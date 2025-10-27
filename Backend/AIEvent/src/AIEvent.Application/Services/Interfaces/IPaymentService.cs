using AIEvent.Application.DTOs.PaymentInformation;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using Net.payOS.Types;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<Result<CreatePaymentResult>> CreatePaymentTopUpAsync(Guid userId, long amount);
        Task<Result> PaymentWebhookAsync(WebhookType webhookBody);
        Task<Result<PaymentInformationResponse>> GetPaymendInformationByIdAsync(Guid userId, Guid paymentInformationId);
        Task<Result> AddPaymendInformationAsync(Guid userId, CreatePaymentInformationRequest request);
        Task<Result> UpdatePaymendInformationAsync(Guid userId, Guid paymentInformationId, UpdatePaymentInformationRequest request);
        Task<Result> DeletePaymendInformationAsync(Guid userId, Guid paymentInformationId);
        Task<Result<BasePaginated<PaymentInformationResponse>>> GetPaymendInformationsAsync(Guid userId, int pageNumber = 1, int pageSize = 5);
    }
}
