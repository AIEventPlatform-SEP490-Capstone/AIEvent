import { Hero } from "../../components/hero"
import { EventDiscovery } from "../../components/event-discovery"

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <EventDiscovery />
          </div>
          
          <div className="space-y-6">
            {/* AI Recommendation Widget */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">AI Recommendations</h3>
              <p className="text-muted-foreground text-sm">AI recommendation widget will be implemented here.</p>
            </div>
            
            {/* Smart Notifications */}
            <div className="bg-card p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-3">Smart Notifications</h3>
              <p className="text-muted-foreground text-sm">Smart notifications component will be implemented here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
