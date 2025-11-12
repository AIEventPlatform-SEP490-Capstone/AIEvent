using AIEvent.Domain.Entities;

namespace AIEvent.Infrastructure.Repositories.Interfaces
{
    public interface IUnitOfWork
    {
        IGenericRepository<User> UserRepository { get; }
        IGenericRepository<Role> RoleRepository { get; }
        IGenericRepository<RefreshToken> RefreshTokenRepository { get; }
        IGenericRepository<Event> EventRepository { get; }
        IGenericRepository<Tag> TagRepository { get; }
        IGenericRepository<EventTag> EventTagRepository { get; }
        IGenericRepository<EventCategory> EventCategoryRepository { get; }
        IGenericRepository<OrganizerProfile> OrganizerProfileRepository { get; }
        IGenericRepository<TicketType> TicketTypeRepository { get; } 
        IGenericRepository<FavoriteEvent> FavoriteEventRepository { get; }
        IGenericRepository<BookingItem> BookingItemRepository { get; }
        IGenericRepository<Ticket> TicketRepository { get; }
        IGenericRepository<Booking> BookingRepository { get; }
        IGenericRepository<Wallet> WalletRepository { get; }
        IGenericRepository<WalletTransaction> WalletTransactionRepository { get; }
        IGenericRepository<PaymentTransaction> PaymentTransactionRepository { get; } 
        IGenericRepository<PaymentInformation> PaymentInformationRepository { get; } 
        IGenericRepository<RevenueReport> RevenueReportRepository { get; }
        IGenericRepository<Friendship> FriendshipRepository { get; }
        IGenericRepository<Rating> RatingRepository { get; }
        IGenericRepository<Notification> NotificationRepository { get; }
        IGenericRepository<EventInvitation> EventInvitationRepository { get; }
        IGenericRepository<StaffProfile> StaffProfileRepository { get; }
        IGenericRepository<EventReport> EventReportRepository { get; }
        void EnableSoftDelete();
        void DisableSoftDelete();
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
        Task<int> ExecuteSqlRawAsync(string sql, params object[] parameters);
    }
}
