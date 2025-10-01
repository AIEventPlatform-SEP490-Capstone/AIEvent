using AIEvent.API.Extensions;
using AIEvent.API.Middleware;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using Microsoft.AspNetCore.Mvc;
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

            builder.Services.AddApplicationServices(builder.Configuration)
                            .AddInfrastructureServices(builder.Configuration);

            builder.Services.AddJwtAuthentication(builder.Configuration);

            builder.Services.AddCustomCors(builder.Configuration);

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();

            builder.Services.AddSwaggerCustoms();
            builder.Services.AddHttpContextAccessor();


            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

            app.UseCors();

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
