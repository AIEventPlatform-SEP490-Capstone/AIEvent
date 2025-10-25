namespace AIEvent.Infrastructure.Repositories.Interfaces
{
    public interface IGenericRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync(bool asNoTracking = false);
        Task<T?> GetByIdAsync(object id, bool asNoTracking = false);
        Task<T> AddAsync(T entity);
        Task AddRangeAsync(IEnumerable<T> entities);
        Task<T> UpdateAsync(T entity);
        Task DeleteAsync(T entity);
        IQueryable<T> Query(bool asNoTracking = false);
        Task UpdateRangeAsync(IEnumerable<T> entities);
    }
}
