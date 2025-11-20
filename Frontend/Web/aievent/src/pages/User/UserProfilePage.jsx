import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Edit3,
  Calendar,
  Briefcase,
  Globe,
  Wrench,
  Sparkles,
  Heart, // Add Heart icon import
  Linkedin,
  Github,
  Twitter,
  Instagram,
  Facebook
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import SuggestionInput from '../../components/ui/suggestion-input';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileNavigation from '../../components/Profile/ProfileNavigation';
import FriendsTab from '../../components/Profile/FriendsTab';
import SettingsTab from '../../components/Profile/SettingsTab';
import PaymentInfoTab from '../../components/Profile/PaymentInfoTab';
import AIRecommendedFriendsTab from '../../components/Profile/AIRecommendedFriendsTab'; // Import the new component
import { useUserProfile } from '../../hooks/userProfile';
import {
  ParticipationFrequency,
  ParticipationFrequencyDisplay,
  BudgetOption,
  BudgetOptionDisplay,
  PredefinedInterests,
  PredefinedCities,
  PredefinedSkills,
  PredefinedLanguages,
  PredefinedEventTypes,
  Experience,
  ExperienceDisplay,
  ParticipationFrequencyReverse,
  ExperienceReverse,
  BudgetOptionReverse
} from '../../constants/userConstants';
import { validateProfileData, transformFormDataToAPI } from '../../utils/profileValidation';
import ChangePasswordModal from '../../components/Auth/ChangePasswordModal';
import { friendAPI } from '../../api/friendAPI';

