using AIEvent.Application.Constants;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.Helpers;
using AIEvent.Application.Services.Interfaces;
using AIEvent.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AIEvent.Application.Services.Implements
{
    public class EvenFieldService : IEvenFieldService
    {
        private readonly IUnitOfWork _unitOfWork;
        public EvenFieldService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Result<IEnumerable<EventFieldResponse>>> GetAllEventField()
        {
            var result = await _unitOfWork.EventFieldRepository
                                            .Query()
                                            .Select(ef => 
                                            new EventFieldResponse { 
                                                EventFieldId = ef.Id.ToString(), 
                                                EventFieldName = ef.NameEventField})
                                            .ToListAsync();

            if (result == null)
                return ErrorResponse.FailureResult("Event Field code already exists.", ErrorCodes.InvalidInput);

            return Result<IEnumerable<EventFieldResponse>>.Success(result); 
        }
    }
}
