using AIEvent.Application.DTOs.Auth;
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
            //CreateMap<AppUser, UserResponse>();

            //CreateMap<RegisterRequest, AppUser>()
            //    .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email))
            //    .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
            //    .ForMember(dest => dest.EmailConfirmed, opt => opt.MapFrom(src => false))
            //    .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => src.FullName))
            //    .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))
            //    .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
            //    .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
            //    .ForMember(dest => dest.InterestedCitiesJson,
            //        opt => opt.MapFrom(src =>
            //            src.InterestedCities != null
            //                ? JsonConvert.SerializeObject(src.InterestedCities)
            //                : null))
            //    .ForMember(dest => dest.UserEventFields,
            //        opt => opt.MapFrom(src =>
            //            src.UserEventFields != null
            //                ? src.UserEventFields.Select(f => new UserEventField
            //                {
            //                    EventFieldId = Guid.Parse(f.EventFieldId)
            //                }).ToList()
            //                : new List<UserEventField>()))
            //    .ForMember(dest => dest.ParticipationFrequency,
            //        opt => opt.MapFrom(src => src.ParticipationFrequency))
            //    .ForMember(dest => dest.BudgetOption,
            //        opt => opt.MapFrom(src => src.BudgetOption))
            //    .ForMember(dest => dest.IsEmailNotificationEnabled,
            //        opt => opt.MapFrom(src => src.IsEmailNotificationEnabled))
            //    .ForMember(dest => dest.IsPushNotificationEnabled,
            //        opt => opt.MapFrom(src => src.IsPushNotificationEnabled))
            //    .ForMember(dest => dest.IsSmsNotificationEnabled,
            //        opt => opt.MapFrom(src => src.IsSmsNotificationEnabled));

            //CreateMap<UpdateUserRequest, AppUser>();
        }
    }
}
