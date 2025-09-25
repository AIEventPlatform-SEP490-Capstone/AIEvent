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
            CreateMap<RegisterOrganizerRequest, OrganizerProfile>()
                    .ForMember(dest => dest.OrganizerFieldAssignments,
                        opt => opt.MapFrom(src =>
                            src.OrganizerFields != null
                                ? src.OrganizerFields.Select(f => new OrganizerFieldAssignment
                                {
                                    EventFieldId = Guid.Parse(f.OrganizerFieldId)
                                }).ToList()
                                : new List<OrganizerFieldAssignment>()));


            CreateMap<OrganizerProfile, OrganizerResponse>()
                .ForMember(dest => dest.OrganizerId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.UserInfo, opt => opt.MapFrom(src => src.User))
                .ForMember(dest => dest.OrganizerFields, opt => opt.MapFrom(src => src.OrganizerFieldAssignments));

            CreateMap<AppUser, UserOrganizerResponse>();

            CreateMap<OrganizerFieldAssignment, OrganizerFieldResponse>()
                .ForMember(dest => dest.EventFieldId, opt => opt.MapFrom(src => src.EventField.Id.ToString()))
                .ForMember(dest => dest.EventFieldName, opt => opt.MapFrom(src => src.EventField.NameEventField));
        }
    }
}
