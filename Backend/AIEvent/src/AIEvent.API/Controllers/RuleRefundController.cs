using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/rule-refund")]
    [ApiController]
    public class RuleRefundController : ControllerBase
    {
        private readonly IRuleRefundService _ruleRefundService;
        public RuleRefundController(IRuleRefundService ruleRefundService)
        {
            _ruleRefundService = ruleRefundService;
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<object>>> CreateRule(CreateRuleRefundRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _ruleRefundService.CreateRuleAsync(userId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }
            return Ok(SuccessResponse<object>.SuccessResult(
                new {}, 
                SuccessCodes.Created, 
                "Create rule successfully"));
        }


        [HttpGet]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<BasePaginated<RuleRefundResponse>>>> GetRule([FromQuery] int pageNumber = 1,
                                                                                                    [FromQuery] int pageSize = 5)
        {
            var userId = User.GetRequiredUserId();
            var result = await _ruleRefundService.GetRuleRefundAsync(userId, pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<RuleRefundResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Rule retrieved successfully"));
        }
    }
}
