using Net.payOS.Types;
using Net.payOS;
using AIEvent.Application.Services.Interfaces;

namespace AIEvent.Application.Services.Implements
{
    public class PayOSService : IPayOSService
    {
        private readonly PayOS _payOS;

        public PayOSService(PayOS payOS)
        {
            _payOS = payOS;
        }

        public async Task<CreatePaymentResult> CreatePaymentLinkAsync(PaymentData data)
            => await _payOS.createPaymentLink(data);

        public WebhookData VerifyPaymentWebhookData(WebhookType webhookBody)
            => _payOS.verifyPaymentWebhookData(webhookBody);
    }
}
