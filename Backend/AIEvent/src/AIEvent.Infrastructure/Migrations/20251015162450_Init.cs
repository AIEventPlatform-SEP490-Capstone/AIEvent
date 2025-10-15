using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AIEvent.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EventCategories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CategoryName = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Interests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Interests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RefundRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RuleName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RuleDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsSystem = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefundRules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NameTag = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RefundRuleDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RefundRuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MinDaysBeforeEvent = table.Column<int>(type: "int", nullable: true),
                    MaxDaysBeforeEvent = table.Column<int>(type: "int", nullable: true),
                    RefundPercent = table.Column<int>(type: "int", precision: 5, scale: 2, nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefundRuleDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefundRuleDetails_RefundRules_RefundRuleId",
                        column: x => x.RefundRuleId,
                        principalTable: "RefundRules",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RoleId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Latitude = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Longitude = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ParticipationFrequency = table.Column<int>(type: "int", nullable: false),
                    BudgetOption = table.Column<int>(type: "int", nullable: false),
                    IsEmailNotificationEnabled = table.Column<bool>(type: "bit", nullable: true),
                    IsPushNotificationEnabled = table.Column<bool>(type: "bit", nullable: true),
                    IsSmsNotificationEnabled = table.Column<bool>(type: "bit", nullable: true),
                    InterestedCitiesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AvatarImgUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Users_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrganizerProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizationType = table.Column<int>(type: "int", nullable: false),
                    EventFrequency = table.Column<int>(type: "int", nullable: false),
                    EventSize = table.Column<int>(type: "int", nullable: false),
                    OrganizerType = table.Column<int>(type: "int", nullable: false),
                    EventExperienceLevel = table.Column<int>(type: "int", nullable: false),
                    ContactName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ContactEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    ContactPhone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Website = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    UrlFacebook = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    UrlInstagram = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    UrlLinkedIn = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ExperienceDescription = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ImgCompany = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ImgFrontIdentity = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ImgBackIdentity = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ImgBusinessLicense = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IdentityNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CompanyName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    TaxCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    CompanyDescription = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ConfirmAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ConfirmBy = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizerProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrganizerProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Token = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRevoked = table.Column<bool>(type: "bit", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReplacedByToken = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RefreshTokens_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Keyword = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Count = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserActions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserInterests",
                columns: table => new
                {
                    InterestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserInterests", x => new { x.UserId, x.InterestId });
                    table.ForeignKey(
                        name: "FK_UserInterests_Interests_InterestId",
                        column: x => x.InterestId,
                        principalTable: "Interests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserInterests_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserOtps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Purpose = table.Column<int>(type: "int", nullable: false),
                    ExpiredAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserOtps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserOtps_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Wallet",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Wallet", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Wallet_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizerProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventCategoryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    isOnlineEvent = table.Column<bool>(type: "bit", nullable: true),
                    LocationName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DetailedDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TotalTickets = table.Column<int>(type: "int", nullable: false),
                    SoldQuantity = table.Column<int>(type: "int", nullable: false),
                    RemainingTickets = table.Column<int>(type: "int", nullable: false),
                    TicketType = table.Column<int>(type: "int", nullable: false),
                    ImgListEvent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Publish = table.Column<bool>(type: "bit", nullable: true),
                    RequireApproval = table.Column<int>(type: "int", nullable: true),
                    RequireApprovalAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RequireApprovalBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Latitude = table.Column<float>(type: "real", nullable: true),
                    Longitude = table.Column<float>(type: "real", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Events_EventCategories_EventCategoryId",
                        column: x => x.EventCategoryId,
                        principalTable: "EventCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Events_OrganizerProfiles_OrganizerProfileId",
                        column: x => x.OrganizerProfileId,
                        principalTable: "OrganizerProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserActionFilters",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserActionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Field = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserActionFilters", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserActionFilters_UserActions_UserActionId",
                        column: x => x.UserActionId,
                        principalTable: "UserActions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TopupRequest",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WalletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SepayTransId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TopupRequest", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TopupRequest_Wallet_WalletId",
                        column: x => x.WalletId,
                        principalTable: "Wallet",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "WalletTransaction",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WalletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalletTransaction", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WalletTransaction_Wallet_WalletId",
                        column: x => x.WalletId,
                        principalTable: "Wallet",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    PaymentStatus = table.Column<int>(type: "int", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bookings_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Bookings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EventTags",
                columns: table => new
                {
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TagId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventTags", x => new { x.EventId, x.TagId });
                    table.ForeignKey(
                        name: "FK_EventTags_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EventTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FavoriteEvents",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoriteEvents", x => new { x.UserId, x.EventId });
                    table.ForeignKey(
                        name: "FK_FavoriteEvents_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FavoriteEvents_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TicketDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RefundRuleId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TicketName = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    TicketPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TicketQuantity = table.Column<int>(type: "int", nullable: false),
                    SoldQuantity = table.Column<int>(type: "int", nullable: false),
                    RemainingQuantity = table.Column<int>(type: "int", nullable: false),
                    TicketDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketDetails_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketDetails_RefundRules_RefundRuleId",
                        column: x => x.RefundRuleId,
                        principalTable: "RefundRules",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PaymentTransaction",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentTransaction", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentTransaction_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentTransaction_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BookingItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingItems_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BookingItems_TicketDetails_TicketTypeId",
                        column: x => x.TicketTypeId,
                        principalTable: "TicketDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingItemId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketTypeId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Price = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TicketCode = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    QrCodeUrl = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    UseAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tickets_BookingItems_BookingItemId",
                        column: x => x.BookingItemId,
                        principalTable: "BookingItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_TicketDetails_TicketTypeId",
                        column: x => x.TicketTypeId,
                        principalTable: "TicketDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "EventCategories",
                columns: new[] { "Id", "CategoryName", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("5e70c4f8-0fc2-4f04-9a3a-8a00ec211ad0"), "Technology", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(1592), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("78bdb96a-6e38-42be-b65a-d78dc8ddaa16"), "Education", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(1616), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("ca745109-0ae5-476b-9f61-471f517d2223"), "Sports", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(1613), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("f80b253d-2dd4-4115-adf1-274fbf384e36"), "Music", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(1575), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null }
                });

            migrationBuilder.InsertData(
                table: "Interests",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "Name", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("1a994c9e-c608-4a08-8a48-ca14ab50d57d"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Gaming", null, null },
                    { new Guid("1fa0b2d7-9ce6-4329-abf9-e800342e712d"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Nhiếp ảnh", null, null },
                    { new Guid("3bcfe253-8741-425f-8c04-c0b1f4d59da3"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Marketing", null, null },
                    { new Guid("3c47a878-185d-46d1-b4e4-82a73e85c842"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Thiết kế", null, null },
                    { new Guid("526f2307-86c9-4889-96dd-dc8f4848bfde"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Âm nhạc", null, null },
                    { new Guid("5d66b033-7a12-484d-8314-1b475f636a27"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Thể thao", null, null },
                    { new Guid("81861d6f-49d8-4d02-bf36-414b0752a8f8"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Ẩm thực", null, null },
                    { new Guid("9ecd8436-9145-4615-ade4-8db47d764f7a"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Công nghệ", null, null },
                    { new Guid("a7285740-70e5-4c51-8a29-555e5de44a3f"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Thời trang", null, null },
                    { new Guid("a8fac781-6f83-436a-bc04-acab64b1d342"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Du lịch", null, null },
                    { new Guid("c3f2ce9e-fdc2-45d3-81fe-1fc7618b5cd1"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Sức khỏe", null, null },
                    { new Guid("c692b9cc-5d1f-4248-bc09-e94ab346b711"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Giáo dục", null, null },
                    { new Guid("d96a4271-3f66-40de-ba97-4f9865610f0c"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Nghệ thuật", null, null },
                    { new Guid("dafc5096-892f-4249-aea5-10f4d28c1743"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Kinh doanh", null, null },
                    { new Guid("ead3e44e-7fa3-4e3a-808b-b6f15332c9a8"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, "Khởi nghiệp", null, null }
                });

            migrationBuilder.InsertData(
                table: "RefundRules",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "IsSystem", "RuleDescription", "RuleName", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new Guid("2b90beac-7ba7-4d45-9cd5-a3dc3e2e764b"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, true, null, "Hoan Ve", null, null });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "IsDeleted", "Name", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("4bb58711-2d39-4730-b6ad-fb2c6cd1bd49"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 46, 34, DateTimeKind.Unspecified).AddTicks(3279), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Administrator role with full access", false, "Admin", null, null },
                    { new Guid("5e3ee69b-e446-477a-810e-4b8f246f958d"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 46, 34, DateTimeKind.Unspecified).AddTicks(3299), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "System management", false, "Manager", null, null },
                    { new Guid("8383e033-d008-41f3-a679-eef71bcd120a"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 46, 34, DateTimeKind.Unspecified).AddTicks(3301), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Manager's collaborator", false, "Staff", null, null },
                    { new Guid("887615f8-d188-4e16-8ac2-c3c3346ed61e"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 46, 34, DateTimeKind.Unspecified).AddTicks(3297), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Regular user role", false, "User", null, null },
                    { new Guid("f88245a6-2ead-47f0-bc6b-cfb99adf48ea"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 46, 34, DateTimeKind.Unspecified).AddTicks(3303), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Organizer role for managing events", false, "Organizer", null, null }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "NameTag", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("01b2d4db-37c0-4fad-b582-7d5ddfdeb0ed"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(1839), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Workshop", null, null },
                    { new Guid("06c223eb-3407-4f77-9af8-18eedb910045"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(1757), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Online", null, null },
                    { new Guid("b364b888-4b95-4184-bbb6-982863865605"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(1754), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Free", null, null },
                    { new Guid("b85d8390-f517-4058-a237-3df4b1d1411c"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(1837), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "VIP", null, null }
                });

            migrationBuilder.InsertData(
                table: "RefundRuleDetails",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "MaxDaysBeforeEvent", "MinDaysBeforeEvent", "Note", "RefundPercent", "RefundRuleId", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("479ba5ab-5330-4553-950e-614c10eb79a0"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, 7, 3, null, 90, new Guid("2b90beac-7ba7-4d45-9cd5-a3dc3e2e764b"), null, null },
                    { new Guid("ac42b560-fbd1-4bae-a27e-c55a5bbf4467"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, 14, 7, null, 80, new Guid("2b90beac-7ba7-4d45-9cd5-a3dc3e2e764b"), null, null }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Address", "AvatarImgUrl", "BudgetOption", "City", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Email", "FullName", "InterestedCitiesJson", "IsActive", "IsDeleted", "IsEmailNotificationEnabled", "IsPushNotificationEnabled", "IsSmsNotificationEnabled", "Latitude", "Longitude", "ParticipationFrequency", "PasswordHash", "RoleId", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("114cf0ef-6645-45fc-bfd3-ac40bc9571e0"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 46, 668, DateTimeKind.Unspecified).AddTicks(1625), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "user2@gmail.com", "Test User", null, true, false, true, true, true, null, null, 0, "$2a$12$ipb2b0gJO4Mag/pJMKK/se91ksx5q.DDUKTTD/LlwuqxaT3az0RPO", new Guid("887615f8-d188-4e16-8ac2-c3c3346ed61e"), null, null },
                    { new Guid("403a72eb-3c6b-4a30-84e8-618c4e1a3511"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 46, 245, DateTimeKind.Unspecified).AddTicks(1010), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "user@gmail.com", "Regular User", null, true, false, true, true, true, null, null, 0, "$2a$12$ygHfAhm/BkUS8eMSo0eJGOxTBJV8UfoCqRMy9lPQmjJpW0yggOTM6", new Guid("887615f8-d188-4e16-8ac2-c3c3346ed61e"), null, null },
                    { new Guid("5616268d-c665-41ed-af50-504098c840d3"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 46, 880, DateTimeKind.Unspecified).AddTicks(9553), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "organizer@gmail.com", "Organizer", null, true, false, true, true, true, null, null, 0, "$2a$12$ZwUUSiTevfGjYe.BVvX2muFJClvz9OZWZCRKWmzX2PZ57/hhXBgEe", new Guid("f88245a6-2ead-47f0-bc6b-cfb99adf48ea"), null, null },
                    { new Guid("96744d14-aa17-44fc-9c3d-7f5726a4120e"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 46, 34, DateTimeKind.Unspecified).AddTicks(3441), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "admin@gmail.com", "System Administrator", null, true, false, true, true, true, null, null, 0, "$2a$12$aCXew61twU7pSPcA7Nl5iu0ZayiZdC3oicsDx93FTpasQt2VlNQr6", new Guid("4bb58711-2d39-4730-b6ad-fb2c6cd1bd49"), null, null },
                    { new Guid("e46af9d8-d81a-469e-adfc-9b52ca167bf6"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 90, DateTimeKind.Unspecified).AddTicks(4249), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "staff@gmail.com", "Staff", null, true, false, true, true, true, null, null, 0, "$2a$12$uYAkFppbSZmkPXksTwKDM.OWGHn5flMJsg9.fAMepkVjtVcYg.CXK", new Guid("8383e033-d008-41f3-a679-eef71bcd120a"), null, null },
                    { new Guid("fc2d72cc-8624-4e6d-a1a3-9dc00be60bcc"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 46, 457, DateTimeKind.Unspecified).AddTicks(6823), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "manager@gmail.com", "Manager", null, true, false, true, true, true, null, null, 0, "$2a$12$.Ztqa2cPhTBuYomwWmRXhuwhnvVCqUiWSo9dJNgAD8fgWL0nk3ToK", new Guid("5e3ee69b-e446-477a-810e-4b8f246f958d"), null, null }
                });

            migrationBuilder.InsertData(
                table: "OrganizerProfiles",
                columns: new[] { "Id", "Address", "CompanyDescription", "CompanyName", "ConfirmAt", "ConfirmBy", "ContactEmail", "ContactName", "ContactPhone", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "EventExperienceLevel", "EventFrequency", "EventSize", "ExperienceDescription", "IdentityNumber", "ImgBackIdentity", "ImgBusinessLicense", "ImgCompany", "ImgFrontIdentity", "IsDeleted", "OrganizationType", "OrganizerType", "Status", "TaxCode", "UpdatedAt", "UpdatedBy", "UrlFacebook", "UrlInstagram", "UrlLinkedIn", "UserId", "Website" },
                values: new object[] { new Guid("eb85e4ea-e913-426e-b1b3-21199b810421"), "123 Le Loi, District 1, Ho Chi Minh City", "Công ty hàng đầu trong lĩnh vực tổ chức sự kiện chuyên nghiệp tại Việt Nam.", "EventPro Vietnam Co., Ltd", new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Utc).AddTicks(1894), "SystemSeeder", "contact@eventpro.vn", "Nguyen Van A", "+84 987 654 321", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(1904), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, 3, 2, 2, "Chuyên tổ chức sự kiện doanh nghiệp, hội nghị, hội thảo và lễ ra mắt sản phẩm.", "079123456789", "/uploads/organizers/back_id.png", "/uploads/organizers/business_license.png", "/uploads/organizers/company_logo.png", "/uploads/organizers/front_id.png", false, 1, 1, 0, "0312345678", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(1905), new TimeSpan(0, 0, 0, 0, 0)), null, "https://facebook.com/eventpro", "https://instagram.com/eventpro.vn", "https://linkedin.com/company/eventpro", new Guid("5616268d-c665-41ed-af50-504098c840d3"), "https://eventpro.vn" });

            migrationBuilder.InsertData(
                table: "UserInterests",
                columns: new[] { "InterestId", "UserId" },
                values: new object[,]
                {
                    { new Guid("3c47a878-185d-46d1-b4e4-82a73e85c842"), new Guid("114cf0ef-6645-45fc-bfd3-ac40bc9571e0") },
                    { new Guid("81861d6f-49d8-4d02-bf36-414b0752a8f8"), new Guid("114cf0ef-6645-45fc-bfd3-ac40bc9571e0") },
                    { new Guid("a8fac781-6f83-436a-bc04-acab64b1d342"), new Guid("114cf0ef-6645-45fc-bfd3-ac40bc9571e0") },
                    { new Guid("9ecd8436-9145-4615-ade4-8db47d764f7a"), new Guid("403a72eb-3c6b-4a30-84e8-618c4e1a3511") },
                    { new Guid("d96a4271-3f66-40de-ba97-4f9865610f0c"), new Guid("403a72eb-3c6b-4a30-84e8-618c4e1a3511") },
                    { new Guid("dafc5096-892f-4249-aea5-10f4d28c1743"), new Guid("403a72eb-3c6b-4a30-84e8-618c4e1a3511") }
                });

            migrationBuilder.InsertData(
                table: "Wallet",
                columns: new[] { "Id", "Balance", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "Status", "UpdatedAt", "UpdatedBy", "UserId" },
                values: new object[,]
                {
                    { new Guid("aaca2b7a-4e60-49c3-9cba-a5632a6b3f56"), 0m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, 0, null, null, new Guid("114cf0ef-6645-45fc-bfd3-ac40bc9571e0") },
                    { new Guid("cde77b0e-1f55-4563-90ee-2b982cb12768"), 1000000m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, 0, null, null, new Guid("403a72eb-3c6b-4a30-84e8-618c4e1a3511") }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "Address", "City", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "DetailedDescription", "EndTime", "EventCategoryId", "ImgListEvent", "IsDeleted", "Latitude", "LocationName", "Longitude", "OrganizerProfileId", "Publish", "RemainingTickets", "RequireApproval", "RequireApprovalAt", "RequireApprovalBy", "SoldQuantity", "StartTime", "TicketType", "Title", "TotalTickets", "UpdatedAt", "UpdatedBy", "isOnlineEvent" },
                values: new object[,]
                {
                    { new Guid("7cc0da71-3fa0-4156-9d0c-4aadef9ff5f3"), "Tòa nhà Innovation Hub 1111111", "Hà Nội", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(2046), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chia sẻ kinh nghiệm khởi nghiệp thành công 1111111", null, new DateTime(2025, 11, 24, 20, 24, 47, 300, DateTimeKind.Utc).AddTicks(2044), new Guid("ca745109-0ae5-476b-9f61-471f517d2223"), null, false, null, "Hà Nội tòa 1", null, new Guid("eb85e4ea-e913-426e-b1b3-21199b810421"), true, 100, 0, null, null, 0, new DateTime(2025, 11, 24, 16, 24, 47, 300, DateTimeKind.Utc).AddTicks(2043), 1, "Workshop Khởi Nghiệp 3.0", 100, null, null, false },
                    { new Guid("81176280-91e1-4533-9b64-96424e083a64"), "Nhà hát Hòa Bình", "Hồ Chí Minh", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(2029), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chương trình nhạc Trịnh với nhiều nghệ sĩ nổi tiếng", null, new DateTime(2025, 10, 29, 18, 24, 47, 300, DateTimeKind.Utc).AddTicks(2026), new Guid("5e70c4f8-0fc2-4f04-9a3a-8a00ec211ad0"), null, false, null, "Hà Nội tòa 3", null, new Guid("eb85e4ea-e913-426e-b1b3-21199b810421"), true, 500, 0, null, null, 0, new DateTime(2025, 10, 29, 16, 24, 47, 300, DateTimeKind.Utc).AddTicks(2026), 2, "Đêm Nhạc Trịnh Công Sơn", 500, null, null, false },
                    { new Guid("a28dedaf-a5fd-4289-a13c-64603bc53300"), null, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(2007), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Sự kiện chia sẻ xu hướng AI mới nhất", null, new DateTime(2025, 10, 22, 19, 24, 47, 300, DateTimeKind.Utc).AddTicks(1999), new Guid("f80b253d-2dd4-4115-adf1-274fbf384e36"), null, false, null, "Hà Nội tòa 3", null, new Guid("eb85e4ea-e913-426e-b1b3-21199b810421"), true, 101, 0, null, null, 99, new DateTime(2025, 10, 22, 16, 24, 47, 300, DateTimeKind.Utc).AddTicks(1990), 2, "Hội Thảo Công Nghệ AI 2025", 200, null, null, true },
                    { new Guid("ecc1cf78-7648-4f5b-9eb1-604e82048421"), "Tòa nhà Innovation Hub", "Hà Nội", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 24, 47, 300, DateTimeKind.Unspecified).AddTicks(2035), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chia sẻ kinh nghiệm khởi nghiệp thành công", null, new DateTime(2025, 11, 5, 20, 24, 47, 300, DateTimeKind.Utc).AddTicks(2032), new Guid("ca745109-0ae5-476b-9f61-471f517d2223"), null, false, null, "Hà Nội tòa 2", null, new Guid("eb85e4ea-e913-426e-b1b3-21199b810421"), false, 100, 2, null, null, 0, new DateTime(2025, 11, 5, 16, 24, 47, 300, DateTimeKind.Utc).AddTicks(2032), 2, "Workshop Khởi Nghiệp 4.0", 100, null, null, false }
                });

            migrationBuilder.InsertData(
                table: "EventTags",
                columns: new[] { "EventId", "TagId" },
                values: new object[,]
                {
                    { new Guid("7cc0da71-3fa0-4156-9d0c-4aadef9ff5f3"), new Guid("01b2d4db-37c0-4fad-b582-7d5ddfdeb0ed") },
                    { new Guid("81176280-91e1-4533-9b64-96424e083a64"), new Guid("b85d8390-f517-4058-a237-3df4b1d1411c") },
                    { new Guid("a28dedaf-a5fd-4289-a13c-64603bc53300"), new Guid("06c223eb-3407-4f77-9af8-18eedb910045") },
                    { new Guid("a28dedaf-a5fd-4289-a13c-64603bc53300"), new Guid("b364b888-4b95-4184-bbb6-982863865605") },
                    { new Guid("ecc1cf78-7648-4f5b-9eb1-604e82048421"), new Guid("01b2d4db-37c0-4fad-b582-7d5ddfdeb0ed") },
                    { new Guid("ecc1cf78-7648-4f5b-9eb1-604e82048421"), new Guid("b364b888-4b95-4184-bbb6-982863865605") }
                });

            migrationBuilder.InsertData(
                table: "TicketDetails",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "EventId", "IsDeleted", "RefundRuleId", "RemainingQuantity", "SoldQuantity", "TicketDescription", "TicketName", "TicketPrice", "TicketQuantity", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("215fdc8f-4fb8-4a66-bb75-fcbbee20ab1b"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("81176280-91e1-4533-9b64-96424e083a64"), false, new Guid("2b90beac-7ba7-4d45-9cd5-a3dc3e2e764b"), 250, 0, null, "Ve VipPro 5", 200000m, 250, null, null },
                    { new Guid("38fc7812-06be-4ea8-a529-ac6b14705fe5"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("a28dedaf-a5fd-4289-a13c-64603bc53300"), false, new Guid("2b90beac-7ba7-4d45-9cd5-a3dc3e2e764b"), 100, 0, null, "Ve VipPro 2", 150000m, 100, null, null },
                    { new Guid("536974d6-0e19-4d70-b9af-d6d009dd0df1"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("81176280-91e1-4533-9b64-96424e083a64"), false, new Guid("2b90beac-7ba7-4d45-9cd5-a3dc3e2e764b"), 250, 0, null, "Ve VipPro 3", 150000m, 250, null, null },
                    { new Guid("a04798b1-9a28-4e63-98c3-9600870c5722"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("ecc1cf78-7648-4f5b-9eb1-604e82048421"), false, new Guid("2b90beac-7ba7-4d45-9cd5-a3dc3e2e764b"), 100, 0, null, "Ve VipPro 4", 50000m, 100, null, null },
                    { new Guid("b4ad4628-01f7-4056-be4a-66700cbce055"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("7cc0da71-3fa0-4156-9d0c-4aadef9ff5f3"), false, null, 100, 0, null, "Ve Free", 0m, 100, null, null },
                    { new Guid("b9ad3e86-02a6-417b-8b81-dbcada0eab95"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("a28dedaf-a5fd-4289-a13c-64603bc53300"), false, new Guid("2b90beac-7ba7-4d45-9cd5-a3dc3e2e764b"), 1, 99, null, "Ve VipPro 1", 100000m, 100, null, null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookingItem_BookingId",
                table: "BookingItems",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_BookingItem_TicketTypeId",
                table: "BookingItems",
                column: "TicketTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_EventId",
                table: "Bookings",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_PaymentStatus",
                table: "Bookings",
                column: "PaymentStatus");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_Status",
                table: "Bookings",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_User_Event",
                table: "Bookings",
                columns: new[] { "UserId", "EventId" });

            migrationBuilder.CreateIndex(
                name: "IX_Booking_UserId",
                table: "Bookings",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_EventCategory_CategoryName",
                table: "EventCategories",
                column: "CategoryName");

            migrationBuilder.CreateIndex(
                name: "IX_EventCategory_IsDeleted",
                table: "EventCategories",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_Event_IsDeleted",
                table: "Events",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_Event_OrganizerProfileId",
                table: "Events",
                column: "OrganizerProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_Event_OrganizerProfileId_CreatedAt",
                table: "Events",
                columns: new[] { "OrganizerProfileId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Event_Title",
                table: "Events",
                column: "Title");

            migrationBuilder.CreateIndex(
                name: "IX_Events_EventCategoryId",
                table: "Events",
                column: "EventCategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_EventTags_TagId",
                table: "EventTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_FavoriteEvent_User_Event",
                table: "FavoriteEvents",
                columns: new[] { "UserId", "EventId" });

            migrationBuilder.CreateIndex(
                name: "IX_FavoriteEvents_EventId",
                table: "FavoriteEvents",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EventField_IsDeleted",
                table: "Interests",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_EventField_NameEventField",
                table: "Interests",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizerProfile_ConfirmAt",
                table: "OrganizerProfiles",
                column: "ConfirmAt");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizerProfile_ContactEmail",
                table: "OrganizerProfiles",
                column: "ContactEmail");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizerProfile_IdentityNumber",
                table: "OrganizerProfiles",
                column: "IdentityNumber");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizerProfile_TaxCode",
                table: "OrganizerProfiles",
                column: "TaxCode",
                unique: true,
                filter: "[TaxCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_OrganizerProfile_UserId",
                table: "OrganizerProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizerProfile_UserId_IsDeleted",
                table: "OrganizerProfiles",
                columns: new[] { "UserId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransaction_BookingId",
                table: "PaymentTransaction",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransaction_UserId",
                table: "PaymentTransaction",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshToken_ExpiresAt",
                table: "RefreshTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_RefreshToken_Token",
                table: "RefreshTokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RefreshToken_Token_ExpiresAt",
                table: "RefreshTokens",
                columns: new[] { "Token", "ExpiresAt" });

            migrationBuilder.CreateIndex(
                name: "IX_RefreshToken_UserId_IsRevoked",
                table: "RefreshTokens",
                columns: new[] { "UserId", "IsRevoked" });

            migrationBuilder.CreateIndex(
                name: "IX_RefundRuleDetail_Range",
                table: "RefundRuleDetails",
                columns: new[] { "RefundRuleId", "MinDaysBeforeEvent", "MaxDaysBeforeEvent" });

            migrationBuilder.CreateIndex(
                name: "IX_RefundRule_IsSystem",
                table: "RefundRules",
                column: "IsSystem");

            migrationBuilder.CreateIndex(
                name: "IX_Role_Name",
                table: "Roles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tag_IsDeleted",
                table: "Tags",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_TicketDetail_IsDeleted",
                table: "TicketDetails",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_TicketDetail_RefundRuleId",
                table: "TicketDetails",
                column: "RefundRuleId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketDetails_EventId_TicketName",
                table: "TicketDetails",
                columns: new[] { "EventId", "TicketName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_BookingItemId",
                table: "Tickets",
                column: "BookingItemId");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_Status",
                table: "Tickets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_UserId",
                table: "Tickets",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TicketTypeId",
                table: "Tickets",
                column: "TicketTypeId");

            migrationBuilder.CreateIndex(
                name: "UQ_Ticket_Code",
                table: "Tickets",
                column: "TicketCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TopupRequest_WalletId",
                table: "TopupRequest",
                column: "WalletId");

            migrationBuilder.CreateIndex(
                name: "IX_UserActionFilters_UserActionId",
                table: "UserActionFilters",
                column: "UserActionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserActions_User_ActionType",
                table: "UserActions",
                columns: new[] { "UserId", "ActionType" });

            migrationBuilder.CreateIndex(
                name: "IX_UserInterests_InterestId",
                table: "UserInterests",
                column: "InterestId");

            migrationBuilder.CreateIndex(
                name: "IX_UserOtps_ExpiredAt",
                table: "UserOtps",
                column: "ExpiredAt");

            migrationBuilder.CreateIndex(
                name: "IX_UserOtps_UserId_Code",
                table: "UserOtps",
                columns: new[] { "UserId", "Code" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_User_IsActive",
                table: "Users",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Wallet_UserId",
                table: "Wallet",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransaction_WalletId",
                table: "WalletTransaction",
                column: "WalletId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventTags");

            migrationBuilder.DropTable(
                name: "FavoriteEvents");

            migrationBuilder.DropTable(
                name: "PaymentTransaction");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "RefundRuleDetails");

            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropTable(
                name: "TopupRequest");

            migrationBuilder.DropTable(
                name: "UserActionFilters");

            migrationBuilder.DropTable(
                name: "UserInterests");

            migrationBuilder.DropTable(
                name: "UserOtps");

            migrationBuilder.DropTable(
                name: "WalletTransaction");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "BookingItems");

            migrationBuilder.DropTable(
                name: "UserActions");

            migrationBuilder.DropTable(
                name: "Interests");

            migrationBuilder.DropTable(
                name: "Wallet");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "TicketDetails");

            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.DropTable(
                name: "RefundRules");

            migrationBuilder.DropTable(
                name: "EventCategories");

            migrationBuilder.DropTable(
                name: "OrganizerProfiles");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Roles");
        }
    }
}
