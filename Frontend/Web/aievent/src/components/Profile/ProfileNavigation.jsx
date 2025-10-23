import React from 'react';
import { Ticket, Heart, Users, History, Settings } from 'lucide-react';

const ProfileNavigation = ({ tabs, activeTab, onTabChange }) => {
  const tabIcons = {
    tickets: Ticket,
    likes: Heart,
    friends: Users,
    history: History,
    settings: Settings
  };

  return (
    <div className="relative bg-gradient-to-r from-gray-50 to-white border-b-2 border-gray-100 shadow-sm overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
      </div>
      
      <div className="relative px-6">
        <div className="flex space-x-2 justify-center">
          {tabs.map((tab) => {
            const IconComponent = tabIcons[tab.id];
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center space-x-3 px-6 py-4 text-sm font-semibold rounded-t-xl transition-all duration-300 whitespace-nowrap group ${
                  isActive
                    ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white shadow-xl scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-lg'
                }`}
              >
                {/* Background shine effect */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer rounded-t-xl"></div>
                )}
                
                {IconComponent && (
                  <div className={`relative ${isActive ? 'animate-bounce-slow' : ''}`}>
                    <IconComponent className={`w-5 h-5 transition-all duration-300 ${
                      isActive ? 'scale-110 drop-shadow-lg' : 'group-hover:scale-110'
                    }`} />
                  </div>
                )}
                <span className="relative z-10">{tab.label}</span>
                
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 rounded-t-full shadow-lg"></div>
                )}
                
                {/* Hover glow effect */}
                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-xl"></div>
                )}
                
                {/* Corner accents for active tab */}
                {isActive && (
                  <>
                    <div className="absolute top-2 left-2 w-2 h-2 bg-white/30 rounded-full"></div>
                    <div className="absolute top-2 right-2 w-2 h-2 bg-white/30 rounded-full"></div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
    </div>
  );
};

export default ProfileNavigation;