using Microsoft.EntityFrameworkCore;

namespace Server.Infrastructure
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Domain.Entities.User> Users { get; set; } = null!;
        public DbSet<Domain.Entities.Address> Addresses { get; set; } = null!;
        public DbSet<Domain.Entities.Category> Categories { get; set; } = null!;
        public DbSet<Domain.Entities.Subcategory> Subcategories { get; set; } = null!;
        public DbSet<Domain.Entities.Product> Products { get; set; } = null!;
        public DbSet<Domain.Entities.Inventory> Inventory { get; set; } = null!;
        public DbSet<Domain.Entities.CartItem> CartItems { get; set; } = null!;
        public DbSet<Domain.Entities.Order> Orders { get; set; } = null!;
        public DbSet<Domain.Entities.OrderItem> OrderItems { get; set; } = null!;
        public DbSet<Domain.Entities.Review> Reviews { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Table names as in Prisma
            modelBuilder.Entity<Domain.Entities.User>(e =>
            {
                e.ToTable("users");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id").HasConversion<string>();
                e.Property(x => x.Email).HasColumnName("email").IsRequired();
                e.Property(x => x.Password).HasColumnName("password").IsRequired();
                e.Property(x => x.FirstName).HasColumnName("first_name").IsRequired();
                e.Property(x => x.LastName).HasColumnName("last_name").IsRequired();
                e.Property(x => x.Phone).HasColumnName("phone");
                e.Property(x => x.Role).HasConversion<string>().HasColumnName("role").IsRequired();
                e.Property(x => x.IsActive).HasColumnName("is_active");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.HasIndex(x => x.Email).IsUnique();
            });

            modelBuilder.Entity<Domain.Entities.Address>(e =>
            {
                e.ToTable("addresses");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id").HasConversion<string>();
                e.Property(x => x.UserId).HasColumnName("user_id").HasConversion<string>();
                e.Property(x => x.Street).HasColumnName("street");
                e.Property(x => x.City).HasColumnName("city");
                e.Property(x => x.State).HasColumnName("state");
                e.Property(x => x.ZipCode).HasColumnName("zip_code");
                e.Property(x => x.Country).HasColumnName("country");
                e.Property(x => x.IsDefault).HasColumnName("is_default");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.HasOne(x => x.User).WithMany(u => u.Addresses).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Domain.Entities.Category>(e =>
            {
                e.ToTable("categories");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id").HasConversion<string>();
                e.Property(x => x.Name).HasColumnName("name");
                e.Property(x => x.Slug).HasColumnName("slug");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.HasIndex(x => x.Name).IsUnique();
                e.HasIndex(x => x.Slug).IsUnique();
            });

            modelBuilder.Entity<Domain.Entities.Subcategory>(e =>
            {
                e.ToTable("subcategories");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id").HasConversion<string>();
                e.Property(x => x.Name).HasColumnName("name");
                e.Property(x => x.Slug).HasColumnName("slug");
                e.Property(x => x.CategoryId).HasColumnName("category_id").HasConversion<string>();
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.HasOne(x => x.Category).WithMany(c => c.Subcategories).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => new { x.CategoryId, x.Slug }).IsUnique();
            });

            modelBuilder.Entity<Domain.Entities.Product>(e =>
            {
                e.ToTable("products");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id").HasConversion<string>();
                e.Property(x => x.Name).HasColumnName("name");
                e.Property(x => x.Description).HasColumnName("description");
                e.Property(x => x.Price).HasColumnName("price").HasPrecision(10, 2);
                e.Property(x => x.Unit).HasColumnName("unit");
                e.Property(x => x.ImageUrl).HasColumnName("image_url");
                e.Property(x => x.CategoryId).HasColumnName("category_id").HasConversion<string>();
                e.Property(x => x.SubcategoryId).HasColumnName("subcategory_id").HasConversion<string>();
                e.Property(x => x.IsActive).HasColumnName("is_active");
                e.Property(x => x.IsFeatured).HasColumnName("is_featured");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.HasOne(x => x.Category).WithMany(c => c.Products).HasForeignKey(x => x.CategoryId);
                e.HasOne(x => x.Subcategory).WithMany(s => s.Products).HasForeignKey(x => x.SubcategoryId);
            });

            modelBuilder.Entity<Domain.Entities.Inventory>(e =>
            {
                e.ToTable("inventory");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id").HasConversion<string>();
                e.Property(x => x.ProductId).HasColumnName("product_id").HasConversion<string>();
                e.Property(x => x.Quantity).HasColumnName("quantity");
                e.Property(x => x.LowStock).HasColumnName("low_stock");
                e.Property(x => x.LastUpdated).HasColumnName("last_updated");
                e.HasOne(x => x.Product).WithOne(p => p.Inventory).HasForeignKey<Domain.Entities.Inventory>(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => x.ProductId).IsUnique();
            });

            modelBuilder.Entity<Domain.Entities.CartItem>(e =>
            {
                e.ToTable("cart_items");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id").HasConversion<string>();
                e.Property(x => x.UserId).HasColumnName("user_id").HasConversion<string>();
                e.Property(x => x.ProductId).HasColumnName("product_id").HasConversion<string>();
                e.Property(x => x.Quantity).HasColumnName("quantity");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.HasOne(x => x.User).WithMany(u => u.CartItems).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Product).WithMany(p => p.CartItems).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => new { x.UserId, x.ProductId }).IsUnique();
            });

            modelBuilder.Entity<Domain.Entities.Order>(e =>
            {
                e.ToTable("orders");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id").HasConversion<string>();
                e.Property(x => x.UserId).HasColumnName("user_id").HasConversion<string>();
                e.Property(x => x.DeliveryAddressId).HasColumnName("delivery_address_id").HasConversion<string>();
                e.Property(x => x.Status).HasConversion<string>().HasColumnName("status");
                e.Property(x => x.Subtotal).HasColumnName("subtotal").HasPrecision(10, 2);
                e.Property(x => x.DeliveryFee).HasColumnName("delivery_fee").HasPrecision(10, 2);
                e.Property(x => x.Total).HasColumnName("total").HasPrecision(10, 2);
                e.Property(x => x.PaymentMethod).HasColumnName("payment_method");
                e.Property(x => x.PaymentStatus).HasConversion<string>().HasColumnName("payment_status");
                e.Property(x => x.Notes).HasColumnName("notes");
                e.Property(x => x.EstimatedDelivery).HasColumnName("estimated_delivery");
                e.Property(x => x.DeliveredAt).HasColumnName("delivered_at");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.HasOne(x => x.User).WithMany(u => u.Orders).HasForeignKey(x => x.UserId);
                e.HasOne(x => x.DeliveryAddress).WithMany(a => a.Orders).HasForeignKey(x => x.DeliveryAddressId);
            });

            modelBuilder.Entity<Domain.Entities.OrderItem>(e =>
            {
                e.ToTable("order_items");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id").HasConversion<string>();
                e.Property(x => x.OrderId).HasColumnName("order_id").HasConversion<string>();
                e.Property(x => x.ProductId).HasColumnName("product_id").HasConversion<string>();
                e.Property(x => x.Quantity).HasColumnName("quantity");
                e.Property(x => x.UnitPrice).HasColumnName("unit_price").HasPrecision(10, 2);
                e.Property(x => x.Subtotal).HasColumnName("subtotal").HasPrecision(10, 2);
                e.HasOne(x => x.Order).WithMany(o => o.OrderItems).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Product).WithMany(p => p.OrderItems).HasForeignKey(x => x.ProductId);
            });

            modelBuilder.Entity<Domain.Entities.Review>(e =>
            {
                e.ToTable("reviews");
                e.HasKey(x => x.Id);
                e.Property(x => x.Id).HasColumnName("id").HasConversion<string>();
                e.Property(x => x.UserId).HasColumnName("user_id").HasConversion<string>();
                e.Property(x => x.ProductId).HasColumnName("product_id").HasConversion<string>();
                e.Property(x => x.Rating).HasColumnName("rating");
                e.Property(x => x.Comment).HasColumnName("comment");
                e.Property(x => x.CreatedAt).HasColumnName("created_at");
                e.Property(x => x.UpdatedAt).HasColumnName("updated_at");
                e.HasOne(x => x.User).WithMany(u => u.Reviews).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
                e.HasOne(x => x.Product).WithMany(p => p.Reviews).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Cascade);
                e.HasIndex(x => new { x.UserId, x.ProductId }).IsUnique();
            });

            base.OnModelCreating(modelBuilder);
        }
    }
}
