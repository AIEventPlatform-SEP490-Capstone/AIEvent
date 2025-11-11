import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Hero } from "../../components/HomePage/hero";
import { EventDiscovery } from "../../components/HomePage/event-discovery";
import { AIRecommendationCard } from "../../components/HomePage/AIRecommendationCard";
import { PATH } from "../../routes/path";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { Footer } from "../../components/Footer/Footer";
import { useHomepageEvents } from "../../hooks/useHomepageEvents";
import { useUserProfile } from "../../hooks/userProfile";
import { eventAPI } from "../../api/eventAPI";

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, isInitialized } = useSelector(
    (state) => state.auth
  );

  const { allEvents, recommendedEvents, loading, error, refreshEvents } =
    useHomepageEvents();
  
  const { profile, getUserProfile } = useUserProfile();
  
  const [aiRecommendedEvents, setAiRecommendedEvents] = useState([]);
  const [loadingAIEvents, setLoadingAIEvents] = useState(false);
  const [showAIEvents, setShowAIEvents] = useState(false);

  // Load user profile when authenticated
  useEffect(() => {
    if (isAuthenticated && !profile) {
      getUserProfile();
    }
  }, [isAuthenticated, profile, getUserProfile]);

  // Handle view all AI recommendations
  const handleViewAllAIRecommendations = async () => {
    if (showAIEvents && aiRecommendedEvents.length > 0) {
      // If already loaded, just scroll
      const element = document.getElementById('ai-recommended-events-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    try {
      setLoadingAIEvents(true);
      const response = await eventAPI.getAIRecommendedEvents(1, 5);
      const events = response?.items || response || [];
      setAiRecommendedEvents(events);
      setShowAIEvents(true);
      
      // Scroll to section after a short delay to ensure DOM is updated
      setTimeout(() => {
        const element = document.getElementById('ai-recommended-events-section');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      console.error("Error loading AI recommended events:", err);
    } finally {
      setLoadingAIEvents(false);
    }
  };

  useEffect(() => {
    // Chỉ redirect khi đã khởi tạo xong, đã xác thực và có user data
    if (isInitialized && isAuthenticated && user && !isLoading) {
      const role = user.role?.toLowerCase();

      switch (role) {
        case "admin":
          navigate(PATH.ADMIN, { replace: true });
          break;
        case "organizer":
          navigate(PATH.ORGANIZER, { replace: true });
          break;
        case "manager":
          navigate(PATH.MANAGER, { replace: true });
          break;
        default:
          // User thường - hiển thị HomePage bình thường
          break;
      }
    }
  }, [isInitialized, isAuthenticated, user, isLoading, navigate]);

  // Hiển thị loading khi đang xác thực hoặc chưa khởi tạo xong
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Nếu user đã authenticated và có role cần redirect, hiển thị loading
  if (isAuthenticated && user) {
    const role = user.role?.toLowerCase();
    if (role === "admin" || role === "organizer" || role === "manager") {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="text-gray-600 mt-4">Đang chuyển hướng...</p>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Hero />

      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {isAuthenticated && recommendedEvents.length > 0 && (
          <AIRecommendationCard 
            recommendedEvents={recommendedEvents}
            userProfile={profile}
            onViewAll={handleViewAllAIRecommendations}
            isLoadingAIEvents={loadingAIEvents}
          />
        )}
        <EventDiscovery
          allEvents={allEvents}
          recommendedEvents={showAIEvents ? aiRecommendedEvents : recommendedEvents}
          loading={loading}
          error={error}
          onRefresh={refreshEvents}
          showAIRecommendedSection={showAIEvents}
        />
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;