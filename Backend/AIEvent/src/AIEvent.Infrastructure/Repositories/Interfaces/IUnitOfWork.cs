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
        IGenericRepository<TicketDetail> TicketDetailRepository { get; }
        IGenericRepository<RefundRule> RefundRuleRepository { get; }
        IGenericRepository<RefundRuleDetail> RefundRuleDetailRepository { get; }
        IGenericRepository<FavoriteEvent> FavoriteEventRepository { get; }
        IGenericRepository<BookingItem> BookingItemRepository { get; }
        IGenericRepository<Ticket> TicketRepository { get; }
        IGenericRepository<Booking> BookingRepository { get; }
        IGenericRepository<Wallet> WalletRepository { get; }
        IGenericRepository<WalletTransaction> WalletTransactionRepository { get; }
        IGenericRepository<PaymentTransaction> PaymentTransactionRepository { get; }
        IGenericRepository<WithdrawRequest> WithdrawRequestRepository { get; }
        IGenericRepository<PaymentInformation> PaymentInformationRepository { get; }
        IGenericRepository<EndEventRequest> EndRequestRepository { get; }
        void EnableSoftDelete();
        void DisableSoftDelete();
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
