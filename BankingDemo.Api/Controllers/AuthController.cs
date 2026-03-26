using BankingDemo.Core.DTOs;
using BankingDemo.Infrastructure.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace BankingDemo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest req)
    {
        var result = await authService.RegisterAsync(req);
        if (result is null)
            return Conflict(new { message = "Email already in use" });
        return Ok(result);
    }

    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login(LoginRequest req)
    {
        var result = await authService.LoginAsync(req);
        if (result is null)
            return Unauthorized(new { message = "Invalid email or password" });
        return Ok(result);
    }
}