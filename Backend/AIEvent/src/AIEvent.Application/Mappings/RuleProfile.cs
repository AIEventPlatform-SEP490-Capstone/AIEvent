using AIEvent.Application.DTOs.RuleRefund;
using AIEvent.Application.DTOs.RuleRefundDetail;
using AIEvent.Domain.Entities;
using AutoMapper;

namespace AIEvent.Application.Mappings
{
    public class RuleProfile : Profile
    {
        public RuleProfile() {
            CreateMap<CreateRuleRefundRequest, RefundRule>()
                .ForMember(dest => dest.RefundRuleDetails, opt => opt.MapFrom(src => src.RuleRefundDetails));

            CreateMap<RuleRefundDetailRequest, RefundRuleDetail>();
        }
    }
}
