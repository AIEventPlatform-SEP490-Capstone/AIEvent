namespace AIEvent.Application.DTOs.Organizer
{
    public class OrganizerEventResponse
    {
        public Guid OrganizerId { get; set; }
        public string? ImgCompany { get; set; }
        public string? CompanyName { get; set; }
        public string? CompanyDescription { get; set; }
    }
}
