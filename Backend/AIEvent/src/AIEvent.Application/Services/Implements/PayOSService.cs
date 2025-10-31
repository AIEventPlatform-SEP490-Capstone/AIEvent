using AIEvent.Application.Services.Interfaces; 
using PayOS;
using Microsoft.Extensions.DependencyInjection;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using PayOS.Models.V1.Payouts;
using PayOS.Models.V1.Payouts.Batch;

namespace AIEvent.Application.Services.Implements
{
    public class PayOSService : IPayOSService
    {
        private readonly PayOSClient _paymentClient;
        private readonly PayOSClient _payoutClient;

        public PayOSService(
            [FromKeyedServices("PaymentClient")] PayOSClient paymentClient,
            [FromKeyedServices("PayoutClient")] PayOSClient payoutClient)
        {
            _paymentClient = paymentClient;
            _payoutClient = payoutClient;
        }

        public async Task<CreatePaymentLinkResponse> CreatePaymentLinkAsync(CreatePaymentLinkRequest data)
            => await _paymentClient.PaymentRequests.CreateAsync(data);

        public async Task<WebhookData> VerifyPaymentWebhookData(Webhook webhookBody)
            => await _paymentClient.Webhooks.VerifyAsync(webhookBody);

        public async Task<Payout> CreatePayoutAsync(PayoutRequest request)
            => await _payoutClient.Payouts.CreateAsync(request);

        public async Task<Payout> CreateManyPayoutAsync(PayoutBatchRequest request)
            => await _payoutClient.Payouts.Batch.CreateAsync(request);

    }
}
