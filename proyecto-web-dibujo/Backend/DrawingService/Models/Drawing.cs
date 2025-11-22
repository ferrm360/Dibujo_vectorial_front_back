using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DrawingService.Models
{
    public class Drawing
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [BsonElement("ownerId")]
        public string OwnerId { get; set; } = null!;

        [BsonElement("title")]
        public string Title { get; set; } = null!;

        [BsonElement("svgContent")]
        public string SvgContent { get; set; } = null!;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; }

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; }
    }
}
