using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.IO;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Define DbSets for models
    public DbSet<User> Users { get; set; }
    public DbSet<UpdateHistory> UpdateHistories { get; set; }
    public DbSet<Entity> Entities { get; set; }
    public DbSet<TaxCollectedDetails> TaxCollectedDetails { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
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
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Existing UpdateHistory configuration
        modelBuilder.Entity<UpdateHistory>()
            .HasOne(h => h.User)
            .WithMany(u => u.UpdateHistories)
            .HasForeignKey(h => h.User_ID)
            .OnDelete(DeleteBehavior.Cascade);

        // Existing TaxCollectedDetails-User configuration
        modelBuilder.Entity<TaxCollectedDetails>()
            .HasOne(t => t.User)
            .WithMany(u => u.TaxCollectedDetails)
            .HasForeignKey(t => t.User_ID)
            .OnDelete(DeleteBehavior.Cascade);

        // Updated Entity-TaxCollectedDetails configuration
        modelBuilder.Entity<Entity>()
            .HasMany(e => e.TaxCollectedDetails)
            .WithOne(t => t.Entity)
            .HasForeignKey(t => t.EntityID)
            .IsRequired(false)  // Make it optional since EntityID is nullable
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Entity>(entity =>
        {
            entity.Property(e => e.Created_By).IsRequired(false);
            entity.Property(e => e.Modified_By).IsRequired(false);
        });

        base.OnModelCreating(modelBuilder);
    }
}
