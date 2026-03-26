using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;

namespace BankingDemo.Infrastructure.Services;

public record PaymentEvent(Guid TransactionId, decimal Amount, string Status, DateTime OccurredAt);

public class PaymentEventService(ILogger<PaymentEventService> logger) : IAsyncDisposable
{
    private IConnection? _connection;
    private IChannel? _channel;
    private const string QueueName = "payment.events";

    public async Task InitializeAsync(string connectionString)
    {
        try
        {
            var factory = new ConnectionFactory { Uri = new Uri(connectionString) };
            _connection = await factory.CreateConnectionAsync();
            _channel = await _connection.CreateChannelAsync();
            await _channel.QueueDeclareAsync(QueueName, durable: true, exclusive: false, autoDelete: false);
            logger.LogInformation("RabbitMQ connected");
        }
        catch (Exception ex)
        {
            logger.LogWarning("RabbitMQ unavailable: {Message}. Events will be skipped.", ex.Message);
        }
    }

    public async Task PublishAsync(PaymentEvent evt)
    {
        if (_channel is null) return;

        try
        {
            var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(evt));
            await _channel.BasicPublishAsync("", QueueName, body);
            logger.LogInformation("Published payment event {TransactionId}", evt.TransactionId);
        }
        catch (Exception ex)
        {
            logger.LogWarning("Failed to publish event: {Message}", ex.Message);
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel is not null) await _channel.DisposeAsync();
        if (_connection is not null) await _connection.DisposeAsync();
    }
}