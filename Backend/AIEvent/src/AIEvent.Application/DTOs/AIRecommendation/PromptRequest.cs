using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.AIRecommendation
{
    public class PromptRequest
    {
        [Required(ErrorMessage = "Need context")]
        public string UserPrompt { get; set; } = default!;
    }
}
