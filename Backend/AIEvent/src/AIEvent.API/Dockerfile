# --------- BUILD STAGE ---------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy toàn bộ source ngay từ đầu
COPY . .

# Restore dependencies
RUN dotnet restore AIEvent.API/AIEvent.API.csproj

# Build và publish
RUN dotnet publish AIEvent.API/AIEvent.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# --------- RUNTIME STAGE ---------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Thiết lập lắng nghe tất cả interface
ENV ASPNETCORE_URLS=http://+:80

# Copy output từ stage build sang runtime
COPY --from=build /app/publish .

# Expose cổng 80 để container nhận traffic
EXPOSE 80

# Chạy ứng dụng
ENTRYPOINT ["dotnet", "AIEvent.API.dll"]
