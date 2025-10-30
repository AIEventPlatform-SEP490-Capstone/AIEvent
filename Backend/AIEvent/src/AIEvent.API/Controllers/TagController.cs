using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [Route("api/tag")]
    [ApiController]
    public class TagController : ControllerBase
    {
        private readonly ITagService _tagService;

        public TagController(ITagService tagService)
        {
            _tagService = tagService;       
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Organizer")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateTag([FromBody] CreateTagRequest request)
        {
            var role = User.GetRoleFromClaim();
            var result = await _tagService.CreateTagAsync(request, role);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Create Tag successfully"));
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<BasePaginated<TagResponse>>>> GetTag(int pageNumber = 1, int pageSize = 5)
        {
            var result = await _tagService.GetListTagAsync(pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<TagResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Tag retrieved successfully"));
        }

        [HttpGet("user")]
        [Authorize(Roles = "Admin,Organizer,Manager")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<TagResponse>>>> GetListTagByUserId(int pageNumber = 1, int pageSize = 5)
        {
            var userId = User.GetRequiredUserId();
            var result = await _tagService.GetListTagByUserIdAsync(pageNumber, pageSize, userId);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<TagResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Tag retrieved successfully"));
        }


        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin, Organizer")]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteTag(string id)
        {
            var result = await _tagService.DeleteTagAsync(id);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new {id},
                SuccessCodes.Success,
                "Delete Tag successfully"));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<SuccessResponse<TagResponse>>> GetTagById(string id)
        {
            var result = await _tagService.GetTagByIdAsync(id);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<TagResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Tag retrieved successfully"));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin, Manager, Organizer")]
        public async Task<ActionResult<SuccessResponse<TagResponse>>> UpdateTag(string id, UpdateTagRequest request)
        {
            var result = await _tagService.UpdateTagAsync(id, request);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<TagResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Update Tag successfully"));
        }
    }
}
