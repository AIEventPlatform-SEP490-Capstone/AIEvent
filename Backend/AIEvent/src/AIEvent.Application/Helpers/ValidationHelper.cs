using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using System.ComponentModel.DataAnnotations;

namespace AIEvent.Application.Helpers
{
    public static class ValidationHelper
    {
        public static Result ValidateModelList<T>(IEnumerable<T> items)
        {
            foreach (var item in items)
            {
                var result = ValidateModel(item);
                if (!result.IsSuccess)
                    return result;
            }
            return Result.Success();
        }


        public static Result ValidateModel<T>(T request)
        {
            if (request == null)
                return ErrorResponse.FailureResult("Invalid input", ErrorCodes.InvalidInput);

            var context = new ValidationContext(request);
            var results = new List<ValidationResult>();

            bool isValid = Validator.TryValidateObject(request, context, results, true);

            if (!isValid)
            {
                var errorMessages = string.Join("; ", results.Select(r => r.ErrorMessage));
                return ErrorResponse.FailureResult(errorMessages, ErrorCodes.InvalidInput);
            }

            return Result.Success();
        }
    }
}
