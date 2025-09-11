namespace AIEvent.Domain.Interfaces
{
    public interface IGenericRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync(bool asNoTracking = false);
        Task<T?> GetByIdAsync(object id, bool asNoTracking = false);
        Task<T> AddAsync(T entity);
        Task<T> UpdateAsync(T entity);
        Task DeleteAsync(T entity);
        IQueryable<T> Query(bool asNoTracking = false);
    }
}
