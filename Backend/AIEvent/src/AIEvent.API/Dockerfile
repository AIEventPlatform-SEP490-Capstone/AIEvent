# --------- BUILD STAGE ---------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution + csproj files
COPY Backend/AIEvent/AIEvent.sln ./
COPY Backend/AIEvent/src/AIEvent.API/AIEvent.API.csproj AIEvent.API/
COPY Backend/AIEvent/src/AIEvent.Application/AIEvent.Application.csproj AIEvent.Application/
COPY Backend/AIEvent/src/AIEvent.Domain/AIEvent.Domain.csproj AIEvent.Domain/
COPY Backend/AIEvent/src/AIEvent.Infrastructure/AIEvent.Infrastructure.csproj AIEvent.Infrastructure/

# Restore dependencies
RUN dotnet restore AIEvent.API/AIEvent.API.csproj

# Copy tất cả source code
COPY Backend/AIEvent/src ./

# Publish
RUN dotnet publish AIEvent.API/AIEvent.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# --------- RUNTIME STAGE ---------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:80

COPY --from=build /app/publish .

EXPOSE 80
ENTRYPOINT ["dotnet", "AIEvent.API.dll"]
