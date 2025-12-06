import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, MapPin, UserMinus, Briefcase, Target, Globe, Linkedin, Github, Twitter, Instagram, Facebook, Sparkles, Mail, UserCircle, Clock, MoreHorizontal, Ban, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import ProfileNavigation from '../../components/Profile/ProfileNavigation';
import { friendAPI } from '../../api/friendAPI';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { showSuccess, showError } from '../../lib/toastUtils';
import { PATH } from '../../routes/path';
import { useSelector } from 'react-redux';

const FriendDetailPage = () => {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useSelector((state) => state.auth);
  const [friendProfile, setFriendProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);
  const [isUnfriending, setIsUnfriending] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [isAddingFriend, setIsAddingFriend] = useState(false);

  useEffect(() => {
    const fetchFriendProfile = async () => {
      if (!friendId) {
        setError('Friend ID is required');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await friendAPI.getFriendProfile(friendId);
        // Response structure: { statusCode, data: { fullName, FriendshipStatus, ... }, message }
        console.log('Full API Response:', response);
        if (response && response.statusCode === 'AIE20000' && response.data) {
          const profileData = response.data;
          // Log để debug
          console.log('Friend profile data:', profileData);
          console.log('FriendshipStatus value:', profileData.FriendshipStatus);
          console.log('All keys in profileData:', Object.keys(profileData));
          setFriendProfile(profileData);
        } else {
          throw new Error(response?.message || 'Failed to fetch friend profile');
        }
      } catch (err) {
        console.error('Error fetching friend profile:', err);
        setError(err.response?.data?.message || err.message || 'Không thể tải thông tin bạn bè');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriendProfile();
  }, [friendId]);

  // Helper function to parse JSON strings safely
  const parseJsonField = (field) => {
    if (!field) return [];
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return Array.isArray(field) ? field : [];
  };

  // Parse skills and interests from API response
  const rawSkills = parseJsonField(friendProfile?.professionalSkillsJson);
  const rawInterests = parseJsonField(friendProfile?.userInterestsJson);

  // Transform skills to array of strings
  const skills = rawSkills.map(skill => {
    if (typeof skill === 'string') {
      // Try to parse if it's a JSON string
      try {
        const parsed = JSON.parse(skill);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed.SkillsName || parsed.skillsName || parsed.name || parsed.skillName || skill;
        }
        return parsed;
      } catch {
        return skill;
      }
    }
    if (typeof skill === 'object' && skill !== null) {
      return skill.SkillsName || skill.skillsName || skill.name || skill.skillName || JSON.stringify(skill);
    }
    return String(skill);
  }).filter(skill => skill && skill.trim() !== ''); // Filter out empty strings

  // Transform API data to match component expectations
  const profileData = friendProfile ? {
    name: friendProfile.fullName || "Chưa cập nhật",
    email: friendProfile.email || "Chưa cập nhật",
    address: friendProfile.address || "Chưa cập nhật",
    city: friendProfile.district || "Chưa cập nhật",
    website: friendProfile.personalWebsite || "",
    bio: friendProfile.introduction || "Chưa cập nhật giới thiệu",
    jobTitle: friendProfile.jobTitle || "Chưa cập nhật",
    occupation: friendProfile.occupation || "Chưa cập nhật",
    careerObjective: friendProfile.careerGoal || "Chưa cập nhật",
    socialLinks: {
      linkedin: friendProfile.linkedInUrl || "",
      github: friendProfile.gitHubUrl || "",
      twitter: friendProfile.twitterUrl || "",
      instagram: friendProfile.instagramUrl || "",
      facebook: friendProfile.facebookUrl || ""
    },
    skills: skills,
    interests: rawInterests.map(interest => {
      if (typeof interest === 'string') {
        // Try to parse if it's a JSON string
        try {
          const parsed = JSON.parse(interest);
          if (typeof parsed === 'object' && parsed !== null) {
            return parsed.InterestName || parsed.interestName || parsed.name || interest;
          }
          return parsed;
        } catch {
          return interest;
        }
      }
      if (typeof interest === 'object' && interest !== null) {
        return interest.InterestName || interest.interestName || interest.name || '';
      }
      return String(interest);
    }).filter(interest => interest && interest.trim() !== ''),
    avatarImgUrl: friendProfile.avatarImgUrl,
    listCommonEvent: friendProfile.listCommonEvent || []
  } : {
    name: "Chưa tải được dữ liệu",
    email: "Chưa tải được dữ liệu",
    address: "Chưa cập nhật",
    city: "Chưa cập nhật",
    website: "",
    bio: "Đang tải thông tin...",
    jobTitle: "Chưa cập nhật",
    occupation: "Chưa cập nhật",
    careerObjective: "Chưa cập nhật",
    socialLinks: {
      linkedin: "",
      github: "",
      twitter: "",
      instagram: "",
      facebook: ""
    },
    skills: [],
    interests: [],
    avatarImgUrl: null,
    listCommonEvent: []
  };

  // Stats - using common events count
  const stats = {
    eventsAttended: profileData.listCommonEvent?.length || 0,
    likes: 0, // Not available in friend profile
    friends: 0 // Not available in friend profile
  };

  const tabs = [
    { id: 'info', label: 'Thông tin' },
    { id: 'likes', label: 'Sự kiện chung' },
  ];

  // Validate GUID format
  const isValidGuid = (guid) => {
    if (!guid || typeof guid !== 'string') return false;
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidRegex.test(guid);
  };

  // Get friendship status - trạng thái quan hệ
  // Note: Backend trả về FriendshipStatus (hoặc friendshipStatus do camelCase naming policy)
  const friendshipStatus = friendProfile?.FriendshipStatus || friendProfile?.friendshipStatus;

  // Helper: Get button label and state
  const getFriendshipButtonState = () => {
    // Kiểm tra các trường hợp có thể xảy ra
    if (!friendshipStatus || friendshipStatus === null || friendshipStatus === undefined) {
      return { type: 'add', label: 'Kết bạn' };
    }

    // Normalize case - backend có thể trả về "Pending", "pending", hoặc số 0, 1, 2...
    const status = String(friendshipStatus).toLowerCase();

    switch (status) {
      case 'pending':
      case '0': // Pending = 0 in enum
        return { type: 'pending', label: 'Đã gửi lời mời' };
      case 'accepted':
      case '1': // Accepted = 1 in enum
        return { type: 'accepted', label: 'Là bạn' };
      case 'blocked':
      case '3': // Blocked = 3 in enum
        return { type: 'blocked', label: 'Đã chặn' };
      case 'rejected':
      case '2': // Rejected = 2 in enum
        return { type: 'rejected', label: 'Từ chối' };
      case 'canceled':
      case '4': // Canceled = 4 in enum
        return { type: 'add', label: 'Kết bạn' };
      default:
        console.warn('Unknown friendship status:', friendshipStatus);
        return { type: 'add', label: 'Kết bạn' };
    }
  };

  const friendshipState = getFriendshipButtonState();

  // Handle add friend
  const handleAddFriend = async () => {
    if (!friendId) {
      showError('Không tìm thấy ID của bạn bè. Vui lòng thử lại.');
      return;
    }

    if (!isValidGuid(friendId)) {
      showError('ID bạn bè không hợp lệ. Vui lòng làm mới trang và thử lại.');
      return;
    }

    setIsAddingFriend(true);
    try {
      const response = await friendAPI.addFriend(friendId);
      const statusCode = response?.statusCode;
      const isSuccess = statusCode === "AIE20000" || statusCode === "AIE20001" || statusCode === "AIE20100" || statusCode === "200" || statusCode === 200;

      if (isSuccess) {
        showSuccess('Đã gửi lời mời kết bạn');
        // Reload friend profile để cập nhật status
        const profileResponse = await friendAPI.getFriendProfile(friendId);
        if (profileResponse && profileResponse.statusCode === 'AIE20000' && profileResponse.data) {
          console.log('Profile updated after add friend:', profileResponse.data.FriendshipStatus);
          setFriendProfile(profileResponse.data);
        }
      } else {
        const errorMessage = response?.message || 'Không thể gửi lời mời kết bạn. Vui lòng thử lại.';
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Đã xảy ra lỗi khi gửi lời mời kết bạn.';
      showError(errorMessage);
    } finally {
      setIsAddingFriend(false);
    }
  };

  // Handle block
  const handleBlock = () => {
    setMenuOpen(false);
    setBlockDialogOpen(true);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [menuOpen]);

  const confirmUnfriend = async () => {
    if (!friendId) {
      showError('Không tìm thấy ID của bạn bè. Vui lòng thử lại.');
      setUnfriendDialogOpen(false);
      return;
    }

    // Validate GUID format
    if (!isValidGuid(friendId)) {
      console.error('Invalid GUID format:', friendId);
      showError('ID bạn bè không hợp lệ. Vui lòng làm mới trang và thử lại.');
      setUnfriendDialogOpen(false);
      return;
    }

    setIsUnfriending(true);
    try {
      const response = await friendAPI.deleteFriend(friendId);
      
      const statusCode = response?.statusCode;
      const isSuccess = statusCode === "AIE20000" || 
                       statusCode === "AIE20100" ||
                       statusCode === "200" || 
                       statusCode === 200;
      
      if (isSuccess) {
        showSuccess(`Đã hủy kết bạn với ${profileData.name || 'người dùng này'}`);
        // Navigate to profile page after successful unfriend
        setTimeout(() => {
          navigate(PATH.PROFILE);
        }, 1500);
      } else {
        const errorMessage = response?.message || 'Không thể hủy kết bạn. Vui lòng thử lại.';
        if (statusCode === "AIE40001") {
          showError('ID bạn bè không hợp lệ. Vui lòng làm mới trang và thử lại.');
        } else {
          showError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error unfriending:', error);
      const errorData = error.response?.data || {};
      const errorStatusCode = errorData.statusCode;
      const errorMessage = errorData.message || error.message || 'Đã xảy ra lỗi khi hủy kết bạn.';
      
      // Handle success responses that might be in error format
      if (error.response?.status === 200 || errorStatusCode === "AIE20000" || errorStatusCode === "AIE20100") {
        showSuccess(`Đã hủy kết bạn với ${profileData.name || 'người dùng này'}`);
        setTimeout(() => {
          navigate(PATH.PROFILE);
        }, 500);
      } else if (errorStatusCode === "AIE40001") {
        showError('ID bạn bè không hợp lệ. Vui lòng làm mới trang và thử lại.');
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsUnfriending(false);
      setUnfriendDialogOpen(false);
    }
  };

  const confirmBlock = async () => {
    if (!friendId) {
      showError('Không tìm thấy ID của bạn bè. Vui lòng thử lại.');
      setBlockDialogOpen(false);
      return;
    }

    // Validate GUID format
    if (!isValidGuid(friendId)) {
      console.error('Invalid GUID format:', friendId);
      showError('ID bạn bè không hợp lệ. Vui lòng làm mới trang và thử lại.');
      setBlockDialogOpen(false);
      return;
    }

    setIsBlocking(true);
    try {
      const response = await friendAPI.blockFriend(friendId);
      
      const statusCode = response?.statusCode;
      const isSuccess = statusCode === "AIE20000" || 
                       statusCode === "AIE20100" ||
                       statusCode === "200" || 
                       statusCode === 200;
      
      if (isSuccess) {
        showSuccess(`Đã chặn ${profileData.name || 'người dùng này'}`);
        // Navigate to profile page after successful block
        setTimeout(() => {
          navigate(PATH.PROFILE);
        }, 1500);
      } else {
        const errorMessage = response?.message || 'Không thể chặn bạn bè. Vui lòng thử lại.';
        if (statusCode === "AIE40001") {
          showError('ID bạn bè không hợp lệ. Vui lòng làm mới trang và thử lại.');
        } else {
          showError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error blocking friend:', error);
      const errorData = error.response?.data || {};
      const errorStatusCode = errorData.statusCode;
      const errorMessage = errorData.message || error.message || 'Đã xảy ra lỗi khi chặn bạn bè.';
      
      // Handle success responses that might be in error format
      if (error.response?.status === 200 || errorStatusCode === "AIE20000" || errorStatusCode === "AIE20100") {
        showSuccess(`Đã chặn ${profileData.name || 'người dùng này'}`);
        setTimeout(() => {
          navigate(PATH.PROFILE);
        }, 500);
      } else if (errorStatusCode === "AIE40001") {
        showError('ID bạn bè không hợp lệ. Vui lòng làm mới trang và thử lại.');
      } else {
        showError(errorMessage);
      }
    } finally {
      setIsBlocking(false);
      setBlockDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
        <div className="max-w-4xl mx-auto mt-4 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-red-600 via-red-500 to-red-400 p-8 text-center">
            <div className="text-white text-lg mb-4">{error}</div>
            <Button
              onClick={() => navigate(-1)}
              className="bg-white/20 text-white hover:bg-white/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Enhanced Profile Header - Rounded corners */}
      <div className="max-w-4xl mx-auto mt-4 rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative">
          <ProfileHeader
            profileData={profileData}
            stats={null} // Hide stats cards for friend profile
            onEditProfile={null} // No edit button for friend profile
          />
          {/* Menu Button */}
          <div className="absolute top-6 right-6 z-20 flex items-center gap-3" ref={menuRef}>
            {/* Action Buttons - Các nút hành động */}
            {friendshipState.type === 'add' && (
              <Button
                onClick={handleAddFriend}
                disabled={isAddingFriend}
                className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isAddingFriend ? 'Đang gửi...' : 'Kết bạn'}
              </Button>
            )}

            {friendshipState.type === 'pending' && (
              <span className="px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm font-medium">
                Lời mời đã gửi
              </span>
            )}

            {friendshipState.type === 'accepted' && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(!menuOpen);
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-md border border-gray-300 hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl"
                  aria-label="Menu"
                >
                  <MoreHorizontal className="w-5 h-5 text-gray-700" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlock();
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-orange-600"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Chặn</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnfriend();
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors text-red-600"
                    >
                      <UserMinus className="w-4 h-4" />
                      <span>Hủy kết bạn</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {friendshipState.type === 'blocked' && (
              <span className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-medium flex items-center gap-2">
                <Ban className="w-4 h-4" />
                Đã chặn
              </span>
            )}
          </div>
        </div>
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Sự kiện chung</h2>
                  <div className="w-16 h-0.5 bg-gray-300"></div>
                </div>
                {profileData.listCommonEvent && profileData.listCommonEvent.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileData.listCommonEvent.map((event, index) => (
                      <div
                        key={index}
                        className="group border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-white"
                      >
                        {/* Image Section - Always show frame even when image is null */}
                        <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-indigo-50 relative overflow-hidden">
                          {event.eventImage ? (
                            <img
                              src={event.eventImage}
                              alt={event.eventName || 'Sự kiện'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Calendar className="w-16 h-16 text-blue-300" />
                            </div>
                          )}
                        </div>
                        
                        {/* Event Info */}
                        <div className="p-5">
                          <h3 className="font-semibold text-lg text-gray-900 mb-4 line-clamp-2">
                            {event.eventName || 'Sự kiện'}
                          </h3>
                          
                          {/* Date */}
                          {event.date && (
                            <div className="flex items-center text-sm text-gray-600 mb-3">
                              <Calendar className="w-4 h-4 mr-2.5 flex-shrink-0 text-blue-500" />
                              <span className="font-medium">
                                {new Date(event.date).toLocaleDateString('vi-VN', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}
                          
                          {/* Address */}
                          {event.address && (
                            <div className="flex items-start text-sm text-gray-600">
                              <MapPin className="w-4 h-4 mr-2.5 flex-shrink-0 text-red-400 mt-0.5" />
                              <span className="line-clamp-2 font-medium">{event.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-700 font-medium text-lg">Chưa có sự kiện chung nào.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'info' && (
              <div className="space-y-4">
                {/* Thông tin nghề nghiệp Card - Compact */}
                {(profileData.occupation || profileData.careerObjective || profileData.website) && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-500" />
                      Thông tin nghề nghiệp
                    </h2>
                    
                    <div className="space-y-2.5">
                      {/* Nghề nghiệp */}
                      {profileData.occupation && profileData.occupation !== "Chưa cập nhật" && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-600">Nghề nghiệp</span>
                          <span className="text-xs font-medium text-gray-900">{profileData.occupation}</span>
                        </div>
                      )}

                      {/* Mục tiêu nghề nghiệp */}
                      {profileData.careerObjective && profileData.careerObjective !== "Chưa cập nhật" && (
                        <div className="flex items-start justify-between py-1">
                          <span className="text-xs text-gray-600">Mục tiêu nghề nghiệp</span>
                          <span className="text-xs font-medium text-gray-900 text-right max-w-[60%]">{profileData.careerObjective}</span>
                        </div>
                      )}

                      {/* Website */}
                      {profileData.website && (
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Globe className="w-3.5 h-3.5" />
                            <span className="text-xs">Website</span>
                          </div>
                          <a 
                            href={profileData.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2 break-all max-w-[60%] text-right"
                          >
                            {profileData.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sở thích Card */}
                {profileData.interests && profileData.interests.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-pink-500" />
                      Sở thích
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profileData.interests.map((interest, index) => {
                        // Extract interest name if it's a string that might contain JSON
                        let displayInterest = interest;
                        if (typeof interest === 'string' && interest.includes('InterestName')) {
                          try {
                            const parsed = JSON.parse(interest);
                            displayInterest = parsed.InterestName || parsed.interestName || interest;
                          } catch {
                            // If parsing fails, try to extract from string
                            const match = interest.match(/"InterestName":"([^"]+)"/);
                            displayInterest = match ? match[1] : interest;
                          }
                        }
                        
                        return (
                          <Badge
                            key={index}
                            className="bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100 transition-colors px-2.5 py-0.5 text-xs font-medium"
                          >
                            {displayInterest}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Liên kết mạng xã hội Card - Compact */}
                {(profileData.socialLinks.linkedin || 
                  profileData.socialLinks.github || 
                  profileData.socialLinks.twitter || 
                  profileData.socialLinks.instagram || 
                  profileData.socialLinks.facebook) && (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-500" />
                      Liên kết mạng xã hội
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {profileData.socialLinks.linkedin && (
                        <a
                          href={profileData.socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">LinkedIn</span>
                        </a>
                      )}
                      {profileData.socialLinks.github && (
                        <a
                          href={profileData.socialLinks.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">GitHub</span>
                        </a>
                      )}
                      {profileData.socialLinks.twitter && (
                        <a
                          href={profileData.socialLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-200 text-sky-700 rounded-lg hover:bg-sky-100 transition-colors"
                        >
                          <Twitter className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Twitter</span>
                        </a>
                      )}
                      {profileData.socialLinks.instagram && (
                        <a
                          href={profileData.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-200 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
                        >
                          <Instagram className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Instagram</span>
                        </a>
                      )}
                      {profileData.socialLinks.facebook && (
                        <a
                          href={profileData.socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Facebook className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Facebook</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unfriend Confirmation Dialog */}
      <AlertDialog open={unfriendDialogOpen} onOpenChange={setUnfriendDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hủy kết bạn</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn hủy kết bạn với <strong>{profileData.name || 'người dùng này'}</strong>?
              <br />
              <br />
              Hành động này không thể hoàn tác. Bạn sẽ không còn là bạn của người này nữa!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnfriending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnfriend}
              disabled={isUnfriending}
              className="bg-red-500 hover:bg-red-600 text-white border-2 border-red-500"
            >
              {isUnfriending ? 'Đang xử lý...' : 'Xác nhận hủy kết bạn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Confirmation Dialog */}
      <AlertDialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận chặn người dùng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn chặn <strong>{profileData.name || 'người dùng này'}</strong>?
              <br />
              <br />
              Khi chặn, bạn sẽ không thể nhìn thấy hoạt động của người này và họ cũng không thể nhìn thấy hoạt động của bạn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBlock}
              disabled={isBlocking}
              className="bg-orange-500 hover:bg-orange-600 text-white border-2 border-orange-500"
            >
              {isBlocking ? 'Đang xử lý...' : 'Xác nhận chặn'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FriendDetailPage;

