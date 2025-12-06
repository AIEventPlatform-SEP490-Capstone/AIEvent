using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.Friend
{
    public class FriendProfileResponse
    {
        public required string FullName { get; set; }
        public string? Address { get; set; }
        public string? District { get; set; }
        public string? Email { get; set; }
        public string? AvatarImgUrl { get; set; }
        public string? UserInterestsJson { get; set; }
        public string? Occupation { get; set; }
        public string? JobTitle { get; set; }
        public string? CareerGoal { get; set; }
        public string? PersonalWebsite { get; set; }
        public string? Introduction { get; set; }
        public string? ProfessionalSkillsJson { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? GitHubUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? InstagramUrl { get; set; }
        public string? FacebookUrl { get; set; }
        public DateTimeOffset? JoinTime { get; set; }
        public List<CommonEvent>? ListCommonEvent {  get; set; }
        public FriendshipStatus? FriendshipStatus { get; set;}
    }
}
