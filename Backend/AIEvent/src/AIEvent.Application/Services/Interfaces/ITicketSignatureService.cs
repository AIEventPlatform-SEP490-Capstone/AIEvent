namespace AIEvent.Application.Services.Interfaces
{
    public interface ITicketSignatureService
    {
        string CreateSignature(string ticketCode);
        bool ValidateSignature(string ticketCode, string signature);
    }
}
