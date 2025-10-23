using AIEvent.Application.DTOs.Wallet;
using AIEvent.Domain.Entities;
using AutoMapper;

namespace AIEvent.Application.Mappings
{
    public class WalletProfile: Profile
    {
        public WalletProfile() {
            CreateMap<Wallet, WalletResponse>()
                .ForMember(dest => dest.WalletId, opt => opt.MapFrom(src => src.Id));
        }
    }
}
