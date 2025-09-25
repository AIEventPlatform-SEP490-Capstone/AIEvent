using AIEvent.Application.DTOs.Role;
using AIEvent.Domain.Identity;
using AutoMapper;

namespace AIEvent.Application.Mappings
{
    public class RoleProfile : Profile
    {
        public RoleProfile() 
        {
            CreateMap<AppRole, RoleResponse>();

            CreateMap<CreateRoleRequest, AppRole>()
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));

            CreateMap<UpdateRoleRequest, AppRole>()
                .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => DateTime.UtcNow));
        }
    }
}
