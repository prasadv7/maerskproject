public class UpdateHistory
{
    public int ID { get; set; }
    public int User_ID { get; set; } // Foreign key to User table
    public string TableName { get; set; } // Name of the table
    public string RecordID { get; set; } // The ID of the record being updated
    public string ChangedField { get; set; } // Name of the field that was updated
    public string OldValue { get; set; } // Previous value of the field
    public string NewValue { get; set; } // New value of the field
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow; // When the update occurred

    // Navigation property
    public User User { get; set; } // Links to the User table
}
