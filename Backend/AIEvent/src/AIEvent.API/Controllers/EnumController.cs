using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/enum")]
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
                BudgetOption = _enumService.GetEnumValues<BudgetOption>(),
                //EventExperienceLevel = _enumService.GetEnumValues<EventExperienceLevel>(),
                //EventFrequency = _enumService.GetEnumValues<EventFrequency>(),
                //EventSize = _enumService.GetEnumValues<EventSize>(),
                //OrganizationType = _enumService.GetEnumValues<OrganizationType>(),
                //OrganizerType = _enumService.GetEnumValues<OrganizerType>(),
                //ParticipationFrequency = _enumService.GetEnumValues<ParticipationFrequency>(),
                //TicketType = _enumService.GetEnumValues<TicketType>(),
            };

            return Ok(SuccessResponse<object>.SuccessResult(
                result,
                SuccessCodes.Success,
                "Retrieved successfully"));
        }
    }
}
