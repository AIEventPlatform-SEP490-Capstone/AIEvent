using AIEvent.Infrastructure.Context;
using AIEvent.Infrastructure.Repositories.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Linq.Expressions;

namespace AIEvent.Infrastructure.Repositories.Implements
{
    public class MongoRepository<T> : IMongoRepository<T> where T : class
    {
        protected readonly IMongoCollection<T> _collection;
        protected readonly string _collectionName;

        public MongoRepository(MongoDbContext mongoDbContext, string collectionName)
        {
            _collectionName = collectionName;
            _collection = mongoDbContext.GetCollection<T>(collectionName);
        }

        public virtual async Task<T> AddAsync(T entity)
        { 
            var idProperty = typeof(T).GetProperty("Id");
            if (idProperty != null && idProperty.PropertyType == typeof(string))
            {
                var currentId = idProperty.GetValue(entity) as string;
                if (string.IsNullOrEmpty(currentId))
                {
                    idProperty.SetValue(entity, ObjectId.GenerateNewId().ToString());
                }
            }

            await _collection.InsertOneAsync(entity);
            return entity;
        }

        public virtual async Task<T?> GetByIdAsync(string id)
        {
            var filter = Builders<T>.Filter.Eq("Id", id);
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public virtual async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _collection.Find(_ => true).ToListAsync();
        }

        public virtual async Task<bool> DeleteByIdAsync(string id)
        {
            var filter = Builders<T>.Filter.Eq("Id", id);
            var result = await _collection.DeleteOneAsync(filter);
            return result.DeletedCount > 0;
        }

        public virtual async Task<long> DeleteManyAsync(Expression<Func<T, bool>> filter)
        {
            var result = await _collection.DeleteManyAsync(filter);
            return result.DeletedCount;
        }

        public virtual async Task<long> CountAsync(Expression<Func<T, bool>>? filter = null)
        {
            if (filter == null)
                return await _collection.CountDocumentsAsync(_ => true);
            
            return await _collection.CountDocumentsAsync(filter);
        }

        public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> filter)
        {
            return await _collection.Find(filter).ToListAsync();
        }

        public virtual async Task<IEnumerable<T>> FindPagedAsync(
            Expression<Func<T, bool>> filter,
            int skip,
            int take,
            Expression<Func<T, object>>? sortBy = null,
            bool sortDescending = true)
        {
            var query = _collection.Find(filter);

            if (sortBy != null)
            {
                var sortDefinition = sortDescending
                    ? Builders<T>.Sort.Descending(sortBy)
                    : Builders<T>.Sort.Ascending(sortBy);
                query = query.Sort(sortDefinition);
            }

            return await query
                .Skip(skip)
                .Limit(take)
                .ToListAsync();
        }

        public virtual async Task<T?> FindOneAsync(Expression<Func<T, bool>> filter)
        {
            return await _collection.Find(filter).FirstOrDefaultAsync();
        }

        public virtual async Task<T> UpdateAsync(T entity)
        {
            var idProperty = typeof(T).GetProperty("Id");
            if (idProperty == null || idProperty.PropertyType != typeof(string))
            {
                throw new InvalidOperationException("Entity must have a string Id property for update operation.");
            }

            var id = idProperty.GetValue(entity) as string;
            if (string.IsNullOrEmpty(id))
            {
                throw new ArgumentException("Entity Id cannot be null or empty for update operation.");
            }

            var filter = Builders<T>.Filter.Eq("Id", id);
            await _collection.ReplaceOneAsync(filter, entity);
            return entity;
        }
    }
}

