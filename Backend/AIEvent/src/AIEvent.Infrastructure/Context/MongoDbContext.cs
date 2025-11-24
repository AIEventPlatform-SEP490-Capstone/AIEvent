using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using System.Security.Authentication;
using System.Net;

namespace AIEvent.Infrastructure.Context
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IConfiguration configuration)
        {
            AppContext.SetSwitch("System.Net.Security.Protocols.Tls13", true);
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12 | SecurityProtocolType.Tls13;

            var connectionString = configuration.GetConnectionString("MongoDB");
            
            if (string.IsNullOrEmpty(connectionString))
                throw new ArgumentNullException(nameof(connectionString), "MongoDB ConnectionString is not configured. Please set it in appsettings.json");
            
            var settings = MongoClientSettings.FromConnectionString(connectionString);

            settings.SslSettings = new SslSettings
            {
                EnabledSslProtocols = SslProtocols.Tls12 | SslProtocols.Tls13
            };

            var client = new MongoClient(settings);
            _database = client.GetDatabase("AIEvent");
        }

        public IMongoCollection<T> GetCollection<T>(string collectionName)
        {
            return _database.GetCollection<T>(collectionName);
        }
    }
}

