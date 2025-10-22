using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/organizer")]
    [ApiController]
    public class OrganizerController : ControllerBase
    {
        private readonly IOrganizerService _organizerService;
        public OrganizerController(IOrganizerService organizerService)
        {
            _organizerService = organizerService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin, Manager")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<OrganizerResponse>>>> GetOrganizer([FromQuery] int pageNumber = 1, 
                                                                                                        [FromQuery] int pageSize = 10, 
                                                                                                        [FromQuery] bool? needApprove = false)
        {
            var result = await _organizerService.GetOrganizerAsync(pageNumber, pageSize, false);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<OrganizerResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Organizer retrieved successfully"));
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin, Organizer, Manager")]
        public async Task<ActionResult<SuccessResponse<OrganizerDetailResponse>>> GetOrganizerById(Guid id)
        {
            var result = await _organizerService.GetOrganizerByIdAsync(id);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<OrganizerDetailResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Organizer retrieved successfully"));
        }

        [HttpPost]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> RegisterOrganizer([FromForm] RegisterOrganizerRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Register Organizer successfully"));
        }

        [HttpPatch("confirm/{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> ConfirmBecomeOrganizer(Guid id, [FromBody] ConfirmRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _organizerService.ConfirmBecomeOrganizerAsync(userId, id, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Updated,
                "Confirm become Organizer successfully"));
        }

        [HttpGet("profile")]
        [Authorize(Roles = "Organizer")]
        public async Task<ActionResult<SuccessResponse<OrganizerResponse>>> GetOrganizerProfile()
        {
            var userId = User.GetRequiredUserId();
            var result = await _organizerService.GetOrganizerProfileAsync(userId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<OrganizerResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Organizer retrieved successfully"));
        }
    }
}
