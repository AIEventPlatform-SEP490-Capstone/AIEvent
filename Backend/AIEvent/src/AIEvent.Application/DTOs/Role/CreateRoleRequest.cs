using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.Role
{
    public class CreateRoleRequest
    {
        [Required(ErrorMessage = "Role name is required")]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
