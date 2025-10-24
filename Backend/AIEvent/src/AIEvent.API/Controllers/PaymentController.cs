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

        [HttpPost("create")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<CreatePaymentResult>>> CreatePayment([FromBody] long amount)
        {
            var userId = User.GetRequiredUserId();

            var result = await _paymentService.CreatePaymentAsync(userId, amount);

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
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> ReceiveWebhook([FromBody] WebhookType webhookBody)
        {
            if (webhookBody == null)
                return BadRequest("Webhook payload is null.");

            var result = await _paymentService.PaymentWebhookAsync(webhookBody);

            if (!result.IsSuccess)
            {
                return Unauthorized(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Payment successfuly"));
        }
    }
}
