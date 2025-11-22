using AuthService.Models;
using AuthService.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace AuthService.Services
{
    public class UserService
    {
        private readonly IMongoCollection<User> _users;

        public UserService(IOptions<MongoDbSettings> mongoSettings)
        {
            var client = new MongoClient(mongoSettings.Value.ConnectionString);
            var db = client.GetDatabase(mongoSettings.Value.DatabaseName);
            _users = db.GetCollection<User>(mongoSettings.Value.UsersCollectionName);
        }

        public async Task<User?> GetByUsernameAsync(string username) =>
            await _users.Find(u => u.Username == username).FirstOrDefaultAsync();

        public async Task<bool> UsernameExistsAsync(string username) =>
            await _users.Find(u => u.Username == username).AnyAsync();

        public async Task<User> CreateAsync(User user)
        {
            await _users.InsertOneAsync(user);
            return user;
        }
    }
}
