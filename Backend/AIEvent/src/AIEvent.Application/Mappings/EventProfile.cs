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
            CreateMap<CreateEventRequest, Event>()
                    .ForMember(dest => dest.RemainingTickets, opt => opt.MapFrom(src => src.TotalTickets))
                    .ForMember(dest => dest.ImgListEvent, opt => opt.MapFrom(src =>
                        src.ImgListEvent != null ? string.Join(", ", src.ImgListEvent) : null))
                    .ForMember(dest => dest.ImgListEvidences, opt => opt.MapFrom(src =>
                        src.ImgListEvidences != null ? string.Join(", ", src.ImgListEvidences) : null))
                    .ForMember(dest => dest.EventTags,
                        opt => opt.MapFrom(src =>
                            src.Tags != null
                                ? src.Tags.Select(f => new EventTag
                                {
                                    TagId = f.TagId
                                }).ToList()
                                : new List<EventTag>()))
                    .ForMember(dest => dest.TicketTypes, opt => opt.MapFrom(src => src.TicketTypes));

            CreateMap<UpdateEventRequest, Event>()
                    .ForMember(dest => dest.EventTags, opt => opt.Ignore())
                    .ForMember(dest => dest.TicketTypes, opt => opt.Ignore())
                    .ForMember(dest => dest.ImgListEvent, opt => opt.Ignore())
                    .ForMember(dest => dest.SoldQuantity, opt => opt.MapFrom(src => 0))
                    .ForMember(dest => dest.RemainingTickets, opt => opt.MapFrom(src => src.TotalTickets))
                    .ForMember(dest => dest.Publish, opt => opt.Ignore())
                    .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<TicketTypeRequest, TicketType>()
                    .ForMember(dest => dest.SoldQuantity, opt => opt.MapFrom(src => 0))
                    .ForMember(dest => dest.RemainingQuantity, opt => opt.MapFrom(src => src.TicketQuantity))
                    .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<Event, EventDetailResponse>()
                .ForMember(dest => dest.EventId, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.OrganizerEvent, opt => opt.MapFrom(src => src.OrganizerProfile))
                .ForMember(dest => dest.ImgListEvent,
                    opt => opt.MapFrom(src =>
                        !string.IsNullOrEmpty(src.ImgListEvent)
                            ? src.ImgListEvent.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                            : new List<string>()))
                .ForMember(dest => dest.ImgListEvidences,
                    opt => opt.MapFrom(src =>
                        !string.IsNullOrEmpty(src.ImgListEvidences)
                            ? src.ImgListEvidences.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                            : new List<string>()))
                .ForMember(dest => dest.TicketDetails, opt => opt.MapFrom(src => src.TicketTypes));

            CreateMap<EventTag, TagResponse>()
                .ForMember(dest => dest.TagId, opt => opt.MapFrom(src => src.TagId.ToString()))
                .ForMember(dest => dest.TagName, opt => opt.MapFrom(src => src.Tag.NameTag));

            CreateMap<EventCategory, EventCategoryResponse>()
                .ForMember(dest => dest.EventCategoryId, opt => opt.MapFrom(src => src.Id.ToString()))
                .ForMember(dest => dest.EventCategoryName, opt => opt.MapFrom(src => src.CategoryName));

            CreateMap<OrganizerProfile, OrganizerEventResponse>()
                .ForMember(dest => dest.OrganizerId, opt => opt.MapFrom(src => src.Id));

            CreateMap<TicketType, TicketTypeResponse>()
                .ForMember(dest => dest.TicketDetailId, opt => opt.MapFrom(src => src.Id));

            CreateMap<CompleteEventRequest, EndEventRequest>()
                .ForMember(dest => dest.EvidenceImages, opt => opt.MapFrom(src =>
                        src.EvidenceImages != null ? string.Join(", ", src.EvidenceImages) : null));

            CreateMap<EndEventRequest, EndEventReview>()
                 .ForMember(dest => dest.EndEventRequestId, opt => opt.MapFrom(src => src.Id))
                 .ForMember(dest => dest.EvidenceImages,
                    opt => opt.MapFrom(src =>
                        !string.IsNullOrEmpty(src.EvidenceImages)
                            ? src.EvidenceImages.Split(", ", StringSplitOptions.RemoveEmptyEntries).ToList()
                            : new List<string>()))
                 .ForMember(dest => dest.OrganizerName, opt => opt.MapFrom(src => src.OrganizerProfile.ContactName))
                 .ForMember(dest => dest.ContactEmail, opt => opt.MapFrom(src => src.OrganizerProfile.ContactEmail))
                 .ForMember(dest => dest.ContactPhone, opt => opt.MapFrom(src => src.OrganizerProfile.ContactPhone))
                 .ForMember(dest => dest.BankName, opt => opt.MapFrom(src => src.PaymentInformation.BankName))
                 .ForMember(dest => dest.AccountHolderName, opt => opt.MapFrom(src => src.PaymentInformation.AccountHolderName))
                 .ForMember(dest => dest.AccountNumber, opt => opt.MapFrom(src => src.PaymentInformation.AccountNumber))
                 .ForMember(dest => dest.EventId, opt => opt.MapFrom(src => src.Event.Id))
                 .ForMember(dest => dest.EventTitle, opt => opt.MapFrom(src => src.Event.Title))
                 .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.Event.StartTime))
                 .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.Event.EndTime))
                 .ForMember(dest => dest.TotalAmount, opt => opt.MapFrom(src => src.Event.TotalAmount))
                 .ForMember(dest => dest.PlatformFee, opt => opt.MapFrom(src => src.Event.PlatformFee))
                 .ForMember(dest => dest.PayoutAmount, opt => opt.MapFrom(src => src.Event.PayoutAmount));

            

        }
    }
}
