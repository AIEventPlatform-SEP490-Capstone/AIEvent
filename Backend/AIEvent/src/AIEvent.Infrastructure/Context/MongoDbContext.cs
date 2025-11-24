using MongoDB.Driver; 
using MongoDB.Bson;

namespace AIEvent.Infrastructure.Context
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IMongoClient client)
        {  
            _database = client.GetDatabase("AIEvent");

            try
            {
                client.GetDatabase("admin").RunCommand<BsonDocument>(new BsonDocument("ping", 1));
            }
            catch (Exception ex)
            { 
                Console.WriteLine($"MongoDB connection failed at startup: {ex.Message}");
                throw;
            }
        }

        public IMongoCollection<T> GetCollection<T>(string collectionName)
        {
            return _database.GetCollection<T>(collectionName);
        }
    }
}

