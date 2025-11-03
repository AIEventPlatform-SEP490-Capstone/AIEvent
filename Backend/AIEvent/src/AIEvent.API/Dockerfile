# --------- BUILD STAGE ---------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj của từng project
COPY src/AIEvent.API/AIEvent.API.csproj AIEvent.API/
COPY src/AIEvent.Application/AIEvent.Application.csproj AIEvent.Application/
COPY src/AIEvent.Domain/AIEvent.Domain.csproj AIEvent.Domain/
COPY src/AIEvent.Infrastructure/AIEvent.Infrastructure.csproj AIEvent.Infrastructure/

# Copy solution (AIEvent.sln)
COPY AIEvent.sln ./

# Restore dependencies
RUN dotnet restore AIEvent.API/AIEvent.API.csproj

# Copy toàn bộ code
COPY src/ .

# Build & Publish
RUN dotnet publish AIEvent.API/AIEvent.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# --------- RUNTIME STAGE ---------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:80

RUN apt-get update && apt-get install -y libgdiplus && ln -s /usr/lib/libgdiplus.so /usr/lib/gdiplus.dll

COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "AIEvent.API.dll"]
