namespace Server.Domain.Entities
{
    public class Category
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Subcategory> Subcategories { get; set; } = new List<Subcategory>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
