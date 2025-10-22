using Microsoft.EntityFrameworkCore;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;

namespace AIEvent.Infrastructure.Data
{
    public static class SeedData
    {
        private static readonly Guid adminRoleId = Guid.NewGuid();
        private static readonly Guid userRoleId = Guid.NewGuid();
        private static readonly Guid managerRoleId = Guid.NewGuid();
        private static readonly Guid organizerRoleId = Guid.NewGuid();
        private static readonly Guid staffRoleId = Guid.NewGuid();

        private static readonly Guid adminUserId = Guid.NewGuid();
        private static readonly Guid regularUserId = Guid.NewGuid();
        private static readonly Guid managerUserId = Guid.NewGuid();
        private static readonly Guid testUserId = Guid.NewGuid();
        private static readonly Guid organizerUserId = Guid.NewGuid();
        private static readonly Guid staffUserId = Guid.NewGuid();

        public static void Seed(this ModelBuilder modelBuilder)
        {
            SeedRoles(modelBuilder);
            SeedUsers(modelBuilder);
            SeedEventCategory(modelBuilder);
            SeedTag(modelBuilder);
            SeedOrganizerProfile(modelBuilder);
            SeedEvent(modelBuilder);
            SeedEventTag(modelBuilder);
            SeedRefundRule(modelBuilder);
            SeedRefundRuleDetail(modelBuilder);
            SeedTicketDetail(modelBuilder);
            SeedWallet(modelBuilder);
        }

        private static void SeedRoles(ModelBuilder modelBuilder)
        {
            var roles = new[]
            {
                new Role
                {
                    Id = adminRoleId,
                    Name = "Admin",
                    Description = "Administrator role with full access",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Role
                {
                    Id = userRoleId,
                    Name = "User",
                    Description = "Regular user role",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Role
                {
                    Id = managerRoleId,
                    Name = "Manager",
                    Description = "System management",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Role
                {
                    Id = staffRoleId,
                    Name = "Staff",
                    Description = "Manager's collaborator",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Role
                {
                    Id = organizerRoleId,
                    Name = "Organizer",
                    Description = "Organizer role for managing events",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                }
            };

            modelBuilder.Entity<Role>().HasData(roles);
        }

        private static void SeedUsers(ModelBuilder modelBuilder)
        {
            var adminUser = new User
            {
                Id = adminUserId,
                RoleId = adminRoleId,
                Email = "admin@gmail.com",
                FullName = "System Administrator",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
            };

            var regularUser = new User
            {
                Id = regularUserId,
                RoleId = userRoleId,
                Email = "user@gmail.com",
                FullName = "Regular User",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
            };

            var managerUser = new User
            {
                Id = managerUserId,
                RoleId = managerRoleId,
                Email = "manager@gmail.com",
                FullName = "Manager",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
            };

            var testUser = new User
            {
                Id = testUserId,
                Email = "user2@gmail.com",
                RoleId = userRoleId,
                FullName = "Test User",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
            };

            var organizerUser = new User
            {
                Id = organizerUserId,
                RoleId = organizerRoleId,
                Email = "organizer@gmail.com",
                FullName = "Organizer",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
            };

            var staffUser = new User
            {
                Id = staffUserId,
                RoleId = staffRoleId,
                Email = "staff@gmail.com",
                FullName = "Staff",
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("123", 12),
            };

            modelBuilder.Entity<User>().HasData(adminUser, regularUser, managerUser, testUser, organizerUser, staffUser);
        }


        private static void SeedWallet(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Wallet>().HasData(
                new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = regularUserId,
                    Balance = 10000000,
                },
                new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = testUserId,
                    Balance = 0,
                },
                new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = organizerUserId,
                    Balance = 0,
                },
                new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = managerUserId,
                    Balance = 0,
                },
                new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = adminUserId,
                    Balance = 0,
                }
            );
        }


