using AIEvent.Domain.Base;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Identity;
using AIEvent.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Security.Claims;

namespace AIEvent.Infrastructure.Context
{
    public class DatabaseContext : IdentityDbContext<AppUser, AppRole, Guid>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DatabaseContext(DbContextOptions<DatabaseContext> options, IHttpContextAccessor httpContextAccessor) : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<OrganizerProfile> OrganizerProfiles { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<TicketType> TicketDetails { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<EventTag> EventTags { get; set; }
        public DbSet<Interest> Intserest { get; set; }
        public DbSet<UserInterest> UserInterests { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Ignore<IdentityUserClaim<Guid>>();
            builder.Ignore<IdentityRoleClaim<Guid>>();
            
            // ----------------- Identity -----------------
            builder.Entity<AppUser>(entity =>
            {
                entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
                entity.Property(e => e.UserName).HasMaxLength(256).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => e.Email).IsUnique().HasDatabaseName("IX_AppUser_Email");
                entity.HasIndex(e => e.UserName).IsUnique().HasDatabaseName("IX_AppUser_UserName");
                entity.HasIndex(e => e.IsActive).HasDatabaseName("IX_AppUser_IsActive");
            });

            builder.Entity<AppRole>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(256).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => e.Name).IsUnique().HasDatabaseName("IX_AppRole_Name");
            });

            builder.Entity<RefreshToken>(entity =>
            {
                entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
                entity.Property(e => e.RevokedByIp).HasMaxLength(50);
                entity.Property(e => e.ReplacedByToken).HasMaxLength(500);
                entity.Property(e => e.ReasonRevoked).HasMaxLength(200);

                entity.HasOne(e => e.User)
                      .WithMany(u => u.RefreshTokens)
                      .HasForeignKey(e => e.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.Token).IsUnique().HasDatabaseName("IX_RefreshToken_Token");
                entity.HasIndex(e => new { e.UserId, e.IsRevoked }).HasDatabaseName("IX_RefreshToken_UserId_IsRevoked");
                entity.HasIndex(e => new { e.Token, e.ExpiresAt }).HasDatabaseName("IX_RefreshToken_Token_ExpiresAt");
                entity.HasIndex(e => e.ExpiresAt).HasDatabaseName("IX_RefreshToken_ExpiresAt");
            });

            // ----------------- OrganizerProfile -----------------
            builder.Entity<OrganizerProfile>(entity =>
            {
                entity.Property(e => e.ContactName).HasMaxLength(100).IsRequired();
                entity.Property(e => e.ContactEmail).HasMaxLength(256).IsRequired();
                entity.Property(e => e.ContactPhone).HasMaxLength(20).IsRequired();
                entity.Property(e => e.Address).HasMaxLength(500).IsRequired();
                entity.Property(e => e.Website).HasMaxLength(256);
                entity.Property(e => e.UrlFacebook).HasMaxLength(256);
                entity.Property(e => e.UrlInstagram).HasMaxLength(256);
                entity.Property(e => e.UrlLinkedIn).HasMaxLength(256);
                entity.Property(e => e.TaxCode).HasMaxLength(50);
                entity.Property(e => e.CompanyName).HasMaxLength(200);
                entity.Property(e => e.CompanyDescription).HasMaxLength(1000);
                entity.Property(e => e.ExperienceDescription).HasMaxLength(2000);
                entity.Property(e => e.IdentityNumber).HasMaxLength(20);
                entity.Property(e => e.ImgFrontIdentity).HasMaxLength(500);
                entity.Property(e => e.ImgCompany).HasMaxLength(500);
                entity.Property(e => e.ImgBackIdentity).HasMaxLength(500);
                entity.Property(e => e.ImgBusinessLicense).HasMaxLength(500);
                entity.Property(e => e.ApproveBy).HasMaxLength(100);

                entity.HasOne(o => o.User)
                    .WithOne(u => u.OrganizerProfile)
                    .HasForeignKey<OrganizerProfile>(o => o.UserId);

                entity.HasIndex(o => o.UserId).HasDatabaseName("IX_OrganizerProfile_UserId");
                entity.HasIndex(o => o.TaxCode).IsUnique().HasDatabaseName("IX_OrganizerProfile_TaxCode");
                entity.HasIndex(o => new { o.UserId, o.IsDeleted }).HasDatabaseName("IX_OrganizerProfile_UserId_IsDeleted");
                entity.HasIndex(o => o.ApproveAt).HasDatabaseName("IX_OrganizerProfile_ApproveAt");
                entity.HasIndex(o => o.ContactEmail).HasDatabaseName("IX_OrganizerProfile_ContactEmail");
                entity.HasIndex(o => o.IdentityNumber).HasDatabaseName("IX_OrganizerProfile_IdentityNumber");
            });


            // ----------------- Event -----------------
            builder.Entity<Event>(entity =>
            {
                // String properties with appropriate lengths
                entity.Property(e => e.Title).HasMaxLength(500).IsRequired();
                entity.Property(t => t.TotalTickets).IsRequired();

                // Relationships
                entity.HasOne(e => e.OrganizerProfile)
                    .WithMany(o => o.Events)
                    .HasForeignKey(e => e.OrganizerProfileId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Performance indexes
                entity.HasIndex(e => e.OrganizerProfileId).HasDatabaseName("IX_Event_OrganizerProfileId");
                entity.HasIndex(e => new { e.OrganizerProfileId, e.CreatedAt }).HasDatabaseName("IX_Event_OrganizerProfileId_CreatedAt");
                entity.HasIndex(e => e.IsDeleted).HasDatabaseName("IX_Event_IsDeleted");
                entity.HasIndex(e => e.Title).HasDatabaseName("IX_Event_Title");
            });

            builder.Entity<EventTag>()
                .HasKey(et => new { et.EventId, et.TagId });

            // ----------------- EventTag -----------------
            builder.Entity<EventTag>()
                .HasOne(et => et.Event)
                .WithMany(e => e.EventTags)
                .HasForeignKey(et => et.EventId);

            builder.Entity<EventTag>()
                .HasOne(et => et.Tag)
                .WithMany(t => t.EventTags)
                .HasForeignKey(et => et.TagId);

            // ----------------- Interest -----------------
            builder.Entity<Interest>(entity =>
            {
                entity.Property(e => e.Name)
                      .HasMaxLength(100)
                      .IsRequired();

                entity.HasIndex(e => e.Name).HasDatabaseName("IX_EventField_NameEventField");
                entity.HasIndex(e => e.IsDeleted).HasDatabaseName("IX_EventField_IsDeleted");
            });

            // ----------------- Tag -----------------
            builder.Entity<Tag>(entity =>
            {
                entity.HasIndex(e => e.IsDeleted).HasDatabaseName("IX_Tag_IsDeleted");
            });

            // ----------------- UserInterest -----------------
            builder.Entity<UserInterest>()
                .HasKey(ue => new { ue.UserId, ue.InterestId });

            builder.Entity<UserInterest>()
                .HasOne(ue => ue.User)
                .WithMany(u => u.UserInterests)
                .HasForeignKey(ue => ue.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<UserInterest>()
                .HasOne(ue => ue.Interest)
                .WithMany(f => f.UserInterests)
                .HasForeignKey(ue => ue.InterestId)
                .OnDelete(DeleteBehavior.Cascade);

            // ----------------- TicketDetail -----------------
            builder.Entity<TicketType>(entity =>
            {
                entity.HasOne(td => td.Event)
                      .WithMany(e => e.TicketDetails)
                      .HasForeignKey(td => td.EventId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.Property(t => t.TicketQuantity).IsRequired();

                entity.Property(e => e.TicketName).HasMaxLength(250).IsRequired();
                entity.Property(td => td.TicketPrice).HasPrecision(18, 2);

                entity.HasIndex(td => new { td.EventId, td.TicketName }).IsUnique();
                entity.HasIndex(e => e.IsDeleted).HasDatabaseName("IX_TicketDetail_IsDeleted");
            });

            // ----------------- UserAction -----------------
            builder.Entity<UserAction>(entity =>
            {
                entity.HasOne(td => td.AppUser)
                      .WithMany(e => e.UserActions)
                      .HasForeignKey(td => td.UserId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(td => new { td.UserId, td.ActionType }).HasDatabaseName("IX_UserActions_User_ActionType");
            });

            // ----------------- UserActionFilter -----------------
            builder.Entity<UserActionFilter>(entity =>
            {
                entity.HasOne(td => td.UserAction)
                      .WithMany(e => e.Filters)
                      .HasForeignKey(td => td.UserActionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });


            builder.Seed();
        }

        private string GetCurrentUserId()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null || !user.Identity?.IsAuthenticated == true)
                return "System";

            return user.FindFirstValue(ClaimTypes.NameIdentifier) ?? "System";
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            var entries = ChangeTracker.Entries<BaseEntity>();
            foreach (var entry in entries)
            {
                switch (entry.State)
                {
                    case EntityState.Deleted:
                        entry.State = EntityState.Modified;
                        entry.Entity.SetDeleted(userId);
                        break;
                    case EntityState.Modified:
                        entry.Entity.SetUpdated(userId);
                        break;
                    case EntityState.Added:
                        entry.Entity.SetCreated(userId);
                        break;
                }
            }
            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}
