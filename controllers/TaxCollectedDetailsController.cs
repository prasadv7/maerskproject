using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TaxCollectedDetailsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TaxCollectedDetailsController(AppDbContext context)
    {
        _context = context;
    }

    // 1. Get all TaxCollectedDetails for the logged-in user
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Retrieve the User ID from the token claims
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Unauthorized("User ID claim is missing from the token.");
        }

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid User ID claim in the token.");
        }

        var taxDetails = await _context.TaxCollectedDetails
            .Where(t => t.User_ID == userId)
            .ToListAsync();

        return Ok(taxDetails);
    }

    // 2. Get TaxCollectedDetails by Entity ID
    [HttpGet("{entityId}")]
    public async Task<IActionResult> GetById(int entityId)
    {
        try
        {
            // Get user ID from the nameidentifier claim
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid user identification");
            }

            var taxDetails = await _context.TaxCollectedDetails
                .Where(t => t.EntityID == entityId && t.User_ID == userId)
                .OrderByDescending(t => t.Created)
                .ToListAsync();

            if (taxDetails == null || !taxDetails.Any())
            {
                return Ok(new List<TaxCollectedDetails>()); // Return empty list instead of 404
            }

            return Ok(taxDetails);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "An error occurred while retrieving tax details", details = ex.Message });
        }
    }

    // 3. Create a new TaxCollectedDetails

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TaxCollectedDetails taxCollectedDetails)
    {
        try
        {
            // Remove ModelState validation errors for server-set fields
            ModelState.Remove("Created_By");
            ModelState.Remove("Modified_By");
            ModelState.Remove("Created");
            ModelState.Remove("Modified");
            ModelState.Remove("User_ID");

            if (!ModelState.IsValid)
            {
                var errors = string.Join("; ", ModelState.Values
                    .SelectMany(x => x.Errors)
                    .Select(x => x.ErrorMessage));
                Console.WriteLine($"Model validation errors: {errors}");
                return BadRequest(ModelState);
            }

            // Get user ID from the nameidentifier claim
            var userIdClaim = User.Claims.FirstOrDefault(c =>
                c.Type == ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized("User ID claim is missing from the token.");
            }

            if (!int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized("Invalid User ID claim in the token.");
            }

            // Set metadata fields
            var now = DateTime.UtcNow;

            // Set User_ID, Created_By, and Modified_By all to userId
            taxCollectedDetails.User_ID = userId;
            taxCollectedDetails.Created = now;
            taxCollectedDetails.Modified = now;
            taxCollectedDetails.Created_By = userId.ToString();  // Using userId directly
            taxCollectedDetails.Modified_By = userId.ToString(); // Using userId directly

            _context.TaxCollectedDetails.Add(taxCollectedDetails);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetById),
                new { entityId = taxCollectedDetails.EntityID },
                taxCollectedDetails
            );
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception in Create: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
            }
            return BadRequest($"Failed to create tax details: {ex.Message}");
        }
    }



    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TaxCollectedDetails updatedDetails)
    {
        // Extract User ID from JWT claims
        var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userIdClaim))
        {
            return Unauthorized("User ID claim is missing from the token.");
        }

        if (!int.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized("Invalid User ID claim in the token.");
        }

        // Retrieve the existing record
        var taxDetail = await _context.TaxCollectedDetails.FirstOrDefaultAsync(t => t.ID == id);

        if (taxDetail == null)
        {
            return NotFound("Tax detail not found.");
        }

        // List to store history of changes
        var history = new List<UpdateHistory>();

        // Check and log changes for each field
        if (taxDetail.Company_Code != updatedDetails.Company_Code)
        {
            history.Add(new UpdateHistory
            {
                User_ID = userId,
                TableName = "TaxCollectedDetails",
                RecordID = taxDetail.ID.ToString(),
                ChangedField = "Company_Code",
                OldValue = taxDetail.Company_Code,
                NewValue = updatedDetails.Company_Code,
                ChangedAt = DateTime.UtcNow
            });
            taxDetail.Company_Code = updatedDetails.Company_Code;
        }

        if (taxDetail.Legal_Entity_Name != updatedDetails.Legal_Entity_Name)
        {
            history.Add(new UpdateHistory
            {
                User_ID = userId,
                TableName = "TaxCollectedDetails",
                RecordID = taxDetail.ID.ToString(),
                ChangedField = "Legal_Entity_Name",
                OldValue = taxDetail.Legal_Entity_Name,
                NewValue = updatedDetails.Legal_Entity_Name,
                ChangedAt = DateTime.UtcNow
            });
            taxDetail.Legal_Entity_Name = updatedDetails.Legal_Entity_Name;
        }

        if (taxDetail.Tax_Reporting_Country != updatedDetails.Tax_Reporting_Country)
        {
            history.Add(new UpdateHistory
            {
                User_ID = userId,
                TableName = "TaxCollectedDetails",
                RecordID = taxDetail.ID.ToString(),
                ChangedField = "Tax_Reporting_Country",
                OldValue = taxDetail.Tax_Reporting_Country,
                NewValue = updatedDetails.Tax_Reporting_Country,
                ChangedAt = DateTime.UtcNow
            });
            taxDetail.Tax_Reporting_Country = updatedDetails.Tax_Reporting_Country;
        }

        if (taxDetail.HFM_Code != updatedDetails.HFM_Code)
        {
            history.Add(new UpdateHistory
            {
                User_ID = userId,
                TableName = "TaxCollectedDetails",
                RecordID = taxDetail.ID.ToString(),
                ChangedField = "HFM_Code",
                OldValue = taxDetail.HFM_Code,
                NewValue = updatedDetails.HFM_Code,
                ChangedAt = DateTime.UtcNow
            });
            taxDetail.HFM_Code = updatedDetails.HFM_Code;
        }

        // Repeat for all other fields...

        // Update metadata
        taxDetail.Modified = DateTime.UtcNow;
        taxDetail.Modified_By = userId.ToString();

        // Save history and updated record
        if (history.Any())
        {
            _context.UpdateHistories.AddRange(history);
        }

        await _context.SaveChangesAsync();

        return Ok("Tax detail updated successfully.");
    }

    // 5. Delete a TaxCollectedDetails by ID
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value);

        var taxDetail = await _context.TaxCollectedDetails.FirstOrDefaultAsync(t => t.ID == id && t.User_ID == userId);

        if (taxDetail == null)
            return NotFound("Tax detail not found.");

        _context.TaxCollectedDetails.Remove(taxDetail);
        await _context.SaveChangesAsync();

        return Ok("Tax detail deleted successfully.");
    }

    // 6. Get update history for a specific TaxCollectedDetails
}
