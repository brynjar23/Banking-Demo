FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ../BankingDemo.Core ./BankingDemo.Core
COPY ../BankingDemo.Infrastructure ./BankingDemo.Infrastructure
COPY . ./BankingDemo.Api
RUN dotnet publish BankingDemo.Api/BankingDemo.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "BankingDemo.Api.dll"]