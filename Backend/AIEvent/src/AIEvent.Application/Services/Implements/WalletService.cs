using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Wallet;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Enums;
using AIEvent.Infrastructure.Repositories.Interfaces;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class WalletService : IWalletService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        public WalletService(IUnitOfWork unitOfWork, IMapper mapper) 
        { 
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }
        public async Task<Result<WalletResponse>> GetWalletUser(Guid userId)
        {
            if (userId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var user = await _unitOfWork.UserRepository.GetByIdAsync(userId, true);
            if (user == null || user.IsDeleted == true)
                return ErrorResponse.FailureResult("User not found or deleted", ErrorCodes.NotFound);

            var wallet = await _unitOfWork.WalletRepository
                                            .Query()
                                            .Where(w => w.UserId == userId)
                                            .ProjectTo<WalletResponse>(_mapper.ConfigurationProvider)
                                            .FirstOrDefaultAsync();
            if(wallet == null)
                return ErrorResponse.FailureResult("User not found or deleted", ErrorCodes.NotFound);

            return Result<WalletResponse>.Success(wallet);
        }

        public async Task<Result<BasePaginated<WalletsResponse>>> GetTransactionStatustUser(Guid walletId, FilterTransactionStatus? status = FilterTransactionStatus.All, int pageNumber = 1, int pageSize = 5)
        {
            if (walletId == Guid.Empty)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var wallet = await _unitOfWork.WalletRepository.GetByIdAsync(walletId, true);
            if (wallet == null || wallet.IsDeleted == true)
                return ErrorResponse.FailureResult("Wallet not found or deleted", ErrorCodes.NotFound);

            IQueryable<WalletTransaction> transaction = _unitOfWork.WalletTransactionRepository
                                                                .Query()
                                                                .AsNoTracking()
                                                                .Where(e => e.WalletId == walletId);
            if (status == FilterTransactionStatus.Processing)
                transaction = transaction.Where(t => t.Status == TransactionStatus.Pending);

            int totalCount = await transaction.CountAsync();

            var result = await transaction
                .OrderByDescending(e => e.UpdatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new WalletsResponse
                {
                    Description = e.Description,
                    WalletId = e.WalletId,
                    Balance = e.Amount,
                    CreatedAt = e.CreatedAt,
                    Direction = e.Direction,
                    OrderCode = e.OrderCode,
                    Status = e.Status,
                    Type = e.Type
                })
                .ToListAsync();

            return new BasePaginated<WalletsResponse>(result, totalCount, pageNumber, pageSize);
        }
    }
}
