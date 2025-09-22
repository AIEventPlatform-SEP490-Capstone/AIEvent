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
        IGenericRepository<EventCategory> EventCategoryRepository { get; }
        IGenericRepository<Tag> TagRepository { get; }
        IGenericRepository<EventTag> EventTagRepository { get; }
        IGenericRepository<Venue> VenueRepository { get; }
        IGenericRepository<OrganizerProfile> OrganizerProfileRepository { get; }
        IGenericRepository<EventField> EventFieldRepository { get; }
        IGenericRepository<EventFieldAssignment> EventFieldAssignmentRepository { get; }
        IGenericRepository<UserEventField> UserEventFieldRepository { get; }
        IGenericRepository<OrganizerFieldAssignment> OrganizerFieldAssignmentRepository { get; }
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
