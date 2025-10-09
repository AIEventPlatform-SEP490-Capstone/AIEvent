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

        private static void SeedEventCategory(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<EventCategory>().HasData(
                new EventCategory
                {
                    Id = Guid.NewGuid(),
                    CategoryName = "Music",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new EventCategory
                {
                    Id = Guid.NewGuid(),
                    CategoryName = "Technology",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new EventCategory
                {
                    Id = Guid.NewGuid(),
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

        public static void SeedTag(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Tag>().HasData(
                new Tag
                {
                    Id = Guid.NewGuid(),
                    NameTag = "Free",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Tag
                {
                    Id = Guid.NewGuid(),
                    NameTag = "Online",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Tag
                {
                    Id = Guid.NewGuid(),
                    NameTag = "VIP",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                },
                new Tag
                {
                    Id = Guid.NewGuid(),
                    NameTag = "Workshop",
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = "System"
                }
            );
        }

        private static void SeedOrganizerProfile(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<OrganizerProfile>().HasData(
                new OrganizerProfile
                {
                    Id = Guid.NewGuid(),
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
                    Status = OrganizerStatus.Approve,
                    ConfirmAt = DateTime.UtcNow,
                    ConfirmBy = "SystemSeeder",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow

                }
            );
        }
    }
}
