using Microsoft.EntityFrameworkCore;
using AIEvent.Domain.Identity;
using Microsoft.AspNetCore.Identity;
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
            SeedUserRoles(modelBuilder);
            SeedEventCategory(modelBuilder);
            SeedTag(modelBuilder);
            SeedOrganizerProfile(modelBuilder);
            SeedEvent(modelBuilder);
            SeedEventTag(modelBuilder);
            SeedRefundRule(modelBuilder);
            SeedRefundRuleDetail(modelBuilder);
            SeedTicketDetail(modelBuilder);
            SeedWallet(modelBuilder);
            SeedInterest(modelBuilder);
            SeedUserInterest(modelBuilder);
        }

        private static readonly Guid InterestId1 = Guid.NewGuid();
        private static readonly Guid InterestId2 = Guid.NewGuid();
        private static readonly Guid InterestId3 = Guid.NewGuid();
        private static readonly Guid InterestId4 = Guid.NewGuid();
        private static readonly Guid InterestId5 = Guid.NewGuid();
        private static readonly Guid InterestId6 = Guid.NewGuid();

        private static void SeedInterest(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Interest>().HasData(
                new Interest { Id = InterestId1, Name = "Công nghệ" },
                new Interest { Id = InterestId2, Name = "Nghệ thuật" },
                new Interest { Id = Guid.NewGuid(), Name = "Gaming" },
                new Interest { Id = InterestId4, Name = "Ẩm thực" },
                new Interest { Id = InterestId3, Name = "Kinh doanh" },
                new Interest { Id = Guid.NewGuid(), Name = "Sức khỏe" },
                new Interest { Id = Guid.NewGuid(), Name = "Thời trang" },
                new Interest { Id = Guid.NewGuid(), Name = "Khởi nghiệp" },
                new Interest { Id = Guid.NewGuid(), Name = "Giáo dục" },
                new Interest { Id = Guid.NewGuid(), Name = "Thể thao" },
                new Interest { Id = Guid.NewGuid(), Name = "Marketing" },
                new Interest { Id = Guid.NewGuid(), Name = "Âm nhạc" },
                new Interest { Id = Guid.NewGuid(), Name = "Nhiếp ảnh" },
                new Interest { Id = InterestId5, Name = "Thiết kế" },
                new Interest { Id = InterestId6, Name = "Du lịch" }
            );
        }


        private static void SeedRoles(ModelBuilder modelBuilder)
        {
            var roles = new[]
            {
                new AppRole
                {
                    Id = adminRoleId,
                    Name = "Admin",
                    NormalizedName = "ADMIN",
                    Description = "Administrator role with full access",
                    CreatedAt = DateTime.UtcNow,
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                },
                new AppRole
                {
                    Id = userRoleId,
                    Name = "User",
                    NormalizedName = "USER",
                    Description = "Regular user role",
                    CreatedAt = DateTime.UtcNow,
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                },
                new AppRole
                {
                    Id = managerRoleId,
                    Name = "Manager",
                    NormalizedName = "MANAGER",
                    Description = "System management",
                    CreatedAt = DateTime.UtcNow,
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                },
                new AppRole
                {
                    Id = staffRoleId,
                    Name = "Staff",
                    NormalizedName = "STAFF",
                    Description = "Manager's collaborator",
                    CreatedAt = DateTime.UtcNow,
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                },
                new AppRole
                {
                    Id = organizerRoleId,
                    Name = "Organizer",
                    NormalizedName = "ORGANIZER",
                    Description = "Organizer role for managing events",
                    CreatedAt = DateTime.UtcNow,
                    ConcurrencyStamp = Guid.NewGuid().ToString()
                }
            };

            modelBuilder.Entity<AppRole>().HasData(roles);
        }

        private static void SeedUsers(ModelBuilder modelBuilder)
        {
            var passwordHasher = new PasswordHasher<AppUser>();

            var adminUser = new AppUser
            {
                Id = adminUserId,
                UserName = "admin@aievent.com",
                NormalizedUserName = "ADMIN@AIEVENT.COM",
                Email = "admin@gmail.com",
                NormalizedEmail = "ADMIN@GMAIL.COM", 
                EmailConfirmed = true,
                FullName = "System Administrator",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                SecurityStamp = Guid.NewGuid().ToString(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            };
            adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "123");

            var regularUser = new AppUser
            {
                Id = regularUserId,
                UserName = "user@aievent.com",
                NormalizedUserName = "USER@AIEVENT.COM",
                Email = "user@gmail.com",
                NormalizedEmail = "USER@GMAIL.COM", 
                EmailConfirmed = true,
                FullName = "Regular User",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                SecurityStamp = Guid.NewGuid().ToString(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            };
            regularUser.PasswordHash = passwordHasher.HashPassword(regularUser, "123");

            var managerUser = new AppUser
            {
                Id = managerUserId,
                UserName = "manager@aievent.com",
                NormalizedUserName = "MANAGER@AIEVENT.COM",
                Email = "manager@gmail.com",
                NormalizedEmail = "MANAGER@GMAIL.COM", 
                EmailConfirmed = true,
                FullName = "Manager",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                SecurityStamp = Guid.NewGuid().ToString(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            };
            managerUser.PasswordHash = passwordHasher.HashPassword(managerUser, "123");

            var testUser = new AppUser
            {
                Id = testUserId,
                UserName = "test@aievent.com",
                NormalizedUserName = "TEST@AIEVENT.COM",
                Email = "user2@gmail.com",
                NormalizedEmail = "USER2@GMAIL.COM",
                EmailConfirmed = true,
                FullName = "Test User",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                SecurityStamp = Guid.NewGuid().ToString(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            };
            testUser.PasswordHash = passwordHasher.HashPassword(testUser, "123");

            var organizerUser = new AppUser
            {
                Id = organizerUserId,
                UserName = "organizer@aievent.com",
                NormalizedUserName = "ORGANIZER@AIEVENT.COM",
                Email = "organizer@gmail.com",
                NormalizedEmail = "ORGANIZER@GMAIL.COM",
                EmailConfirmed = true,
                FullName = "Organizer",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                SecurityStamp = Guid.NewGuid().ToString(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            };
            organizerUser.PasswordHash = passwordHasher.HashPassword(organizerUser, "123");

            var staffUser = new AppUser
            {
                Id = staffUserId,
                UserName = "staff@aievent.com",
                NormalizedUserName = "STAFF@AIEVENT.COM",
                Email = "staff@gmail.com",
                NormalizedEmail = "STAFF@GMAIL.COM",
                EmailConfirmed = true,
                FullName = "Staff",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                SecurityStamp = Guid.NewGuid().ToString(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            };
            staffUser.PasswordHash = passwordHasher.HashPassword(staffUser, "123");

            modelBuilder.Entity<AppUser>().HasData(adminUser, regularUser, managerUser, testUser, organizerUser, staffUser);
        }


        private static void SeedWallet(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Wallet>().HasData(
                new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = regularUserId,
                    Balance = 1000000,
                    Status = WalletStatus.Active,
                },
                new Wallet
                {
                    Id = Guid.NewGuid(),
                    UserId = testUserId,
                    Balance = 0,
                    Status = WalletStatus.Active,
                }
            );
        }

        private static void SeedUserRoles(ModelBuilder modelBuilder)
        {
            var userRoles = new[]
            {
                new IdentityUserRole<Guid>
                {
                    UserId = adminUserId,
                    RoleId = adminRoleId
                },
                new IdentityUserRole<Guid>
                {
                    UserId = regularUserId,
                    RoleId = userRoleId
                },
                new IdentityUserRole<Guid>
                {
                    UserId = managerUserId,
                    RoleId = managerRoleId
                },
                new IdentityUserRole<Guid>
                {
                    UserId = organizerUserId,
                    RoleId = organizerRoleId
                },
                new IdentityUserRole<Guid>
                {
                    UserId = staffUserId,
                    RoleId = staffRoleId
                },
                new IdentityUserRole<Guid>
                {
                    UserId = testUserId,
                    RoleId = userRoleId
                }
            };

            modelBuilder.Entity<IdentityUserRole<Guid>>().HasData(userRoles);
        }

        private static void SeedUserInterest(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<UserInterest>().HasData(
                new UserInterest
                {
                    UserId = regularUserId,
                    InterestId = InterestId1,
                },
                new UserInterest
                {
                    UserId = regularUserId,
                    InterestId = InterestId2,
                },
                new UserInterest
                {
                    UserId = regularUserId,
                    InterestId = InterestId3,
                },
                new UserInterest
                {
                    UserId = testUserId,
                    InterestId = InterestId4,
                },
                new UserInterest
                {
                    UserId = testUserId,
                    InterestId = InterestId5,
                },
                new UserInterest
                {
                    UserId = testUserId,
                    InterestId = InterestId6,
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
