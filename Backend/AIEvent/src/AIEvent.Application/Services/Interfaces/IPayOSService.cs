using PayOS.Models.V1.Payouts;
using PayOS.Models.V1.Payouts.Batch;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IPayOSService
    {
        Task<CreatePaymentLinkResponse> CreatePaymentLinkAsync(CreatePaymentLinkRequest data);
        Task<WebhookData> VerifyPaymentWebhookData(Webhook webhookBody);
        Task<Payout> CreatePayoutAsync(PayoutRequest request);
        Task<Payout> CreateManyPayoutAsync(PayoutBatchRequest request);
    }
}
