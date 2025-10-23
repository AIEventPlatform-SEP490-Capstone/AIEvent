using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Wallet;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/wallet")]
    [ApiController]
    public class WalletController : ControllerBase
    {
        public IWalletService _walletService;
        public WalletController(IWalletService walletService)
        {
            _walletService = walletService;
        }

        [HttpGet("user")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<WalletResponse>>> GetWalletUser()
        {
            var userId = User.GetRequiredUserId();
            var result = await _walletService.GetWalletUser(userId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<WalletResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Wallet retrieved successfully"));
        }

        [HttpGet("{walletId}/transactions")]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<BasePaginated<WalletsResponse>>>> GetTransactionStatus(
            Guid walletId,
            [FromQuery] FilterTransactionStatus status = FilterTransactionStatus.All,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 5)
        {
            var result = await _walletService.GetTransactionStatustUser(walletId, status, pageNumber, pageSize);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<WalletsResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Transaction retrieved successfully"));
        }
    }
}
