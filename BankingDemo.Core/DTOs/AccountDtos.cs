namespace BankingDemo.Core.DTOs;

public record AccountResponse(Guid Id, string AccountNumber, string Currency, decimal Balance);
public record TransferRequest(Guid FromAccountId, Guid ToAccountId, decimal Amount, string? Description);
public record TransactionResponse(Guid Id, string FromAccount, string ToAccount, decimal Amount, string Currency, string Status, bool FraudFlagged, DateTime CreatedAt);

public record CreateAccountRequest(string Currency = "ISK");