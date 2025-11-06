using AIEvent.API.Extensions;
using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.Friend;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Bases;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AIEvent.API.Controllers
{
    [ApiController]
    [Route("api/friend")]
    public class FriendController : ControllerBase
    {
        private readonly IFriendService _friendService;

        public FriendController(IFriendService friendService)
        {
            _friendService = friendService;
        }

        [HttpPost("{id}")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> AddFriend(string id)
        {
            var userId = User.GetRequiredUserId();
            var result = await _friendService.AddFriendRequestAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Created,
                "Add Friend successfully"));
        }

        [HttpPatch("{id}")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> RespondFriendRequest(string id, bool isAccepted)
        {
            var userId = User.GetRequiredUserId();
            var result = await _friendService.RespondFriendRequestAsync(id, userId, isAccepted);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Response successfully"));
        }

        [HttpGet("request")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<ListAddFriendRequest>>>> GetListInvitations(int pageNumber = 1, int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _friendService.GetFriendInvitationsAsync(userId, pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<ListAddFriendRequest>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "FriendInvitations retrieved successfully"));
        }

        [HttpGet]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<ListFriendResponse>>>> GetListFriend(int pageNumber = 1, int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _friendService.GetListFriendAsync(userId, pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<ListFriendResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Friends retrieved successfully"));
        }

        [HttpGet("search")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<BasePaginated<ListFriendResponse>>>> SearchFriend(string keyword, int pageNumber = 1, int pageSize = 10)
        {
            var userId = User.GetRequiredUserId();
            var result = await _friendService.SearchFriendsAsync(userId,  keyword, pageNumber, pageSize);
            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<BasePaginated<ListFriendResponse>>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Friends retrieved successfully"));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> DeleteFriend(string id)
        {
            var userId = User.GetRequiredUserId();
            var result = await _friendService.DeleteFriendAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }

            return Ok(SuccessResponse<object>.SuccessResult(
                new { },
                SuccessCodes.Success,
                "Delete Friend successfully"));
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "User")]
        public async Task<ActionResult<SuccessResponse<object>>> GetFriendProfile(string id)
        {
            var userId = User.GetRequiredUserId();
            var result = await _friendService.GetFriendProfileAsync(userId, id);

            if (!result.IsSuccess)
            {
                return BadRequest(result.Error!);
            }
            
            return Ok(SuccessResponse<object>.SuccessResult(
                result.Value!,
                SuccessCodes.Success,
                "Get FriendProfile successfully"));
        }
    }
}
