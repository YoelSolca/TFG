namespace Backend.Application.Common
{
    public class Result<T>
    {
        public bool IsSuccess { get; private set; }
        public T? Value { get; private set; }
        public string? Error { get; private set; }
        public string? ErrorCode { get; private set; }

        private Result(bool isSuccess, T? value, string? error, string? errorCode)
        {
            IsSuccess = isSuccess;
            Value = value;
            Error = error;
            ErrorCode = errorCode;
        }
        public static Result<T> Success(T value) => new Result<T>(true, value, null, null);
        public static Result<T> Failure(string error, string? errorCode = null) => new Result<T>(false, default, error, errorCode);
    }

    public static class ErrorCodes
    {
        public const string NotFound = "NOT_FOUND";
        public const string ValidationError = "VALIDATION_ERROR";
        public const string Unauthorized = "UNAUTHORIZED";
        public const string Forbidden = "FORBIDDEN";
        public const string Duplicate = "DUPLICATE_IDCARD";
        public const string InvalidCredentials = "INVALID_CREDENTIALS";
        public const string EmailTaken = "EMAIL_TAKEN";
        public const string InvalidToken = "INVALID_TOKEN";
        public const string AccountPending = "ACCOUNT_PENDING";
        public const string AccountRejected = "ACCOUNT_REJECTED";
        public const string AccountSuspended = "ACCOUNT_SUSPENDED";
    }
}
