using AIEvent.Application.Constants;
using AIEvent.Application.DTO.Common;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EnumController : ControllerBase
    {
        private readonly IEnumService _enumService;
        public EnumController(IEnumService enumService)
        {
            _enumService = enumService;
        }

        [HttpGet("all")]
        public IActionResult GetAllEnums()
        {
            var result = new
            {
                EventExperienceLevel = _enumService.GetEnumValues<EventExperienceLevel>(),
                EventFrequency = _enumService.GetEnumValues<EventFrequency>(),
                EventSize = _enumService.GetEnumValues<EventSize>(),
                OrganizationType = _enumService.GetEnumValues<OrganizationType>(),
                OrganizerType = _enumService.GetEnumValues<OrganizerType>()
            };

            return Ok(SuccessResponse<object>.SuccessResult(
                result,
                SuccessCodes.Success,
                "Retrieved successfully"));
        }
    }
}
