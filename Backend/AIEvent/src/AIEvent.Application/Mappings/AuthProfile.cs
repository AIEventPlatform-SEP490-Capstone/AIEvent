using AIEvent.Application.DTOs.Auth;
using AIEvent.Domain.Identity;
using AutoMapper;

namespace AIEvent.Application.Mappings
{
    public class AuthProfile : Profile
    {
        public AuthProfile() 
        {
            CreateMap<RefreshToken, AuthResponse>()
                    .ForMember(dest => dest.RefreshToken, opt => opt.MapFrom(src => src.Token));
        }
    }
}
