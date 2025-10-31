using AIEvent.Application.Helpers;
using AIEvent.Application.Mappings;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AIEvent.Infrastructure.Context;
using AIEvent.Infrastructure.Repositories.Implements;
using CloudinaryDotNet;
using Microsoft.EntityFrameworkCore;
using Net.payOS;
using StackExchange.Redis;

namespace AIEvent.API.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddAutoMapper(typeof(AuthProfile).Assembly);

            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>))
                    .AddScoped<ITransactionHelper, TransactionHelper>()
                    .AddScoped<ICacheService, CacheService>()
                    .AddScoped<IUnitOfWork, UnitOfWork>()
                    .AddScoped<IJwtService, JwtService>()
                    .AddScoped<ICloudinaryService, CloudinaryService>()
                    .AddScoped<IAuthService, AuthService>()
                    .AddScoped<IUserService, UserService>()
                    .AddScoped<IEventService, EventService>()
                    .AddScoped<IRoleService, RoleService>()
                    .AddScoped<IEnumService, EnumService>()
                    .AddScoped<IEmailService, EmailService>()
                    .AddSingleton<IHasherHelper, HasherHelper>()
                    .AddScoped<IOrganizerService, OrganizerService>()
                    .AddScoped<ITagService, TagService>()
                    .AddScoped<IRuleRefundService, RuleRefundService>()
                    .AddScoped<IFavoriteEventService, FavoriteEventService>()
                    .AddScoped<IEventCategoryService, EventCategoryService>()
                    .AddScoped<IBookingService, BookingService>()
                    .AddScoped<IQrCodeService, QrCodeService>()
                    .AddScoped<ITicketSignatureService, TicketSignatureService>()
                    .AddScoped<IPaymentService, PaymentService>()
                    .AddScoped<IPayOSService, PayOSService>()
                    .AddScoped<IWalletService, WalletService>()
                    .AddScoped<IPdfService, PdfService>()
                    .AddScoped<IHangfireJobService, HangfireJobService>();

            return services;
        }


        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<DatabaseContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            return services;
        }

        public static IServiceCollection AddExternalServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IConnectionMultiplexer>(
                ConnectionMultiplexer.Connect(configuration["Redis:ConnectionString"]!));

            services.AddSingleton(x =>
            {
                var config = x.GetRequiredService<IConfiguration>().GetSection("Cloudinary");
                var account = new Account(
                    config["CloudName"],
                    config["Key"],
                    config["Secret"]
                );

                var cloudinary = new Cloudinary(account)
                {
                    Api = { Secure = true } 
                };

                return cloudinary;
            });

            services.AddSingleton<PayOS>(x =>
            {
                var config = x.GetRequiredService<IConfiguration>().GetSection("PayOS");
                string clientId = config["ClientId"] ?? throw new Exception("ClientId not found");
                string apiKey = config["ApiKey"] ?? throw new Exception("ClientId not found");
                string checksumKey = config["ChecksumKey"] ?? throw new Exception("ClientId not found");

                return new PayOS(clientId, apiKey, checksumKey);
            });


            return services;
        }
    }
}
