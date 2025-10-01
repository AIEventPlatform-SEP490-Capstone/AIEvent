using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.Services.Interfaces;
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

        //[HttpGet]
        //[Authorize]
        //public async Task<ActionResult<SuccessResponse<List<OrganizerResponse>>>> GetOrganizer([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        //{
        //    var result = await _organizerService.GetOrganizerAsync(page, pageSize);
        //    if (result.IsFailure)
        //    {
        //        return BadRequest(result.Error!);
        //    }

        //    return Ok(SuccessResponse<List<OrganizerResponse>>.SuccessResult(
        //        result.Value!,
        //        SuccessCodes.Success,
        //        "Organizer retrieved successfully"));
        //}

        //[HttpGet("{id}")]
        //[Authorize]
        //public async Task<ActionResult<SuccessResponse<OrganizerResponse>>> GetOrganizerById(string id)
        //{
        //    var result = await _organizerService.GetOrganizerByIdAsync(id);
        //    if (result.IsFailure)
        //    {
        //        return BadRequest(result.Error!);
        //    }

        //    return Ok(SuccessResponse<OrganizerResponse>.SuccessResult(
        //        result.Value!,
        //        SuccessCodes.Success,
        //        "Organizer retrieved successfully"));
        //}

        [HttpPost]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> RegisterOrganizer([FromForm] RegisterOrganizerRequest request)
        {
            var userId = User.GetRequiredUserId();
            var result = await _organizerService.RegisterOrganizerAsync(userId, request);
            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Register Organizer successfully"));
        }
    }
}
