import React from 'react';
import { User, MapPin, Edit3, Award, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

const ProfileHeader = ({
  profileData,
  stats,
  onEditProfile
}) => {
  return (
    <div className="relative overflow-hidden">
      {/* Enhanced Multi-layer Gradient Background - Blue Dark to Light to Black to White */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom right, #1e3a8a 0%, #3b82f6 25%, #60a5fa 40%, #1f2937 60%, #4b5563 75%, #ffffff 100%)'
        }}
      ></div>
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: 'linear-gradient(to top right, rgba(30, 58, 138, 0.5) 0%, rgba(55, 65, 81, 0.4) 50%, rgba(255, 255, 255, 0.3) 100%)'
        }}
      ></div>
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: 'radial-gradient(ellipse at top right, rgba(59, 130, 246, 0.4) 0%, rgba(75, 85, 99, 0.3) 50%, transparent 100%)'
        }}
      ></div>

      {/* Animated Background Elements with improved animations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gray-300/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-20 right-1/4 w-20 h-20 bg-white/15 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start space-x-4">
            {/* Enhanced Profile Picture with glow effect */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>

              <div className="relative w-36 h-36 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/40 shadow-2xl group-hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent"></div>

                {profileData.avatarImgUrl ? (
                  <img
                    src={profileData.avatarImgUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover rounded-full relative z-10"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <User className="w-16 h-16 text-white relative z-10" />
                )}
              </div>

              {/* Sparkle effect */}
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-300 animate-pulse" style={{ animationDelay: '0.3s' }} />
            </div>

            {/* Enhanced Profile Info with better spacing */}
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {profileData.name || 'Chưa có tên'}
                  </h1>
                  <Award className="w-4 h-4 text-yellow-300 animate-pulse" />
                </div>
                <p className="text-lg text-white/95 font-medium mb-1 flex items-center">
                  {profileData.email || 'Chưa có email'}
                </p>
                <p className="text-base text-white/85 mb-2 font-medium">
                  {profileData.jobTitle || 'Chưa có chức vụ'}
                </p>
                <div className="flex items-center text-white/80 mb-3 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 inline-flex">
                  <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{profileData.address || 'Chưa có địa chỉ'}</span>
                </div>
              </div>

              <div className="max-w-xl">
                <p className="text-white/85 leading-relaxed text-sm bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                  {profileData.bio || 'Chưa có giới thiệu'}
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Edit Profile Button with icon animation */}
          {onEditProfile && (
            <div className="mt-4 lg:mt-0">
              <Button
                variant="outline"
                className="group relative bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 hover:border-white/50 transition-all duration-300 shadow-xl hover:shadow-2xl px-6 py-2 text-sm font-semibold overflow-hidden"
                onClick={onEditProfile}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Edit3 className="w-4 h-4 mr-2 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">Chỉnh sửa hồ sơ</span>
              </Button>
            </div>
          )}
        </div>

        {/* Enhanced Skills Tags with better animations */}
        <div className="mt-4">
          <h3 className="text-white/90 font-semibold mb-2 text-xs uppercase tracking-wide flex items-center">
            <Sparkles className="w-3 h-3 mr-2" />
            Kỹ năng chuyên môn
          </h3>
          <div className="flex flex-wrap gap-2">
            {profileData.skills && profileData.skills.slice(0, 3).map((skill, index) => (
              <Badge
                key={index}
                className="group bg-white/15 text-white border-white/30 backdrop-blur-md hover:bg-white/25 hover:scale-105 transition-all duration-300 px-3 py-1.5 text-xs font-medium shadow-lg cursor-pointer relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative z-10">{skill}</span>
              </Badge>
            ))}
            {profileData.skills && profileData.skills.length > 3 && (
              <Badge className="bg-white/15 text-white/90 border-white/30 backdrop-blur-md hover:bg-white/25 transition-all duration-300 px-3 py-1.5 text-xs font-medium shadow-lg cursor-pointer">
                <span className="mr-1">+</span>{profileData.skills.length - 3} kỹ năng khác
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/20 to-transparent"></div>
    </div>
  );
};

export default ProfileHeader;