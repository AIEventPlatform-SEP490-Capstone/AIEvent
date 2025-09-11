using AIEvent.Application.Constants;

namespace AIEvent.Application.DTO.Common
{
    public class ErrorResponse : BaseResponse
    {
        public object? Errors { get; set; } 

        public static ErrorResponse FailureResult(
            string message,
            string statusCode = ErrorCodes.InternalServerError,
            object? error = null)
        {
            return new ErrorResponse
            {
                Success = false,
                StatusCode = statusCode,
                Message = message,
                Errors = error
            };
        }
    }
}
