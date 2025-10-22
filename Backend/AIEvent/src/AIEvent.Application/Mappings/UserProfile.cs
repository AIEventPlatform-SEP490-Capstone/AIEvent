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
                            : new List<UserInterest>()))
                .ForMember(dest => dest.FavoriteEventTypes,
                    opt => opt.MapFrom(src =>
                        !string.IsNullOrEmpty(src.FavoriteEventTypesJson)
                            ? JsonConvert.DeserializeObject<List<FavoriteEventTypes>>(src.FavoriteEventTypesJson)
                            : new List<FavoriteEventTypes>()))
                .ForMember(dest => dest.ProfessionalSkills,
                    opt => opt.MapFrom(src =>
                        !string.IsNullOrEmpty(src.ProfessionalSkillsJson)
                            ? JsonConvert.DeserializeObject<List<UserSkills>>(src.ProfessionalSkillsJson)
                            : new List<UserSkills>()))
                .ForMember(dest => dest.Languages,
                    opt => opt.MapFrom(src =>
                        !string.IsNullOrEmpty(src.LanguagesJson)
                            ? JsonConvert.DeserializeObject<List<UserSkills>>(src.LanguagesJson)
                            : new List<UserSkills>()));

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
                            : null))
                .ForMember(dest => dest.ProfessionalSkillsJson,
                    opt => opt.MapFrom(src =>
                        src.ProfessionalSkills != null
                            ? JsonConvert.SerializeObject(src.ProfessionalSkills)
                            : null))
                .ForMember(dest => dest.FavoriteEventTypesJson,
                    opt => opt.MapFrom(src =>
                        src.FavoriteEventTypes != null
                            ? JsonConvert.SerializeObject(src.FavoriteEventTypes)
                            : null))
                .ForMember(dest => dest.LanguagesJson,
                    opt => opt.MapFrom(src =>
                        src.Languages != null
                            ? JsonConvert.SerializeObject(src.Languages)
                            : null));
        }
    }
}
