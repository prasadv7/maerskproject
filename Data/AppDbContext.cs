using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.IO;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Define DbSets for models
    public DbSet<User> Users { get; set; }
    public DbSet<UpdateHistory> UpdateHistories { get; set; }

    public DbSet<TaxCollectedDetails> TaxCollectedDetails { get; set; } // Add TaxCollectedDetails

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        // Load configuration from appsettings.json
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .Build();

        var dbSettings = configuration.GetSection("DatabaseSettings");
        var provider = dbSettings["Provider"];
        var connectionString = dbSettings["ConnectionString"];

        // Configure database provider dynamically
        switch (provider)
        {
            case "SQLServer":
                optionsBuilder.UseSqlServer(connectionString);
                break;
            case "PostgreSQL":
                optionsBuilder.UseNpgsql(connectionString);
                break;
            case "SQLite":
                optionsBuilder.UseSqlite(connectionString);
                break;
            default:
                throw new Exception("Unsupported database provider");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Set up relationships for UserHistory
        modelBuilder.Entity<UpdateHistory>()
            .HasOne(h => h.User) // One history entry belongs to one user
            .WithMany(u => u.UpdateHistories) // One user can have many history entries
            .HasForeignKey(h => h.User_ID);

        // Set up relationships for TaxCollectedDetails
        modelBuilder.Entity<TaxCollectedDetails>()
            .HasOne(t => t.User) // One TaxCollectedDetails entry is created/modified by one user
            .WithMany(u => u.TaxCollectedDetails) // One user can have many entries
            .HasForeignKey(t => t.User_ID);

        base.OnModelCreating(modelBuilder); // Ensure any inherited behavior is preserved
    }
}
