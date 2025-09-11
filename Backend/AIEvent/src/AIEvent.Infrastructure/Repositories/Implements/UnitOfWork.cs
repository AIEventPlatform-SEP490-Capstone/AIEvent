using AIEvent.Domain.Identity;
using AIEvent.Domain.Interfaces;
using AIEvent.Infrastructure.Context;
using Microsoft.EntityFrameworkCore.Storage;

namespace AIEvent.Infrastructure.Implements
{
    public class UnitOfWork : IUnitOfWork, IDisposable
    {
        private readonly DatabaseContext _context;
        private readonly Dictionary<Type, object> _repositories = new Dictionary<Type, object>();
        private IDbContextTransaction? _transaction;

        public IGenericRepository<AppUser> UserRepository => GetRepository<AppUser>();
        public IGenericRepository<AppRole> RoleRepository => GetRepository<AppRole>();
        public IGenericRepository<RefreshToken> RefreshTokenRepository => GetRepository<RefreshToken>();

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
    }
}
