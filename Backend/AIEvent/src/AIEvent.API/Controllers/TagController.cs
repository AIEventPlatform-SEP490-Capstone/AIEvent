using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.Services.Implements;
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
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<object>>> CreateTag([FromBody] CreateTagRequest request)
        {
            var result = await _tagService.CreateTagAsync(request);
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
        [Authorize]
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


        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteTag(string id)
        {
            var result = await _tagService.DeleteTagAsync(id);
            if (result.IsFailure)
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
        [Authorize]
        public async Task<ActionResult<SuccessResponse<TagResponse>>> GetTagById(string id)
        {
            var result = await _tagService.GetTagByIdAsync(id);
            if (result.IsFailure)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<TagResponse>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Tag retrieved successfully"));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<SuccessResponse<TagResponse>>> UpdateTag(string id, UpdateTagRequest request)
        {
            var result = await _tagService.UpdateTagAsync(id, request);
            if (result.IsFailure)
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
