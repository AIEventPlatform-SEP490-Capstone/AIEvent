using AIEvent.API.Extensions;
using AIEvent.API.Middleware;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using Hangfire;
using Hangfire.SqlServer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.FileProviders;
using StackExchange.Redis;
using System.Text.Json;
using System.Text.Json.Serialization;
namespace AIEvent.API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Chỉ cấu hình HTTPS khi chạy Production
            if (builder.Environment.IsProduction())
            {
                builder.WebHost.ConfigureKestrel(options =>
                {
                    options.ListenAnyIP(80); // HTTP để redirect hoặc ACME
                    options.ListenAnyIP(443, listenOptions =>
                    {
                        listenOptions.UseHttps("/https/aievent.duckdns.org.pfx", builder.Configuration["PFX_PASSWORD"]);
                    });
                });
            }

            
            // Add services to the container.
            builder.Services.AddControllers()
                            .AddJsonOptions(options =>
                            {
                                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
                                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                                options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.CamelCase;
                            })
                            .ConfigureApiBehaviorOptions(options =>
                            {
                                options.InvalidModelStateResponseFactory = context =>
                                {
                                    var errors = context.ModelState
                                                        .Where(x => x.Value?.Errors.Count > 0)
                                                        .ToDictionary(
                                                            kvp => kvp.Key,
                                                            kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray()
                                                        );

                                    var result = new ObjectResult(ErrorResponse.FailureResult(
                                                                error: errors,
                                                                message: ErrorMessages.InvalidInput,
                                                                statusCode: ErrorCodes.InvalidInput))
                                    {
                                        StatusCode = StatusCodes.Status400BadRequest
                                    };
                                    return result;
                                };
                            });

            builder.Configuration.AddEnvironmentVariables();

            builder.Services.AddApplicationServices(builder.Configuration)
                            .AddInfrastructureServices(builder.Configuration)
                            .AddExternalServices(builder.Configuration);

            builder.Services.AddHangfire(config =>
            {
                config.SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                      .UseSimpleAssemblyNameTypeSerializer()
                      .UseRecommendedSerializerSettings()
                      .UseSqlServerStorage(builder.Configuration.GetConnectionString("HangfireConnection"),
                          new SqlServerStorageOptions
                          {
                              CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
                              SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
                              QueuePollInterval = TimeSpan.FromSeconds(15),
                              UseRecommendedIsolationLevel = true,
                              DisableGlobalLocks = true
                          });
            });

            builder.Services.AddHangfireServer();

            builder.Services.AddJwtAuthentication(builder.Configuration);

            builder.Services.AddCustomCors(builder.Configuration);

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();

            builder.Services.AddSwaggerCustoms();
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddHttpClient();

            var app = builder.Build();

            app.UseSwagger();
            app.UseSwaggerUI();

            if (app.Environment.IsProduction())
            {
                app.UseHttpsRedirection();
            }


            app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

            app.UseCors();

            app.UseAuthentication();
            app.UseAuthorization();

            var wellKnownPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", ".well-known");
            if (!Directory.Exists(wellKnownPath))
            {
                Directory.CreateDirectory(wellKnownPath);
            }

            app.UseStaticFiles(new StaticFileOptions
            {
                ServeUnknownFileTypes = true,
                FileProvider = new PhysicalFileProvider(wellKnownPath),
                RequestPath = "/.well-known"
            });

            app.UseHangfireDashboard("/hangfire");

            app.MapControllers();

            app.Run();
        }
    }
}
