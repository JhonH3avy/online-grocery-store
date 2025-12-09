namespace Server.Domain.Entities
{
    public class Inventory
    {
        public Guid Id { get; set; }
        public Guid ProductId { get; set; }
        public int Quantity { get; set; } = 0;
        public int LowStock { get; set; } = 10;
        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        public Product Product { get; set; } = null!;
    }
}
