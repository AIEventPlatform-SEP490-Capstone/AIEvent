using AIEvent.Application.Helpers;
using AIEvent.Application.Mappings;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Interfaces;
using AIEvent.Infrastructure.Context;
using AIEvent.Infrastructure.Implements;
using Microsoft.EntityFrameworkCore;
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
                    .AddScoped<ITicketTokenService, TicketTokenService>();

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

            return services;
        }
    }
}
