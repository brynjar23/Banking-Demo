using System.Security.Claims;
using BankingDemo.Core.DTOs;
using BankingDemo.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BankingDemo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountsController(AccountService accountService) : ControllerBase
{
    private Guid UserId => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAccounts()
    {
        var accounts = await accountService.GetUserAccountsAsync(UserId);
        return Ok(accounts);
    }

    [HttpGet("{accountId}/transactions")]
    public async Task<IActionResult> GetTransactions(Guid accountId)
    {
        var transactions = await accountService.GetTransactionsAsync(accountId);
        return Ok(transactions);
    }

    [HttpPost("transfer")]
    public async Task<IActionResult> Transfer(TransferRequest req)
    {
        var (success, message, transaction) = await accountService.TransferAsync(req, UserId);
        if (!success)
            return BadRequest(new { message });
        return Ok(new { message, transaction });
    }

    [HttpPost]
        public async Task<IActionResult> CreateAccount([FromBody] CreateAccountRequest req)
    {
        var account = await accountService.CreateAccountAsync(UserId, req.Currency);
        return Ok(account);
    }

    [HttpGet("lookup/{accountNumber}")]
    public async Task<IActionResult> LookupAccount(string accountNumber)
    {
        var account = await accountService.LookupAccountAsync(accountNumber);
        if (account is null)
            return NotFound(new { message = "Account not found" });
        return Ok(account);
    }
}