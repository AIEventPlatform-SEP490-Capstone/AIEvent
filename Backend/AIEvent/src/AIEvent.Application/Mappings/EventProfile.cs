using AIEvent.Application.DTOs.Event;
using AIEvent.Application.DTOs.EventField;
using AIEvent.Application.DTOs.Organizer;
using AIEvent.Application.DTOs.Tag;
using AIEvent.Application.DTOs.Ticket;
using AIEvent.Domain.Entities;
using AutoMapper;

namespace AIEvent.Application.Mappings
{
    public class EventProfile : Profile
    {
        public EventProfile() 
        {
            //CreateMap<CreateEventRequest, Event>()
            //        .ForMember(dest => dest.RemainingTickets, opt => opt.MapFrom(src => src.TotalTickets))
            //        .ForMember(dest => dest.EventFieldAssignments,
            //            opt => opt.MapFrom(src =>
            //                src.EventFields != null
            //                    ? src.EventFields.Select(f => new EventFieldAssignment
            //                    {
            //                        EventFieldId = Guid.Parse(f.EventFieldId)
            //                    }).ToList()
            //                    : new List<EventFieldAssignment>()))
            //        .ForMember(dest => dest.EventTags,
            //            opt => opt.MapFrom(src =>
            //                src.Tags != null
            //                    ? src.Tags.Select(f => new EventTag
            //                    {
            //                        TagId = f.TagId
            //                    }).ToList()
            //                    : new List<EventTag>()))
            //        .ForMember(dest => dest.TicketDetails,
            //            opt => opt.MapFrom(src =>
            //                src.TicketDetails != null
            //                    ? src.TicketDetails.Select(td => new TicketType
            //                    {
            //                        TicketName = td.TicketName,
            //                        TicketPrice = td.TicketPrice,
            //                        TicketQuantity = td.TicketQuantity,
            //                        TicketDescription = td.TicketDescription,
            //                        RemainingQuantity = td.TicketQuantity
            //                    }).ToList()
            //                    : new List<TicketType>())); ;


            //CreateMap<Event, EventResponse>()
            //    .ForMember(dest => dest.EventId, opt => opt.MapFrom(src => src.Id))
            //    .ForMember(dest => dest.OrganizerEvent, opt => opt.MapFrom(src => src.OrganizerProfile))

            //CreateMap<OrganizerProfile, OrganizerEventResponse>()
            //    .ForMember(dest => dest.OrganizerId, opt => opt.MapFrom(src => src.Id));

            //CreateMap<EventTag, TagResponse>()
            //    .ForMember(dest => dest.TagId, opt => opt.MapFrom(src => src.TagId.ToString()))
            //    .ForMember(dest => dest.TagName, opt => opt.MapFrom(src => src.Tag.NameTag));

            //CreateMap<TicketType, TicketDetailResponse>()
            //    .ForMember(dest => dest.TicketDetailId, opt => opt.MapFrom(src => src.Id));
        }
    }
}
