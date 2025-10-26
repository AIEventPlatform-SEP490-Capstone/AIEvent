using AIEvent.Domain.Base;
using AIEvent.Domain.Entities;
using AIEvent.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using System.Security.Claims;

namespace AIEvent.Infrastructure.Context
{
    public class DatabaseContext : DbContext
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public DatabaseContext(DbContextOptions<DatabaseContext> options, IHttpContextAccessor httpContextAccessor) : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<OrganizerProfile> OrganizerProfiles { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<EventCategory> EventCategories { get; set; }
        public DbSet<TicketDetail> TicketDetails { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<EventTag> EventTags { get; set; }
        public DbSet<UserAction> UserActions { get; set; }
        public DbSet<UserActionFilter> UserActionFilters { get; set; }
        public DbSet<RefundRule> RefundRules { get; set; }
        public DbSet<RefundRuleDetail> RefundRuleDetails { get; set; }
        public DbSet<FavoriteEvent> FavoriteEvents { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<BookingItem> BookingItems { get; set; }
        public DbSet<Ticket> Tickets { get; set; }
        public DbSet<WithdrawRequest> WithdrawRequests { get; set; }
        public DbSet<PaymentInfomation> PaymentInfomations { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            
            // ----------------- User -----------------
            builder.Entity<User>(entity =>
            {
                entity.HasOne(e => e.Role)
                      .WithMany(u => u.Users)
                      .HasForeignKey(e => e.RoleId);

                entity.HasOne(u => u.LinkedUser)
                      .WithMany(p => p.CreatedOrganizerAccounts)
                      .HasForeignKey(u => u.LinkedUserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.Email).HasMaxLength(256).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => e.Email).IsUnique().HasDatabaseName("IX_User_Email");
                entity.HasIndex(e => e.IsActive).HasDatabaseName("IX_User_IsActive");
            });

            // ----------------- Role -----------------
            builder.Entity<Role>(entity =>
            {
                entity.Property(e => e.Name).HasMaxLength(256).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => e.Name).IsUnique().HasDatabaseName("IX_Role_Name");
            });

            // ----------------- RefreshToken -----------------
            builder.Entity<RefreshToken>(entity =>
            {
                entity.Property(e => e.Token).IsRequired().HasMaxLength(500);

                entity.HasOne(e => e.User)
                      .WithMany(u => u.RefreshTokens)
                      .HasForeignKey(e => e.UserId);

                entity.HasIndex(e => e.Token).IsUnique().HasDatabaseName("IX_RefreshToken_Token");
                entity.HasIndex(e => new { e.UserId, e.IsDeleted }).HasDatabaseName("IX_RefreshToken_UserId_IsDeleted");
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
                entity.Property(e => e.ConfirmBy).HasMaxLength(100);

                entity.HasOne(o => o.User)
                      .WithOne(u => u.OrganizerProfile)
                      .HasForeignKey<OrganizerProfile>(o => o.UserId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(o => o.UserId).HasDatabaseName("IX_OrganizerProfile_UserId");
                entity.HasIndex(o => new { o.UserId, o.TaxCode }).IsUnique().HasDatabaseName("IX_OrganizerProfile_UserId_TaxCode");
                entity.HasIndex(o => o.ConfirmAt).HasDatabaseName("IX_OrganizerProfile_ConfirmAt");
                entity.HasIndex(o => o.ContactEmail).HasDatabaseName("IX_OrganizerProfile_ContactEmail");
                entity.HasIndex(o => o.IdentityNumber).HasDatabaseName("IX_OrganizerProfile_IdentityNumber");
            });


            // ----------------- Event -----------------
            builder.Entity<Event>(entity =>
            {
                entity.Property(e => e.Title).HasMaxLength(500).IsRequired();
                entity.Property(t => t.TotalTickets).IsRequired();

                entity.HasOne(e => e.OrganizerProfile)
                    .WithMany(o => o.Events)
                    .HasForeignKey(e => e.OrganizerProfileId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.EventCategory)
                    .WithMany(o => o.Events)
                    .HasForeignKey(e => e.EventCategoryId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.OrganizerProfileId).HasDatabaseName("IX_Event_OrganizerProfileId");
                entity.HasIndex(e => new { e.OrganizerProfileId, e.CreatedAt }).HasDatabaseName("IX_Event_OrganizerProfileId_CreatedAt");
                entity.HasIndex(e => e.IsDeleted).HasDatabaseName("IX_Event_IsDeleted");
                entity.HasIndex(e => e.Title).HasDatabaseName("IX_Event_Title");
            });

            builder.Entity<EventTag>()
                .HasKey(et => new { et.EventId, et.TagId });

            //------------------Booking-------------------
            builder.Entity<Booking>(entity =>
            {
                entity.HasOne(e => e.Event)
                    .WithMany(o => o.Bookings)
                    .HasForeignKey(e => e.EventId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.User)
                    .WithMany(o => o.Bookings)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).HasDatabaseName("IX_Booking_UserId");
                entity.HasIndex(e => e.EventId).HasDatabaseName("IX_Booking_EventId");
                entity.HasIndex(e => new { e.UserId, e.EventId }).HasDatabaseName("IX_Booking_User_Event");
                entity.HasIndex(e => e.Status).HasDatabaseName("IX_Booking_Status");
                entity.HasIndex(e => e.PaymentStatus).HasDatabaseName("IX_Booking_PaymentStatus");
            });

            //---------------BookingItem------------------
            builder.Entity<BookingItem>(entity =>
            {
                entity.HasOne(e => e.Booking)
                    .WithMany(o => o.BookingItems)
                    .HasForeignKey(e => e.BookingId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.TicketType)
                    .WithMany(o => o.BookingItems)
                    .HasForeignKey(e => e.TicketTypeId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.BookingId).HasDatabaseName("IX_BookingItem_BookingId");
                entity.HasIndex(e => e.TicketTypeId).HasDatabaseName("IX_BookingItem_TicketTypeId");
            });

            //---------------Ticket--------------------
            builder.Entity<Ticket>(entity =>
            {
                entity.HasOne(e => e.BookingItem)
                    .WithMany(o => o.Tickets)
                    .HasForeignKey(e => e.BookingItemId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.TicketType)
                    .WithMany(o => o.Tickets)
                    .HasForeignKey(e => e.TicketTypeId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).HasDatabaseName("IX_Ticket_UserId");
                entity.HasIndex(e => e.BookingItemId).HasDatabaseName("IX_Ticket_BookingItemId");
                entity.HasIndex(e => e.TicketCode).IsUnique().HasDatabaseName("UQ_Ticket_Code"); // UNIQUE cho ticket code
                entity.HasIndex(e => e.Status).HasDatabaseName("IX_Ticket_Status");
            });


            //------------------Wallet---------------------
            builder.Entity<Wallet>(entity =>
            {
                entity.HasOne(e => e.User)
                    .WithOne(o => o.Wallet)
                    .HasForeignKey<Wallet>(o => o.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.UserId).HasDatabaseName("IX_Wallet_UserId").IsUnique();
            });

            //--------------WalletTransaction--------------
            builder.Entity<WalletTransaction>(entity =>
            {
                entity.HasOne(e => e.Wallet)
                    .WithMany(o => o.WalletTransactions)
                    .HasForeignKey(e => e.WalletId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.WalletId).HasDatabaseName("IX_WalletTransaction_WalletId");
                entity.HasIndex(e => new { e.ReferenceId, e.ReferenceType }).HasDatabaseName("IX_WalletTransaction_Reference");
                entity.HasIndex(e => e.Type).HasDatabaseName("IX_WalletTransaction_Type");
                entity.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_WalletTransaction_CreatedAt");
            });


            //--------------PaymentTransaction--------------
            builder.Entity<PaymentTransaction>(entity =>
            {
                entity.HasOne(e => e.Booking)
                    .WithMany(o => o.PaymentTransactions)
                    .HasForeignKey(e => e.BookingId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.BookingId).HasDatabaseName("IX_PaymentTransaction_BookingId");
                entity.HasIndex(e => e.UserId).HasDatabaseName("IX_PaymentTransaction_UserId");
                entity.HasIndex(e => e.Status).HasDatabaseName("IX_PaymentTransaction_Status");
                entity.HasIndex(e => e.CreatedAt).HasDatabaseName("IX_PaymentTransaction_CreatedAt");
            });

            // ----------------- EventTag -----------------
            builder.Entity<EventTag>()
                .HasOne(et => et.Event)
                .WithMany(e => e.EventTags)
                .HasForeignKey(et => et.EventId);

            builder.Entity<EventTag>()
                .HasOne(et => et.Tag)
                .WithMany(t => t.EventTags)
                .HasForeignKey(et => et.TagId);

            // ----------------- EventCategory -----------------
            builder.Entity<EventCategory>(entity =>
            {
                entity.HasIndex(e => e.CategoryName).HasDatabaseName("IX_EventCategory_CategoryName");
                entity.HasIndex(e => e.IsDeleted).HasDatabaseName("IX_EventCategory_IsDeleted");
            });

            // ----------------- Tag -----------------
            builder.Entity<Tag>(entity =>
            {
                entity.HasIndex(e => e.IsDeleted).HasDatabaseName("IX_Tag_IsDeleted");
            });

            // ----------------- TicketDetail -----------------
            builder.Entity<TicketDetail>(entity =>
            {
                entity.HasOne(td => td.Event)
                      .WithMany(e => e.TicketDetails)
                      .HasForeignKey(td => td.EventId);

                entity.Property(t => t.TicketQuantity).IsRequired();

                entity.Property(e => e.TicketName).HasMaxLength(250).IsRequired();
                entity.Property(td => td.TicketPrice).HasPrecision(18, 2);

                entity.HasIndex(td => new { td.EventId, td.TicketName }).IsUnique();
                entity.HasIndex(e => e.RefundRuleId).HasDatabaseName("IX_TicketDetail_RefundRuleId");
            });

            // ----------------- UserAction -----------------
            builder.Entity<UserAction>(entity =>
            {
                entity.HasOne(td => td.AppUser)
                      .WithMany(e => e.UserActions)
                      .HasForeignKey(td => td.UserId);

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

            // ----------------- RefundRuleDetail -----------------
            builder.Entity<RefundRule>(entity =>
            {
                entity.HasIndex(rd => rd.IsSystem).HasDatabaseName("IX_RefundRule_IsSystem");

            });

            // ----------------- RefundRuleDetail -----------------
            builder.Entity<RefundRuleDetail>(entity =>
            {
                entity.HasOne(d => d.RefundRule)
                      .WithMany(r => r.RefundRuleDetails)
                      .HasForeignKey(d => d.RefundRuleId);

                entity.Property(d => d.RefundPercent).HasPrecision(5, 2);
                entity.HasIndex(rd => new { rd.RefundRuleId, rd.MinDaysBeforeEvent, rd.MaxDaysBeforeEvent}).HasDatabaseName("IX_RefundRuleDetail_Range");

            });

            // ----------------- FavoriteEvent -----------------
            builder.Entity<FavoriteEvent>(entity =>
            {
                entity.HasKey(fe => new { fe.UserId, fe.EventId });

                entity.HasOne(ue => ue.User)
                    .WithMany(u => u.FavoriteEvents)
                    .HasForeignKey(ue => ue.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ue => ue.Event)
                    .WithMany(f => f.FavoriteEvents)
                    .HasForeignKey(ue => ue.EventId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(fe => new { fe.UserId, fe.EventId }).HasDatabaseName("IX_FavoriteEvent_User_Event");

            });

            // ----------------- WithdrawRequest -----------------
            builder.Entity<WithdrawRequest>(entity =>
            {
                entity.HasOne(w => w.User)
                    .WithMany(u => u.WithdrawRequests)
                    .HasForeignKey(w => w.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(w => w.BankName).IsRequired().HasMaxLength(500);
                entity.Property(w => w.BankAccountNumber).IsRequired().HasMaxLength(100);
                entity.Property(w => w.BankAccountName).IsRequired().HasMaxLength(500);
                entity.Property(w => w.Amount).HasColumnType("decimal(18,2)");
            });

            // ----------------- PaymentInfomation -----------------
            builder.Entity<PaymentInfomation>(entity =>
            {
                entity.ToTable("PaymentInfomations"); 

                entity.HasOne(pi => pi.User)
                      .WithMany(u => u.PaymentInfomations)
                      .HasForeignKey(pi => pi.UserId)
                      .OnDelete(DeleteBehavior.Cascade); 

                entity.HasIndex(pi => new { pi.UserId, pi.AccountNumber })
                      .IsUnique()
                      .HasDatabaseName("IX_PaymentInfo_User_Account");

                entity.HasIndex(pi => pi.UserId)
                      .HasDatabaseName("IX_PaymentInfo_UserId");
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
