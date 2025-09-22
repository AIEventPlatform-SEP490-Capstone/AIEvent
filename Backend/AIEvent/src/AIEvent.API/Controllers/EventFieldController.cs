using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EventFieldController : ControllerBase
    {
        private readonly IEvenFieldService _evenFieldService;
        public EventFieldController(IEvenFieldService evenFieldService)
        {
            _evenFieldService = evenFieldService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<IEnumerable<EventFieldResponse>>>> GetEventField()
        {
            var result = await _evenFieldService.GetAllEventField();
            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<IEnumerable<EventFieldResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Event field retrieved successfully"));
        }
    }
}
