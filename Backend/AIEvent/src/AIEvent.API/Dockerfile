FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution + csproj trước để restore
COPY AIEvent.API/*.csproj AIEvent.API/
COPY AIEvent.Application/*.csproj AIEvent.Application/
COPY AIEvent.Domain/*.csproj AIEvent.Domain/
COPY AIEvent.Infrastructure/*.csproj AIEvent.Infrastructure/

RUN dotnet restore AIEvent.API/AIEvent.API.csproj

# Copy toàn bộ mã nguồn
COPY AIEvent.API/ AIEvent.API/
COPY AIEvent.Application/ AIEvent.Application/
COPY AIEvent.Domain/ AIEvent.Domain/
COPY AIEvent.Infrastructure/ AIEvent.Infrastructure/

RUN dotnet publish AIEvent.API/AIEvent.API.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:80
COPY --from=build /app/publish .
EXPOSE 80
ENTRYPOINT ["dotnet", "AIEvent.API.dll"]
