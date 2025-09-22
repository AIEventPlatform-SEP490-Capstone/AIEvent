using System.ComponentModel.DataAnnotations;

namespace AIEvent.Domain.Enums
{
    public enum OrganizationType
    {
        [Display(Name = "Công ty tư nhân")]
        PrivateCompany = 1,

        [Display(Name = "Doanh nghiệp nhà nước")]
        StateEnterprise = 2,

        [Display(Name = "Tổ chức phi lợi nhuận")]
        NonProfit = 3,

        [Display(Name = "Cá nhân kinh doanh")]
        IndividualBusiness = 4,

        [Display(Name = "Startup")]
        Startup = 5,

        [Display(Name = "Cộng đồng/Câu lạc bộ")]
        CommunityClub = 6,

        [Display(Name = "Trường học/Đại học")]
        SchoolUniversity = 7,

        [Display(Name = "Khác")]
        Other = 8
    }
}
