using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.DTOs.RuleRefundDetail;
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
        [Authorize(Roles = "Admin, Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateRule([FromBody] CreateRuleRefundRequest request)
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
        [Authorize(Roles = "Admin, Organizer, Manager")]
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

        [HttpPatch("{id}")]
        [Authorize(Roles = "Admin, Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> UpdateRule(Guid id,UpdateRuleRefundRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _ruleRefundService.UpdateRuleAsync(userId, id, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new {},
                SuccessCodes.Updated,
                "Rule updated successfully"));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin, Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteRule(Guid id)
        {
            var userId = User.GetRequiredUserId();
            var result = await _ruleRefundService.DeleteRuleAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Deleted,
                "Rule deleted successfully"));
        }

        [HttpPost("detail")]
        [Authorize(Roles = "Admin, Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateRuleDetail(Guid ruleRefundId, RuleRefundDetailRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _ruleRefundService.CreateRuleDetailAsync(userId, ruleRefundId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }
            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Create rule detail successfully"));
        }


        [HttpPatch("detail/{id}")]
        [Authorize(Roles = "Admin, Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> UpdateRuleDetail(Guid id, UpdateRuleRefundDetailRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _ruleRefundService.UpdateRuleDetailAsync(userId, id, request);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Updated,
                "Rule detail updated successfully"));
        }

        [HttpDelete("detail/{id}")]
        [Authorize(Roles = "Admin, Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteRuleDetail(Guid id)
        {
            var userId = User.GetRequiredUserId();
            var result = await _ruleRefundService.DeleteRuleDetailAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Deleted,
                "Rule detail deleted successfully"));
        }
    }
}
