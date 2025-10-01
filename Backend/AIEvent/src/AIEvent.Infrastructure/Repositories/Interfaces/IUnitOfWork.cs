using AIEvent.Domain.Entities;
using AIEvent.Domain.Identity;

namespace AIEvent.Domain.Interfaces
{
    public interface IUnitOfWork
    {
        IGenericRepository<AppUser> UserRepository { get; }
        IGenericRepository<AppRole> RoleRepository { get; }
        IGenericRepository<RefreshToken> RefreshTokenRepository { get; }
        IGenericRepository<Event> EventRepository { get; }
        IGenericRepository<Tag> TagRepository { get; }
        IGenericRepository<EventTag> EventTagRepository { get; }
        IGenericRepository<OrganizerProfile> OrganizerProfileRepository { get; }
        IGenericRepository<Interest> InterestRepository { get; }
        IGenericRepository<UserInterest> UserInterestRepository { get; }
        IGenericRepository<TicketType> TicketDetailRepository { get; }
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
