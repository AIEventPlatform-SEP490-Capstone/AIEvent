using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.PaymentInformation;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
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

        [HttpGet("information/{id}")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<PaymentInformationResponse>>> GetPaymentInformationById(Guid id)
        {
            var userId = User.GetRequiredUserId();

            var result = await _paymentService.GetPaymendInformationByIdAsync(userId, id);
            if (!result.IsSuccess)
                return NotFound(result.Error!);

            return Ok(SuccessResponse<PaymentInformationResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Retrieve payment information successfully"));
        }

        [HttpGet("informations")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<BasePaginated<PaymentInformationResponse>>>> GetPaymentInformations(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 5)
        {
            var userId = User.GetRequiredUserId();

            var result = await _paymentService.GetPaymendInformationsAsync(userId, pageNumber, pageSize);
            if (!result.IsSuccess)
                return BadRequest(result.Error!);

            return Ok(SuccessResponse<BasePaginated<PaymentInformationResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Retrieve payment informations successfully"));
        }

        [HttpPost("information")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> AddPaymentInformation([FromBody] CreatePaymentInformationRequest request)
        {
            var userId = User.GetRequiredUserId();

            var result = await _paymentService.AddPaymendInformationAsync(userId, request);
            if (!result.IsSuccess)
                return BadRequest(result.Error!);

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Payment information created successfully"));
        }

        [HttpPatch("information/{id}")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> UpdatePaymentInformation(Guid id, [FromBody] UpdatePaymentInformationRequest request)
        {
            var userId = User.GetRequiredUserId();

            var result = await _paymentService.UpdatePaymendInformationAsync(userId, id, request);
            if (!result.IsSuccess)
                return BadRequest(result.Error!);

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Updated,
                "Payment information updated successfully"));
        }

        [HttpDelete("information/{id}")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> DeletePaymentInformation(Guid id)
        {
            var userId = User.GetRequiredUserId();

            var result = await _paymentService.DeletePaymendInformationAsync(userId, id);
            if (!result.IsSuccess)
                return BadRequest(result.Error!);

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Deleted,
                "Payment information deleted successfully"));
        }
    }
}
