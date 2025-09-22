using AIEvent.Application.Services.Interfaces;
using System.ComponentModel.DataAnnotations;
using System.Reflection;

namespace AIEvent.Application.Services.Implements
{
    public class EnumService : IEnumService
    {
        public IEnumerable<object> GetEnumValues<T>() where T : Enum
        {
            return Enum.GetValues(typeof(T))
                       .Cast<T>()
                       .Select(e => new
                       {
                           Value = Convert.ToInt32(e),
                           Name = e.ToString(),
                           Description = e.GetType().GetMember(e.ToString())
                            .First()
                            .GetCustomAttribute<DisplayAttribute>()?
                            .Name ?? e.ToString()
                       });
        }
    }

}
