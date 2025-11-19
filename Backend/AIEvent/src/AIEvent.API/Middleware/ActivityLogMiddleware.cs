using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Entities;
using Hangfire;
using System.Diagnostics;
using System.Security.Claims;

namespace AIEvent.API.Middleware
{
    public class ActivityLogMiddleware
    {
        private readonly RequestDelegate _next;
        private static readonly string[] IgnorePaths =
        {
            "/swagger", "/favicon", "/health", "/hangfire"
        };

        public ActivityLogMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(
            HttpContext context,
            IBackgroundJobClient backgroundJob
        )
        {
            if (IgnorePaths.Any(p => context.Request.Path.StartsWithSegments(p)))
            {
                await _next(context);
                return;
            }

            if (context.Request.ContentType?.StartsWith("multipart/") == true)
            {
                await _next(context);
                return;
            }

            var sw = Stopwatch.StartNew();

            string? body = null;

            try
            {
                if (context.Request.ContentLength < 2048
                    && context.Request.ContentLength > 0)
                {
                    context.Request.EnableBuffering();

                    using var reader = new StreamReader(
                        context.Request.Body,
                        leaveOpen: true);

                    body = await reader.ReadToEndAsync();
                    context.Request.Body.Position = 0;
                }
            }
            catch
            {
                // không cho crash middleware
            }

            await _next(context);

            sw.Stop();

            Guid? userId = null;
            var uidClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (uidClaim != null && Guid.TryParse(uidClaim, out var g))
                userId = g;

            var log = new ActivityLog
            {
                UserId = userId,
                Path = context.Request.Path,
                Method = context.Request.Method,
                Query = context.Request.QueryString.ToString(),
                Body = body,
                IpAddress = context.Connection.RemoteIpAddress?.ToString(),
                UserAgent = context.Request.Headers["User-Agent"],
                StatusCode = context.Response.StatusCode,
                CreatedAt = DateTime.UtcNow
            };

            try
            {
                backgroundJob.Enqueue<IActivityLogService>(s => s.SaveAsync(log));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"ActivityLog error: {ex.Message}");
            }
        }
    }
}
