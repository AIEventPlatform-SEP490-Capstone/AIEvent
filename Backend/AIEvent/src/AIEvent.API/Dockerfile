# --------- BUILD STAGE ---------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy toàn bộ solution và project files để restore
COPY *.sln ./
COPY AIEvent.API/AIEvent.API.csproj AIEvent.API/
COPY AIEvent.Application/AIEvent.Application.csproj AIEvent.Application/
COPY AIEvent.Domain/AIEvent.Domain.csproj AIEvent.Domain/
COPY AIEvent.Infrastructure/AIEvent.Infrastructure.csproj AIEvent.Infrastructure/

# Khôi phục dependencies
RUN dotnet restore AIEvent.API/AIEvent.API.csproj

# Copy toàn bộ mã nguồn còn lại
COPY . .

# Build và publish ra thư mục /app/publish
RUN dotnet publish AIEvent.API/AIEvent.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# --------- RUNTIME STAGE ---------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Thiết lập biến môi trường để lắng nghe tất cả interface
ENV ASPNETCORE_URLS=http://+:80

# Copy output từ stage build sang runtime
COPY --from=build /app/publish .

# Expose cổng 80 để container nhận traffic
EXPOSE 80

# Chạy ứng dụng
ENTRYPOINT ["dotnet", "AIEvent.API.dll"]
