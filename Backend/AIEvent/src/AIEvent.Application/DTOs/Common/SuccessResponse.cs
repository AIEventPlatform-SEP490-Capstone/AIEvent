using AIEvent.Application.Constants;
using System.Text.Json.Serialization;

namespace AIEvent.Application.DTOs.Common
{
    public class SuccessResponse<T> : BaseResponse
    {
        [JsonPropertyOrder(3)]
        public T? Data { get; set; }

        public static SuccessResponse<T> SuccessResult(T data, string statusCode = SuccessCodes.Success, string message = SuccessMessages.Success)
        {
            return new SuccessResponse<T>
            {
                StatusCode = statusCode,
                Message = message,
                Data = data
            };
        }
    }
}
