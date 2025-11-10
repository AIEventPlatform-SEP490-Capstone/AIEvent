using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.DTOs.User
{
    public class AccountResponse
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string PhoneNumber { get; set; }
        public string? Image { get; set; }
    }
}
