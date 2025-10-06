import { Hero } from "../../components/hero"
import { EventDiscovery } from "../../components/event-discovery"

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3">
            <EventDiscovery />
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
    </div>
  );
};

export default HomePage;
