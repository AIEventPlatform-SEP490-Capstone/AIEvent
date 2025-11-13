using System.Linq.Expressions;

namespace AIEvent.Infrastructure.Repositories.Interfaces
{
    public interface IMongoRepository<T> where T : class
    {
        Task<T> AddAsync(T entity);
        Task<T?> GetByIdAsync(string id);
        Task<IEnumerable<T>> GetAllAsync();
        Task<bool> DeleteByIdAsync(string id);
        Task<long> DeleteManyAsync(Expression<Func<T, bool>> filter);
        Task<long> CountAsync(Expression<Func<T, bool>>? filter = null);
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> filter);
        Task<IEnumerable<T>> FindPagedAsync(
            Expression<Func<T, bool>> filter,
            int skip,
            int take,
            Expression<Func<T, object>>? sortBy = null,
            bool sortDescending = true);
        Task<T?> FindOneAsync(Expression<Func<T, bool>> filter);
        Task<T> UpdateAsync(T entity);
    }
}

