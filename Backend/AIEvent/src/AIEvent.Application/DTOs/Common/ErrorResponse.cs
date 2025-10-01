using AIEvent.Application.Constants;
using System.Text.Json.Serialization;

namespace AIEvent.Application.DTOs.Common
{
    public class ErrorResponse : BaseResponse
    {
        [JsonPropertyOrder(3)]
        public object? Errors { get; set; } 

        public static ErrorResponse FailureResult(
            string message,
            string statusCode = ErrorCodes.InternalServerError,
            object? error = null)
        {
            return new ErrorResponse
            {
                StatusCode = statusCode,
                Message = message,
                Errors = error
            };
        }
    }
}
