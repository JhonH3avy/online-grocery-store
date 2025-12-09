namespace Server.Domain.Entities
{
    public class Subcategory
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public Guid CategoryId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public Category Category { get; set; } = null!;
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
