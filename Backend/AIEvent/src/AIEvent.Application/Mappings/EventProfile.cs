using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Domain.Entities;
using AutoMapper;
using System.Text.Json;

namespace AIEvent.Application.Mappings
{
    public class EventProfile : Profile
    {
        public EventProfile() 
        {
            CreateMap<CreateEventRequest, Event>()
                    .ForMember(dest => dest.RemainingTickets, opt => opt.MapFrom(src => src.TotalTickets))
                    .ForMember(dest => dest.EventTags,
                        opt => opt.MapFrom(src =>
                            src.Tags != null
                                ? src.Tags.Select(f => new EventTag
                                {
                                    TagId = f.TagId
                                }).ToList()
                                : new List<EventTag>()))
                    .ForMember(dest => dest.TicketDetails, opt => opt.Ignore());

            CreateMap<UpdateEventRequest, Event>()
                    .ForMember(dest => dest.EventTags, opt => opt.Ignore())
                    .ForMember(dest => dest.TicketDetails, opt => opt.Ignore())
                    .ForMember(dest => dest.ImgListEvent, opt => opt.Ignore())
                    .ForMember(dest => dest.SoldQuantity, opt => opt.MapFrom(src => 0))
                    .ForMember(dest => dest.RemainingTickets, opt => opt.MapFrom(src => src.TotalTickets))
                    .ForMember(dest => dest.Publish, opt => opt.Ignore())
                    .ForMember(dest => dest.EventCategoryId, opt => opt.MapFrom((src, dest) => 
                        !string.IsNullOrWhiteSpace(src.EventCategoryId) 
                            ? Guid.Parse(src.EventCategoryId) 
                            : dest.EventCategoryId))
                    .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<TicketDetailRequest, TicketDetail>()
                    .ForMember(dest => dest.Id, opt => opt.Ignore())
                    .ForMember(dest => dest.EventId, opt => opt.Ignore())
                    .ForMember(dest => dest.RefundRuleId, opt => opt.MapFrom((src, dest) =>
                        !string.IsNullOrWhiteSpace(src.RuleRefundRequestId)
                            ? Guid.Parse(src.RuleRefundRequestId)
                            : dest.RefundRuleId))
                    .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<Event, EventDetailResponse>()
                .ForMember(dest => dest.EventId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.OrganizerEvent, opt => opt.MapFrom(src => src.OrganizerProfile))
                .ForMember(dest => dest.ImgListEvent, 
                    opt => opt.MapFrom(
                        src => string.IsNullOrEmpty(src.ImgListEvent)
                            ? new List<string>()
                            : JsonSerializer.Deserialize<List<string>>(src.ImgListEvent, new JsonSerializerOptions())
                    ))
                .ForMember(dest => dest.ImgEventEvidences,
                    opt => opt.MapFrom(
                        src => string.IsNullOrEmpty(src.Evidences)
                            ? new List<string>()
                            : JsonSerializer.Deserialize<List<string>>(src.Evidences, new JsonSerializerOptions())
                    ));

            CreateMap<EventTag, TagResponse>()
                .ForMember(dest => dest.TagId, opt => opt.MapFrom(src => src.TagId.ToString()))
                .ForMember(dest => dest.TagName, opt => opt.MapFrom(src => src.Tag.NameTag));

            CreateMap<EventCategory, EventCategoryResponse>()
                .ForMember(dest => dest.EventCategoryId, opt => opt.MapFrom(src => src.Id.ToString()))
                .ForMember(dest => dest.EventCategoryName, opt => opt.MapFrom(src => src.CategoryName));

            CreateMap<OrganizerProfile, OrganizerEventResponse>()
                .ForMember(dest => dest.OrganizerId, opt => opt.MapFrom(src => src.Id));

            CreateMap<TicketDetail, TicketDetailResponse>()
                .ForMember(dest => dest.TicketDetailId, opt => opt.MapFrom(src => src.Id));
        }
    }
}
