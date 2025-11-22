using DrawingService.Models;
using DrawingService.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;

namespace DrawingService.Services
{
    public class DrawingsService
    {
        private readonly IMongoCollection<Drawing> _drawings;

        public DrawingsService(IOptions<MongoDbSettings> mongoSettings)
        {
            var client = new MongoClient(mongoSettings.Value.ConnectionString);
            var db = client.GetDatabase(mongoSettings.Value.DatabaseName);
            _drawings = db.GetCollection<Drawing>(mongoSettings.Value.DrawingsCollectionName);
        }

        public async Task<List<Drawing>> GetByOwnerAsync(string ownerId) =>
            await _drawings.Find(d => d.OwnerId == ownerId).ToListAsync();

        public async Task<Drawing?> GetByIdAsync(string id, string ownerId) =>
            await _drawings.Find(d => d.Id == id && d.OwnerId == ownerId).FirstOrDefaultAsync();

        public async Task<Drawing> CreateAsync(Drawing d)
        {
            d.CreatedAt = DateTime.UtcNow;
            d.UpdatedAt = DateTime.UtcNow;
            await _drawings.InsertOneAsync(d);
            return d;
        }

        public async Task<bool> UpdateAsync(string id, string ownerId, string title, string svgContent)
        {
            var update = Builders<Drawing>.Update
                .Set(d => d.Title, title)
                .Set(d => d.SvgContent, svgContent)
                .Set(d => d.UpdatedAt, DateTime.UtcNow);

            var result = await _drawings.UpdateOneAsync(
                d => d.Id == id && d.OwnerId == ownerId,
                update);

            return result.ModifiedCount > 0;
        }

        public async Task<bool> DeleteAsync(string id, string ownerId)
        {
            var result = await _drawings.DeleteOneAsync(d => d.Id == id && d.OwnerId == ownerId);
            return result.DeletedCount > 0;
        }
    }
}
