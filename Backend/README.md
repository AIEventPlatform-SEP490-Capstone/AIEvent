# AIEvent Backend

AIEvent Backend là một RESTful API được xây dựng bằng ASP.NET Core 8.0, sử dụng Clean Architecture pattern để quản lý sự kiện và người dùng. Hệ thống cung cấp các tính năng xác thực, phân quyền và quản lý người dùng với JWT token.

## 🏗️ Kiến trúc dự án

Dự án được tổ chức theo Clean Architecture với 4 layer chính:

```
AIEvent/
├── src/
│   ├── AIEvent.API/          # Presentation Layer - Web API Controllers
│   ├── AIEvent.Application/  # Application Layer - Business Logic & Services
│   ├── AIEvent.Domain/       # Domain Layer - Entities & Interfaces
│   └── AIEvent.Infrastructure/ # Infrastructure Layer - Data Access & External Services
└── tests/
    ├── AIEvent.API.Test/     # API Integration Tests
    └── AIEvent.Application.Test/ # Application Unit Tests
```

## 🚀 Công nghệ sử dụng

- **Framework**: ASP.NET Core 8.0
- **Database**: SQL Server với Entity Framework Core 8.0
- **Authentication**: JWT Bearer Token + Refresh Token
- **Authorization**: ASP.NET Core Identity với Role-based access
- **Mapping**: AutoMapper
- **Documentation**: Swagger/OpenAPI
- **Testing**: xUnit, Integration Tests

## 📋 Tính năng chính

### 🔐 Authentication & Authorization
- Đăng ký tài khoản mới
- Đăng nhập với email/password
- JWT Access Token (1 giờ) + Refresh Token (7 ngày)
- Làm mới token tự động
- Thu hồi refresh token
- Role-based authorization (Admin, User)

### 👥 Quản lý người dùng
- Xem thông tin người dùng (Admin only)
- Cập nhật profile cá nhân
- Quản lý trạng thái active/inactive

### 🛡️ Quản lý vai trò (Roles)
- Tạo vai trò mới
- Cập nhật thông tin vai trò
- Xem danh sách tất cả vai trò

## 🔧 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- .NET 8.0 SDK
- SQL Server (LocalDB hoặc SQL Server instance)
- Visual Studio 2022 hoặc VS Code

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd AIEvent/Backend
```

### Bước 2: Cấu hình database
1. Mở file `appsettings.json` trong `AIEvent.API`
2. Cập nhật connection string:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(local);Database=AIEvent;Uid=sa;Pwd=123456;TrustServerCertificate=True"
  }
}
```

### Bước 3: Chạy migration
```bash
cd src/AIEvent.API
dotnet ef database update
```

### Bước 4: Chạy ứng dụng
```bash
dotnet run
```

API sẽ chạy tại: `http://localhost:5059`
Swagger UI: `http://localhost:5059/swagger`

## 📚 API Endpoints

### Authentication
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Đăng nhập | ❌ |
| POST | `/api/auth/register` | Đăng ký | ❌ |
| POST | `/api/auth/refresh-token` | Làm mới token | ❌ |
| POST | `/api/auth/revoke-token` | Thu hồi token | ✅ |

### User Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/{id}` | Lấy thông tin user | ✅ (Admin) |
| PUT | `/api/user/profile` | Cập nhật profile | ✅ |

### Role Management
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/role` | Lấy danh sách roles | ✅ |
| POST | `/api/role` | Tạo role mới | ✅ |
| PUT | `/api/role/{id}` | Cập nhật role | ✅ |

## 📝 Cấu trúc dữ liệu

### AppUser
```csharp
public class AppUser : IdentityUser<Guid>
{
    public string? FullName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsActive { get; set; }
    public virtual ICollection<RefreshToken> RefreshTokens { get; set; }
}
```

### AppRole
```csharp
public class AppRole : IdentityRole<Guid>
{
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

### RefreshToken
```csharp
public class RefreshToken : BaseEntity
{
    public string Token { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public Guid UserId { get; set; }
    public AppUser User { get; set; }
}
```

## 🔒 Bảo mật

### JWT Configuration
- **Access Token**: Thời gian sống 1 giờ
- **Refresh Token**: Thời gian sống 7 ngày
- **Algorithm**: HS256
- **Key**: Cấu hình trong `appsettings.json`

### CORS Policy
- Cho phép origin: `http://localhost:3000` (Frontend)
- Có thể cấu hình thêm origins trong `appsettings.json`

## 🧪 Testing

### Chạy Unit Tests
```bash
cd tests/AIEvent.Application.Test
dotnet test
```

### Chạy Integration Tests
```bash
cd tests/AIEvent.API.Test
dotnet test
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": "AIE20000",
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": "AIE40001",
  "message": "Error message",
  "errors": { ... }
}
```

### Status Codes
- `AIE20000`: Success
- `AIE20100`: Created
- `AIE20001`: Updated
- `AIE40001`: Invalid Input
- `AIE40101`: Token Invalid
- `AIE40102`: Unauthorized
- `AIE40301`: Permission Denied
- `AIE40401`: Not Found
- `AIE50001`: Internal Server Error

## 🔧 Cấu hình môi trường

### Development
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=(local);Database=AIEvent;Uid=sa;Pwd=123456;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "ThisIsASecretKeyForJWTTokenGenerationThatShouldBeAtLeast32Characters",
    "Issuer": "PjBase",
    "Audience": "PjBase"
  },
  "AllowedOrigins": [
    "http://localhost:3000"
  ]
}
```

## 🚀 Deployment

### Production Checklist
- [ ] Cập nhật connection string cho production database
- [ ] Thay đổi JWT secret key
- [ ] Cấu hình CORS cho production domain
- [ ] Enable HTTPS
- [ ] Cấu hình logging cho production
- [ ] Setup health checks

## 🤝 Đóng góp

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- Project Link: [https://github.com/your-username/AIEvent](https://github.com/your-username/AIEvent)
- Documentation: [API Documentation](http://localhost:5059/swagger)

---

*Được phát triển với ❤️ bằng ASP.NET Core*