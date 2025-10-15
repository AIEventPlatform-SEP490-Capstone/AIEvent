import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Hero } from "../../components/hero"
import { EventDiscovery } from "../../components/event-discovery"
import { PATH } from "../../routes/path";
import LoadingSpinner from "../../components/LoadingSpinner/LoadingSpinner";
import { Footer } from "../../components/Footer/Footer";
import { useHomepageEvents } from "../../hooks/useHomepageEvents";

const HomePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, isInitialized } = useSelector((state) => state.auth);
  
  const { 
    allEvents, 
    recommendedEvents, 
    loading, 
    error, 
    refreshEvents 
  } = useHomepageEvents();

  useEffect(() => {
    // Chỉ redirect khi đã khởi tạo xong, đã xác thực và có user data
    if (isInitialized && isAuthenticated && user && !isLoading) {
      const role = user.role?.toLowerCase();
      
      switch (role) {
        case 'admin':
          navigate(PATH.ADMIN, { replace: true });
          break;
        case 'organizer':
          navigate(PATH.ORGANIZER, { replace: true });
          break;
        case 'manager':
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
    if (role === 'admin' || role === 'organizer' || role === 'manager') {
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3">
            <EventDiscovery 
              allEvents={allEvents}
              recommendedEvents={recommendedEvents}
              loading={loading}
              error={error}
              onRefresh={refreshEvents}
            />
          </div>
          
          <div className="space-y-6">
            {/* AI Recommendation Widget */}
            <div className="bg-gradient-to-br from-card to-card/80 p-6 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Recommendations</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">AI recommendation widget will be implemented here.</p>
            </div>
            
            {/* Smart Notifications */}
            <div className="bg-gradient-to-br from-card to-card/80 p-6 rounded-2xl border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
              <h3 className="text-lg font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Smart Notifications</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Smart notifications component will be implemented here.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default HomePage;