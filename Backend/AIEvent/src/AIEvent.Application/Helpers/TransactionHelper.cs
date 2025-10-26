using AIEvent.Infrastructure.Repositories.Interfaces;
namespace AIEvent.Application.Helpers
{
    public interface ITransactionHelper
    {
        Task<Result<T>> ExecuteInTransactionAsync<T>(Func<Task<Result<T>>> action);
        Task<Result> ExecuteInTransactionAsync(Func<Task<Result>> action);
    }
    public class TransactionHelper : ITransactionHelper
    {
        private readonly IUnitOfWork _unitOfWork;

        public TransactionHelper(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Result<T>> ExecuteInTransactionAsync<T>(Func<Task<Result<T>>> action)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var result = await action();

                if (result.IsSuccess)
                {
                    await _unitOfWork.SaveChangesAsync();
                    await _unitOfWork.CommitTransactionAsync();
                }
                else
                {
                    await _unitOfWork.RollbackTransactionAsync();
                }

                return result;
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }

        public async Task<Result> ExecuteInTransactionAsync(Func<Task<Result>> action)
        {
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var result = await action();

                if (result.IsSuccess)
                {
                    await _unitOfWork.SaveChangesAsync();
                    await _unitOfWork.CommitTransactionAsync();
                }
                else
                {
                    await _unitOfWork.RollbackTransactionAsync();
                }

                return result;
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                throw;
            }
        }
    }
}
