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

        public static Result<T> ValidateModelWithResult<T>(T request)
        {
            var validationResult = ValidateModel(request);
            if (!validationResult.IsSuccess)
                return Result<T>.Failure(validationResult.Error!);

            return Result<T>.Success(request);
        }

        public static Result<List<T>> ValidateModelListWithResult<T>(IEnumerable<T> items)
        {
            var list = items.ToList();
            var result = ValidateModelList(list);
            if (!result.IsSuccess)
                return Result<List<T>>.Failure(result.Error!);

            return Result<List<T>>.Success(list);
        }
    }
}
