using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Net.payOS.Types;

namespace AIEvent.API.Controllers
{
    [Route("api/payment")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost("topup")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<CreatePaymentResult>>> CreatePaymentTopUp([FromBody] long amount)
        {
            var userId = User.GetRequiredUserId();

            var result = await _paymentService.CreatePaymentTopUpAsync(userId, amount);

            if (!result.IsSuccess)
            {
                return Unauthorized(result.Error!);
            }

            return Ok(SuccessResponse<CreatePaymentResult>.SuccessResult(
                result.Value!,
                SuccessCodes.Created,
                "Create payment successfuly"));
        }

        [HttpPost("webhook")]
        public async Task<ActionResult<SuccessResponse<object>>> ReceiveWebhook([FromBody] WebhookType webhookBody)
        {
            if (webhookBody == null)
                return BadRequest("Webhook payload is null.");

            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Payment successfuly"));
        }
    }
}
