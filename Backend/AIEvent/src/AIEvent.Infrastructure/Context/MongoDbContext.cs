using MongoDB.Driver;
using Microsoft.Extensions.Configuration;

namespace AIEvent.Infrastructure.Context
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("MongoDB");
            
            if (string.IsNullOrEmpty(connectionString))
                throw new ArgumentNullException(nameof(connectionString), "MongoDB ConnectionString is not configured. Please set it in appsettings.json");
           
            var client = new MongoClient(connectionString);
            _database = client.GetDatabase("AIEvent");
        }

        public IMongoCollection<T> GetCollection<T>(string collectionName)
        {
            return _database.GetCollection<T>(collectionName);
        }
    }
}

