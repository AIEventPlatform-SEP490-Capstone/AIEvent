using AIEvent.Application.DTOs.User;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Infrastructure.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Helpers
{
    [Authorize]
    public class LocationHub : Hub
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICacheService _cacheService;

        public LocationHub(ICacheService cacheService, IUnitOfWork unitOfWork)
        {
            _cacheService = cacheService;
            _unitOfWork = unitOfWork;
        }

        public async Task UpdateLocation(Guid userId, double lat, double lng)
        {
            var user = await _unitOfWork.UserRepository
                .Query()
                .AsNoTracking()
                .Select(u => new {u.Id, u.IsActive, u.IsDeleted, u.IsTurnOnLocation })
                .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted && u.IsActive);

            if (user == null || user.IsTurnOnLocation == false) return;

            var location = new UserLocationCache
            {
                Latitude = lat,
                Longitude = lng,
                LastUpdate = DateTime.UtcNow
            };

            await _cacheService.SetAsync($"user-location:{userId}", location, TimeSpan.FromHours(3));
        }

        public override Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId))
            {
                Context.Abort();
                return Task.CompletedTask;
            }
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            return base.OnDisconnectedAsync(exception);
        }
    }
}
