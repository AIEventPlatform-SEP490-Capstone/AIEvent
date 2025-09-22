using AutoMapper;
using AIEvent.Application.DTOs.Auth;
using AIEvent.Application.DTOs.Role;
using AIEvent.Application.DTOs.User;
using AIEvent.Domain.Identity;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Domain.Entities;
using Newtonsoft.Json;

namespace AIEvent.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateUserMappings();
            CreateRoleMappings();
            CreateAuthMappings();
            CreateOrganizerMappings();
        }

        private void CreateUserMappings()
        {
            CreateMap<AppUser, UserResponse>();

            CreateMap<RegisterRequest, AppUser>()
                .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
                .ForMember(dest => dest.EmailConfirmed, opt => opt.MapFrom(src => false))
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
                .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.InterestedCitiesJson,
                    opt => opt.MapFrom(src =>
                        src.InterestedCities != null
                            ? JsonConvert.SerializeObject(src.InterestedCities)
                            : null))
                .ForMember(dest => dest.UserEventFields,
                    opt => opt.MapFrom(src =>
                        src.UserEventFields != null
                            ? src.UserEventFields.Select(f => new UserEventField
                            {
                                EventFieldId = Guid.Parse(f.EventFieldId)
                            }).ToList()
                            : new List<UserEventField>()))
                .ForMember(dest => dest.ParticipationFrequency,
                    opt => opt.MapFrom(src => src.ParticipationFrequency))
                .ForMember(dest => dest.BudgetOption,
                    opt => opt.MapFrom(src => src.BudgetOption))
                .ForMember(dest => dest.IsEmailNotificationEnabled,
                    opt => opt.MapFrom(src => src.IsEmailNotificationEnabled))
                .ForMember(dest => dest.IsPushNotificationEnabled,
                    opt => opt.MapFrom(src => src.IsPushNotificationEnabled))
                .ForMember(dest => dest.IsSmsNotificationEnabled,
                    opt => opt.MapFrom(src => src.IsSmsNotificationEnabled));

            CreateMap<UpdateUserRequest, AppUser>();
        }

        private void CreateRoleMappings()
        {
            CreateMap<AppRole, RoleResponse>();

            CreateMap<CreateRoleRequest, AppRole>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<UpdateRoleRequest, AppRole>()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
        }

        private void CreateAuthMappings()
        {
            CreateMap<RefreshToken, AuthResponse>()
                .ForMember(dest => dest.RefreshToken, opt => opt.MapFrom(src => src.Token));
        }

        private void CreateOrganizerMappings()
        {
            CreateMap<RegisterOrganizerRequest, OrganizerProfile>()
                .ForMember(dest => dest.OrganizerFieldAssignments,
                    opt => opt.MapFrom(src =>
                        src.OrganizerFields != null
                            ? src.OrganizerFields.Select(f => new OrganizerFieldAssignment{
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
