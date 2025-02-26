using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EntityController : ControllerBase
{
    private readonly AppDbContext _context;

    public EntityController(AppDbContext context)
    {
        _context = context;
    }

    // POST: api/Entity
    [HttpPost]
    public async Task<IActionResult> CreateEntity([FromBody] Entity newEntity)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Extract User ID from JWT token
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Unauthorized("User ID claim is missing from the token.");
        }

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid User ID claim in the token.");
        }

        try
        {
            // Set metadata fields
            var now = DateTime.UtcNow;
            newEntity.Created_By = userId.ToString();
            newEntity.Modified_By = userId.ToString();
            newEntity.Created = now;
            newEntity.Modified = now;

            // Add the new entity to the database
            await _context.Entities.AddAsync(newEntity);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEntityById), new { id = newEntity.ID }, newEntity);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    // GET: api/Entity/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEntityById(int id)
    {
        var entity = await _context.Entities
            .Include(e => e.TaxCollectedDetails) // Include related TaxCollectedDetails
            .FirstOrDefaultAsync(e => e.ID == id);

        if (entity == null)
        {
            return NotFound($"Entity with ID {id} not found.");
        }

        return Ok(entity);
    }

    // GET: api/Entity
    [HttpGet]
    public async Task<IActionResult> GetAllEntities()
    {
        try
        {
            var entities = await _context.Entities
                .Select(e => new
                {
                    e.ID,
                    e.Company_Code,
                    e.Legal_Entity_Name,
                    e.Tax_Reporting_Country,
                    e.HFM_Code,
                    e.Created,
                    e.Created_By,
                    e.Modified,
                    e.Modified_By
                })
                .ToListAsync();
            return Ok(entities);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }
}
