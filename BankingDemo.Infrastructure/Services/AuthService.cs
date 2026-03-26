using BankingDemo.Core.DTOs;
using BankingDemo.Core.Models;
using BankingDemo.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BankingDemo.Infrastructure.Services;

public class AuthService(AppDbContext db, TokenService tokenService)
{
    public async Task<AuthResponse?> RegisterAsync(RegisterRequest req)
    {
        if (await db.Users.AnyAsync(u => u.Email == req.Email))
            return null;

        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = req.FullName,
            Email = req.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password)
        };

        var account = new Account
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            AccountNumber = GenerateAccountNumber(),
            Currency = "ISK",
            Balance = 500000 // seed balance so demo is interesting
        };

        db.Users.Add(user);
        db.Accounts.Add(account);
        await db.SaveChangesAsync();

        return new AuthResponse(tokenService.GenerateToken(user), user.FullName, user.Email);
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return null;

        return new AuthResponse(tokenService.GenerateToken(user), user.FullName, user.Email);
    }

    private static string GenerateAccountNumber() =>
        "IS" + Random.Shared.NextInt64(1000000000, 9999999999).ToString();
}