using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var success = await _authService.RegisterUser(request.Name, request.Email, request.Password);
        if (!success)
            return BadRequest("User with this email already exists.");

        return Ok("User registered successfully.");
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var token = await _authService.LoginUser(request.Email, request.Password);
        if (token == null)
            return Unauthorized("Invalid email or password.");

        return Ok(new { Token = token });
    }

    [HttpGet("protected")]

    [Authorize]
    public IActionResult GetProtectedData()
    {
        return Ok(new { Message = "This is protected data.", User = User.Identity.Name });
    }

    // This endpoint is accessible to everyone
    [HttpGet("public")]
    [AllowAnonymous]
    public IActionResult GetPublicData()
    {
        return Ok(new { Message = "This is public data." });
    }
}

public class RegisterRequest
{
    public string Name { get; set; }
    public string Email { get; set; }
    public string Password { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; }
    public string Password { get; set; }
}
