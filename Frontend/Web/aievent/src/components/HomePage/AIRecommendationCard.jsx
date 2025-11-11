import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import robotCycleIcon from "../../assets/robot-cycle.png";
import arrowIcon from "../../assets/arrow.png";
import { BudgetOptionDisplay } from "../../constants/userConstants";
import { useNavigate } from "react-router-dom";
import { PATH } from "../../routes/path";

export function AIRecommendationCard({ recommendedEvents = [], userProfile = null, onViewAll, isLoadingAIEvents = false }) {
  const navigate = useNavigate();
  
  // Extract user preferences from profile
  const favoriteEventTypes = userProfile?.favoriteEventTypes 
    ? userProfile.favoriteEventTypes.map(et => et.favoriteEventTypeName || et)
    : [];
  
  const interestedDistricts = userProfile?.interestedDistricts
    ? userProfile.interestedDistricts.map(d => d.districtName || d)
    : [];
  
  const budgetOption = userProfile?.budgetOption 
    ? BudgetOptionDisplay[userProfile.budgetOption] || userProfile.budgetOption
    : null;
  
  // Check if user has any preferences
  const hasPreferences = favoriteEventTypes.length > 0 || interestedDistricts.length > 0 || budgetOption;
  
  // Format interests text with highlighted keywords
  // Format: "Dựa trên sở thích xxx, vị trí xxx, ngân sách xxx của bạn!"
  const formatInterestsText = () => {
    if (!hasPreferences) {
      return { 
        baseText: "", 
        eventTypesText: null,
        districtsText: null,
        budgetText: null,
        showReminder: true 
      };
    }
    
    let colorIndex = 0;
    
    // Format event types - chỉ lấy 2 mục đầu tiên
    let eventTypesText = null;
    if (favoriteEventTypes.length > 0) {
      const limitedEventTypes = favoriteEventTypes.slice(0, 2);
      const eventTypesList = limitedEventTypes.map((et, idx) => ({
        text: et,
        colorIndex: colorIndex++,
        isLast: idx === limitedEventTypes.length - 1,
        isSecondLast: idx === limitedEventTypes.length - 2
      }));
      eventTypesText = eventTypesList;
    }
    
    // Format districts - chỉ lấy 2 mục đầu tiên
    let districtsText = null;
    if (interestedDistricts.length > 0) {
      const limitedDistricts = interestedDistricts.slice(0, 2);
      const districtsList = limitedDistricts.map((d, idx) => ({
        text: d,
        colorIndex: colorIndex++,
        isLast: idx === limitedDistricts.length - 1,
        isSecondLast: idx === limitedDistricts.length - 2
      }));
      districtsText = districtsList;
    }
    
    // Format budget
    let budgetText = null;
    if (budgetOption) {
      budgetText = {
        text: budgetOption,
        colorIndex: colorIndex++
      };
    }
    
    return { 
      baseText: "Dựa trên ",
      eventTypesText,
      districtsText,
      budgetText,
      showReminder: false
    };
  };

  const { baseText, eventTypesText, districtsText, budgetText, showReminder } = formatInterestsText();

  // Get color gradient for each interest based on index
  const getInterestColor = (index) => {
    const colors = [
      "from-blue-500 via-blue-600 to-blue-500", // xanh dương
      "from-purple-500 via-pink-500 to-purple-500", // tím/hồng
      "from-orange-500 via-orange-600 to-orange-500", // cam
      "from-green-500 via-emerald-500 to-green-500", // xanh lá
      "from-indigo-500 via-indigo-600 to-indigo-500", // indigo
      "from-rose-500 via-rose-600 to-rose-500", // hồng
    ];
    return colors[index % colors.length];
  };
  
  const handleGoToProfile = () => {
    navigate(PATH.PROFILE);
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      // Fallback: Scroll to recommended events section
      const element = document.getElementById('recommended-events-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="mb-12">
      {/* Main Content Card */}
      <div className="relative bg-gradient-to-br from-white via-gray-50 to-blue-50/30 rounded-3xl p-6 sm:p-8 lg:p-10 border border-gray-200/60 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
        {/* Animated gradient background */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 via-blue-100/20 to-transparent rounded-full blur-3xl -z-0 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200/30 via-orange-100/20 to-transparent rounded-full blur-3xl -z-0 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-r from-blue-100/20 to-orange-100/20 rounded-full blur-3xl -z-0 animate-blob animation-delay-4000"></div>
        
        <div className="relative z-10">
          {/* Header Section - Inside Card */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-start gap-4 flex-1">
              {/* Icon - Robot Cycle with animated background */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-sky-500 to-blue-400 rounded-xl blur-md opacity-50 animate-pulse"></div>
                <div className="relative w-16 h-16 rounded-xl">
                  <img 
                    src={robotCycleIcon} 
                    alt="AI Robot" 
                    className="w-full h-full object-contain animate-bounce-slow"
                  />
                </div>
              </div>
              
              {/* Title */}
              <div className="flex-1 pt-1">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight mb-2">
                  <span className="text-gray-800">Gợi ý từ </span>
                  <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent animate-gradient-x">
                    AI dành cho bạn
                  </span>
                </h2>
                <p className="text-sm sm:text-base text-gray-500 font-medium">
                  Được cá nhân hóa dựa trên sở thích của bạn
                </p>
              </div>
            </div>

            {/* View All Button - Top Right */}
            <Button
              onClick={handleViewAll}
              disabled={isLoadingAIEvents}
              className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 group transform hover:scale-105 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingAIEvents ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tìm...</span>
                </>
              ) : (
                <>
                  <img 
                    src={arrowIcon} 
                    alt="Arrow" 
                    className="w-7 h-7 brightness-0 invert -translate-x-3 group-hover:translate-x-0 transition-transform duration-300"
                  />
                  <span>Xem tất cả gợi ý</span>
                </>
              )}
            </Button>
          </div>

          {/* Event Count */}
          <div className="mb-6">
            <p className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight">
              <span className="text-3xl sm:text-4xl lg:text-5xl bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 bg-clip-text text-transparent animate-gradient-x">
                AI
              </span>{" "}
              đã tìm thấy sự kiện phù hợp với bạn!
            </p>
          </div>

          {/* Interest Description */}
          {showReminder ? (
            <div className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed font-medium">
              <p className="text-gray-600 mb-3">
                Để nhận được gợi ý tốt hơn, vui lòng cập nhật{" "}
                <button
                  onClick={handleGoToProfile}
                  className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2"
                >
                  sở thích của bạn
                </button>
                {" "}trong hồ sơ (Loại sự kiện ưa thích, Quận quan tâm và Ngân sách cho sự kiện).
              </p>
            </div>
          ) : (
            <div className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed font-medium">
              <span className="text-gray-600">{baseText}</span>
              
              {/* Sở thích */}
              {eventTypesText && (
                <>
                  <span className="text-gray-600">sở thích </span>
                  {eventTypesText.map((item, index) => {
                    const colorClass = getInterestColor(item.colorIndex);
                    return (
                      <span key={`event-${index}`}>
                        {item.isLast && eventTypesText.length > 1 ? (
                          <>
                            {" và "}
                            <span className={`font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent animate-gradient-x`}>
                              {item.text}
                            </span>
                          </>
                        ) : item.isSecondLast ? (
                          <>
                            <span className={`font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent animate-gradient-x`}>
                              {item.text}
                            </span>
                            {" "}
                          </>
                        ) : (
                          <>
                            <span className={`font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent animate-gradient-x`}>
                              {item.text}
                            </span>
                            {eventTypesText.length > 1 && index < eventTypesText.length - 1 && ", "}
                          </>
                        )}
                      </span>
                    );
                  })}
                </>
              )}
              
              {/* Vị trí */}
              {districtsText && (
                <>
                  {eventTypesText && ", "}
                  <span className="text-gray-600">vị trí </span>
                  {districtsText.map((item, index) => {
                    const colorClass = getInterestColor(item.colorIndex);
                    return (
                      <span key={`district-${index}`}>
                        {item.isLast && districtsText.length > 1 ? (
                          <>
                            {" và "}
                            <span className={`font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent animate-gradient-x`}>
                              {item.text}
                            </span>
                          </>
                        ) : item.isSecondLast ? (
                          <>
                            <span className={`font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent animate-gradient-x`}>
                              {item.text}
                            </span>
                            {" "}
                          </>
                        ) : (
                          <>
                            <span className={`font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent animate-gradient-x`}>
                              {item.text}
                            </span>
                            {districtsText.length > 1 && index < districtsText.length - 1 && ", "}
                          </>
                        )}
                      </span>
                    );
                  })}
                </>
              )}
              
              {/* Ngân sách */}
              {budgetText && (
                <>
                  {(eventTypesText || districtsText) && ", "}
                  <span className="text-gray-600">ngân sách </span>
                  <span className={`font-bold bg-gradient-to-r ${getInterestColor(budgetText.colorIndex)} bg-clip-text text-transparent animate-gradient-x`}>
                    {budgetText.text}
                  </span>
                </>
              )}
              
              <span className="text-gray-600"> của bạn!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIRecommendationCard;

