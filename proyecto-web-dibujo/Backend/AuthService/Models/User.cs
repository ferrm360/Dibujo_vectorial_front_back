using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace AuthService.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("username")]
        public string Username { get; set; } = null!;

        [BsonElement("email")]
        public string? Email { get; set; }

        [BsonElement("passwordHash")]
        public string PasswordHash { get; set; } = null!;
    }
}
