using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.DTOs.User;
using AIEvent.Domain.Entities;
using AIEvent.Domain.Identity;
using AutoMapper;

namespace AIEvent.Application.Mappings
{
    public class OrganizersProfile : Profile
    {
        public OrganizersProfile() 
        {
            CreateMap<RegisterOrganizerRequest, OrganizerProfile>();


            CreateMap<OrganizerProfile, OrganizerResponse>()
                .ForMember(dest => dest.OrganizerId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.UserInfo, opt => opt.MapFrom(src => src.User));

            CreateMap<AppUser, UserOrganizerResponse>();
        }
    }
}
