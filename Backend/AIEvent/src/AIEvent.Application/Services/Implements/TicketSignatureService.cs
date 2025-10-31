using AIEvent.Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace AIEvent.Application.Services.Implements
{
    public class TicketSignatureService : ITicketSignatureService
    {
        private readonly string _secretKey;

        public TicketSignatureService(IConfiguration config)
        {
            _secretKey = config["Ticket:SecretKey"]!;
        }

        public string CreateSignature(string ticketCode)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(ticketCode));
            return Convert.ToBase64String(hash);
        }

        public bool ValidateSignature(string ticketCode, string signature)
        {
            var expected = CreateSignature(ticketCode);
            return expected == signature;
        }
    }
}
