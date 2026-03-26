using BankingDemo.Core.DTOs;
using BankingDemo.Core.Models;
using BankingDemo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using System.Text.Json;

namespace BankingDemo.Infrastructure.Services;

public class AccountService(AppDbContext db, IConnectionMultiplexer redis, ILogger<AccountService> logger)
{
    private readonly IDatabase _cache = redis.GetDatabase();

    public async Task<List<AccountResponse>> GetUserAccountsAsync(Guid userId)
    {
        return await db.Accounts
            .Where(a => a.UserId == userId)
            .Select(a => new AccountResponse(a.Id, a.AccountNumber, a.Currency, a.Balance))
            .ToListAsync();
    }

    public async Task<List<TransactionResponse>> GetTransactionsAsync(Guid accountId)
    {
        var cacheKey = $"txns:{accountId}";
        var cached = await _cache.StringGetAsync(cacheKey);

        if (cached.HasValue)
        {
            logger.LogInformation("Cache hit for account {AccountId}", accountId);
            return JsonSerializer.Deserialize<List<TransactionResponse>>((string)cached!)!;
        }

        var txns = await db.Transactions
            .Include(t => t.FromAccount)
            .Include(t => t.ToAccount)
            .Where(t => t.FromAccountId == accountId || t.ToAccountId == accountId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TransactionResponse(
                t.Id,
                t.FromAccount.AccountNumber,
                t.ToAccount.AccountNumber,
                t.Amount,
                t.Currency,
                t.Status.ToString(),
                t.FraudFlagged,
                t.CreatedAt))
            .ToListAsync();

        await _cache.StringSetAsync(cacheKey, JsonSerializer.Serialize(txns), TimeSpan.FromSeconds(30));
        return txns;
    }

    public async Task<(bool Success, string Message, TransactionResponse? Transaction)>
        TransferAsync(TransferRequest req, Guid userId)
    {
        var fromAccount = await db.Accounts
            .FirstOrDefaultAsync(a => a.Id == req.FromAccountId && a.UserId == userId);

        if (fromAccount is null)
            return (false, "Account not found or unauthorized", null);

        if (fromAccount.Balance < req.Amount)
            return (false, "Insufficient funds", null);

        if (req.Amount <= 0)
            return (false, "Amount must be positive", null);

        var toAccount = await db.Accounts.FirstOrDefaultAsync(a => a.Id == req.ToAccountId);
        if (toAccount is null)
            return (false, "Destination account not found", null);

        var isFraud = FraudCheck(req.Amount, fromAccount);

        var transaction = new Transaction
        {
            Id = Guid.NewGuid(),
            FromAccountId = req.FromAccountId,
            ToAccountId = req.ToAccountId,
            Amount = req.Amount,
            Currency = fromAccount.Currency,
            Description = req.Description,
            Status = isFraud ? TransactionStatus.Flagged : TransactionStatus.Completed,
            FraudFlagged = isFraud
        };

        if (!isFraud)
        {
            fromAccount.Balance -= req.Amount;
            toAccount.Balance += req.Amount;
        }

        db.Transactions.Add(transaction);
        await db.SaveChangesAsync();

        // Invalidate cache for both accounts
        await _cache.KeyDeleteAsync($"txns:{req.FromAccountId}");
        await _cache.KeyDeleteAsync($"txns:{req.ToAccountId}");

        var response = new TransactionResponse(
            transaction.Id,
            fromAccount.AccountNumber,
            toAccount.AccountNumber,
            transaction.Amount,
            transaction.Currency,
            transaction.Status.ToString(),
            transaction.FraudFlagged,
            transaction.CreatedAt);

        return (true, isFraud ? "Transfer flagged for review" : "Transfer successful", response);
    }

    private static bool FraudCheck(decimal amount, Account account)
    {
        if (amount > 500000) return true;              // large single transfer
        if (amount > account.Balance * 0.9m) return true; // draining account
        return false;
    }

    public async Task<AccountResponse> CreateAccountAsync(Guid userId, string currency)
    {
        var account = new Account
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AccountNumber = GenerateAccountNumber(),
            Currency = currency,
            Balance = 500000
        };

        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        return new AccountResponse(account.Id, account.AccountNumber, account.Currency, account.Balance);
    }
    private static string GenerateAccountNumber() =>
            "IS" + Random.Shared.NextInt64(1000000000, 9999999999).ToString();

    public async Task<AccountResponse?> LookupAccountAsync(string accountNumber)
    {
        return await db.Accounts
            .Where(a => a.AccountNumber == accountNumber)
            .Select(a => new AccountResponse(a.Id, a.AccountNumber, a.Currency, a.Balance))
            .FirstOrDefaultAsync();
    }
}