const UserProfilePage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('likes');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);
  const hasFetchedProfile = useRef(false);
  const {
    profile,
    isLoading,
    isUpdating,
    error,
    updateError,
    getUserProfile,
    updateProfile,
    clearError,
  } = useUserProfile();

  useEffect(() => {
    if (!profile && !isLoading && !hasFetchedProfile.current) {
      hasFetchedProfile.current = true;
      getUserProfile();
    }
  }, [profile, isLoading, getUserProfile]);

  // Reset hasFetchedProfile when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      hasFetchedProfile.current = false;
    }
  }, [user]);

  // Handle tab from URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Fetch friend requests count when component mounts
  useEffect(() => {
    const fetchFriendRequestsCount = async () => {
      if (!user) return;
      
      try {
        const response = await friendAPI.getFriendRequests({ pageNumber: 1, pageSize: 1 });
        if (response.statusCode === "AIE20000" && response.data) {
          setFriendRequestsCount(response.data.totalItems || 0);
        }
      } catch (error) {
        console.error('Error fetching friend requests count:', error);
        // Silently fail - don't show error for badge count
      }
    };

    fetchFriendRequestsCount();
  }, [user]);

  // Transform API data to match component expectations
  const profileData = profile ? {
    name: profile.fullName || "Chưa cập nhật",
    email: profile.email || "Chưa cập nhật",
    phone: profile.phoneNumber || "Chưa cập nhật",
    address: profile.address || profile.district || "Chưa cập nhật",
    city: profile.city || "Chưa cập nhật",
    website: profile.personalWebsite || "",
    bio: profile.introduction || "Chưa có thông tin",
    jobTitle: profile.jobTitle || "Chưa cập nhật",
    occupation: profile.occupation || "Chưa cập nhật",
    experience: profile.experience ? ExperienceDisplay[profile.experience] : "Chưa cập nhật",
    careerObjective: profile.careerGoal || "Chưa cập nhật",
    socialLinks: {
      linkedin: profile.linkedInUrl || "",
      github: profile.gitHubUrl || "",
      twitter: profile.twitterUrl || "",
      instagram: profile.instagramUrl || "",
      facebook: profile.facebookUrl || ""
    },
    skills: profile.professionalSkillsJson ? (() => {
      try {
        const skills = JSON.parse(profile.professionalSkillsJson);
        if (Array.isArray(skills)) {
          return skills.map(skill => 
            typeof skill === 'object' ? (skill.SkillName || skill.skillName || skill.name || '') : skill
          ).filter(skill => skill && skill.trim() !== '');
        }
        return [];
      } catch (e) {
        console.error('Error parsing skills:', e);
        return [];
      }
    })() : [],
    languages: profile.languagesJson ? (() => {
      try {
        const languages = JSON.parse(profile.languagesJson);
        if (Array.isArray(languages)) {
          return languages.map(lang => 
            typeof lang === 'object' ? (lang.LanguageName || lang.languageName || lang.name || '') : lang
          ).filter(lang => lang && lang.trim() !== '');
        }
        return [];
      } catch (e) {
        console.error('Error parsing languages:', e);
        return [];
      }
    })() : [],
    interests: profile.userInterestsJson ? (() => {
      try {
        const interests = JSON.parse(profile.userInterestsJson);
        if (Array.isArray(interests)) {
          return interests.map(interest => 
            typeof interest === 'object' ? (interest.InterestName || interest.interestName || interest.name || '') : interest
          ).filter(interest => interest && interest.trim() !== '');
        }
        return [];
      } catch (e) {
        console.error('Error parsing interests:', e);
        return [];
      }
    })() : [],
    eventTypes: profile.favoriteEventTypesJson ? (() => {
      try {
        const eventTypes = JSON.parse(profile.favoriteEventTypesJson);
        if (Array.isArray(eventTypes)) {
          return eventTypes.map(et => 
            typeof et === 'object' ? (et.FavoriteEventTypeName || et.favoriteEventTypeName || et.name || '') : et
          ).filter(et => et && et.trim() !== '');
        }
        return [];
      } catch (e) {
        console.error('Error parsing event types:', e);
        return [];
      }
    })() : [],
    cities: profile.interestedDistrictsJson ? (() => {
      try {
        const cities = JSON.parse(profile.interestedDistrictsJson);
        if (Array.isArray(cities)) {
          return cities.map(city => 
            typeof city === 'object' ? (city.DistrictName || city.districtName || city.name || '') : city
          ).filter(city => city && city.trim() !== '');
        }
        return [];
      } catch (e) {
        console.error('Error parsing cities:', e);
        return [];
      }
    })() : [],
    participationFrequency: profile.participationFrequency ? ParticipationFrequencyDisplay[profile.participationFrequency] : "Hàng tháng",
    // API specific fields
    id: profile.id,
    emailConfirmed: profile.emailConfirmed,
    latitude: profile.latitude,
    longitude: profile.longitude,
    avatarImgUrl: profile.avatarImgUrl,
    isTurnOnLocation: profile.isTurnOnLocation,
    isEmailNotificationEnabled: profile.isEmailNotificationEnabled,
    isPushNotificationEnabled: profile.isPushNotificationEnabled,
    isSmsNotificationEnabled: profile.isSmsNotificationEnabled,
    budgetOption: profile.budgetOption,
    totalJoinedEvents: profile.totalJoinedEvents || 0,
    totalFavoriteEvents: profile.totalFavoriteEvents || 0,
    totalFriends: profile.totalFriends || 0
  } : {
    name: "Chưa tải được dữ liệu",
    email: "Chưa tải được dữ liệu",
    phone: "Chưa tải được dữ liệu",
    address: "Chưa tải được dữ liệu",
    city: "Chưa tải được dữ liệu",
    website: "",
    bio: "Đang tải thông tin...",
    jobTitle: "Chưa tải được dữ liệu",
    occupation: "Chưa tải được dữ liệu",
    experience: "Chưa tải được dữ liệu",
    careerObjective: "Chưa tải được dữ liệu",
    socialLinks: {
      linkedin: "",
      github: "",
      twitter: "",
      instagram: "",
      facebook: ""
    },
    skills: [],
    languages: [],
    interests: [],
    eventTypes: [],
    cities: [],
    participationFrequency: "Hàng tháng",
    // API specific fields
    id: null,
    emailConfirmed: null,
    latitude: null,
    longitude: null,
    avatarImgUrl: null,
    isTurnOnLocation: false,
    isEmailNotificationEnabled: null,
    isPushNotificationEnabled: null,
    isSmsNotificationEnabled: null,
    budgetOption: "Flexible",
    totalJoinedEvents: 0,
    totalFavoriteEvents: 0,
    totalFriends: 0
  };

  const tabs = [
    { id: 'likes', label: 'Yêu thích' },
    { id: 'friends', label: 'Bạn bè' },
    { id: 'airecommended', label: 'AI Gợi ý' }, // Add the new AI Recommended tab
    { id: 'card', label: 'Thông tin thẻ' },
    { id: 'settings', label: 'Cài đặt' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Enhanced Profile Header - Rounded corners */}
      <div className="max-w-4xl mx-auto mt-4 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-center">
            <div className="text-white text-lg">Đang tải thông tin cá nhân...</div>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-br from-red-600 via-red-500 to-red-400 p-8 text-center">
            <div className="text-white text-lg">Lỗi khi tải thông tin: {error.message || 'Không thể tải dữ liệu'}</div>
            <button
              onClick={() => {
                hasFetchedProfile.current = false;
                getUserProfile();
              }}
              className="mt-4 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <ProfileHeader
            profileData={profileData}
            stats={null}
            onEditProfile={() => setIsEditModalOpen(true)}
          />
        )}
      </div>

      {/* Separated Content Area */}
      <div className="max-w-4xl mx-auto mt-4">
        {/* Enhanced Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <ProfileNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Content Area */}
        <div className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-visible">
          <div className="px-6 py-6 pb-8">
            {activeTab === 'likes' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Sự kiện yêu thích</h2>
                  <div className="w-16 h-0.5 bg-gray-300"></div>
                </div>
                {profileData.totalFavoriteEvents > 0 ? (
                  <div className="text-gray-600">Danh sách sự kiện yêu thích sẽ hiển thị ở đây.</div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Chưa có sự kiện yêu thích nào.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'friends' && (
              <FriendsTab user={user} initialFriendRequestsCount={friendRequestsCount} onFriendRequestsCountChange={setFriendRequestsCount} />
            )}

            {activeTab === 'airecommended' && (
              <AIRecommendedFriendsTab user={user} />
            )}

            {activeTab === 'card' && (
              <PaymentInfoTab />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                profileData={profileData}
                onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
              />
            )}
          </div>
        </div>
      </div>


      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <EditProfileModal
            profileData={profileData}
            originalProfile={profile}
            onClose={() => setIsEditModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

    </div>
  );
};

// Edit Profile Modal Component
const EditProfileModal = ({ profileData, originalProfile, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: profileData.name || '',
    email: profileData.email || '',
    phoneNumber: profileData.phone || '',
    address: profileData.address || '',
    district: profileData.city || '',
    introduction: profileData.bio || '',
    jobTitle: profileData.jobTitle || '',
    occupation: profileData.occupation || '',
    experience: profileData.experience ? ExperienceReverse[profileData.experience] : '',
    careerGoal: profileData.careerObjective || '',
    personalWebsite: profileData.website || '',
    linkedInUrl: profileData.socialLinks?.linkedin || '',
    gitHubUrl: profileData.socialLinks?.github || '',
    twitterUrl: profileData.socialLinks?.twitter || '',
    instagramUrl: profileData.socialLinks?.instagram || '',
    facebookUrl: profileData.socialLinks?.facebook || '',
    professionalSkills: profileData.skills || [],
    languages: profileData.languages || [],
    userInterests: profileData.interests || [],
    favoriteEventTypes: profileData.eventTypes || [],
    interestedDistricts: profileData.cities || [],
    participationFrequency: profileData.participationFrequency ? ParticipationFrequencyReverse[profileData.participationFrequency] : '',
    budgetOption: profileData.budgetOption || 'Flexible'
  });
  
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const { updateProfile } = useUserProfile();

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle suggestion input changes (for arrays)
  const handleSuggestionInputChange = (field, values) => {
    setFormData(prev => ({
      ...prev,
      [field]: values
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Validate required fields
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Tên đầy đủ là bắt buộc';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    
    try {
      // Transform form data to match API expectations
      const transformedData = transformFormDataToAPI(formData, originalProfile);
      
      // Validate transformed data
      const validationError = validateProfileData(transformedData);
      if (validationError) {
        throw new Error(validationError);
      }
      
      await updateProfile(transformedData);
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrors({ submit: error.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-gray-900">Chỉnh sửa hồ sơ</DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Thông tin cá nhân</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={errors.fullName ? 'border-red-500' : ''}
                />
                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
              </div>
              
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              
              <div>
                <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                  Số điện thoại
                </Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                  Địa chỉ
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="district" className="text-sm font-medium text-gray-700">
                  Quận/Huyện
                </Label>
                <Input
                  id="district"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Thông tin nghề nghiệp</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="jobTitle" className="text-sm font-medium text-gray-700">
                  Chức danh
                </Label>
                <Input
                  id="jobTitle"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="occupation" className="text-sm font-medium text-gray-700">
                  Nghề nghiệp
                </Label>
                <Input
                  id="occupation"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="experience" className="text-sm font-medium text-gray-700">
                  Kinh nghiệm
                </Label>
                <Select 
                  value={formData.experience} 
                  onValueChange={(value) => handleInputChange('experience', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn mức kinh nghiệm" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(Experience).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {ExperienceDisplay[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="careerGoal" className="text-sm font-medium text-gray-700">
                  Mục tiêu nghề nghiệp
                </Label>
                <Textarea
                  id="careerGoal"
                  value={formData.careerGoal}
                  onChange={(e) => handleInputChange('careerGoal', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="personalWebsite" className="text-sm font-medium text-gray-700">
                  Website cá nhân
                </Label>
                <Input
                  id="personalWebsite"
                  value={formData.personalWebsite}
                  onChange={(e) => handleInputChange('personalWebsite', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* About */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Giới thiệu</h3>
            
            <div>
              <Label htmlFor="introduction" className="text-sm font-medium text-gray-700">
                Giới thiệu bản thân
              </Label>
              <Textarea
                id="introduction"
                value={formData.introduction}
                onChange={(e) => handleInputChange('introduction', e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          {/* Social Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Liên kết mạng xã hội</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="linkedInUrl" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedInUrl"
                  value={formData.linkedInUrl}
                  onChange={(e) => handleInputChange('linkedInUrl', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="gitHubUrl" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub
                </Label>
                <Input
                  id="gitHubUrl"
                  value={formData.gitHubUrl}
                  onChange={(e) => handleInputChange('gitHubUrl', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="twitterUrl" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Label>
                <Input
                  id="twitterUrl"
                  value={formData.twitterUrl}
                  onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="instagramUrl" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Instagram className="w-4 h-4" />
                  Instagram
                </Label>
                <Input
                  id="instagramUrl"
                  value={formData.instagramUrl}
                  onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="facebookUrl" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Label>
                <Input
                  id="facebookUrl"
                  value={formData.facebookUrl}
                  onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Sở thích & Ưu tiên</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Kỹ năng chuyên môn
                </Label>
                <SuggestionInput
                  suggestions={PredefinedSkills}
                  selectedValues={formData.professionalSkills}
                  onValuesChange={(values) => handleSuggestionInputChange('professionalSkills', values)}
                  placeholder="Nhập kỹ năng..."
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Ngôn ngữ
                </Label>
                <SuggestionInput
                  suggestions={PredefinedLanguages}
                  selectedValues={formData.languages}
                  onValuesChange={(values) => handleSuggestionInputChange('languages', values)}
                  placeholder="Nhập ngôn ngữ..."
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Sở thích
                </Label>
                <SuggestionInput
                  suggestions={PredefinedInterests}
                  selectedValues={formData.userInterests}
                  onValuesChange={(values) => handleSuggestionInputChange('userInterests', values)}
                  placeholder="Nhập sở thích..."
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Loại sự kiện ưa thích
                </Label>
                <SuggestionInput
                  suggestions={PredefinedEventTypes}
                  selectedValues={formData.favoriteEventTypes}
                  onValuesChange={(values) => handleSuggestionInputChange('favoriteEventTypes', values)}
                  placeholder="Nhập loại sự kiện..."
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Quận/Huyện quan tâm
                </Label>
                <SuggestionInput
                  suggestions={PredefinedCities}
                  selectedValues={formData.interestedDistricts}
                  onValuesChange={(values) => handleSuggestionInputChange('interestedDistricts', values)}
                  placeholder="Nhập quận/huyện..."
                />
              </div>
              
              <div>
                <Label htmlFor="participationFrequency" className="text-sm font-medium text-gray-700">
                  Tần suất tham gia
                </Label>
                <Select 
                  value={formData.participationFrequency} 
                  onValueChange={(value) => handleInputChange('participationFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn tần suất" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ParticipationFrequency).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {ParticipationFrequencyDisplay[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="budgetOption" className="text-sm font-medium text-gray-700">
                  Ngân sách cho sự kiện
                </Label>
                <Select 
                  value={formData.budgetOption} 
                  onValueChange={(value) => handleInputChange('budgetOption', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngân sách" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(BudgetOption).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {BudgetOptionDisplay[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Actions */}
      <div className="flex justify-end gap-3 mt-6">
        {errors.submit && <p className="text-red-500 text-sm mr-auto">{errors.submit}</p>}
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSaving}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Đang lưu...
            </>
          ) : (
            'Lưu thay đổi'
          )}
        </Button>
      </div>
    </>
  );
};

export default UserProfilePage;