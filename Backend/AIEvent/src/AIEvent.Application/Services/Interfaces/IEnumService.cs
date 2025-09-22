namespace AIEvent.Application.Services.Interfaces
{
    public interface IEnumService
    {
        IEnumerable<object> GetEnumValues<T>() where T : Enum;
    }
}
