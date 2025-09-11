namespace AIEvent.Application.DTO.Common
{
    public class BaseResponse
    {
        public bool Success { get; set; }
        public string StatusCode { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
