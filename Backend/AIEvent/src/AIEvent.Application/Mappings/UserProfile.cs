using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Domain.Entities;
using AutoMapper;
using Newtonsoft.Json;

namespace AIEvent.Application.Mappings
{
    public class UserProfile : Profile
    {
        public UserProfile() 
        {
            CreateMap<User, UserResponse>();

            CreateMap<User, UserDetailResponse>()
                .ForMember(dest => dest.InterestedCities,
                    opt => opt.MapFrom(src =>
                        !string.IsNullOrEmpty(src.InterestedCitiesJson)
                            ? JsonConvert.DeserializeObject<List<InterestedCities>>(src.InterestedCitiesJson)
                            : new List<InterestedCities>()))
                .ForMember(dest => dest.UserInterests,
                    opt => opt.MapFrom(src =>
                        !string.IsNullOrEmpty(src.UserInterestsJson)
                            ? JsonConvert.DeserializeObject<List<UserInterest>>(src.UserInterestsJson)
                            : new List<UserInterest>()));

            CreateMap<UpdateUserRequest, User>()
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.InterestedCitiesJson,
                    opt => opt.MapFrom(src =>
                        src.InterestedCities != null
                            ? JsonConvert.SerializeObject(src.InterestedCities)
                            : null))
                .ForMember(dest => dest.UserInterestsJson,
                    opt => opt.MapFrom(src =>
                        src.UserInterests != null
                            ? JsonConvert.SerializeObject(src.UserInterests)
                            : null));
        }
    }
}