        private static readonly Guid eventCategoryId1 = Guid.NewGuid();
        private static readonly Guid eventCategoryId2 = Guid.NewGuid();
        private static readonly Guid eventCategoryId3 = Guid.NewGuid();
        private static void SeedEventCategory(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<EventCategory>().HasData(
                new EventCategory
                {
                    Id = eventCategoryId1,
                    CategoryName = "Music",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new EventCategory
                {
                    Id = eventCategoryId2,
                    CategoryName = "Technology",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new EventCategory
                {
                    Id = eventCategoryId3,
                    CategoryName = "Sports",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new EventCategory
                {
                    Id = Guid.NewGuid(),
                    CategoryName = "Education",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                }
            );
        }
        private static readonly Guid tagId1 = Guid.NewGuid();
        private static readonly Guid tagId2 = Guid.NewGuid();
        private static readonly Guid tagId3 = Guid.NewGuid();
        private static readonly Guid tagId4 = Guid.NewGuid();
        public static void SeedTag(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Tag>().HasData(
                new Tag
                {
                    Id = tagId1,
                    NameTag = "Free",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Tag
                {
                    Id = tagId2,
                    NameTag = "Online",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Tag
                {
                    Id = tagId3,
                    NameTag = "VIP",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Tag
                {
                    Id = tagId4,
                    NameTag = "Workshop",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                }
            );
        }

        private static readonly Guid organizerProfileId = Guid.NewGuid();
        private static void SeedOrganizerProfile(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<OrganizerProfile>().HasData(
                new OrganizerProfile
                {
                    Id = organizerProfileId,
                    UserId = organizerUserId,
                    OrganizationType = OrganizationType.PrivateCompany,
                    EventFrequency = EventFrequency.Monthly,
                    EventSize = EventSize.Medium,
                    OrganizerType = OrganizerType.Individual,
                    EventExperienceLevel = EventExperienceLevel.Experienced,
                    ContactName = "Nguyen Van A",
                    ContactEmail = "contact@eventpro.vn",
                    ContactPhone = "+84 987 654 321",
                    Address = "123 Le Loi, District 1, Ho Chi Minh City",
                    Website = "https://eventpro.vn",
                    UrlFacebook = "https://facebook.com/eventpro",
                    UrlInstagram = "https://instagram.com/eventpro.vn",
                    UrlLinkedIn = "https://linkedin.com/company/eventpro",
                    ExperienceDescription = "Chuyên tổ chức sự kiện doanh nghiệp, hội nghị, hội thảo và lễ ra mắt sản phẩm.",
                    ImgCompany = "/uploads/organizers/company_logo.png",
                    ImgFrontIdentity = "/uploads/organizers/front_id.png",
                    ImgBackIdentity = "/uploads/organizers/back_id.png",
                    ImgBusinessLicense = "/uploads/organizers/business_license.png",
                    IdentityNumber = "079123456789",
                    CompanyName = "EventPro Vietnam Co., Ltd",
                    TaxCode = "0312345678",
                    CompanyDescription = "Công ty hàng đầu trong lĩnh vực tổ chức sự kiện chuyên nghiệp tại Việt Nam.",
                    Status = ConfirmStatus.Approve,
                    ConfirmAt = DateTime.UtcNow,
                    ConfirmBy = "SystemSeeder",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            );
        }

        private static readonly Guid eventId1 = Guid.NewGuid();
        private static readonly Guid eventId2 = Guid.NewGuid();
        private static readonly Guid eventId3 = Guid.NewGuid();
        private static readonly Guid eventId4 = Guid.NewGuid();
        
        private static void SeedEvent(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Event>().HasData(
                new Event
                {
                    Id = eventId1,
                    
                    OrganizerProfileId = organizerProfileId, 
                    EventCategoryId = eventCategoryId1, 
                    Title = "Hội Thảo Công Nghệ AI 2025",
                    Description = "Sự kiện chia sẻ xu hướng AI mới nhất",
                    StartTime = DateTime.UtcNow.AddDays(7),
                    EndTime = DateTime.UtcNow.AddDays(7).AddHours(3),
                    isOnlineEvent = true,
                    LocationName = "Hà Nội tòa 3",
                    TotalTickets = 200,
                    SoldQuantity = 99,
                    RemainingTickets = 101,
                    TicketType = TicketType.Paid,
                    Publish = true,
                    RequireApproval = ConfirmStatus.Approve,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                },
                new Event
                {
                    Id = eventId2,
                    OrganizerProfileId = organizerProfileId,
                    EventCategoryId = eventCategoryId2,
                    Title = "Đêm Nhạc Trịnh Công Sơn",
                    Description = "Chương trình nhạc Trịnh với nhiều nghệ sĩ nổi tiếng",
                    StartTime = DateTime.UtcNow.AddDays(14),
                    EndTime = DateTime.UtcNow.AddDays(14).AddHours(2),
                    isOnlineEvent = false,
                    City = "Hồ Chí Minh",
                    Address = "Nhà hát Hòa Bình",
                    TotalTickets = 500,
                    RemainingTickets = 500,
                    TicketType = TicketType.Paid,
                    Publish = true,
                    RequireApproval = ConfirmStatus.Approve,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    LocationName = "Hà Nội tòa 3"
                },
                new Event
                {
                    Id = eventId3,
                    OrganizerProfileId = organizerProfileId,
                    EventCategoryId = eventCategoryId3,
                    Title = "Workshop Khởi Nghiệp 4.0",
                    Description = "Chia sẻ kinh nghiệm khởi nghiệp thành công",
                    StartTime = DateTime.UtcNow.AddDays(21),
                    EndTime = DateTime.UtcNow.AddDays(21).AddHours(4),
                    isOnlineEvent = false,
                    City = "Hà Nội",
                    Address = "Tòa nhà Innovation Hub",
                    TotalTickets = 100,
                    RemainingTickets = 100,
                    TicketType = TicketType.Paid,
                    Publish = false, // chưa publish
                    RequireApproval = ConfirmStatus.NeedConfirm,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    LocationName = "Hà Nội tòa 2"
                },
                new Event
                {
                    Id = eventId4,
                    OrganizerProfileId = organizerProfileId,
                    EventCategoryId = eventCategoryId3,
                    Title = "Workshop Khởi Nghiệp 3.0",
                    Description = "Chia sẻ kinh nghiệm khởi nghiệp thành công 1111111",
                    StartTime = DateTime.UtcNow.AddDays(40),
                    EndTime = DateTime.UtcNow.AddDays(40).AddHours(4),
                    isOnlineEvent = false,
                    City = "Hà Nội",
                    Address = "Tòa nhà Innovation Hub 1111111",
                    TotalTickets = 100,
                    RemainingTickets = 100,
                    TicketType = TicketType.Free,
                    Publish = true, 
                    RequireApproval = ConfirmStatus.Approve,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System",
                    LocationName = "Hà Nội tòa 1"
                }
            );
        }

        private static readonly Guid refundRuleId = Guid.NewGuid();
        private static void SeedRefundRule(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<RefundRule>().HasData(
                new RefundRule
                {
                    Id = refundRuleId,
                    RuleName = "Hoan Ve",
                    IsSystem = true,
                }
            );
        }

        private static readonly Guid refundRuleDetailId1 = Guid.NewGuid();
        private static readonly Guid refundRuleDetailId2 = Guid.NewGuid();
        private static void SeedRefundRuleDetail(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<RefundRuleDetail>().HasData(
                new RefundRuleDetail
                {
                    Id = refundRuleDetailId1,
                    RefundRuleId = refundRuleId,
                    MinDaysBeforeEvent = 3,
                    MaxDaysBeforeEvent = 7,
                    RefundPercent = 90,
                },
                new RefundRuleDetail
                {
                    Id = refundRuleDetailId2,
                    RefundRuleId = refundRuleId,
                    MinDaysBeforeEvent = 7,
                    MaxDaysBeforeEvent = 14,
                    RefundPercent = 80,
                }
            );
        }

        private static readonly Guid ticketDetailId1 = Guid.NewGuid();
        private static readonly Guid ticketDetailId2 = Guid.NewGuid();
        private static readonly Guid ticketDetailId3 = Guid.NewGuid();
        private static readonly Guid ticketDetailId4 = Guid.NewGuid();
        private static readonly Guid ticketDetailId5 = Guid.NewGuid();
        private static readonly Guid ticketDetailId6 = Guid.NewGuid();
        private static void SeedTicketDetail(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TicketDetail>().HasData(
                new TicketDetail
                {
                    Id = ticketDetailId1,
                    EventId = eventId1,
                    TicketName = "Ve VipPro 1",
                    RefundRuleId = refundRuleId,
                    TicketPrice = 100000,
                    TicketQuantity = 100,
                    RemainingQuantity = 1,
                    SoldQuantity = 99,
                },
                new TicketDetail
                {
                    Id = ticketDetailId2,
                    EventId = eventId1,
                    TicketName = "Ve VipPro 2",
                    RefundRuleId = refundRuleId,
                    TicketPrice = 150000,
                    TicketQuantity = 100,
                    RemainingQuantity = 100,
                },
                new TicketDetail
                {
                    Id = ticketDetailId3,
                    EventId = eventId2,
                    TicketName = "Ve VipPro 3",
                    RefundRuleId = refundRuleId,
                    TicketPrice = 150000,
                    TicketQuantity = 250,
                    RemainingQuantity = 250,
                },
                new TicketDetail
                {
                    Id = ticketDetailId4,
                    EventId = eventId2,
                    TicketName = "Ve VipPro 5",
                    RefundRuleId = refundRuleId,
                    TicketPrice = 200000,
                    TicketQuantity = 250,
                    RemainingQuantity = 250,
                },
                new TicketDetail
                {
                    Id = ticketDetailId5,
                    EventId = eventId3,
                    TicketName = "Ve VipPro 4",
                    RefundRuleId = refundRuleId,
                    TicketPrice = 50000,
                    TicketQuantity = 100,
                    RemainingQuantity = 100,
                },
                new TicketDetail
                {
                    Id = ticketDetailId6,
                    EventId = eventId4,
                    TicketName = "Ve Free",
                    TicketPrice = 0,
                    TicketQuantity = 100,
                    RemainingQuantity = 100,
                }
            );
        }


        private static void SeedEventTag(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<EventTag>().HasData(
                new EventTag { EventId = eventId1, TagId = tagId2 }, 
                new EventTag { EventId = eventId1, TagId = tagId1 }, 

                new EventTag { EventId = eventId2, TagId = tagId3 }, 

                new EventTag { EventId = eventId3, TagId = tagId4 }, 
                new EventTag { EventId = eventId3, TagId = tagId1 }, 

                new EventTag { EventId = eventId4, TagId = tagId4 }  
            );
        }


    }
}
