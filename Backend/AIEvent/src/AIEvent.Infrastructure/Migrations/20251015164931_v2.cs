using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace AIEvent.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class v2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserInterests");

            migrationBuilder.DropTable(
                name: "Interests");

            migrationBuilder.DeleteData(
                table: "EventCategories",
                keyColumn: "Id",
                keyValue: new Guid("78bdb96a-6e38-42be-b65a-d78dc8ddaa16"));

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("7cc0da71-3fa0-4156-9d0c-4aadef9ff5f3"), new Guid("01b2d4db-37c0-4fad-b582-7d5ddfdeb0ed") });

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("81176280-91e1-4533-9b64-96424e083a64"), new Guid("b85d8390-f517-4058-a237-3df4b1d1411c") });

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("a28dedaf-a5fd-4289-a13c-64603bc53300"), new Guid("06c223eb-3407-4f77-9af8-18eedb910045") });

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("a28dedaf-a5fd-4289-a13c-64603bc53300"), new Guid("b364b888-4b95-4184-bbb6-982863865605") });

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("ecc1cf78-7648-4f5b-9eb1-604e82048421"), new Guid("01b2d4db-37c0-4fad-b582-7d5ddfdeb0ed") });

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("ecc1cf78-7648-4f5b-9eb1-604e82048421"), new Guid("b364b888-4b95-4184-bbb6-982863865605") });

            migrationBuilder.DeleteData(
                table: "RefundRuleDetails",
                keyColumn: "Id",
                keyValue: new Guid("479ba5ab-5330-4553-950e-614c10eb79a0"));

            migrationBuilder.DeleteData(
                table: "RefundRuleDetails",
                keyColumn: "Id",
                keyValue: new Guid("ac42b560-fbd1-4bae-a27e-c55a5bbf4467"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("215fdc8f-4fb8-4a66-bb75-fcbbee20ab1b"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("38fc7812-06be-4ea8-a529-ac6b14705fe5"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("536974d6-0e19-4d70-b9af-d6d009dd0df1"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("a04798b1-9a28-4e63-98c3-9600870c5722"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("b4ad4628-01f7-4056-be4a-66700cbce055"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("b9ad3e86-02a6-417b-8b81-dbcada0eab95"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("96744d14-aa17-44fc-9c3d-7f5726a4120e"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("e46af9d8-d81a-469e-adfc-9b52ca167bf6"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("fc2d72cc-8624-4e6d-a1a3-9dc00be60bcc"));

            migrationBuilder.DeleteData(
                table: "Wallet",
                keyColumn: "Id",
                keyValue: new Guid("aaca2b7a-4e60-49c3-9cba-a5632a6b3f56"));

            migrationBuilder.DeleteData(
                table: "Wallet",
                keyColumn: "Id",
                keyValue: new Guid("cde77b0e-1f55-4563-90ee-2b982cb12768"));

            migrationBuilder.DeleteData(
                table: "Events",
                keyColumn: "Id",
                keyValue: new Guid("7cc0da71-3fa0-4156-9d0c-4aadef9ff5f3"));

            migrationBuilder.DeleteData(
                table: "Events",
                keyColumn: "Id",
                keyValue: new Guid("81176280-91e1-4533-9b64-96424e083a64"));

            migrationBuilder.DeleteData(
                table: "Events",
                keyColumn: "Id",
                keyValue: new Guid("a28dedaf-a5fd-4289-a13c-64603bc53300"));

            migrationBuilder.DeleteData(
                table: "Events",
                keyColumn: "Id",
                keyValue: new Guid("ecc1cf78-7648-4f5b-9eb1-604e82048421"));

            migrationBuilder.DeleteData(
                table: "RefundRules",
                keyColumn: "Id",
                keyValue: new Guid("2b90beac-7ba7-4d45-9cd5-a3dc3e2e764b"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("4bb58711-2d39-4730-b6ad-fb2c6cd1bd49"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("5e3ee69b-e446-477a-810e-4b8f246f958d"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("8383e033-d008-41f3-a679-eef71bcd120a"));

            migrationBuilder.DeleteData(
                table: "Tags",
                keyColumn: "Id",
                keyValue: new Guid("01b2d4db-37c0-4fad-b582-7d5ddfdeb0ed"));

            migrationBuilder.DeleteData(
                table: "Tags",
                keyColumn: "Id",
                keyValue: new Guid("06c223eb-3407-4f77-9af8-18eedb910045"));

            migrationBuilder.DeleteData(
                table: "Tags",
                keyColumn: "Id",
                keyValue: new Guid("b364b888-4b95-4184-bbb6-982863865605"));

            migrationBuilder.DeleteData(
                table: "Tags",
                keyColumn: "Id",
                keyValue: new Guid("b85d8390-f517-4058-a237-3df4b1d1411c"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("114cf0ef-6645-45fc-bfd3-ac40bc9571e0"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("403a72eb-3c6b-4a30-84e8-618c4e1a3511"));

            migrationBuilder.DeleteData(
                table: "EventCategories",
                keyColumn: "Id",
                keyValue: new Guid("5e70c4f8-0fc2-4f04-9a3a-8a00ec211ad0"));

            migrationBuilder.DeleteData(
                table: "EventCategories",
                keyColumn: "Id",
                keyValue: new Guid("ca745109-0ae5-476b-9f61-471f517d2223"));

            migrationBuilder.DeleteData(
                table: "EventCategories",
                keyColumn: "Id",
                keyValue: new Guid("f80b253d-2dd4-4115-adf1-274fbf384e36"));

            migrationBuilder.DeleteData(
                table: "OrganizerProfiles",
                keyColumn: "Id",
                keyValue: new Guid("eb85e4ea-e913-426e-b1b3-21199b810421"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("887615f8-d188-4e16-8ac2-c3c3346ed61e"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("5616268d-c665-41ed-af50-504098c840d3"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("f88245a6-2ead-47f0-bc6b-cfb99adf48ea"));

            migrationBuilder.AddColumn<string>(
                name: "UserInterestsJson",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.InsertData(
                table: "EventCategories",
                columns: new[] { "Id", "CategoryName", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("02a45028-50db-4bad-a281-c02ffa02c794"), "Sports", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5054), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("1d985206-a0a7-4a06-93e6-124656691e89"), "Music", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5030), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("7a94d25e-6eff-467b-a378-d058d47e7aa0"), "Education", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5056), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null },
                    { new Guid("ad7d5563-82f1-438c-a4de-973f5ba10954"), "Technology", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5052), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, null, null }
                });

            migrationBuilder.InsertData(
                table: "RefundRules",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "IsSystem", "RuleDescription", "RuleName", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new Guid("85a0fc68-5ed6-4990-ad96-6231e61f73e6"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, true, null, "Hoan Ve", null, null });

            migrationBuilder.InsertData(
                table: "Roles",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "IsDeleted", "Name", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("44134d45-0ada-4227-a8d9-f5d06a7ffe9b"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 27, 724, DateTimeKind.Unspecified).AddTicks(6075), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Regular user role", false, "User", null, null },
                    { new Guid("6a557141-89b5-4262-b04d-7fb4e113bfca"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 27, 724, DateTimeKind.Unspecified).AddTicks(6081), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Organizer role for managing events", false, "Organizer", null, null },
                    { new Guid("a4e66ab8-ce25-4044-812d-8f8341ab33a4"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 27, 724, DateTimeKind.Unspecified).AddTicks(6061), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Administrator role with full access", false, "Admin", null, null },
                    { new Guid("c7af517a-f091-454f-a0ac-474119aec00a"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 27, 724, DateTimeKind.Unspecified).AddTicks(6077), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "System management", false, "Manager", null, null },
                    { new Guid("eceba098-6123-4cd4-af34-fd29d499517d"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 27, 724, DateTimeKind.Unspecified).AddTicks(6079), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Manager's collaborator", false, "Staff", null, null }
                });

            migrationBuilder.InsertData(
                table: "Tags",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "NameTag", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("18866cbe-d8ee-46ec-a406-e251a074bc42"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5090), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Free", null, null },
                    { new Guid("7b0cdebe-de30-4cf7-ae7d-f8939c0daa4e"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5106), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Workshop", null, null },
                    { new Guid("c25724f6-9b1c-4629-869a-25cba4f57b85"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5092), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "Online", null, null },
                    { new Guid("d18b770c-0886-40af-8241-6a88da0ff3f1"), new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5104), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, false, "VIP", null, null }
                });

            migrationBuilder.InsertData(
                table: "RefundRuleDetails",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "MaxDaysBeforeEvent", "MinDaysBeforeEvent", "Note", "RefundPercent", "RefundRuleId", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("9a563d87-53b2-4c87-83d2-910cef4deb65"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, 14, 7, null, 80, new Guid("85a0fc68-5ed6-4990-ad96-6231e61f73e6"), null, null },
                    { new Guid("d2a28245-aa16-4f2d-9775-6105981a4d9d"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, 7, 3, null, 90, new Guid("85a0fc68-5ed6-4990-ad96-6231e61f73e6"), null, null }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "Address", "AvatarImgUrl", "BudgetOption", "City", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Email", "FullName", "InterestedCitiesJson", "IsActive", "IsDeleted", "IsEmailNotificationEnabled", "IsPushNotificationEnabled", "IsSmsNotificationEnabled", "Latitude", "Longitude", "ParticipationFrequency", "PasswordHash", "RoleId", "UpdatedAt", "UpdatedBy", "UserInterestsJson" },
                values: new object[,]
                {
                    { new Guid("1328c70d-9f70-42e3-b93f-d798855b9cfb"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 28, 150, DateTimeKind.Unspecified).AddTicks(9056), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "manager@gmail.com", "Manager", null, true, false, true, true, true, null, null, 0, "$2a$12$KgU.qtbUNyxbmrlHfccVVOz2NJ6.XZxDWWpBSjoGtSCQjWlRST68a", new Guid("c7af517a-f091-454f-a0ac-474119aec00a"), null, null, null },
                    { new Guid("3da6e83b-c170-4885-86c6-1885e0c78e42"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 28, 789, DateTimeKind.Unspecified).AddTicks(3400), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "staff@gmail.com", "Staff", null, true, false, true, true, true, null, null, 0, "$2a$12$UW2lLLsBeAdgNqPor40Lc.o49BAQehQgU4Qe4XT5r79NzYqgdM97K", new Guid("eceba098-6123-4cd4-af34-fd29d499517d"), null, null, null },
                    { new Guid("6ec09c40-a0c8-4dd2-b0cc-e0bc839705a4"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 27, 936, DateTimeKind.Unspecified).AddTicks(2164), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "user@gmail.com", "Regular User", null, true, false, true, true, true, null, null, 0, "$2a$12$EQ9BN496Ucm71EBOmOssEug7D6fpYdm3hq8D237.NX1DH9jwme1Wm", new Guid("44134d45-0ada-4227-a8d9-f5d06a7ffe9b"), null, null, null },
                    { new Guid("a0773ba3-0905-47e4-a169-f88938e8b17e"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 28, 367, DateTimeKind.Unspecified).AddTicks(6749), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "user2@gmail.com", "Test User", null, true, false, true, true, true, null, null, 0, "$2a$12$FB79XTcsy1kktic4Lee0QOign/.qUZ3icWws41dRRTk.W49gvK9KG", new Guid("44134d45-0ada-4227-a8d9-f5d06a7ffe9b"), null, null, null },
                    { new Guid("d47d6c95-a3ed-47c9-b7bf-f1ea9078f825"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 28, 578, DateTimeKind.Unspecified).AddTicks(8481), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "organizer@gmail.com", "Organizer", null, true, false, true, true, true, null, null, 0, "$2a$12$YfdeyDsGRDZPzTvKZWaKHeRBLBxxcEZO/mkIPhSKhCHFWdnJpE8Me", new Guid("6a557141-89b5-4262-b04d-7fb4e113bfca"), null, null, null },
                    { new Guid("eb880e6d-e24e-4a8a-999e-a9e224110dda"), null, null, 0, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 27, 724, DateTimeKind.Unspecified).AddTicks(6217), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, "admin@gmail.com", "System Administrator", null, true, false, true, true, true, null, null, 0, "$2a$12$XJ.JqKbqsiWYHMumw44QTuWfAwgGrcSb2EmrC.TTzNNWsnxNJ884O", new Guid("a4e66ab8-ce25-4044-812d-8f8341ab33a4"), null, null, null }
                });

            migrationBuilder.InsertData(
                table: "OrganizerProfiles",
                columns: new[] { "Id", "Address", "CompanyDescription", "CompanyName", "ConfirmAt", "ConfirmBy", "ContactEmail", "ContactName", "ContactPhone", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "EventExperienceLevel", "EventFrequency", "EventSize", "ExperienceDescription", "IdentityNumber", "ImgBackIdentity", "ImgBusinessLicense", "ImgCompany", "ImgFrontIdentity", "IsDeleted", "OrganizationType", "OrganizerType", "Status", "TaxCode", "UpdatedAt", "UpdatedBy", "UrlFacebook", "UrlInstagram", "UrlLinkedIn", "UserId", "Website" },
                values: new object[] { new Guid("68cf9b98-321e-4624-9eac-6a186214f60c"), "123 Le Loi, District 1, Ho Chi Minh City", "Công ty hàng đầu trong lĩnh vực tổ chức sự kiện chuyên nghiệp tại Việt Nam.", "EventPro Vietnam Co., Ltd", new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Utc).AddTicks(5153), "SystemSeeder", "contact@eventpro.vn", "Nguyen Van A", "+84 987 654 321", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5160), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, 3, 2, 2, "Chuyên tổ chức sự kiện doanh nghiệp, hội nghị, hội thảo và lễ ra mắt sản phẩm.", "079123456789", "/uploads/organizers/back_id.png", "/uploads/organizers/business_license.png", "/uploads/organizers/company_logo.png", "/uploads/organizers/front_id.png", false, 1, 1, 0, "0312345678", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5161), new TimeSpan(0, 0, 0, 0, 0)), null, "https://facebook.com/eventpro", "https://instagram.com/eventpro.vn", "https://linkedin.com/company/eventpro", new Guid("d47d6c95-a3ed-47c9-b7bf-f1ea9078f825"), "https://eventpro.vn" });

            migrationBuilder.InsertData(
                table: "Wallet",
                columns: new[] { "Id", "Balance", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "IsDeleted", "Status", "UpdatedAt", "UpdatedBy", "UserId" },
                values: new object[,]
                {
                    { new Guid("c91848eb-ef60-4a91-975e-83ffccb0c99b"), 0m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, 0, null, null, new Guid("a0773ba3-0905-47e4-a169-f88938e8b17e") },
                    { new Guid("eb091c03-a6dd-43cd-b98e-02e1616e79f3"), 1000000m, new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, false, 0, null, null, new Guid("6ec09c40-a0c8-4dd2-b0cc-e0bc839705a4") }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "Address", "City", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "Description", "DetailedDescription", "EndTime", "EventCategoryId", "ImgListEvent", "IsDeleted", "Latitude", "LocationName", "Longitude", "OrganizerProfileId", "Publish", "RemainingTickets", "RequireApproval", "RequireApprovalAt", "RequireApprovalBy", "SoldQuantity", "StartTime", "TicketType", "Title", "TotalTickets", "UpdatedAt", "UpdatedBy", "isOnlineEvent" },
                values: new object[,]
                {
                    { new Guid("5fea4955-9124-4ec2-a4e8-eacb84d47bc6"), "Nhà hát Hòa Bình", "Hồ Chí Minh", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5309), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chương trình nhạc Trịnh với nhiều nghệ sĩ nổi tiếng", null, new DateTime(2025, 10, 29, 18, 49, 29, 0, DateTimeKind.Utc).AddTicks(5307), new Guid("ad7d5563-82f1-438c-a4de-973f5ba10954"), null, false, null, "Hà Nội tòa 3", null, new Guid("68cf9b98-321e-4624-9eac-6a186214f60c"), true, 500, 0, null, null, 0, new DateTime(2025, 10, 29, 16, 49, 29, 0, DateTimeKind.Utc).AddTicks(5306), 2, "Đêm Nhạc Trịnh Công Sơn", 500, null, null, false },
                    { new Guid("7408d72d-e147-48d7-b71a-ab2d4931e285"), null, null, new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5293), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Sự kiện chia sẻ xu hướng AI mới nhất", null, new DateTime(2025, 10, 22, 19, 49, 29, 0, DateTimeKind.Utc).AddTicks(5288), new Guid("1d985206-a0a7-4a06-93e6-124656691e89"), null, false, null, "Hà Nội tòa 3", null, new Guid("68cf9b98-321e-4624-9eac-6a186214f60c"), true, 101, 0, null, null, 99, new DateTime(2025, 10, 22, 16, 49, 29, 0, DateTimeKind.Utc).AddTicks(5281), 2, "Hội Thảo Công Nghệ AI 2025", 200, null, null, true },
                    { new Guid("d392234e-6c8b-4eb9-bd2d-9b01bb69e77c"), "Tòa nhà Innovation Hub 1111111", "Hà Nội", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5326), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chia sẻ kinh nghiệm khởi nghiệp thành công 1111111", null, new DateTime(2025, 11, 24, 20, 49, 29, 0, DateTimeKind.Utc).AddTicks(5324), new Guid("02a45028-50db-4bad-a281-c02ffa02c794"), null, false, null, "Hà Nội tòa 1", null, new Guid("68cf9b98-321e-4624-9eac-6a186214f60c"), true, 100, 0, null, null, 0, new DateTime(2025, 11, 24, 16, 49, 29, 0, DateTimeKind.Utc).AddTicks(5323), 1, "Workshop Khởi Nghiệp 3.0", 100, null, null, false },
                    { new Guid("f0928ce4-1d05-4986-b7bb-c7e730c5c2b9"), "Tòa nhà Innovation Hub", "Hà Nội", new DateTimeOffset(new DateTime(2025, 10, 15, 16, 49, 29, 0, DateTimeKind.Unspecified).AddTicks(5315), new TimeSpan(0, 0, 0, 0, 0)), "System", null, null, "Chia sẻ kinh nghiệm khởi nghiệp thành công", null, new DateTime(2025, 11, 5, 20, 49, 29, 0, DateTimeKind.Utc).AddTicks(5312), new Guid("02a45028-50db-4bad-a281-c02ffa02c794"), null, false, null, "Hà Nội tòa 2", null, new Guid("68cf9b98-321e-4624-9eac-6a186214f60c"), false, 100, 2, null, null, 0, new DateTime(2025, 11, 5, 16, 49, 29, 0, DateTimeKind.Utc).AddTicks(5311), 2, "Workshop Khởi Nghiệp 4.0", 100, null, null, false }
                });

            migrationBuilder.InsertData(
                table: "EventTags",
                columns: new[] { "EventId", "TagId" },
                values: new object[,]
                {
                    { new Guid("5fea4955-9124-4ec2-a4e8-eacb84d47bc6"), new Guid("d18b770c-0886-40af-8241-6a88da0ff3f1") },
                    { new Guid("7408d72d-e147-48d7-b71a-ab2d4931e285"), new Guid("18866cbe-d8ee-46ec-a406-e251a074bc42") },
                    { new Guid("7408d72d-e147-48d7-b71a-ab2d4931e285"), new Guid("c25724f6-9b1c-4629-869a-25cba4f57b85") },
                    { new Guid("d392234e-6c8b-4eb9-bd2d-9b01bb69e77c"), new Guid("7b0cdebe-de30-4cf7-ae7d-f8939c0daa4e") },
                    { new Guid("f0928ce4-1d05-4986-b7bb-c7e730c5c2b9"), new Guid("18866cbe-d8ee-46ec-a406-e251a074bc42") },
                    { new Guid("f0928ce4-1d05-4986-b7bb-c7e730c5c2b9"), new Guid("7b0cdebe-de30-4cf7-ae7d-f8939c0daa4e") }
                });

            migrationBuilder.InsertData(
                table: "TicketDetails",
                columns: new[] { "Id", "CreatedAt", "CreatedBy", "DeletedAt", "DeletedBy", "EventId", "IsDeleted", "RefundRuleId", "RemainingQuantity", "SoldQuantity", "TicketDescription", "TicketName", "TicketPrice", "TicketQuantity", "UpdatedAt", "UpdatedBy" },
                values: new object[,]
                {
                    { new Guid("0757e186-76ab-4f7e-99d9-db3f698f90e3"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("7408d72d-e147-48d7-b71a-ab2d4931e285"), false, new Guid("85a0fc68-5ed6-4990-ad96-6231e61f73e6"), 100, 0, null, "Ve VipPro 2", 150000m, 100, null, null },
                    { new Guid("3b431a03-855d-4318-9ca2-e5f0b2efa77f"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("d392234e-6c8b-4eb9-bd2d-9b01bb69e77c"), false, null, 100, 0, null, "Ve Free", 0m, 100, null, null },
                    { new Guid("54cc63ff-9b9e-4914-abfb-ef00512b34f6"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("7408d72d-e147-48d7-b71a-ab2d4931e285"), false, new Guid("85a0fc68-5ed6-4990-ad96-6231e61f73e6"), 1, 99, null, "Ve VipPro 1", 100000m, 100, null, null },
                    { new Guid("5783ef35-9c1c-430d-9933-7f98c59dd85c"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("5fea4955-9124-4ec2-a4e8-eacb84d47bc6"), false, new Guid("85a0fc68-5ed6-4990-ad96-6231e61f73e6"), 250, 0, null, "Ve VipPro 3", 150000m, 250, null, null },
                    { new Guid("57a9d464-eb20-4307-9882-56e973b14109"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("5fea4955-9124-4ec2-a4e8-eacb84d47bc6"), false, new Guid("85a0fc68-5ed6-4990-ad96-6231e61f73e6"), 250, 0, null, "Ve VipPro 5", 200000m, 250, null, null },
                    { new Guid("5fa7919c-ba74-4ff9-a503-70f3c1815af4"), new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)), null, null, null, new Guid("f0928ce4-1d05-4986-b7bb-c7e730c5c2b9"), false, new Guid("85a0fc68-5ed6-4990-ad96-6231e61f73e6"), 100, 0, null, "Ve VipPro 4", 50000m, 100, null, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EventCategories",
                keyColumn: "Id",
                keyValue: new Guid("7a94d25e-6eff-467b-a378-d058d47e7aa0"));

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("5fea4955-9124-4ec2-a4e8-eacb84d47bc6"), new Guid("d18b770c-0886-40af-8241-6a88da0ff3f1") });

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("7408d72d-e147-48d7-b71a-ab2d4931e285"), new Guid("18866cbe-d8ee-46ec-a406-e251a074bc42") });

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("7408d72d-e147-48d7-b71a-ab2d4931e285"), new Guid("c25724f6-9b1c-4629-869a-25cba4f57b85") });

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("d392234e-6c8b-4eb9-bd2d-9b01bb69e77c"), new Guid("7b0cdebe-de30-4cf7-ae7d-f8939c0daa4e") });

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("f0928ce4-1d05-4986-b7bb-c7e730c5c2b9"), new Guid("18866cbe-d8ee-46ec-a406-e251a074bc42") });

            migrationBuilder.DeleteData(
                table: "EventTags",
                keyColumns: new[] { "EventId", "TagId" },
                keyValues: new object[] { new Guid("f0928ce4-1d05-4986-b7bb-c7e730c5c2b9"), new Guid("7b0cdebe-de30-4cf7-ae7d-f8939c0daa4e") });

            migrationBuilder.DeleteData(
                table: "RefundRuleDetails",
                keyColumn: "Id",
                keyValue: new Guid("9a563d87-53b2-4c87-83d2-910cef4deb65"));

            migrationBuilder.DeleteData(
                table: "RefundRuleDetails",
                keyColumn: "Id",
                keyValue: new Guid("d2a28245-aa16-4f2d-9775-6105981a4d9d"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("0757e186-76ab-4f7e-99d9-db3f698f90e3"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("3b431a03-855d-4318-9ca2-e5f0b2efa77f"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("54cc63ff-9b9e-4914-abfb-ef00512b34f6"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("5783ef35-9c1c-430d-9933-7f98c59dd85c"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("57a9d464-eb20-4307-9882-56e973b14109"));

            migrationBuilder.DeleteData(
                table: "TicketDetails",
                keyColumn: "Id",
                keyValue: new Guid("5fa7919c-ba74-4ff9-a503-70f3c1815af4"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("1328c70d-9f70-42e3-b93f-d798855b9cfb"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("3da6e83b-c170-4885-86c6-1885e0c78e42"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("eb880e6d-e24e-4a8a-999e-a9e224110dda"));

            migrationBuilder.DeleteData(
                table: "Wallet",
                keyColumn: "Id",
                keyValue: new Guid("c91848eb-ef60-4a91-975e-83ffccb0c99b"));

            migrationBuilder.DeleteData(
                table: "Wallet",
                keyColumn: "Id",
                keyValue: new Guid("eb091c03-a6dd-43cd-b98e-02e1616e79f3"));

            migrationBuilder.DeleteData(
                table: "Events",
                keyColumn: "Id",
                keyValue: new Guid("5fea4955-9124-4ec2-a4e8-eacb84d47bc6"));

            migrationBuilder.DeleteData(
                table: "Events",
                keyColumn: "Id",
                keyValue: new Guid("7408d72d-e147-48d7-b71a-ab2d4931e285"));

            migrationBuilder.DeleteData(
                table: "Events",
                keyColumn: "Id",
                keyValue: new Guid("d392234e-6c8b-4eb9-bd2d-9b01bb69e77c"));

            migrationBuilder.DeleteData(
                table: "Events",
                keyColumn: "Id",
                keyValue: new Guid("f0928ce4-1d05-4986-b7bb-c7e730c5c2b9"));

            migrationBuilder.DeleteData(
                table: "RefundRules",
                keyColumn: "Id",
                keyValue: new Guid("85a0fc68-5ed6-4990-ad96-6231e61f73e6"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("a4e66ab8-ce25-4044-812d-8f8341ab33a4"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("c7af517a-f091-454f-a0ac-474119aec00a"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("eceba098-6123-4cd4-af34-fd29d499517d"));

            migrationBuilder.DeleteData(
                table: "Tags",
                keyColumn: "Id",
                keyValue: new Guid("18866cbe-d8ee-46ec-a406-e251a074bc42"));

            migrationBuilder.DeleteData(
                table: "Tags",
                keyColumn: "Id",
                keyValue: new Guid("7b0cdebe-de30-4cf7-ae7d-f8939c0daa4e"));

            migrationBuilder.DeleteData(
                table: "Tags",
                keyColumn: "Id",
                keyValue: new Guid("c25724f6-9b1c-4629-869a-25cba4f57b85"));

            migrationBuilder.DeleteData(
                table: "Tags",
                keyColumn: "Id",
                keyValue: new Guid("d18b770c-0886-40af-8241-6a88da0ff3f1"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("6ec09c40-a0c8-4dd2-b0cc-e0bc839705a4"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a0773ba3-0905-47e4-a169-f88938e8b17e"));

            migrationBuilder.DeleteData(
                table: "EventCategories",
                keyColumn: "Id",
                keyValue: new Guid("02a45028-50db-4bad-a281-c02ffa02c794"));

            migrationBuilder.DeleteData(
                table: "EventCategories",
                keyColumn: "Id",
                keyValue: new Guid("1d985206-a0a7-4a06-93e6-124656691e89"));

            migrationBuilder.DeleteData(
                table: "EventCategories",
                keyColumn: "Id",
                keyValue: new Guid("ad7d5563-82f1-438c-a4de-973f5ba10954"));

            migrationBuilder.DeleteData(
                table: "OrganizerProfiles",
                keyColumn: "Id",
                keyValue: new Guid("68cf9b98-321e-4624-9eac-6a186214f60c"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("44134d45-0ada-4227-a8d9-f5d06a7ffe9b"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("d47d6c95-a3ed-47c9-b7bf-f1ea9078f825"));

            migrationBuilder.DeleteData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("6a557141-89b5-4262-b04d-7fb4e113bfca"));

            migrationBuilder.DropColumn(
                name: "UserInterestsJson",
                table: "Users");

            migrationBuilder.CreateTable(
                name: "Interests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DeletedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    DeletedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Interests", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserInterests",
                columns: table => new
                {
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InterestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
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
                name: "IX_EventField_IsDeleted",
                table: "Interests",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_EventField_NameEventField",
                table: "Interests",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_UserInterests_InterestId",
                table: "UserInterests",
                column: "InterestId");
        }
    }
}
