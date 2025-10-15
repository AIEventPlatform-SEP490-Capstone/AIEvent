using AIEvent.Domain.Entities;
using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AIEvent.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Storage;

namespace AIEvent.Infrastructure.Implements
{
    public class UnitOfWork : IUnitOfWork, IDisposable, IAsyncDisposable
    {
        private readonly DatabaseContext _context;
        private readonly Dictionary<Type, object> _repositories = new Dictionary<Type, object>();
        private IDbContextTransaction? _transaction;

        public IGenericRepository<AppUser> UserRepository => GetRepository<AppUser>();
        public IGenericRepository<AppRole> RoleRepository => GetRepository<AppRole>();
        public IGenericRepository<RefreshToken> RefreshTokenRepository => GetRepository<RefreshToken>();
        public IGenericRepository<Event> EventRepository => GetRepository<Event>();     
        public IGenericRepository<Tag> TagRepository => GetRepository<Tag>();
        public IGenericRepository<EventCategory> EventCategoryRepository => GetRepository<EventCategory>();
        public IGenericRepository<EventTag> EventTagRepository => GetRepository<EventTag>();
        public IGenericRepository<OrganizerProfile> OrganizerProfileRepository => GetRepository<OrganizerProfile>();
        public IGenericRepository<Interest> InterestRepository => GetRepository<Interest>();
        public IGenericRepository<UserInterest> UserInterestRepository => GetRepository<UserInterest>();
        public IGenericRepository<TicketDetail> TicketDetailRepository => GetRepository<TicketDetail>();
        public IGenericRepository<RefundRule> RefundRuleRepository => GetRepository<RefundRule>();
        public IGenericRepository<RefundRuleDetail> RefundRuleDetailRepository => GetRepository<RefundRuleDetail>();
        public IGenericRepository<FavoriteEvent> FavoriteEventRepository => GetRepository<FavoriteEvent>();
        public IGenericRepository<Booking> BookingRepository => GetRepository<Booking>();
        public IGenericRepository<Ticket> TicketRepository => GetRepository<Ticket>();
        public IGenericRepository<BookingItem> BookingItemRepository => GetRepository<BookingItem>();
        public IGenericRepository<Wallet> WalletRepository => GetRepository<Wallet>();
        public IGenericRepository<WalletTransaction> WalletTransactionRepository => GetRepository<WalletTransaction>();
        public IGenericRepository<PaymentTransaction> PaymentTransactionRepository => GetRepository<PaymentTransaction>();
        public IGenericRepository<TopupRequest> TopupRequestRepository => GetRepository<TopupRequest>();

        public UnitOfWork(DatabaseContext context)
        {
            _context = context;
        }

        private IGenericRepository<T> GetRepository<T>() where T : class
        {
            if (!_repositories.ContainsKey(typeof(T)))
            {
                _repositories[typeof(T)] = new GenericRepository<T>(_context);
            }
            return (IGenericRepository<T>)_repositories[typeof(T)];
        }


        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            if (_transaction == null)
                _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }

        public async ValueTask DisposeAsync()
        {
            if (_transaction != null)
                await _transaction.DisposeAsync();

            await _context.DisposeAsync();
        }
    }
}
