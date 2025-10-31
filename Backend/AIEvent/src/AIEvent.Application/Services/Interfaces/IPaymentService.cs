using AIEvent.Application.DTOs.Payment;
using AIEvent.Application.DTOs.PaymentInformation;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using PayOS.Models.V1.Payouts;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IPaymentService
    {
        Task<Result<CreatePaymentLinkResponse>> CreatePaymentTopUpAsync(Guid userId, long amount);
        Task<Result> PaymentWebhookAsync(Webhook webhookBody);
        Task<Result<PaymentInformationResponse>> GetPaymendInformationByIdAsync(Guid userId, Guid paymentInformationId);
        Task<Result> AddPaymendInformationAsync(Guid userId, CreatePaymentInformationRequest request);
        Task<Result> UpdatePaymendInformationAsync(Guid userId, Guid paymentInformationId, UpdatePaymentInformationRequest request);
        Task<Result> DeletePaymendInformationAsync(Guid userId, Guid paymentInformationId);
        Task<Result<BasePaginated<PaymentInformationResponse>>> GetPaymendInformationsAsync(Guid userId, int pageNumber = 1, int pageSize = 5);
        Task<Result<Payout>> WithdrawAsync(Guid userId, OnlyPayOutRequest request);
    }
}
