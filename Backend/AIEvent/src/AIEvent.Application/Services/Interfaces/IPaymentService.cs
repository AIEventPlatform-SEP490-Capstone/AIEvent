using AIEvent.Application.Helpers;
using Net.payOS.Types;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<Result<CreatePaymentResult>> CreatePaymentTopUpAsync(Guid userId, long amount);
        Task<Result> PaymentWebhookAsync(WebhookType webhookBody);
    }
}
