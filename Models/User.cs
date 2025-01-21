using System.ComponentModel.DataAnnotations;

public class User
{
    public int Id { get; set; } // Primary key

    [Required]
    public string? Name { get; set; } // Username or Full Name

    [Required]
    [EmailAddress]
    public string? Email { get; set; } // Unique Email Address

    [Required]
    public string? PasswordHash { get; set; } // Hashed Password

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow; 
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow; 

    public ICollection<UpdateHistory> UpdateHistories { get; set; }
    public ICollection<TaxCollectedDetails> TaxCollectedDetails { get; set; }
}
