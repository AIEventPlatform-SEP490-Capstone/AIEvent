using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using System.Net;
using System.Text.Json;

namespace AIEvent.API.Middleware
{
    public class GlobalExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        public GlobalExceptionHandlingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            var response = ErrorResponse.FailureResult(
                ErrorMessages.InternalServerError,
                GetError((HttpStatusCode)context.Response.StatusCode),
                exception.Message);

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DictionaryKeyPolicy = JsonNamingPolicy.CamelCase
            });
            await context.Response.WriteAsync(json);
        }

        private static readonly Dictionary<HttpStatusCode, string> ErrorMappings = new()
        {
            { HttpStatusCode.BadRequest,  ErrorCodes.InvalidInput},
            { HttpStatusCode.Unauthorized, ErrorCodes.Unauthorized},
            { HttpStatusCode.Forbidden, ErrorCodes.PermissionDenied},
            { HttpStatusCode.NotFound, ErrorCodes.NotFound},
            { HttpStatusCode.InternalServerError, ErrorCodes.InternalServerError },
        };

        private static string GetError(HttpStatusCode statusCode)
        {
            return ErrorMappings.TryGetValue(statusCode, out var value)
                ? value
                : (ErrorCodes.InternalServerError);
        }

    }
}
