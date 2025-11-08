using AIEvent.Domain.Enums;

namespace AIEvent.Application.DTOs.AIRecommendation
{
    public class UserNeedRecommendation
    {
        public string? District { get; set; }
        public string? Latitude { get; set; }
        public string? Longitude { get; set; }
        public BudgetOption? BudgetOption { get; set; }
        public string? InterestedDistricts { get; set; }
        public string? UserInterests { get; set; }
        public string? FavoriteEventTypes { get; set; }
        public string? Occupation { get; set; }
        public string? CareerGoal { get; set; }
        public string? JobTitle { get; set; }
        public string? ProfessionalSkills { get; set; }
    }
}
