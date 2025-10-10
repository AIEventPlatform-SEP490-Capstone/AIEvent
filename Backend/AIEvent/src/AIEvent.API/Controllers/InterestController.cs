using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Interest;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/interest")]
    [ApiController]
    public class InterestController : ControllerBase
    {
        private readonly IInterestsService _interestsService;

        public InterestController(IInterestsService interestsService)
        {
            _interestsService = interestsService;
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult<SuccessResponse<object>>> Create([FromBody] InterestRequest request)
        {
            var result = await _interestsService.CreateInterestAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Create Interest successfully"));
        }

        [HttpGet]
        [AllowAnonymous]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<BasePaginated<InterestResponse>>>> Get(int pageNumber = 1, int pageSize = 5)
        {
            var result = await _interestsService.GetInterestAsync(pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<InterestResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Interest retrieved successfully"));
        }


        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin, Organizer")]
        public async Task<ActionResult<SuccessResponse<object>>> Delete(string id)
        {
            var result = await _interestsService.DeleteInterestAsync(id);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { id },
                SuccessCodes.Success,
                "Delete Interest successfully"));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult<SuccessResponse<object>>> Update(string id, InterestRequest request)
        {
            var result = await _interestsService.UpdateInterestAsync(id, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new {},
                SuccessCodes.Success,
                "Update Interest successfully"));
        }
    }
}
