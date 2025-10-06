# --------- BUILD STAGE ---------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution + csproj (từ context src)
COPY AIEvent.API/AIEvent.API.csproj AIEvent.API/
COPY AIEvent.Application/AIEvent.Application.csproj AIEvent.Application/
COPY AIEvent.Domain/AIEvent.Domain.csproj AIEvent.Domain/
COPY AIEvent.Infrastructure/AIEvent.Infrastructure.csproj AIEvent.Infrastructure/
COPY AIEvent.sln ./

# Restore
RUN dotnet restore AIEvent.API/AIEvent.API.csproj

# Copy toàn bộ code
COPY . .

# Publish
RUN dotnet publish AIEvent.API/AIEvent.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# --------- RUNTIME STAGE ---------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:80
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "AIEvent.API.dll"]
