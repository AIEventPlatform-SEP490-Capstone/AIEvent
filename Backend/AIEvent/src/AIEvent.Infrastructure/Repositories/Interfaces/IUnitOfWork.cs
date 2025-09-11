using AIEvent.Domain.Identity;

namespace AIEvent.Domain.Interfaces
{
    public interface IUnitOfWork
    {
        IGenericRepository<AppUser> UserRepository { get; }
        IGenericRepository<AppRole> RoleRepository { get; }
        IGenericRepository<RefreshToken> RefreshTokenRepository { get; }
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}
