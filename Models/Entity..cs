using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class Entity
{
    public int ID { get; set; }

    [Required]
    public string Company_Code { get; set; }

    [Required]
    public string Legal_Entity_Name { get; set; }

    [Required]
    public string Tax_Reporting_Country { get; set; }

    [Required]
    public string HFM_Code { get; set; }

    public DateTime Created { get; set; } = DateTime.UtcNow;
    public string Created_By { get; set; } = "system";  // Default value
    public DateTime Modified { get; set; } = DateTime.UtcNow;
    public string Modified_By { get; set; } = "system";  // Default value

    // Navigation property for related TaxCollectedDetails
    public ICollection<TaxCollectedDetails> TaxCollectedDetails { get; set; } = new List<TaxCollectedDetails>();
}
