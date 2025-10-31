using AIEvent.Application.DTOs.PaymentInformation;
using AIEvent.Domain.Entities;
using AutoMapper;

namespace AIEvent.Application.Mappings
{
    public class PaymentProfile : Profile
    {
        public PaymentProfile()
        {
            CreateMap<CreatePaymentInformationRequest, PaymentInformation>();
            CreateMap<UpdatePaymentInformationRequest, PaymentInformation>()
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            CreateMap<PaymentInformation, PaymentInformationResponse>()
                .ForMember(dest => dest.PaymentInformationId, opt => opt.MapFrom(src => src.Id));
        }
    }
}
