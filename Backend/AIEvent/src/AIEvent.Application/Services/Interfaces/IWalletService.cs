using AIEvent.Application.DTOs.Wallet;
using AIEvent.Application.Helpers;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IWalletService
    {
        Task<Result<WalletResponse>> GetWalletUser(Guid userId);
        Task<Result<BasePaginated<WalletsResponse>>> GetTransactionStatustUser(Guid walletId, FilterTransactionStatus? status = FilterTransactionStatus.All, int pageNumber = 1, int pageSize = 5);
    }
}
