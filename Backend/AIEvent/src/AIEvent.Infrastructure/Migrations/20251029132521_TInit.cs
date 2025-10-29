using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AIEvent.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TInit : Migration
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
                name: "RefundRules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RuleName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RuleDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
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
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
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
                    UserInterestsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FavoriteEventTypesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Occupation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    JobTitle = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CareerGoal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Experience = table.Column<int>(type: "int", nullable: true),
                    PersonalWebsite = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Introduction = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProfessionalSkillsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LinkedInUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GitHubUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TwitterUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    InstagramUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FacebookUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LanguagesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LinkedUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
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
                    table.ForeignKey(
                        name: "FK_Users_Users_LinkedUserId",
                        column: x => x.LinkedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
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
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaymentInfomations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AccountHolderName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AccountNumber = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BranchName = table.Column<string>(type: "nvarchar(max)", nullable: false),
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
                    table.PrimaryKey("PK_PaymentInfomations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentInfomations_Users_UserId",
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
                name: "Wallet",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Balance = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
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
                name: "WithdrawRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    BankAccountNumber = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    BankAccountName = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
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
                    table.PrimaryKey("PK_WithdrawRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WithdrawRequests_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
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
                    ReasonReject = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReasonCancel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LinkRef = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    City = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Evidences = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Latitude = table.Column<float>(type: "real", nullable: true),
                    Longitude = table.Column<float>(type: "real", nullable: true),
                    SaleStartTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SaleEndTime = table.Column<DateTime>(type: "datetime2", nullable: true),
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
                name: "WalletTransaction",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WalletId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceBefore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BalanceAfter = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReferenceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReferenceType = table.Column<int>(type: "int", nullable: true),
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
                    MinPurchaseQuantity = table.Column<int>(type: "int", nullable: false),
                    MaxPurchaseQuantity = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
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
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
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
                    { new Guid("433e28f0-5e63-487e-a8d4-bb77cbfb67a7"), "Education", new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(4685), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("79beb79b-5b14-49d1-8641-941d47a5cf1b"), "Sports", new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(4567), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("7a10bbd6-6918-4bcc-b540-6d09315cfb4b"), "Technology", new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(4564), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("8217ae40-0f30-442b-892e-d44399259c52"), "Music", new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(4539), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null }
                });

            migrationBuilder.InsertData(
                table: "RefundRules",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "RuleDescription", "RuleName", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new Guid("9a2fa5c8-6e1d-4056-bd36-35aa6ca0d210"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, "Hoan Ve", null, null });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "IsDeleted", "Name", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("0540d361-2a56-454c-8e70-8829a8722453"), new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 19, 144, DateTimeKind.Unspecified).AddTicks(8905), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Manager's collaborator", false, "Staff", null, null },
                    { new Guid("4c5ad3ba-90bb-4a19-b78b-4205abae4952"), new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 19, 144, DateTimeKind.Unspecified).AddTicks(8881), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Administrator role with full access", false, "Admin", null, null },
                    { new Guid("89b43dd6-9e7f-4afd-81a2-12c5c5c03c05"), new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 19, 144, DateTimeKind.Unspecified).AddTicks(8907), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Organizer role for managing events", false, "Organizer", null, null },
                    { new Guid("abcd6b89-51a0-446c-8f6c-cbe2c3bfab3a"), new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 19, 144, DateTimeKind.Unspecified).AddTicks(8903), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "System management", false, "Manager", null, null },
                    { new Guid("c361a5f7-9859-40e0-b266-7cd76952dfbf"), new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 19, 144, DateTimeKind.Unspecified).AddTicks(8901), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Regular user role", false, "User", null, null }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "NameTag", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("50ed84c9-a413-499e-847b-48d40395a9a3"), new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(4755), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Free", null, null },
                    { new Guid("5c085589-5519-4fd2-97c4-b9639025241a"), new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(4759), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Online", null, null },
                    { new Guid("7b42f2ad-e158-4976-a82b-6c59a1c6c276"), new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(4761), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "VIP", null, null },
                    { new Guid("a91dab6f-2f1d-4b8d-838b-a3d114a4f7d1"), new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(4765), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Workshop", null, null }
                });

            migrationBuilder.InsertData(
                table: "RefundRuleDetails",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "MaxDaysBeforeEvent", "MinDaysBeforeEvent", "Note", "RefundPercent", "RefundRuleId", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("26ebd71c-07a0-4236-89a6-828b02001b48"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, 7, 3, null, 90, new Guid("9a2fa5c8-6e1d-4056-bd36-35aa6ca0d210"), null, null },
                    { new Guid("2f39ef22-8a9d-4687-a3c0-ee8148cd941c"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, 14, 7, null, 80, new Guid("9a2fa5c8-6e1d-4056-bd36-35aa6ca0d210"), null, null }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Address", "AvatarImgUrl", "BudgetOption", "CareerGoal", "City", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Email", "Experience", "FacebookUrl", "FavoriteEventTypesJson", "FullName", "GitHubUrl", "InstagramUrl", "InterestedCitiesJson", "Introduction", "IsActive", "IsDeleted", "IsEmailNotificationEnabled", "IsPushNotificationEnabled", "IsSmsNotificationEnabled", "JobTitle", "LanguagesJson", "Latitude", "LinkedInUrl", "LinkedUserId", "Longitude", "Occupation", "ParticipationFrequency", "PasswordHash", "PersonalWebsite", "PhoneNumber", "ProfessionalSkillsJson", "RoleId", "TwitterUrl", "UpdatedAt", "UpdatedBy", "UserInterestsJson" },
                values: new object[,]
                {
                    { new Guid("00cfc9a5-55cb-44e0-b85d-12faea4285b0"), null, null, 0, null, null, new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 19, 391, DateTimeKind.Unspecified).AddTicks(2126), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "user@gmail.com", null, null, null, "Regular User", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$.O9lfDpNYyqGV7Nf43sxCuLqICUi.AiVRpa9qN643HgCAxhPJ.ppO", null, null, null, new Guid("c361a5f7-9859-40e0-b266-7cd76952dfbf"), null, null, null, null },
                    { new Guid("1752dda4-328a-429b-93d3-8a17d670111e"), null, null, 0, null, null, new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 19, 640, DateTimeKind.Unspecified).AddTicks(1785), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "manager@gmail.com", null, null, null, "Manager", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$0eWYfOIYZGrUAYkXWw0/4OPXUv5AVWFeQgpnshD54VOcn9nYJrn0K", null, null, null, new Guid("abcd6b89-51a0-446c-8f6c-cbe2c3bfab3a"), null, null, null, null },
                    { new Guid("4ab7628d-6e49-43a8-b3fc-be39b829cabf"), null, null, 0, null, null, new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 19, 144, DateTimeKind.Unspecified).AddTicks(9235), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "admin@gmail.com", null, null, null, "System Administrator", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$Kr6gidhkFaYs2GVkYe1wtO6PXSYZnJ..KpIiRK/bmghz7gBKSbVuC", null, null, null, new Guid("4c5ad3ba-90bb-4a19-b78b-4205abae4952"), null, null, null, null },
                    { new Guid("61b8de6d-26b2-41e8-ad62-7889ad8f0000"), null, null, 0, null, null, new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 19, 889, DateTimeKind.Unspecified).AddTicks(286), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "user2@gmail.com", null, null, null, "Test User", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$xLMOwlB0U09tE/Ddek587.KI48DgAJRWxuS710PD/G9Y/enCzLDbK", null, null, null, new Guid("c361a5f7-9859-40e0-b266-7cd76952dfbf"), null, null, null, null },
                    { new Guid("abb2b9fd-dc2f-4b63-bbf4-8188e5e61aea"), null, null, 0, null, null, new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 390, DateTimeKind.Unspecified).AddTicks(1412), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "staff@gmail.com", null, null, null, "Staff", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$SZlQ5Gao3W88oBKX33csQut11ubtqbjE3nhABfQQPFnIBhDwW8ZfO", null, null, null, new Guid("0540d361-2a56-454c-8e70-8829a8722453"), null, null, null, null },
                    { new Guid("e2c132df-779a-47ae-85f8-ab438ab751b6"), null, null, 0, null, null, new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 130, DateTimeKind.Unspecified).AddTicks(8303), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "organizer@gmail.com", null, null, null, "Organizer", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$2/SgxSzuGYWFverhkFUu3OfZaMyDGI0Q9yg.Ld6CryTUa/nGbeAlG", null, null, null, new Guid("89b43dd6-9e7f-4afd-81a2-12c5c5c03c05"), null, null, null, null }
                });

            migrationBuilder.InsertData(
                table: "OrganizerProfiles",
                columns: new[] { "Id", "Address", "CompanyDescription", "CompanyName", "ConfirmAt", "ConfirmBy", "ContactEmail", "ContactName", "ContactPhone", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "EventExperienceLevel", "EventFrequency", "EventSize", "ExperienceDescription", "IdentityNumber", "ImgBackIdentity", "ImgBusinessLicense", "ImgCompany", "ImgFrontIdentity", "IsDeleted", "OrganizationType", "OrganizerType", "Status", "TaxCode", "UpdatedAt", "UpdatedBy", "UrlFacebook", "UrlInstagram", "UrlLinkedIn", "UserId", "Website" },
                values: new object[] { new Guid("8ccbd79d-ea08-445f-948a-3d9ddf1e5c33"), "123 Le Loi, District 1, Ho Chi Minh City", "Công ty hàng đầu trong lĩnh vực tổ chức sự kiện chuyên nghiệp tại Việt Nam.", "EventPro Vietnam Co., Ltd", new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Utc).AddTicks(4899), "SystemSeeder", "contact@eventpro.vn", "Nguyen Van A", "+84 987 654 321", new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(4909), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, 3, 2, 2, "Chuyên tổ chức sự kiện doanh nghiệp, hội nghị, hội thảo và lễ ra mắt sản phẩm.", "079123456789", "/uploads/organizers/back_id.png", "/uploads/organizers/business_license.png", "/uploads/organizers/company_logo.png", "/uploads/organizers/front_id.png", false, 1, 1, 0, "0312345678", new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(4910), new TimeSpan(0, 0, 0, 0, 0)), null, "https://facebook.com/eventpro", "https://instagram.com/eventpro.vn", "https://linkedin.com/company/eventpro", new Guid("e2c132df-779a-47ae-85f8-ab438ab751b6"), "https://eventpro.vn" });

            migrationBuilder.InsertData(
                table: "Wallet",
                columns: new[] { "Id", "Balance", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "UpdatedAt", "UpdatedBy", "UserId" },
                values: new object[,]
                {
                    { new Guid("42e25f61-7ec2-4b0c-9626-c4adb84b1395"), 10000000m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, null, new Guid("00cfc9a5-55cb-44e0-b85d-12faea4285b0") },
                    { new Guid("74ddd6be-524f-42c6-bcae-b1465f960923"), 0m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, null, new Guid("1752dda4-328a-429b-93d3-8a17d670111e") },
                    { new Guid("850ec95c-ac2d-49a0-88d1-26faa2fe887b"), 0m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, null, new Guid("e2c132df-779a-47ae-85f8-ab438ab751b6") },
                    { new Guid("aeec2ceb-eac5-4175-a7e4-475ab419fbfc"), 0m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, null, new Guid("4ab7628d-6e49-43a8-b3fc-be39b829cabf") },
                    { new Guid("ce643cd4-a9f9-4859-819c-798a238b32e8"), 0m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, null, new Guid("61b8de6d-26b2-41e8-ad62-7889ad8f0000") }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "Address", "City", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "DetailedDescription", "EndTime", "EventCategoryId", "Evidences", "ImgListEvent", "IsDeleted", "Latitude", "LinkRef", "LocationName", "Longitude", "OrganizerProfileId", "Publish", "ReasonCancel", "ReasonReject", "RemainingTickets", "RequireApproval", "RequireApprovalAt", "RequireApprovalBy", "SaleEndTime", "SaleStartTime", "SoldQuantity", "StartTime", "TicketType", "Title", "TotalTickets", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("0042b72d-8d02-4f51-aa84-ae01ab3da520"), "Nhà hát Hòa Bình", "Hồ Chí Minh", new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(5271), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chương trình nhạc Trịnh với nhiều nghệ sĩ nổi tiếng", null, new DateTime(2025, 11, 12, 15, 25, 20, 666, DateTimeKind.Utc).AddTicks(5268), new Guid("7a10bbd6-6918-4bcc-b540-6d09315cfb4b"), null, null, false, null, null, "Hà Nội tòa 3", null, new Guid("8ccbd79d-ea08-445f-948a-3d9ddf1e5c33"), true, null, null, 500, 0, null, null, null, null, 0, new DateTime(2025, 11, 12, 13, 25, 20, 666, DateTimeKind.Utc).AddTicks(5267), 2, "Đêm Nhạc Trịnh Công Sơn", 500, null, null },
                    { new Guid("5dd332c0-bd5e-469d-85c3-a5200f50888b"), "Tòa nhà Innovation Hub 1111111", "Hà Nội", new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(5281), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chia sẻ kinh nghiệm khởi nghiệp thành công 1111111", null, new DateTime(2025, 12, 8, 17, 25, 20, 666, DateTimeKind.Utc).AddTicks(5279), new Guid("79beb79b-5b14-49d1-8641-941d47a5cf1b"), null, null, false, null, null, "Hà Nội tòa 1", null, new Guid("8ccbd79d-ea08-445f-948a-3d9ddf1e5c33"), true, null, null, 100, 0, null, null, null, null, 0, new DateTime(2025, 12, 8, 13, 25, 20, 666, DateTimeKind.Utc).AddTicks(5279), 1, "Workshop Khởi Nghiệp 3.0", 100, null, null },
                    { new Guid("b58fd0e1-a011-4adf-af96-81d119d36fb2"), null, null, new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(5248), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Sự kiện chia sẻ xu hướng AI mới nhất", null, new DateTime(2025, 11, 5, 16, 25, 20, 666, DateTimeKind.Utc).AddTicks(5240), new Guid("8217ae40-0f30-442b-892e-d44399259c52"), null, null, false, null, null, "Hà Nội tòa 3", null, new Guid("8ccbd79d-ea08-445f-948a-3d9ddf1e5c33"), true, null, null, 101, 0, null, null, null, null, 99, new DateTime(2025, 11, 5, 13, 25, 20, 666, DateTimeKind.Utc).AddTicks(5229), 2, "Hội Thảo Công Nghệ AI 2025", 200, null, null },
                    { new Guid("ee99b4ad-9ae3-4e8e-81d5-9abcc0ee8a8a"), "Tòa nhà Innovation Hub", "Hà Nội", new DateTimeOffset(new DateTime(2025, 10, 29, 13, 25, 20, 666, DateTimeKind.Unspecified).AddTicks(5276), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chia sẻ kinh nghiệm khởi nghiệp thành công", null, new DateTime(2025, 11, 19, 17, 25, 20, 666, DateTimeKind.Utc).AddTicks(5274), new Guid("79beb79b-5b14-49d1-8641-941d47a5cf1b"), null, null, false, null, null, "Hà Nội tòa 2", null, new Guid("8ccbd79d-ea08-445f-948a-3d9ddf1e5c33"), false, null, null, 100, 2, null, null, null, null, 0, new DateTime(2025, 11, 19, 13, 25, 20, 666, DateTimeKind.Utc).AddTicks(5274), 2, "Workshop Khởi Nghiệp 4.0", 100, null, null }
                });

            migrationBuilder.InsertData(
                table: "EventTags",
                columns: new[] { "EventId", "TagId" },
                values: new object[,]
                {
                    { new Guid("0042b72d-8d02-4f51-aa84-ae01ab3da520"), new Guid("7b42f2ad-e158-4976-a82b-6c59a1c6c276") },
                    { new Guid("5dd332c0-bd5e-469d-85c3-a5200f50888b"), new Guid("a91dab6f-2f1d-4b8d-838b-a3d114a4f7d1") },
                    { new Guid("b58fd0e1-a011-4adf-af96-81d119d36fb2"), new Guid("50ed84c9-a413-499e-847b-48d40395a9a3") },
                    { new Guid("b58fd0e1-a011-4adf-af96-81d119d36fb2"), new Guid("5c085589-5519-4fd2-97c4-b9639025241a") },
                    { new Guid("ee99b4ad-9ae3-4e8e-81d5-9abcc0ee8a8a"), new Guid("50ed84c9-a413-499e-847b-48d40395a9a3") },
                    { new Guid("ee99b4ad-9ae3-4e8e-81d5-9abcc0ee8a8a"), new Guid("a91dab6f-2f1d-4b8d-838b-a3d114a4f7d1") }
                });

            migrationBuilder.InsertData(
                table: "TicketDetails",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "EventId", "MaxPurchaseQuantity", "MinPurchaseQuantity", "RefundRuleId", "RemainingQuantity", "SoldQuantity", "TicketDescription", "TicketName", "TicketPrice", "TicketQuantity", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("00531445-42d1-4632-8cda-b356f005a20a"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("0042b72d-8d02-4f51-aa84-ae01ab3da520"), 10, 1, new Guid("9a2fa5c8-6e1d-4056-bd36-35aa6ca0d210"), 250, 0, null, "Ve VipPro 3", 150000m, 250, null, null },
                    { new Guid("22c15958-bb78-4e25-af0b-8ea4af1ca786"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("0042b72d-8d02-4f51-aa84-ae01ab3da520"), 10, 1, new Guid("9a2fa5c8-6e1d-4056-bd36-35aa6ca0d210"), 250, 0, null, "Ve VipPro 5", 200000m, 250, null, null },
                    { new Guid("232a5c7e-03ad-42ad-902a-541bddf27f8f"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("5dd332c0-bd5e-469d-85c3-a5200f50888b"), 10, 1, null, 100, 0, null, "Ve Free", 0m, 100, null, null },
                    { new Guid("987fd71b-5967-4698-9ca8-a50ec323f773"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("b58fd0e1-a011-4adf-af96-81d119d36fb2"), 10, 1, new Guid("9a2fa5c8-6e1d-4056-bd36-35aa6ca0d210"), 100, 0, null, "Ve VipPro 2", 150000m, 100, null, null },
                    { new Guid("aaa782cb-e4da-4974-a4dc-4ab54aaa32eb"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("b58fd0e1-a011-4adf-af96-81d119d36fb2"), 10, 1, new Guid("9a2fa5c8-6e1d-4056-bd36-35aa6ca0d210"), 1, 99, null, "Ve VipPro 1", 100000m, 100, null, null },
                    { new Guid("cebe8aff-bd74-4182-a1ec-1722aaf9920a"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("ee99b4ad-9ae3-4e8e-81d5-9abcc0ee8a8a"), 10, 1, new Guid("9a2fa5c8-6e1d-4056-bd36-35aa6ca0d210"), 100, 0, null, "Ve VipPro 4", 50000m, 100, null, null }
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
                name: "IX_OrganizerProfile_UserId",
                table: "OrganizerProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizerProfile_UserId_TaxCode",
                table: "OrganizerProfiles",
                columns: new[] { "UserId", "TaxCode" },
                unique: true,
                filter: "[TaxCode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentInfo_User_Account",
                table: "PaymentInfomations",
                columns: new[] { "UserId", "AccountNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentInfo_UserId",
                table: "PaymentInfomations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransaction_BookingId",
                table: "PaymentTransaction",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransaction_CreatedAt",
                table: "PaymentTransaction",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentTransaction_Status",
                table: "PaymentTransaction",
                column: "Status");

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
                name: "IX_RefreshToken_UserId_IsDeleted",
                table: "RefreshTokens",
                columns: new[] { "UserId", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_RefundRuleDetail_Range",
                table: "RefundRuleDetails",
                columns: new[] { "RefundRuleId", "MinDaysBeforeEvent", "MaxDaysBeforeEvent" });

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
                name: "IX_UserActionFilters_UserActionId",
                table: "UserActionFilters",
                column: "UserActionId");

            migrationBuilder.CreateIndex(
                name: "IX_UserActions_User_ActionType",
                table: "UserActions",
                columns: new[] { "UserId", "ActionType" });

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
                name: "IX_Users_LinkedUserId",
                table: "Users",
                column: "LinkedUserId");

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
                name: "IX_WalletTransaction_CreatedAt",
                table: "WalletTransaction",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransaction_Reference",
                table: "WalletTransaction",
                columns: new[] { "ReferenceId", "ReferenceType" });

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransaction_Type",
                table: "WalletTransaction",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransaction_WalletId",
                table: "WalletTransaction",
                column: "WalletId");

            migrationBuilder.CreateIndex(
                name: "IX_WithdrawRequests_UserId",
                table: "WithdrawRequests",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EventTags");

            migrationBuilder.DropTable(
                name: "FavoriteEvents");

            migrationBuilder.DropTable(
                name: "PaymentInfomations");

            migrationBuilder.DropTable(
                name: "PaymentTransaction");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "RefundRuleDetails");

            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropTable(
                name: "UserActionFilters");

            migrationBuilder.DropTable(
                name: "WalletTransaction");

            migrationBuilder.DropTable(
                name: "WithdrawRequests");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "BookingItems");

            migrationBuilder.DropTable(
                name: "UserActions");

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
