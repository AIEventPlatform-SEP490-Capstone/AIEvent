using AIEvent.Application.Helpers;
using AIEvent.Application.Mappings;
using AIEvent.Application.Services.Implements;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AIEvent.Infrastructure.Context;
using AIEvent.Infrastructure.Implements;
using Microsoft.AspNetCore.Identity;
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
                    //.AddScoped<ICacheService, CacheService>()
                    .AddScoped<IUnitOfWork, UnitOfWork>()
                    .AddScoped<IJwtService, JwtService>()
                    .AddScoped<ICloudinaryService, CloudinaryService>()
                    .AddScoped<IAuthService, AuthService>()
                    .AddScoped<IUserService, UserService>()
                    .AddScoped<IEventService, EventService>()
                    .AddScoped<IRoleService, RoleService>()
                    .AddScoped<IEnumService, EnumService>()
                    .AddScoped<IOrganizerService, OrganizerService>();

            return services;
        }


        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<DatabaseContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            services.AddIdentity<AppUser, AppRole>()
                    .AddEntityFrameworkStores<DatabaseContext>()
                    .AddDefaultTokenProviders();

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
