namespace Server.Domain.Entities
{
    public enum OrderStatus
    {
        PENDING,
        CONFIRMED,
        PREPARING,
        READY_FOR_DELIVERY,
        OUT_FOR_DELIVERY,
        DELIVERED,
        CANCELLED
    }

    public enum PaymentStatus
    {
        PENDING,
        PAID,
        FAILED,
        REFUNDED
    }

    public class Order
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid DeliveryAddressId { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.PENDING;
        public decimal Subtotal { get; set; }
        public decimal DeliveryFee { get; set; }
        public decimal Total { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.PENDING;
        public string? Notes { get; set; }
        public DateTime? EstimatedDelivery { get; set; }
        public DateTime? DeliveredAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public User User { get; set; } = null!;
        public Address DeliveryAddress { get; set; } = null!;
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
