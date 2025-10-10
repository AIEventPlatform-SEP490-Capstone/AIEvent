using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Common;
using AIEvent.Application.DTOs.User;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Identity;
using AutoMapper;
using Newtonsoft.Json;

namespace AIEvent.Application.Mappings
{
    public class UserProfile : Profile
    {
        public UserProfile() 
        {
            CreateMap<AppUser, UserResponse>();

            CreateMap<AppUser, UserDetailResponse>()
                .ForMember(dest => dest.InterestedCities,
                    opt => opt.MapFrom(src =>
                        !string.IsNullOrEmpty(src.InterestedCitiesJson)
                            ? JsonConvert.DeserializeObject<List<InterestedCities>>(src.InterestedCitiesJson)
                            : new List<InterestedCities>()))
                .ForMember(dest => dest.UserInterests,
                    opt => opt.MapFrom(src =>
                        src.UserInterests != null
                            ? src.UserInterests.Select(f => new UserInterestResponse
                            {
                                InterestId = f.InterestId,
                                InterestName = f.Interest.Name
                            }).ToList()
                            : new List<UserInterestResponse>()));

            CreateMap<RegisterRequest, AppUser>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.EmailConfirmed, opt => opt.MapFrom(src => false))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.InterestedCitiesJson,
                    opt => opt.MapFrom(src =>
                        src.InterestedCities != null
                            ? JsonConvert.SerializeObject(src.InterestedCities)
                            : null))
                .ForMember(dest => dest.UserInterests,
                    opt => opt.MapFrom(src =>
                        src.UserInterests != null
                            ? src.UserInterests.Select(f => new UserInterest
                            {
                                InterestId = f.UserInterestId
                            }).ToList()
                            : new List<UserInterest>()));

            CreateMap<UpdateUserRequest, AppUser>()
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.InterestedCitiesJson,
                    opt => opt.MapFrom(src =>
                        src.InterestedCities != null
                            ? JsonConvert.SerializeObject(src.InterestedCities)
                            : null))
                .ForMember(dest => dest.UserInterests,
                    opt => opt.MapFrom(src =>
                        src.UserInterests != null
                            ? src.UserInterests.Select(f => new UserInterest
                            {
                                InterestId = f.UserInterestId
                            }).ToList()
                            : new List<UserInterest>()));
        }
    }
}
