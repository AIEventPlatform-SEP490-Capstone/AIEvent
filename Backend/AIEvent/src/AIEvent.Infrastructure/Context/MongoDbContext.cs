using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using System.Security.Authentication; 

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
            
            var settings = MongoClientSettings.FromConnectionString(connectionString);

            settings.SslSettings = new SslSettings
            {
                EnabledSslProtocols = SslProtocols.Tls12
            };

            settings.ConnectTimeout = TimeSpan.FromSeconds(60);
            settings.ServerSelectionTimeout = TimeSpan.FromSeconds(120);
            settings.HeartbeatTimeout = TimeSpan.FromSeconds(60);
            settings.SocketTimeout = TimeSpan.FromSeconds(60);

            var client = new MongoClient(settings);
            _database = client.GetDatabase("AIEvent");
        }

        public IMongoCollection<T> GetCollection<T>(string collectionName)
        {
            return _database.GetCollection<T>(collectionName);
        }
    }
}

