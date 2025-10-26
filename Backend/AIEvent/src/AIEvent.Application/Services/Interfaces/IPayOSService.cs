using Net.payOS.Types;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IPayOSService
    {
        Task<CreatePaymentResult> CreatePaymentLinkAsync(PaymentData data);
        WebhookData VerifyPaymentWebhookData(WebhookType webhookBody);
        Task<PaymentLinkInformation> GetPaymentWebhookData(long orderId);
    }
}
