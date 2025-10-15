namespace AIEvent.Application.Services.Interfaces
{
    public interface ITicketTokenService
    {
        string CreateTicketToken(Guid ticketId);
    }
}
