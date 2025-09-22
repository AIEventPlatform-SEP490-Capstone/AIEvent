using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.Helpers;

namespace AIEvent.Application.Services.Interfaces
{
    public interface IEvenFieldService
    {
        Task<Result<IEnumerable<EventFieldResponse>>> GetAllEventField();
    }
}
