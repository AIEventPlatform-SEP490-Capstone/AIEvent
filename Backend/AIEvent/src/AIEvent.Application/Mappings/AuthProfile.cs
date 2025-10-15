using AIEvent.Application.DTOs.Auth;
using AIEvent.Domain.Entities;
using AutoMapper;
using Newtonsoft.Json;

namespace AIEvent.Application.Mappings
{
    public class AuthProfile : Profile
    {
        public AuthProfile() 
        {
            CreateMap<RefreshToken, AuthResponse>()
                    .ForMember(dest => dest.RefreshToken, opt => opt.MapFrom(src => src.Token));

            CreateMap<RegisterRequest, User>()
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
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
