using AIEvent.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace AIEvent.Application.DTOs.Organizer
{
    public class ListOrganizerNeedApprove
    {
        public required string Id { get; set; }
        public required OrganizationType OrganizationType { get; set; }
        public string? CompanyName { get; set; }
        public required string ContactEmail { get; set; }
        public required string ContactPhone { get; set; }
        public required string Address { get; set; }
        public string? ImgCompany { get; set; }
    }
}
