using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.DTOs.User;
using AIEvent.Domain.Entities;
using AutoMapper;

namespace AIEvent.Application.Mappings
{
    public class OrganizersProfile : Profile
    {
        public OrganizersProfile() 
        {
            CreateMap<RegisterOrganizerRequest, OrganizerProfile>();


            CreateMap<OrganizerProfile, OrganizerDetailResponse>()
                .ForMember(dest => dest.OrganizerId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.UserRegisterInfo, opt => opt.MapFrom(src => src.User));

            CreateMap<User, UserOrganizerResponse>();

            CreateMap<OrganizerProfile, OrganizerResponse>();
        }
    }
}
