using AIEvent.Application.DTOs.Common;

namespace AIEvent.Application.Helpers
{
    public class Result<T>
    {
        public bool IsSuccess { get; private set; }
        public bool IsFailure
        {
            get { return !IsSuccess; }
        }
        public T? Value { get; private set; }
        public ErrorResponse? Error { get; private set; }

        private Result(bool isSuccess, T? value, ErrorResponse? error)
        {
            IsSuccess = isSuccess;
            Value = value;
            Error = error;
        }

        public static Result<T> Success(T value)
        {
            return new Result<T>(true, value, null);
        }

        public static Result<T> Failure(ErrorResponse error)
        {
            return new Result<T>(false, default, error);
        }

        public static implicit operator Result<T>(T value)
        {
            return Success(value);
        }

        public static implicit operator Result<T>(ErrorResponse error)
        {
            return Failure(error);
        }
    }

    public class Result
    {
        public bool IsSuccess { get; private set; }
        
        public ErrorResponse? Error { get; private set; }

        public bool IsFailure
        {
            get { return !IsSuccess; }
        }

        private Result(bool isSuccess, ErrorResponse? error)
        {
            IsSuccess = isSuccess;
            Error = error;
        }

        public static Result Success()
        {
            return new Result(true, null);
        }

        public static Result Failure(ErrorResponse error)
        {
            return new Result(false, error);
        }

        public static implicit operator Result(ErrorResponse error)
        {
            return Failure(error);
        }
    }
}
