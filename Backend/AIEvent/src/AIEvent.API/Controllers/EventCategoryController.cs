using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.EventCategory;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/eventCategory")]
    [ApiController]
    public class EventCategoryController : ControllerBase
    {
        private readonly IEventCategoryService _eventCategoryService;

        public EventCategoryController(IEventCategoryService eventCategoryService)
        {
            _eventCategoryService = eventCategoryService;
        }


        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateEventCategory([FromBody] CreateCategoryRequest request)
        {
            var result = await _eventCategoryService.CreateEventCategoryAsync(request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Create EventCategory successfully"));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteEventCategory(string id)
        {
            var result = await _eventCategoryService.DeleteEventCategoryAsync(id);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { id },
                SuccessCodes.Success,
                "Delete EventCategory successfully"));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<EventCategoryResponse>>> GetEventCategoryById(string id)
        {
            var result = await _eventCategoryService.GetEventCategoryByIdAsync(id);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<EventCategoryResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "EventCategory retrieved successfully"));
        }


        [HttpGet]
        [AllowAnonymous]
        [Authorize]
        public async Task<ActionResult<SuccessResponse<BasePaginated<EventCategoryResponse>>>> GetEventCategory(int pageNumber = 1, int pageSize = 5)
        {
            var result = await _eventCategoryService.GetListCategoryAsync(pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<EventCategoryResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "EventCategory retrieved successfully"));
        }


        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<SuccessResponse<EventCategoryResponse>>> UpdateEventCategory(string id, CreateCategoryRequest request)
        {
            var result = await _eventCategoryService.UpdateEventCategoryAsync(id, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<EventCategoryResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Update Tag successfully"));
        }
    }
}
