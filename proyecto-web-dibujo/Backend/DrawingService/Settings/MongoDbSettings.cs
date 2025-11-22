namespace DrawingService.Settings
{
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string DrawingsCollectionName { get; set; } = null!;
    }
}
