using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AIEvent.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class i : Migration
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
                    District = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Latitude = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Longitude = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ParticipationFrequency = table.Column<int>(type: "int", nullable: false),
                    BudgetOption = table.Column<int>(type: "int", nullable: false),
                    IsEmailNotificationEnabled = table.Column<bool>(type: "bit", nullable: true),
                    IsPushNotificationEnabled = table.Column<bool>(type: "bit", nullable: true),
                    IsSmsNotificationEnabled = table.Column<bool>(type: "bit", nullable: true),
                    InterestedDistrictsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
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
                name: "Friendships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ReceiverId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
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
                    table.PrimaryKey("PK_Friendships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Friendships_Users_ReceiverId",
                        column: x => x.ReceiverId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Friendships_Users_SenderId",
                        column: x => x.SenderId,
                        principalTable: "Users",
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
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaymentInformations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AccountHolderName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AccountNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BankName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BankBin = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BankShortName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BankLogo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BranchName = table.Column<string>(type: "nvarchar(max)", nullable: true),
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
                    table.PrimaryKey("PK_PaymentInformations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentInformations_Users_UserId",
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
                name: "Wallets",
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
                    table.PrimaryKey("PK_Wallets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Wallets_Users_UserId",
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
                    TicketPricingType = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PayoutAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PlatformFee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ImgListEvent = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Publish = table.Column<bool>(type: "bit", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: true),
                    RequireApprovalAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RequireApprovalBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReasonReject = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ReasonCancel = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LinkRef = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    District = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImgListEvidences = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Address = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Latitude = table.Column<float>(type: "real", nullable: true),
                    Longitude = table.Column<float>(type: "real", nullable: true),
                    SaleStartTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SaleEndTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    AverageRating = table.Column<double>(type: "float", nullable: true),
                    TotalRatings = table.Column<int>(type: "int", nullable: false),
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
                name: "WalletTransactions",
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
                    table.PrimaryKey("PK_WalletTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WalletTransactions_Wallets_WalletId",
                        column: x => x.WalletId,
                        principalTable: "Wallets",
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
                name: "EndEventRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizerProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PaymentInformationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Summary = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AdminNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    EvidenceImages = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsLatest = table.Column<bool>(type: "bit", nullable: false),
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
                    table.PrimaryKey("PK_EndEventRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EndEventRequests_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EndEventRequests_OrganizerProfiles_OrganizerProfileId",
                        column: x => x.OrganizerProfileId,
                        principalTable: "OrganizerProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_EndEventRequests_PaymentInformations_PaymentInformationId",
                        column: x => x.PaymentInformationId,
                        principalTable: "PaymentInformations",
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
                name: "Ratings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RatingScore = table.Column<byte>(type: "tinyint", nullable: false),
                    Comment = table.Column<string>(type: "nvarchar(max)", nullable: true),
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
                    table.PrimaryKey("PK_Ratings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Ratings_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Ratings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RevenueReports",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrganizerProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GrossRevenue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NetRevenue = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PlatformFee = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ReportMonth = table.Column<int>(type: "int", nullable: false),
                    ReportYear = table.Column<int>(type: "int", nullable: false),
                    PayoutDate = table.Column<DateTime>(type: "datetime2", nullable: false),
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
                    table.PrimaryKey("PK_RevenueReports", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RevenueReports_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RevenueReports_OrganizerProfiles_OrganizerProfileId",
                        column: x => x.OrganizerProfileId,
                        principalTable: "OrganizerProfiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TicketTypes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EventId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketName = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    TicketPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    TicketQuantity = table.Column<int>(type: "int", nullable: false),
                    SoldQuantity = table.Column<int>(type: "int", nullable: false),
                    RemainingQuantity = table.Column<int>(type: "int", nullable: false),
                    TicketDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketTypes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketTypes_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
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
                    TransactionType = table.Column<int>(type: "int", nullable: false),
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
                        name: "FK_BookingItems_TicketTypes_TicketTypeId",
                        column: x => x.TicketTypeId,
                        principalTable: "TicketTypes",
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
                        name: "FK_Tickets_TicketTypes_TicketTypeId",
                        column: x => x.TicketTypeId,
                        principalTable: "TicketTypes",
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
                    { new Guid("2a2b3a4b-f6c5-4176-9c35-883594fe9305"), "Technology", new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(1112), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("8f41c61e-8ee8-4082-bdc7-7af3d4b41fdc"), "Music", new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(1039), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("b561ae60-955b-4418-93d4-5654d197ae3f"), "Sports", new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(1120), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("f904f29b-8330-415c-a3c6-307c571c6fb6"), "Education", new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(1118), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null }
                });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "IsDeleted", "Name", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("4ecefe54-9817-43ad-bfdd-fb683bdaeb6e"), new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 15, 651, DateTimeKind.Unspecified).AddTicks(5689), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Organizer role for managing events", false, "Organizer", null, null },
                    { new Guid("4f7514ba-78b5-4388-89ba-7d233c32a526"), new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 15, 651, DateTimeKind.Unspecified).AddTicks(5685), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Manager's collaborator", false, "Staff", null, null },
                    { new Guid("65736304-6b08-475d-9dee-27981ad95102"), new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 15, 651, DateTimeKind.Unspecified).AddTicks(5651), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Administrator role with full access", false, "Admin", null, null },
                    { new Guid("ce5a0665-a86e-4eaf-b217-07b47a40cc5c"), new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 15, 651, DateTimeKind.Unspecified).AddTicks(5682), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "System management", false, "Manager", null, null },
                    { new Guid("eb6f0648-68c6-4cac-acd0-eae48b628f4a"), new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 15, 651, DateTimeKind.Unspecified).AddTicks(5677), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Regular user role", false, "User", null, null }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "NameTag", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("33aae937-e825-4841-9c6f-450920814c9a"), new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(1316), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Workshop", null, null },
                    { new Guid("7226730c-badc-46a8-93e4-01770c93ff35"), new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(1305), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Free", null, null },
                    { new Guid("8574d069-8fe5-4dc2-9446-405eab6bf627"), new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(1312), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Online", null, null },
                    { new Guid("8c37ee4b-100d-497f-be96-5c1592e0e3f0"), new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(1313), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "VIP", null, null }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Address", "AvatarImgUrl", "BudgetOption", "CareerGoal", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "District", "Email", "Experience", "FacebookUrl", "FavoriteEventTypesJson", "FullName", "GitHubUrl", "InstagramUrl", "InterestedDistrictsJson", "Introduction", "IsActive", "IsDeleted", "IsEmailNotificationEnabled", "IsPushNotificationEnabled", "IsSmsNotificationEnabled", "JobTitle", "LanguagesJson", "Latitude", "LinkedInUrl", "LinkedUserId", "Longitude", "Occupation", "ParticipationFrequency", "PasswordHash", "PersonalWebsite", "PhoneNumber", "ProfessionalSkillsJson", "RoleId", "TwitterUrl", "UpdatedAt", "UpdatedBy", "UserInterestsJson" },
                values: new object[,]
                {
                    { new Guid("1e490cce-3424-4d36-bf14-d8e3ce6c5e72"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 15, 651, DateTimeKind.Unspecified).AddTicks(6124), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, "admin@gmail.com", null, null, null, "System Administrator", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$m37diWwH3fMf9JdrbOnLdeA8neHn6/vW9FbOGzv.WOGk.LNk0x3i2", null, null, null, new Guid("65736304-6b08-475d-9dee-27981ad95102"), null, null, null, null },
                    { new Guid("6ff3a8b5-d0d0-4d8c-a152-2c8d4b179812"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 7, DateTimeKind.Unspecified).AddTicks(9434), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, "staff@gmail.com", null, null, null, "Staff", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$CyK3mcyUTNqsAYsmlM1LROHL5lw3YKvf7dnrt1AXiQNF0PLk6r2IS", null, null, null, new Guid("4f7514ba-78b5-4388-89ba-7d233c32a526"), null, null, null, null },
                    { new Guid("731e82e2-4644-4d8e-9911-0e10d4fc3e77"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 17, 81, DateTimeKind.Unspecified).AddTicks(6858), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, "user2@gmail.com", null, null, null, "Test User", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$26Hald71MGAXBliTRbBjz.AXGhQMVpsuTGT5VkEjYj5VmG7UmIHZy", null, null, null, new Guid("eb6f0648-68c6-4cac-acd0-eae48b628f4a"), null, null, null, null },
                    { new Guid("99b679a4-c759-4ed1-bbc1-8fd6c98dbacd"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 17, 542, DateTimeKind.Unspecified).AddTicks(9535), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, "organizer@gmail.com", null, null, null, "Organizer", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$w/7LdL.Qvrc31atp3hpeAumemQmDaWYq7xcnI/hx095EXjOO.PkPK", null, null, null, new Guid("4ecefe54-9817-43ad-bfdd-fb683bdaeb6e"), null, null, null, null },
                    { new Guid("b4d507b3-b85e-4fc8-be8e-63d30c93dabc"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 16, 131, DateTimeKind.Unspecified).AddTicks(1540), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, "user@gmail.com", null, null, null, "Regular User", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$2uwhBnSZl34uJYTq3Jkzxe4QbW4XefLmAyMfGZGd/IiNAAh/SPeCS", null, null, null, new Guid("eb6f0648-68c6-4cac-acd0-eae48b628f4a"), null, null, null, null },
                    { new Guid("b8b5ddd1-6e65-486c-8120-9a2b40568d06"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 16, 622, DateTimeKind.Unspecified).AddTicks(2404), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, null, "manager@gmail.com", null, null, null, "Manager", null, null, null, null, true, false, true, true, true, null, null, null, null, null, null, null, 0, "$2a$12$/clanf9S5G2QScUQvdJ4K.m9qeW0nWaFDKFbClX1jiS6bd69HRjOC", null, null, null, new Guid("ce5a0665-a86e-4eaf-b217-07b47a40cc5c"), null, null, null, null }
                });

            migrationBuilder.InsertData(
                table: "OrganizerProfiles",
                columns: new[] { "Id", "Address", "CompanyDescription", "CompanyName", "ConfirmAt", "ConfirmBy", "ContactEmail", "ContactName", "ContactPhone", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "EventExperienceLevel", "EventFrequency", "EventSize", "ExperienceDescription", "IdentityNumber", "ImgBackIdentity", "ImgBusinessLicense", "ImgCompany", "ImgFrontIdentity", "IsDeleted", "OrganizationType", "OrganizerType", "Status", "TaxCode", "UpdatedAt", "UpdatedBy", "UrlFacebook", "UrlInstagram", "UrlLinkedIn", "UserId", "Website" },
                values: new object[] { new Guid("b500f69b-623b-41ed-bd31-89dd093a05e5"), "123 Le Loi, District 1, Ho Chi Minh City", "Công ty hàng đầu trong lĩnh vực tổ chức sự kiện chuyên nghiệp tại Việt Nam.", "EventPro Vietnam Co., Ltd", new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Utc).AddTicks(1487), "SystemSeeder", "contact@eventpro.vn", "Nguyen Van A", "+84 987 654 321", new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(1526), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, 3, 2, 2, "Chuyên tổ chức sự kiện doanh nghiệp, hội nghị, hội thảo và lễ ra mắt sản phẩm.", "079123456789", "/uploads/organizers/back_id.png", "/uploads/organizers/business_license.png", "/uploads/organizers/company_logo.png", "/uploads/organizers/front_id.png", false, 1, 1, 0, "0312345678", new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(1527), new TimeSpan(0, 0, 0, 0, 0)), null, "https://facebook.com/eventpro", "https://instagram.com/eventpro.vn", "https://linkedin.com/company/eventpro", new Guid("99b679a4-c759-4ed1-bbc1-8fd6c98dbacd"), "https://eventpro.vn" });

            migrationBuilder.InsertData(
                table: "Wallets",
                columns: new[] { "Id", "Balance", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "UpdatedAt", "UpdatedBy", "UserId" },
                values: new object[,]
                {
                    { new Guid("6137b0ac-0a15-4c4e-9b72-dc065c303cd3"), 0m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, null, new Guid("1e490cce-3424-4d36-bf14-d8e3ce6c5e72") },
                    { new Guid("a1bc22c6-0628-4a66-9333-17b54a6915c7"), 0m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, null, new Guid("731e82e2-4644-4d8e-9911-0e10d4fc3e77") },
                    { new Guid("e0860234-af6b-46bc-8779-5f76df4993de"), 0m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, null, new Guid("99b679a4-c759-4ed1-bbc1-8fd6c98dbacd") },
                    { new Guid("f94d1f93-237b-47fc-95f6-7b955696712e"), 0m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, null, new Guid("b8b5ddd1-6e65-486c-8120-9a2b40568d06") },
                    { new Guid("fc2b259e-501b-41ba-afc6-fee075a7b2bb"), 10000000m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, null, null, new Guid("b4d507b3-b85e-4fc8-be8e-63d30c93dabc") }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "Address", "AverageRating", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "DetailedDescription", "District", "EndTime", "EventCategoryId", "ImgListEvent", "ImgListEvidences", "IsDeleted", "Latitude", "LinkRef", "LocationName", "Longitude", "OrganizerProfileId", "PayoutAmount", "PlatformFee", "Publish", "ReasonCancel", "ReasonReject", "RemainingTickets", "RequireApprovalAt", "RequireApprovalBy", "SaleEndTime", "SaleStartTime", "SoldQuantity", "StartTime", "Status", "TicketPricingType", "Title", "TotalAmount", "TotalRatings", "TotalTickets", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("08fd3826-87d2-467b-bf2e-9d8d42c39d14"), null, 0.0, new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(2482), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Sự kiện chia sẻ xu hướng AI mới nhất", null, null, new DateTime(2025, 11, 15, 11, 59, 18, 422, DateTimeKind.Utc).AddTicks(2462), new Guid("2a2b3a4b-f6c5-4176-9c35-883594fe9305"), null, null, false, null, null, "Hà Nội tòa 3", null, new Guid("b500f69b-623b-41ed-bd31-89dd093a05e5"), 0m, 0m, true, null, null, 101, null, null, null, null, 99, new DateTime(2025, 11, 15, 8, 59, 18, 422, DateTimeKind.Utc).AddTicks(2431), 1, 2, "Hội Thảo Công Nghệ AI 2025", 0m, 0, 200, null, null },
                    { new Guid("9a79e683-2e54-45ff-babf-7d520ceed69f"), "Tòa nhà Innovation Hub", 0.0, new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(2789), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chia sẻ kinh nghiệm khởi nghiệp thành công", null, "Hà Nội", new DateTime(2025, 11, 29, 12, 59, 18, 422, DateTimeKind.Utc).AddTicks(2787), new Guid("f904f29b-8330-415c-a3c6-307c571c6fb6"), null, null, false, null, null, "Hà Nội tòa 2", null, new Guid("b500f69b-623b-41ed-bd31-89dd093a05e5"), 0m, 0m, false, null, null, 100, null, null, null, null, 0, new DateTime(2025, 11, 29, 8, 59, 18, 422, DateTimeKind.Utc).AddTicks(2787), 0, 2, "Workshop Khởi Nghiệp 4.0", 0m, 0, 100, null, null },
                    { new Guid("dcac16cf-4b3f-4869-a314-4725d67603fe"), "Nhà hát Hòa Bình", 0.0, new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(2784), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chương trình nhạc Trịnh với nhiều nghệ sĩ nổi tiếng", null, "Hồ Chí Minh", new DateTime(2025, 11, 22, 10, 59, 18, 422, DateTimeKind.Utc).AddTicks(2770), new Guid("8f41c61e-8ee8-4082-bdc7-7af3d4b41fdc"), null, null, false, null, null, "Hà Nội tòa 3", null, new Guid("b500f69b-623b-41ed-bd31-89dd093a05e5"), 0m, 0m, true, null, null, 500, null, null, null, null, 0, new DateTime(2025, 11, 22, 8, 59, 18, 422, DateTimeKind.Utc).AddTicks(2769), 1, 2, "Đêm Nhạc Trịnh Công Sơn", 0m, 0, 500, null, null },
                    { new Guid("dd181c95-584e-4b65-8dd9-b147ab1f8fc6"), "Tòa nhà Innovation Hub 1111111", 0.0, new DateTimeOffset(new DateTime(2025, 11, 8, 8, 59, 18, 422, DateTimeKind.Unspecified).AddTicks(2794), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chia sẻ kinh nghiệm khởi nghiệp thành công 1111111", null, "Hà Nội", new DateTime(2025, 12, 18, 12, 59, 18, 422, DateTimeKind.Utc).AddTicks(2792), new Guid("f904f29b-8330-415c-a3c6-307c571c6fb6"), null, null, false, null, null, "Hà Nội tòa 1", null, new Guid("b500f69b-623b-41ed-bd31-89dd093a05e5"), 0m, 0m, true, null, null, 100, null, null, null, null, 0, new DateTime(2025, 12, 18, 8, 59, 18, 422, DateTimeKind.Utc).AddTicks(2792), 1, 1, "Workshop Khởi Nghiệp 3.0", 0m, 0, 100, null, null }
                });

            migrationBuilder.InsertData(
                table: "EventTags",
                columns: new[] { "EventId", "TagId" },
                values: new object[,]
                {
                    { new Guid("08fd3826-87d2-467b-bf2e-9d8d42c39d14"), new Guid("7226730c-badc-46a8-93e4-01770c93ff35") },
                    { new Guid("08fd3826-87d2-467b-bf2e-9d8d42c39d14"), new Guid("8574d069-8fe5-4dc2-9446-405eab6bf627") },
                    { new Guid("9a79e683-2e54-45ff-babf-7d520ceed69f"), new Guid("33aae937-e825-4841-9c6f-450920814c9a") },
                    { new Guid("9a79e683-2e54-45ff-babf-7d520ceed69f"), new Guid("7226730c-badc-46a8-93e4-01770c93ff35") },
                    { new Guid("dcac16cf-4b3f-4869-a314-4725d67603fe"), new Guid("8c37ee4b-100d-497f-be96-5c1592e0e3f0") },
                    { new Guid("dd181c95-584e-4b65-8dd9-b147ab1f8fc6"), new Guid("33aae937-e825-4841-9c6f-450920814c9a") }
                });

            migrationBuilder.InsertData(
                table: "TicketTypes",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "EventId", "RemainingQuantity", "SoldQuantity", "TicketDescription", "TicketName", "TicketPrice", "TicketQuantity", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("2add3b90-0b8a-41ee-a610-212aa74e9c5a"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("08fd3826-87d2-467b-bf2e-9d8d42c39d14"), 100, 0, null, "Ve VipPro 2", 15000m, 100, null, null },
                    { new Guid("5d94c725-b331-4a3d-91d7-64233aa70c93"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("08fd3826-87d2-467b-bf2e-9d8d42c39d14"), 1, 99, null, "Ve VipPro 1", 10000m, 100, null, null },
                    { new Guid("b737712a-7634-4a68-9442-afa4a4dca8b3"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("dcac16cf-4b3f-4869-a314-4725d67603fe"), 250, 0, null, "Ve VipPro 5", 20000m, 250, null, null },
                    { new Guid("d3ecbbc1-dd18-4eda-a142-9ff760e04573"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("9a79e683-2e54-45ff-babf-7d520ceed69f"), 100, 0, null, "Ve VipPro 4", 5000m, 100, null, null },
                    { new Guid("f18bb35d-63e4-4b40-a3df-aff107bd79fb"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("dcac16cf-4b3f-4869-a314-4725d67603fe"), 250, 0, null, "Ve VipPro 3", 15000m, 250, null, null },
                    { new Guid("fb0947ab-78e7-413e-8c03-904a64e97e0f"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, new Guid("dd181c95-584e-4b65-8dd9-b147ab1f8fc6"), 100, 0, null, "Ve Free", 0m, 100, null, null }
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
                name: "IX_EndEventRequests_EventId",
                table: "EndEventRequests",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_EndEventRequests_OrganizerProfileId",
                table: "EndEventRequests",
                column: "OrganizerProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_EndEventRequests_PaymentInformationId",
                table: "EndEventRequests",
                column: "PaymentInformationId");

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
                name: "IX_Friendship_ReceiverId",
                table: "Friendships",
                column: "ReceiverId");

            migrationBuilder.CreateIndex(
                name: "IX_Friendship_Sender_Receiver",
                table: "Friendships",
                columns: new[] { "SenderId", "ReceiverId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Friendship_SenderId",
                table: "Friendships",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_Friendship_Status",
                table: "Friendships",
                column: "Status");

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
                name: "IX_PaymentInfo_UserId",
                table: "PaymentInformations",
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
                name: "IX_Rating_Event_User",
                table: "Ratings",
                columns: new[] { "EventId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Rating_EventId",
                table: "Ratings",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_Ratings_UserId",
                table: "Ratings",
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
                name: "IX_RevenueReports_EventId",
                table: "RevenueReports",
                column: "EventId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RevenueReports_Organizer_YearMonth",
                table: "RevenueReports",
                columns: new[] { "OrganizerProfileId", "ReportYear", "ReportMonth" });

            migrationBuilder.CreateIndex(
                name: "IX_RevenueReports_OrganizerProfileId",
                table: "RevenueReports",
                column: "OrganizerProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_RevenueReports_ReportYearMonth",
                table: "RevenueReports",
                columns: new[] { "ReportYear", "ReportMonth" });

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
                name: "IX_TicketTypes_EventId_TicketName",
                table: "TicketTypes",
                columns: new[] { "EventId", "TicketName" },
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
                table: "Wallets",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransaction_CreatedAt",
                table: "WalletTransactions",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransaction_Reference",
                table: "WalletTransactions",
                columns: new[] { "ReferenceId", "ReferenceType" });

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransaction_Type",
                table: "WalletTransactions",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransaction_WalletId",
                table: "WalletTransactions",
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
                name: "EndEventRequests");

            migrationBuilder.DropTable(
                name: "EventTags");

            migrationBuilder.DropTable(
                name: "FavoriteEvents");

            migrationBuilder.DropTable(
                name: "Friendships");

            migrationBuilder.DropTable(
                name: "PaymentTransaction");

            migrationBuilder.DropTable(
                name: "Ratings");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "RevenueReports");

            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropTable(
                name: "WalletTransactions");

            migrationBuilder.DropTable(
                name: "WithdrawRequests");

            migrationBuilder.DropTable(
                name: "PaymentInformations");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "BookingItems");

            migrationBuilder.DropTable(
                name: "Wallets");

            migrationBuilder.DropTable(
                name: "Bookings");

            migrationBuilder.DropTable(
                name: "TicketTypes");

            migrationBuilder.DropTable(
                name: "Events");

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
