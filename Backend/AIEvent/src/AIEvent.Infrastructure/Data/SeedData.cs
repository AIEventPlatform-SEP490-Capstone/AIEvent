using Microsoft.EntityFrameworkCore;
using AIEvent.Domain.Identity;
using Microsoft.AspNetCore.Identity;
using AIEvent.Domain.Entities;

namespace AIEvent.Infrastructure.Data
{
    public static class SeedData
    {
        private static readonly Guid adminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        private static readonly Guid userRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        private static readonly Guid eventManagerRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        private static readonly Guid adminUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        private static readonly Guid regularUserId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        private static readonly Guid eventManagerUserId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        private static readonly Guid testUserId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        public static void Seed(this ModelBuilder modelBuilder)
        {
            SeedRoles(modelBuilder);
            SeedUsers(modelBuilder);
            SeedUserRoles(modelBuilder);
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
                    Id = eventManagerRoleId,
                    Name = "EventManager",
                    NormalizedName = "EVENTMANAGER",
                    Description = "Event manager role for managing events",
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

            var eventManagerUser = new AppUser
            {
                Id = eventManagerUserId,
                UserName = "manager@aievent.com",
                NormalizedUserName = "MANAGER@AIEVENT.COM",
                Email = "manager@gmail.com",
                NormalizedEmail = "MANAGER@GMAIL.COM", 
                EmailConfirmed = true,
                FullName = "Event Manager",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                SecurityStamp = Guid.NewGuid().ToString(),
                ConcurrencyStamp = Guid.NewGuid().ToString()
            };
            eventManagerUser.PasswordHash = passwordHasher.HashPassword(eventManagerUser, "123");

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

            modelBuilder.Entity<AppUser>().HasData(adminUser, regularUser, eventManagerUser, testUser);
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
                    UserId = eventManagerUserId,
                    RoleId = eventManagerRoleId
                },
                new IdentityUserRole<Guid>
                {
                    UserId = testUserId,
                    RoleId = userRoleId
                }
            };

            modelBuilder.Entity<IdentityUserRole<Guid>>().HasData(userRoles);
        }
    }
}
