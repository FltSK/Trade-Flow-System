using Microsoft.EntityFrameworkCore;
using TradeFlowSystemAPI.Models;

namespace TradeFlowSystemAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<UserSession> UserSessions { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Usta> Ustalar { get; set; }
        public DbSet<DeleteRequest> DeleteRequests { get; set; }
        public DbSet<DeletedCustomer> DeletedCustomers { get; set; }
        public DbSet<ActivityLog> ActivityLogs { get; set; }
        public DbSet<Stok> Stoklar { get; set; }
        public DbSet<CustomerSoldDevice> CustomerSoldDevices { get; set; }
        public DbSet<StokHareketi> StokHareketleri { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<StokRezervasyon> StokRezervasyonlari { get; set; }
        public DbSet<ProductType> ProductTypes { get; set; }
        public DbSet<Brand> Brands { get; set; }
        public DbSet<BrandProductType> BrandProductTypes { get; set; }
        public DbSet<Model> Models { get; set; }
        public DbSet<Job> Jobs { get; set; }
        public DbSet<JobProductType> JobProductTypes { get; set; }
        public DbSet<DukkanCarisi> DukkanCarisi { get; set; }
        public DbSet<CustomerUstaAssignment> CustomerUstaAssignments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.Entity<CustomerSoldDevice>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Quantity).HasDefaultValue(1);
                // entity.Property(e => e.DaireBilgisi).HasMaxLength(200);
                entity.HasOne(e => e.Customer)
                      .WithMany()
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Stok)
                      .WithMany()
                      .HasForeignKey(e => e.StokId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Password).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
                entity.HasIndex(e => e.Username).IsUnique();
            });

            // Customer configuration
            modelBuilder.Entity<Customer>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.AdSoyad).IsRequired().HasMaxLength(100);
                entity.Property(e => e.TcKimlik).IsRequired().HasMaxLength(11);
                entity.Property(e => e.Telefon).HasMaxLength(20);
                entity.Property(e => e.SozlesmeTutari).IsRequired().HasColumnType("decimal(15,2)");
                entity.Property(e => e.SozlesmeTarihi).HasColumnType("date");
                entity.Property(e => e.OdemeTaahhutTarihi).HasColumnType("date");
                entity.Property(e => e.RandevuTarihi).HasColumnType("date");
                // Bu alanlar DB'den kaldırıldı; EF modelinden ignore edelim
                entity.Ignore(e => e.YapilanIs);
                entity.Ignore(e => e.BoruTipi);
                entity.Ignore(e => e.SatilanCihaz);
                entity.Ignore(e => e.Termostat);
                // Bu alanlar da DB'den kaldırıldı
                entity.Ignore(e => e.ToptanciIsmi);
                // UstaIsmi tekrar kullanılıyor, ignore'u kaldırdık
                entity.Property(e => e.UstaIsmi).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.UpdatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.CreatedByUserId).IsRequired();
                entity.Property(e => e.CreatedByUsername).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.AdSoyad);
                entity.HasIndex(e => e.TcKimlik);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.CreatedByUserId);
            });

            // Payment configuration
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CustomerId).IsRequired();
                entity.Property(e => e.Tutar).IsRequired().HasColumnType("decimal(15,2)");
                entity.Property(e => e.Tarih).IsRequired().HasColumnType("date");
                entity.Property(e => e.Tur).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Aciklama).HasMaxLength(500);
                entity.Property(e => e.Toptanci).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.UpdatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.CreatedByUserId).IsRequired();
                entity.Property(e => e.CreatedByUsername).IsRequired().HasMaxLength(50);
                entity.HasOne(e => e.Customer)
                    .WithMany(c => c.Payments)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.Tarih);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.CreatedByUserId);
            });

            // Supplier configuration
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.TaxNumber).HasMaxLength(20);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.HasIndex(e => e.Name);
            });

            // Usta configuration
            modelBuilder.Entity<Usta>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.AdSoyad).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Telefon).HasMaxLength(20);
                entity.Property(e => e.Adres).HasMaxLength(200);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.UzmanlikAlani).HasMaxLength(100);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.UpdatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.CreatedByUserId).IsRequired();
                entity.Property(e => e.CreatedByUsername).IsRequired().HasMaxLength(50);
                entity.HasIndex(e => e.AdSoyad);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.CreatedAt);
                entity.HasIndex(e => e.CreatedByUserId);
            });

            // CustomerUstaAssignment configuration
            modelBuilder.Entity<CustomerUstaAssignment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Note).HasMaxLength(200);
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.UpdatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.HasOne(e => e.Customer)
                      .WithMany()
                      .HasForeignKey(e => e.CustomerId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Usta)
                      .WithMany()
                      .HasForeignKey(e => e.UstaId)
                      .OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(e => new { e.CustomerId, e.UstaId });
            });

            // UserSession configuration
            modelBuilder.Entity<UserSession>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
                entity.Property(e => e.ExpiresAt).IsRequired();
                entity.Property(e => e.DeviceInfo).HasMaxLength(200);
                entity.Property(e => e.IpAddress).HasMaxLength(50);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(e => e.Token).IsUnique();
                entity.HasIndex(e => e.UserId);
            });

            // DeleteRequest configuration
            modelBuilder.Entity<DeleteRequest>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CustomerId).IsRequired();
                entity.Property(e => e.RequestedByUserId).IsRequired();
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Reason).HasMaxLength(500);
                entity.Property(e => e.RejectionReason).HasMaxLength(500);
                entity.HasOne(e => e.Customer)
                    .WithMany()
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Payment)
                    .WithMany()
                    .HasForeignKey(e => e.PaymentId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(e => e.RequestedBy)
                    .WithMany()
                    .HasForeignKey(e => e.RequestedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(e => e.ApprovedBy)
                    .WithMany()
                    .HasForeignKey(e => e.ApprovedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.RequestedAt);
            });

            // DeletedCustomer configuration
            modelBuilder.Entity<DeletedCustomer>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.AdSoyad).IsRequired().HasMaxLength(100);
                entity.Property(e => e.TcKimlik).IsRequired().HasMaxLength(11);
                entity.Property(e => e.Telefon).HasMaxLength(20);
                entity.Property(e => e.SozlesmeTutari).IsRequired().HasColumnType("decimal(15,2)");
                entity.Property(e => e.SozlesmeTarihi).HasColumnType("date");
                entity.Property(e => e.OdemeTaahhutTarihi).HasColumnType("date");
                entity.Property(e => e.RandevuTarihi).HasColumnType("date");
                entity.Property(e => e.YapilanIs).HasMaxLength(200);
                entity.Property(e => e.BoruTipi).HasMaxLength(50);
                entity.Property(e => e.SatilanCihaz).HasMaxLength(200);
                entity.Property(e => e.Termostat).HasMaxLength(100);
                entity.Property(e => e.ToptanciIsmi).HasMaxLength(100);
                entity.Property(e => e.UstaIsmi).HasMaxLength(100);
                entity.Property(e => e.CreatedAt).HasColumnType("timestamp with time zone");
                entity.Property(e => e.UpdatedAt).HasColumnType("timestamp with time zone");
                entity.Property(e => e.CreatedByUserId).IsRequired();
                entity.Property(e => e.CreatedByUsername).IsRequired().HasMaxLength(50);
                entity.Property(e => e.DeletedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.DeletedByUserId).IsRequired();
                entity.Property(e => e.DeletedByUsername).IsRequired().HasMaxLength(50);
                entity.Property(e => e.RestoredAt).HasColumnType("timestamp with time zone");
                entity.Property(e => e.RestoredByUsername).HasMaxLength(50);
                entity.Property(e => e.IsRestored).HasDefaultValue(false);
                entity.HasIndex(e => e.AdSoyad);
                entity.HasIndex(e => e.DeletedAt);
                entity.HasIndex(e => e.IsRestored);
            });

            // ActivityLog configuration
            modelBuilder.Entity<ActivityLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.EntityId);
                entity.Property(e => e.EntityName).HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.UserId).IsRequired();
                entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.HasIndex(e => e.Action);
                entity.HasIndex(e => e.EntityType);
                entity.HasIndex(e => e.EntityId);
                entity.HasIndex(e => e.UserId);
                entity.HasIndex(e => e.CreatedAt);
            });

            // Stok configuration
            modelBuilder.Entity<Stok>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.UrunTuru).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Marka).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Model).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Miktar).IsRequired().HasDefaultValue(0);
                entity.Property(e => e.MinimumStok).IsRequired().HasDefaultValue(1);
                entity.Property(e => e.BirimFiyat).HasColumnType("decimal(15,2)");
                entity.Property(e => e.OlusturmaTarihi).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.GuncellemeTarihi).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.OlusturanKullanici).HasMaxLength(100);
                entity.Property(e => e.GuncelleyenKullanici).HasMaxLength(100);
                entity.Property(e => e.IsActive).HasDefaultValue(true);
                entity.HasIndex(e => e.UrunTuru);
                entity.HasIndex(e => e.Marka);
                entity.HasIndex(e => e.Model);
                entity.HasIndex(e => e.Miktar);
                entity.HasIndex(e => e.IsActive);
            });

            // StokHareketi configuration
            modelBuilder.Entity<StokHareketi>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.StokId).IsRequired();
                entity.Property(e => e.CustomerId); // Opsiyonel müşteri ID'si
                entity.Property(e => e.Miktar).IsRequired();
                entity.Property(e => e.HareketTipi).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Aciklama).HasMaxLength(500);
                entity.Property(e => e.Tarih).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.KullaniciAdi).HasMaxLength(100);
                entity.HasOne(e => e.Stok)
                    .WithMany(s => s.StokHareketleri)
                    .HasForeignKey(e => e.StokId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Customer)
                    .WithMany(c => c.StokHareketleri)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.SetNull); // Müşteri silinirse hareket kalır ama CustomerId null olur
                entity.HasIndex(e => e.StokId);
                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.HareketTipi);
                entity.HasIndex(e => e.Tarih);
            });

            // ProductType configuration
            modelBuilder.Entity<ProductType>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Ad).IsRequired().HasMaxLength(50);
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.UpdatedAt).HasColumnType("timestamp with time zone");
                entity.HasIndex(e => e.Ad).IsUnique();
            });

            // Job configuration
            modelBuilder.Entity<Job>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Ad).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.UpdatedAt).HasColumnType("timestamp with time zone");
                entity.HasIndex(e => e.Ad).IsUnique();
            });

            // JobProductType configuration
            modelBuilder.Entity<JobProductType>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.JobId).IsRequired();
                entity.Property(e => e.ProductTypeId).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.HasOne(e => e.Job)
                    .WithMany(j => j.JobProductTypes)
                    .HasForeignKey(e => e.JobId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.ProductType)
                    .WithMany()
                    .HasForeignKey(e => e.ProductTypeId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(e => new { e.JobId, e.ProductTypeId }).IsUnique();
            });

            // Brand configuration
            modelBuilder.Entity<Brand>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Ad).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.UpdatedAt).HasColumnType("timestamp with time zone");
                entity.HasIndex(e => e.Ad).IsUnique();
            });

            // BrandProductType configuration
            modelBuilder.Entity<BrandProductType>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.BrandId).IsRequired();
                entity.Property(e => e.ProductTypeId).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                
                entity.HasOne(e => e.Brand)
                    .WithMany(b => b.BrandProductTypes)
                    .HasForeignKey(e => e.BrandId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.ProductType)
                    .WithMany(pt => pt.BrandProductTypes)
                    .HasForeignKey(e => e.ProductTypeId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                // Unique constraint for Brand-ProductType combination
                entity.HasIndex(e => new { e.BrandId, e.ProductTypeId }).IsUnique();
            });

            // Model configuration
            modelBuilder.Entity<Model>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Ad).IsRequired().HasMaxLength(100);
                entity.Property(e => e.BrandId).IsRequired();
                entity.Property(e => e.ProductTypeId).IsRequired();
                entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.UpdatedAt).HasColumnType("timestamp with time zone");
                
                entity.HasOne(e => e.Brand)
                    .WithMany(b => b.Models)
                    .HasForeignKey(e => e.BrandId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.ProductType)
                    .WithMany(pt => pt.Models)
                    .HasForeignKey(e => e.ProductTypeId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasIndex(e => new { e.BrandId, e.ProductTypeId, e.Ad }).IsUnique();
            });

            // Order configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CustomerId).IsRequired();
                entity.Property(e => e.StokId).IsRequired();
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Miktar).IsRequired().HasDefaultValue(1);
                entity.Property(e => e.SiparisTarihi).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.TahsisTarihi).HasColumnType("timestamp with time zone");
                entity.Property(e => e.TamamlanmaTarihi).HasColumnType("timestamp with time zone");
                entity.Property(e => e.Notlar).HasMaxLength(500);
                entity.Property(e => e.OlusturanKullanici).HasMaxLength(100);
                entity.Property(e => e.GuncelleyenKullanici).HasMaxLength(100);
                entity.Property(e => e.OlusturmaTarihi).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.GuncellemeTarihi).IsRequired().HasColumnType("timestamp with time zone");
                
                entity.HasOne(e => e.Customer)
                    .WithMany(c => c.Orders)
                    .HasForeignKey(e => e.CustomerId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Stok)
                    .WithMany(s => s.Orders)
                    .HasForeignKey(e => e.StokId)
                    .OnDelete(DeleteBehavior.Restrict);
                    
                entity.HasIndex(e => e.CustomerId);
                entity.HasIndex(e => e.StokId);
                entity.HasIndex(e => e.Status);
                entity.HasIndex(e => e.SiparisTarihi);
            });

            // StokRezervasyon configuration
            modelBuilder.Entity<StokRezervasyon>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.StokId).IsRequired();
                entity.Property(e => e.OrderId).IsRequired();
                entity.Property(e => e.RezerveEdilenMiktar).IsRequired();
                entity.Property(e => e.RezervasyonTarihi).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.TahsisTarihi).HasColumnType("timestamp with time zone");
                entity.Property(e => e.Durum).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Aciklama).HasMaxLength(500);
                entity.Property(e => e.OlusturanKullanici).HasMaxLength(100);
                entity.Property(e => e.OlusturmaTarihi).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.GuncellemeTarihi).IsRequired().HasColumnType("timestamp with time zone");
                
                entity.HasOne(e => e.Stok)
                    .WithMany(s => s.StokRezervasyonlari)
                    .HasForeignKey(e => e.StokId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasOne(e => e.Order)
                    .WithMany(o => o.StokRezervasyonlari)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);
                    
                entity.HasIndex(e => e.StokId);
                entity.HasIndex(e => e.OrderId);
                entity.HasIndex(e => e.Durum);
                entity.HasIndex(e => e.RezervasyonTarihi);
            });

            // DukkanCarisi configuration
            modelBuilder.Entity<DukkanCarisi>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Aciklama).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Tutar).IsRequired().HasColumnType("decimal(15,2)");
                entity.Property(e => e.YapanKullanici).IsRequired().HasMaxLength(100);
                entity.Property(e => e.YapilanIslem).IsRequired().HasMaxLength(50);
                entity.Property(e => e.IslemTarihi).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.OlusturmaTarihi).IsRequired().HasColumnType("timestamp with time zone");
                entity.Property(e => e.GuncellemeTarihi).HasColumnType("timestamp with time zone");
                entity.Property(e => e.GuncelleyenKullanici).HasMaxLength(100);
                entity.Property(e => e.IsDeleted).HasDefaultValue(false);
                entity.HasIndex(e => e.YapilanIslem);
                entity.HasIndex(e => e.IslemTarihi);
                entity.HasIndex(e => e.OlusturmaTarihi);
                entity.HasIndex(e => e.YapanKullanici);
            });

            // Seed data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // SuperAdmin user (şifre: superadmin123)
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 1,
                Username = "superadmin",
                Password = "$2a$11$zj8y12YepQ2ImLK40qQToOKtDInFDOAnPU8NbNoSp12GsJHDIyi0e", // superadmin123
                Role = "superadmin",
                CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc)
            });

            // Admin user (şifre: admin123)
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 2,
                Username = "admin",
                Password = "$2a$11$8gw3dCyCAZZw7JaFcYicouEWJdG.kqWsGqHtMu2Am2iDZLJAWlF5e", // admin123
                Role = "admin",
                CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc)
            });

            // Employee user (şifre: calisan123)
            modelBuilder.Entity<User>().HasData(new User
            {
                Id = 3,
                Username = "calisan",
                Password = "$2a$11$2F67BkugEC.YyYCVfTXqC.nC9uPthVHQPATWACUJk3mvxDnIgiBMC", // calisan123
                Role = "employee",
                CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc),
                UpdatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc)
            });

            // Default suppliers
            modelBuilder.Entity<Supplier>().HasData(
                new Supplier { Id = 1, Name = "Artı", IsActive = true, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Supplier { Id = 2, Name = "ABC", IsActive = true, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Supplier { Id = 3, Name = "DEF", IsActive = true, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Supplier { Id = 4, Name = "KMB", IsActive = true, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc), UpdatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) }
            );

            // Default product types
            modelBuilder.Entity<ProductType>().HasData(
                new ProductType { Id = 1, Ad = "Kombi", CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new ProductType { Id = 2, Ad = "Klima", CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new ProductType { Id = 3, Ad = "Şofben", CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new ProductType { Id = 4, Ad = "Kazan", CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) }
            );

            // Default brands
            modelBuilder.Entity<Brand>().HasData(
                new Brand { Id = 1, Ad = "Vaillant", CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Brand { Id = 2, Ad = "Daikin", CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Brand { Id = 3, Ad = "Arçelik", CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Brand { Id = 4, Ad = "Demirdöküm", CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Brand { Id = 5, Ad = "Bosch", CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) }
            );

            // Default brand-product type relationships
            modelBuilder.Entity<BrandProductType>().HasData(
                // Vaillant - Kombi
                new BrandProductType { Id = 1, BrandId = 1, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                // Daikin - Kombi, Klima
                new BrandProductType { Id = 2, BrandId = 2, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new BrandProductType { Id = 3, BrandId = 2, ProductTypeId = 2, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                // Arçelik - Kombi, Klima
                new BrandProductType { Id = 4, BrandId = 3, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new BrandProductType { Id = 5, BrandId = 3, ProductTypeId = 2, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                // Demirdöküm - Kombi
                new BrandProductType { Id = 6, BrandId = 4, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                // Bosch - Kombi, Şofben
                new BrandProductType { Id = 7, BrandId = 5, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new BrandProductType { Id = 8, BrandId = 5, ProductTypeId = 3, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) }
            );

            // Default models
            modelBuilder.Entity<Model>().HasData(
                // Vaillant Kombi modelleri
                new Model { Id = 1, Ad = "EcoTec Pro", BrandId = 1, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Model { Id = 2, Ad = "EcoTec Plus", BrandId = 1, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                // Daikin modelleri
                new Model { Id = 3, Ad = "Altherma", BrandId = 2, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Model { Id = 4, Ad = "Sensys", BrandId = 2, ProductTypeId = 2, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Model { Id = 5, Ad = "Perfera", BrandId = 2, ProductTypeId = 2, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                // Arçelik modelleri
                new Model { Id = 6, Ad = "Alteo", BrandId = 3, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Model { Id = 7, Ad = "Vela", BrandId = 3, ProductTypeId = 2, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                // Demirdöküm modelleri
                new Model { Id = 8, Ad = "Nitromix", BrandId = 4, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Model { Id = 9, Ad = "Atron", BrandId = 4, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                // Bosch modelleri
                new Model { Id = 10, Ad = "Condens 7000", BrandId = 5, ProductTypeId = 1, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) },
                new Model { Id = 11, Ad = "Therm 4000", BrandId = 5, ProductTypeId = 3, CreatedAt = new DateTime(2024,1,1, 0, 0, 0, DateTimeKind.Utc) }
            );
        }
    }
} 