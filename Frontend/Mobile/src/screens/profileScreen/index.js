import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { useDispatch } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';
import { UserService } from '../../api/services';
import { logoutUser } from '../../redux/actions/Action';
import { 
  PredefinedSkills, 
  PredefinedLanguages, 
  PredefinedInterests, 
  PredefinedEventTypes, 
  PredefinedCities,
  ParticipationFrequencyDisplay,
  BudgetOptionDisplay,
  ExperienceDisplay,
  ParticipationFrequencyReverse,
  BudgetOptionReverse,
  ExperienceReverse
} from '../../constants/UserConstants';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('tickets');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const hasFetchedProfile = useRef(false);

  const tabs = [
    { id: 'tickets', label: 'Vé của tôi' },
    { id: 'likes', label: 'Yêu thích' },
    { id: 'friends', label: 'Bạn bè' },
    { id: 'history', label: 'Lịch sử' },
    { id: 'settings', label: 'Cài đặt' }
  ];

  const eventTickets = [
    {
      id: 1,
      name: "Vietnam Tech Conference 2024",
      date: "15/3/2024",
      time: "09:00",
      location: "Trung tâm Hội nghị Quốc gia, Đường Thăng Long, Mỹ Đình, Nam Từ Liêm, Hà Nội",
      status: "Có hiệu lực",
      image: "/api/placeholder/300/200"
    }
  ];

  useEffect(() => {
    if (!hasFetchedProfile.current) {
      hasFetchedProfile.current = true;
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await UserService.getProfile();
      
      if (result.success) {
        setProfile(result.data);
      } else {
        // Check if it's an authentication error
        if (result.message && result.message.includes('not authenticated')) {
          setError('Vui lòng đăng nhập lại để xem thông tin cá nhân');
        } else {
          setError(result.message || 'Failed to fetch profile');
        }
      }
    } catch (err) {
      setError('An error occurred while fetching profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchUserProfile();
    setIsRefreshing(false);
  };

  const handleLogoutSuccess = () => {
    console.log('Logout successful');
  };

  const handleEditProfile = () => {
    setIsEditModalOpen(true);
  };

  const handleSettings = () => {
    Alert.alert('Thông báo', 'Chức năng cài đặt sẽ được phát triển trong tương lai');
  };

  const handleNotifications = () => {
    Alert.alert('Thông báo', 'Chức năng thông báo sẽ được phát triển trong tương lai');
  };

  const handleViewQR = (ticketId) => {
    Alert.alert('QR Code', `View QR code for ticket ${ticketId}`);
  };

  const handleViewDetails = (ticketId) => {
    Alert.alert('Ticket Details', `View details for ticket ${ticketId}`);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            try {
              // Dispatch logout action - this will automatically navigate to login screen
              dispatch(logoutUser());
            } catch (error) {
              Alert.alert('Lỗi', 'Có lỗi xảy ra khi đăng xuất');
            }
          },
        },
      ]
    );
  };

  // Transform API data to match component expectations
  const profileData = profile ? {
    name: profile.fullName || "Chưa cập nhật",
    email: profile.email || "Chưa cập nhật",
    phone: profile.phoneNumber || "Chưa cập nhật",
    address: profile.address || "Chưa cập nhật",
    city: profile.city || "Chưa cập nhật",
    website: profile.personalWebsite || "",
    bio: profile.introduction || "Chưa cập nhật giới thiệu",
    jobTitle: profile.jobTitle || "Chưa cập nhật",
    occupation: profile.occupation || "Chưa cập nhật",
    experience: ExperienceDisplay[profile.experience] || "Chưa cập nhật",
    careerObjective: profile.careerGoal || "Chưa cập nhật",
    socialLinks: {
      linkedin: profile.linkedInUrl || "",
      github: profile.gitHubUrl || "",
      twitter: profile.twitterUrl || "",
      instagram: profile.instagramUrl || "",
      facebook: profile.facebookUrl || ""
    },
    skills: (profile.professionalSkills && Array.isArray(profile.professionalSkills)) ? profile.professionalSkills.map(skill => skill.skillsName) : [],
    languages: (profile.languages && Array.isArray(profile.languages)) ? profile.languages.map(language => language.languagesName) : [],
    interests: (profile.userInterests && Array.isArray(profile.userInterests)) ? profile.userInterests.map(interest => interest.interestName) : [],
    eventTypes: (profile.favoriteEventTypes && Array.isArray(profile.favoriteEventTypes)) ? profile.favoriteEventTypes.map(eventType => eventType.favoriteEventTypeName) : [],
    cities: (profile.interestedCities && Array.isArray(profile.interestedCities)) ? profile.interestedCities.map(city => city.cityName) : [],
    participationFrequency: ParticipationFrequencyDisplay[profile.participationFrequency] || "Hàng tháng",
    budgetOptionDisplay: BudgetOptionDisplay[profile.budgetOption] || "Linh hoạt",
    avatarImgUrl: profile.avatarImgUrl || null,
    totalJoinedEvents: profile.totalJoinedEvents || 0,
    totalFavoriteEvents: profile.totalFavoriteEvents || 0,
    totalFriends: profile.totalFriends || 0
  } : {
    name: "Chưa tải được dữ liệu",
    email: "Chưa tải được dữ liệu",
    phone: "Chưa tải được dữ liệu",
    address: "Chưa cập nhật",
    city: "Chưa cập nhật",
    website: "",
    bio: "Đang tải thông tin...",
    jobTitle: "Chưa cập nhật",
    occupation: "Chưa cập nhật",
    experience: "Chưa cập nhật",
    careerObjective: "Chưa cập nhật",
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
    budgetOptionDisplay: "Linh hoạt",
    avatarImgUrl: null,
    totalJoinedEvents: 0,
    totalFavoriteEvents: 0,
    totalFriends: 0
  };


  const stats = {
    eventsAttended: profileData.totalJoinedEvents,
    likes: profileData.totalFavoriteEvents,
    friends: profileData.totalFriends
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeaderCard}>
      <View style={styles.profileHeaderContent}>
        <View style={styles.avatarSection}>
        <View style={styles.avatarContainer}>
            {profileData.avatarImgUrl && profileData.avatarImgUrl.trim() !== '' ? (
              <Image 
                source={{ 
                  uri: profileData.avatarImgUrl,
                  cache: 'force-cache' // Cache the image for better performance
                }} 
                style={styles.avatar}
                onError={(error) => {
                  // Handle avatar load error silently
                }}
                resizeMode="cover"
                defaultSource={Images.avatar1} // Fallback image
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <CustomText variant="h3" color="white" style={styles.avatarText}>
                  {profileData.name.charAt(0).toUpperCase()}
                </CustomText>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
            <CustomText variant="caption" color="white" style={styles.editButtonText}>
              Chỉnh sửa hồ sơ
            </CustomText>
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileInfo}>
          <CustomText variant="h2" color="white" style={styles.userName}>
            {profileData.name}
          </CustomText>
          <CustomText variant="body" color="white" style={styles.userEmail}>
            {profileData.email}
          </CustomText>
          <CustomText variant="body" color="white" style={styles.userRole}>
            {profileData.occupation}
          </CustomText>
          <CustomText variant="body" color="white" style={styles.userLocation}>
            📍 {profileData.address}
        </CustomText>
          <CustomText variant="body" color="white" style={styles.userBio}>
            {profileData.bio}
        </CustomText>
      </View>

        {/* Skills Section */}
        <View style={styles.skillsSection}>
          <CustomText variant="h4" color="white" style={styles.skillsTitle}>
            KỸ NĂNG CHUYÊN MÔN
          </CustomText>
          <View style={styles.skillsContainer}>
            {profileData.skills.slice(0, 3).map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <CustomText variant="caption" color="white">
                  {skill}
                </CustomText>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <CustomText variant="h3" color="white" style={styles.statNumber}>
              {stats.eventsAttended}
            </CustomText>
            <CustomText variant="caption" color="white" style={styles.statLabel}>
              SỰ KIỆN THAM GIA
            </CustomText>
          </View>
          <View style={styles.statCard}>
            <CustomText variant="h3" color="white" style={styles.statNumber}>
              {stats.likes}
            </CustomText>
            <CustomText variant="caption" color="white" style={styles.statLabel}>
              YÊU THÍCH
            </CustomText>
          </View>
          <View style={styles.statCard}>
            <CustomText variant="h3" color="white" style={styles.statNumber}>
              {stats.friends}
            </CustomText>
            <CustomText variant="caption" color="white" style={styles.statLabel}>
              BẠN BÈ
            </CustomText>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTabNavigation = () => (
    <View style={styles.tabNavigation}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && styles.activeTabButton
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <CustomText 
              variant="caption" 
              color={activeTab === tab.id ? "white" : "primary"}
              style={[
                styles.tabButtonText,
                activeTab === tab.id && styles.activeTabButtonText
              ]}
            >
              {tab.label}
            </CustomText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tickets':
        return (
          <View style={styles.tabContent}>
            <View style={styles.tabHeader}>
              <CustomText variant="h3" color="primary">
                Vé sự kiện của tôi
              </CustomText>
              <CustomText variant="body" color="secondary">
                3 vé
              </CustomText>
            </View>
            {eventTickets.map((ticket) => (
              <View key={ticket.id} style={styles.ticketCard}>
                <View style={styles.ticketLeft}>
                  <View style={styles.ticketLogo}>
                    <CustomText variant="h4" color="white">
                      H
                    </CustomText>
                  </View>
                  <View style={styles.ticketInfo}>
                    <CustomText variant="body" color="white" style={styles.ticketTitle}>
                      EVENT TICKET
                    </CustomText>
                    <CustomText variant="caption" color="white">
                      Valid Entry Pass
                    </CustomText>
                  </View>
                </View>
                <View style={styles.ticketRight}>
                  <CustomText variant="h4" color="primary" style={styles.eventTitle}>
                    {ticket.name}
                  </CustomText>
                  <View style={styles.ticketStatus}>
                    <View style={styles.statusDot} />
                    <CustomText variant="caption" color="success">
                      {ticket.status}
                    </CustomText>
                  </View>
                  <View style={styles.ticketDetails}>
                    <CustomText variant="caption" color="secondary">
                      📅 {ticket.date} 🕘 {ticket.time}
                    </CustomText>
                    <CustomText variant="caption" color="secondary">
                      📍 {ticket.location}
                    </CustomText>
                  </View>
                </View>
              </View>
            ))}
          </View>
        );
      case 'likes':
        return (
          <View style={styles.tabContent}>
            <CustomText variant="h3" color="primary" style={styles.tabTitle}>
              Sự kiện yêu thích
            </CustomText>
            <CustomText variant="body" color="secondary">
              Chưa có sự kiện yêu thích nào.
            </CustomText>
          </View>
        );
      case 'friends':
        return (
          <View style={styles.tabContent}>
            <CustomText variant="h3" color="primary" style={styles.tabTitle}>
              Bạn bè
            </CustomText>
            <CustomText variant="body" color="secondary">
              Chưa có bạn bè nào.
            </CustomText>
          </View>
        );
      case 'history':
        return (
          <View style={styles.tabContent}>
            <CustomText variant="h3" color="primary" style={styles.tabTitle}>
              Lịch sử hoạt động
            </CustomText>
            <CustomText variant="body" color="secondary">
              Chưa có hoạt động nào.
            </CustomText>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.tabContent}>
            <View style={styles.settingsHeader}>
              <CustomText variant="h3" color="primary" style={styles.settingsTitle}>
                Cài đặt
              </CustomText>
              <CustomText variant="caption" color="secondary" style={styles.settingsSubtitle}>
                Quản lý tài khoản và ứng dụng
              </CustomText>
            </View>
            
            {/* Account Settings Section */}
            <View style={styles.settingsSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconContainer}>
                  <CustomText variant="h4" color="white">👤</CustomText>
                </View>
                <CustomText variant="h4" color="primary" style={styles.sectionTitle}>
                  Tài khoản
                </CustomText>
              </View>
              
              {/* Notifications Setting */}
              <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIconContainer, styles.notificationIcon]}>
                    <CustomText variant="h4" color="white">🔔</CustomText>
                  </View>
                  <View style={styles.settingContent}>
                    <CustomText variant="body" color="primary" style={styles.settingTitle}>
                      Thông báo
                    </CustomText>
                    <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                      Nhận thông báo về sự kiện mới và cập nhật
                    </CustomText>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <View style={styles.toggleSwitch}>
                    <View style={styles.toggleThumb} />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Privacy Setting */}
              <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIconContainer, styles.privacyIcon]}>
                    <CustomText variant="h4" color="white">🔒</CustomText>
                  </View>
                  <View style={styles.settingContent}>
                    <CustomText variant="body" color="primary" style={styles.settingTitle}>
                      Quyền riêng tư
                    </CustomText>
                    <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                      Hiển thị hồ sơ công khai cho người khác
                    </CustomText>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <View style={[styles.toggleSwitch, styles.toggleSwitchActive]}>
                    <View style={[styles.toggleThumb, styles.toggleThumbActive]} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Security Section */}
            <View style={styles.settingsSection}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, styles.securityIconContainer]}>
                  <CustomText variant="h4" color="white">🛡️</CustomText>
                </View>
                <CustomText variant="h4" color="primary" style={styles.sectionTitle}>
                  Bảo mật
                </CustomText>
              </View>
              
              {/* Change Password */}
              <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIconContainer, styles.passwordIcon]}>
                    <CustomText variant="h4" color="white">🔑</CustomText>
                  </View>
                  <View style={styles.settingContent}>
                    <CustomText variant="body" color="primary" style={styles.settingTitle}>
                      Đổi mật khẩu
                    </CustomText>
                    <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                      Cập nhật mật khẩu để bảo vệ tài khoản
                    </CustomText>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <View style={styles.chevronContainer}>
                    <CustomText variant="body" color="secondary" style={styles.chevron}>›</CustomText>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Two-Factor Authentication */}
              <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIconContainer, styles.securityIcon]}>
                    <CustomText variant="h4" color="white">🔐</CustomText>
                  </View>
                  <View style={styles.settingContent}>
                    <CustomText variant="body" color="primary" style={styles.settingTitle}>
                      Xác thực 2 bước
                    </CustomText>
                    <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                      Bảo mật tài khoản với mã xác thực
                    </CustomText>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <View style={[styles.toggleSwitch, styles.toggleSwitchActive]}>
                    <View style={[styles.toggleThumb, styles.toggleThumbActive]} />
                  </View>
                </View>
              </TouchableOpacity>

              {/* Logout */}
              <TouchableOpacity 
                style={[styles.settingCard, styles.logoutCard]} 
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIconContainer, styles.logoutIconContainer]}>
                    <CustomText variant="h4" color="white">🚪</CustomText>
                  </View>
                  <View style={styles.settingContent}>
                    <CustomText variant="body" color="error" style={styles.settingTitle}>
                      Đăng xuất
                    </CustomText>
                    <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                      Đăng xuất khỏi tài khoản hiện tại
                    </CustomText>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <View style={styles.chevronContainer}>
                    <CustomText variant="body" color="error" style={styles.chevron}>›</CustomText>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* App Info Section */}
            <View style={styles.settingsSection}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, styles.appIconContainer]}>
                  <CustomText variant="h4" color="white">📱</CustomText>
                </View>
                <CustomText variant="h4" color="primary" style={styles.sectionTitle}>
                  Ứng dụng
                </CustomText>
              </View>
              
              <View style={styles.settingCard}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIconContainer, styles.infoIcon]}>
                    <CustomText variant="h4" color="white">ℹ️</CustomText>
                  </View>
                  <View style={styles.settingContent}>
                    <CustomText variant="body" color="primary" style={styles.settingTitle}>
                      Phiên bản
                    </CustomText>
                    <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                      AIEvent v1.0.0 (Build 1001)
                    </CustomText>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <View style={styles.versionBadge}>
                    <CustomText variant="caption" color="white" style={styles.versionText}>
                      Mới nhất
                    </CustomText>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.settingCard} activeOpacity={0.7}>
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIconContainer, styles.helpIcon]}>
                    <CustomText variant="h4" color="white">❓</CustomText>
                  </View>
                  <View style={styles.settingContent}>
                    <CustomText variant="body" color="primary" style={styles.settingTitle}>
                      Trợ giúp & Hỗ trợ
                    </CustomText>
                    <CustomText variant="caption" color="secondary" style={styles.settingDescription}>
                      FAQ, liên hệ và hướng dẫn sử dụng
                    </CustomText>
                  </View>
                </View>
                <View style={styles.settingRight}>
                  <View style={styles.chevronContainer}>
                    <CustomText variant="body" color="secondary" style={styles.chevron}>›</CustomText>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <CustomText variant="body" color="secondary" style={styles.loadingText}>
          Đang tải thông tin cá nhân...
        </CustomText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <CustomText variant="h3" color="error">
          Lỗi khi tải thông tin
        </CustomText>
        <CustomText variant="body" color="secondary">
          {error}
        </CustomText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserProfile}>
          <CustomText variant="body" color="white">
            Thử lại
          </CustomText>
        </TouchableOpacity>
        {error.includes('đăng nhập') && (
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: Colors.secondary, marginTop: 8 }]} 
            onPress={() => {
              // Navigate to login screen
              // TODO: Add navigation logic here
            }}
          >
            <CustomText variant="body" color="white">
              Đăng nhập
            </CustomText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}
        {renderTabNavigation()}
        {renderTabContent()}
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <EditProfileModal
          profileData={profileData}
          originalProfile={profile}
          isUpdating={isUpdating}
          onClose={() => setIsEditModalOpen(false)}
          onSave={async (updatedData) => {
            try {
              setIsUpdating(true);
              const result = await UserService.updateProfile(updatedData);
              if (result.success) {
                await fetchUserProfile();
                setIsEditModalOpen(false);
                Alert.alert('Thành công', 'Cập nhật hồ sơ thành công');
              } else {
                Alert.alert('Lỗi', result.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
              }
            } catch (error) {
              Alert.alert('Lỗi', `Có lỗi xảy ra khi cập nhật hồ sơ: ${error.message}`);
            } finally {
              setIsUpdating(false);
            }
          }}
        />
      </Modal>
    </View>
  );
};

// Edit Profile Modal Component
const EditProfileModal = ({ profileData, originalProfile, isUpdating, onClose, onSave }) => {
  const [activeSection, setActiveSection] = useState('basic');
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newEventType, setNewEventType] = useState('');
  const [showParticipationDropdown, setShowParticipationDropdown] = useState(false);
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [showExperienceDropdown, setShowExperienceDropdown] = useState(false);
  const [formData, setFormData] = useState({
    name: profileData.name || '',
    email: profileData.email || '',
    phone: profileData.phone || '',
    address: profileData.address || '',
    city: profileData.city || '',
    website: profileData.website || '',
    bio: profileData.bio || '',
    jobTitle: profileData.jobTitle || '',
    occupation: profileData.occupation || '',
    experience: ExperienceReverse[profileData.experience] || 'None',
    careerObjective: profileData.careerObjective || '',
    socialLinks: profileData.socialLinks || {},
    skills: Array.isArray(profileData.skills) ? profileData.skills : [],
    languages: Array.isArray(profileData.languages) ? profileData.languages : [],
    interests: Array.isArray(profileData.interests) ? profileData.interests : [],
    cities: Array.isArray(profileData.cities) ? profileData.cities : [],
    eventTypes: Array.isArray(profileData.eventTypes) ? profileData.eventTypes : [],
    participationFrequency: ParticipationFrequencyReverse[profileData.participationFrequency] || 'Monthly',
    budgetOption: BudgetOptionReverse[profileData.budgetOptionDisplay] || 'Flexible',
    isEmailNotificationEnabled: true,
    isPushNotificationEnabled: true,
    isSmsNotificationEnabled: false,
    latitude: '',
    longitude: '',
    avatarImage: null,
    avatarImgUrl: profileData.avatarImgUrl || ''
  });


  const sections = [
    { id: 'basic', label: 'Thông tin cơ bản', icon: '👤' },
    { id: 'professional', label: 'Nghề nghiệp', icon: '💼' },
    { id: 'social', label: 'Mạng xã hội', icon: '🌐' },
    { id: 'skills', label: 'Kỹ năng & Sở thích', icon: '🔧' },
    { id: 'preferences', label: 'Tùy chọn sự kiện', icon: '📅' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addArrayItem = (field, value, setter) => {
    const trimmedValue = value.trim();
    if (trimmedValue && !formData[field].includes(trimmedValue)) {
      const newArray = [...formData[field], trimmedValue];
      handleArrayChange(field, newArray);
      setter('');
    }
  };

  const removeArrayItem = (field, index) => {
    const updatedArray = formData[field].filter((_, i) => i !== index);
    handleArrayChange(field, updatedArray);
  };

  const handleSocialLinkChange = (platform, value) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  };

  const handleAvatarChange = async () => {
    try {
      // Request permission first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission Required', 
          'Permission to access camera roll is required!',
          [
            {
              text: 'Use Default Avatar',
              onPress: () => {
                setFormData(prev => ({
                  ...prev,
                  avatarImgUrl: 'https://via.placeholder.com/150/007bff/ffffff?text=' + formData.name.charAt(0),
                  avatarImage: null,
                }));
                Alert.alert('Success', 'Default avatar selected!');
              }
            },
            { text: 'Cancel' }
          ]
        );
        return;
      }

      // Show action sheet
      Alert.alert(
        'Select Avatar',
        'Choose an option',
        [
          {
            text: 'Photo Library',
            onPress: () => pickImage(),
          },
          {
            text: 'Use Default',
            onPress: () => {
              setFormData(prev => ({
                ...prev,
                avatarImgUrl: 'https://via.placeholder.com/150/007bff/ffffff?text=' + formData.name.charAt(0),
                avatarImage: null,
              }));
              Alert.alert('Success', 'Default avatar selected!');
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Avatar change error:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const pickImage = async () => {
    try {
      console.log('Starting image picker with working approach...');
      
      // Use the same approach that worked for testImagePicker
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      console.log('Image picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        console.log('Selected asset:', asset);
        
        setFormData(prev => ({
          ...prev,
          avatarImage: {
            uri: asset.uri,
            type: 'image/jpeg',
            name: 'avatar.jpg',
          },
          avatarImgUrl: asset.uri, // For preview
        }));
        Alert.alert('Success', 'Avatar image selected successfully!');
      } else {
        console.log('Image picker was canceled or no assets');
      }
    } catch (error) {
      console.error('Pick image error:', error);
      Alert.alert(
        'Image Picker Error', 
        'Failed to open image picker. Using default avatar instead.',
        [
          {
            text: 'Use Default',
            onPress: () => {
              setFormData(prev => ({
                ...prev,
                avatarImgUrl: 'https://via.placeholder.com/150/007bff/ffffff?text=' + formData.name.charAt(0),
                avatarImage: null,
              }));
              Alert.alert('Success', 'Default avatar selected!');
            }
          },
          { text: 'Cancel' }
        ]
      );
    }
  };


  const handleSave = async () => {
    try {
      // Transform form data to API format
      const apiData = {
        fullName: formData.name,
        phoneNumber: formData.phone,
        address: formData.address,
        city: formData.city,
        personalWebsite: formData.website,
        introduction: formData.bio,
        jobTitle: formData.jobTitle,
        occupation: formData.occupation,
        careerGoal: formData.careerObjective,
        experience: ExperienceReverse[formData.experience] || formData.experience,
        linkedInUrl: formData.socialLinks.linkedin,
        gitHubUrl: formData.socialLinks.github,
        twitterUrl: formData.socialLinks.twitter,
        facebookUrl: formData.socialLinks.facebook,
        instagramUrl: formData.socialLinks.instagram,
        professionalSkills: formData.skills.map(skill => ({ skillsName: skill })),
        languages: formData.languages.map(language => ({ languagesName: language })),
        userInterests: formData.interests.map(interest => ({ interestName: interest })),
        interestedCities: formData.cities.map(city => ({ cityName: city })),
        favoriteEventTypes: formData.eventTypes.map(eventType => ({ favoriteEventTypeName: eventType })),
        participationFrequency: ParticipationFrequencyReverse[formData.participationFrequency] || formData.participationFrequency,
        budgetOption: BudgetOptionReverse[formData.budgetOption] || formData.budgetOption,
        isEmailNotificationEnabled: formData.isEmailNotificationEnabled,
        isPushNotificationEnabled: formData.isPushNotificationEnabled,
        isSmsNotificationEnabled: formData.isSmsNotificationEnabled,
        latitude: formData.latitude,
        longitude: formData.longitude,
        avatarImage: formData.avatarImage
      };

      await onSave(apiData);
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi cập nhật hồ sơ');
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'basic':
        return (
          <View style={styles.editSection}>
            {/* Avatar Section */}
            <View style={styles.avatarEditSection}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Ảnh đại diện
              </CustomText>
              <View style={styles.avatarEditContainer}>
                <View style={styles.avatarEditPreview}>
                  {formData.avatarImgUrl ? (
                    <Image 
                      source={{ uri: formData.avatarImgUrl }} 
                      style={styles.avatarEditImage}
                      onError={() => {
                        console.log('Edit avatar image failed to load');
                      }}
                    />
                  ) : (
                    <View style={styles.avatarEditPlaceholder}>
                      <CustomText variant="h3" color="primary">
                        {formData.name.charAt(0).toUpperCase()}
                      </CustomText>
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  style={styles.avatarEditButton} 
                  onPress={handleAvatarChange}
                >
                  <CustomText variant="caption" color="white">
                    Thay đổi ảnh
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Họ và tên *
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="Nhập họ và tên đầy đủ"
              />
            </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Email *
              </CustomText>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={formData.email}
                editable={false}
                placeholder="example@email.com"
              />
              <CustomText variant="caption" color="secondary">
                Email không thể chỉnh sửa
              </CustomText>
            </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Số điện thoại
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                placeholder="+84 123 456 789"
              />
            </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Địa chỉ
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.address}
                onChangeText={(value) => handleInputChange('address', value)}
                placeholder="Quận 1, Hồ Chí Minh"
              />
            </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Website cá nhân
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.website}
                onChangeText={(value) => handleInputChange('website', value)}
                placeholder="https://example.com"
              />
            </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Giới thiệu bản thân
              </CustomText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.bio}
                onChangeText={(value) => handleInputChange('bio', value)}
                placeholder="Mô tả ngắn gọn về bản thân..."
                multiline
                numberOfLines={4}
              />
              <CustomText variant="caption" color="secondary">
                {formData.bio.length}/500 ký tự
              </CustomText>
            </View>
          </View>
        );
      case 'professional':
        return (
          <View style={styles.editSection}>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Chức danh
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.jobTitle}
                onChangeText={(value) => handleInputChange('jobTitle', value)}
                placeholder="Ví dụ: Senior Developer, Product Manager..."
              />
            </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Ngành nghề
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.occupation}
                onChangeText={(value) => handleInputChange('occupation', value)}
                placeholder="Ví dụ: Công nghệ thông tin, Marketing, Tài chính..."
              />
            </View>
             <View style={styles.formGroup}>
               <CustomText variant="body" color="primary" style={styles.label}>
                 Kinh nghiệm làm việc
               </CustomText>
               <TouchableOpacity 
                 style={styles.pickerContainer}
                 onPress={() => setShowExperienceDropdown(!showExperienceDropdown)}
               >
                 <CustomText variant="body" color="primary">
                   {ExperienceDisplay[formData.experience] || formData.experience}
                 </CustomText>
                 <CustomText variant="body" color="secondary">▼</CustomText>
               </TouchableOpacity>
               {showExperienceDropdown && (
                 <View style={styles.dropdown}>
                   <ScrollView showsVerticalScrollIndicator={false}>
                     {Object.entries(ExperienceDisplay).map(([key, value], index) => {
                       const isLastItem = index === Object.entries(ExperienceDisplay).length - 1;
                       return (
                         <TouchableOpacity
                           key={key}
                           style={[
                             isLastItem ? styles.dropdownItem : styles.dropdownItemWithBorder,
                             formData.experience === key && styles.selectedDropdownItem
                           ]}
                           onPress={() => {
                             handleInputChange('experience', key);
                             setShowExperienceDropdown(false);
                           }}
                           activeOpacity={0.7}
                         >
                           <CustomText 
                             variant="body" 
                             color={formData.experience === key ? "white" : "primary"}
                           >
                             {value}
                           </CustomText>
                         </TouchableOpacity>
                       );
                     })}
                   </ScrollView>
                 </View>
               )}
             </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Mục tiêu nghề nghiệp
              </CustomText>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.careerObjective}
                onChangeText={(value) => handleInputChange('careerObjective', value)}
                placeholder="Mô tả mục tiêu nghề nghiệp..."
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );
      case 'social':
        return (
          <View style={styles.editSection}>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                LinkedIn
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.socialLinks.linkedin}
                onChangeText={(value) => handleSocialLinkChange('linkedin', value)}
                placeholder="https://linkedin.com/username"
              />
            </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                GitHub
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.socialLinks.github}
                onChangeText={(value) => handleSocialLinkChange('github', value)}
                placeholder="https://github.com/username"
              />
            </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Twitter
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.socialLinks.twitter}
                onChangeText={(value) => handleSocialLinkChange('twitter', value)}
                placeholder="https://twitter.com/username"
              />
            </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Instagram
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.socialLinks.instagram}
                onChangeText={(value) => handleSocialLinkChange('instagram', value)}
                placeholder="https://instagram.com/username"
              />
            </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Facebook
              </CustomText>
              <TextInput
                style={styles.input}
                value={formData.socialLinks.facebook}
                onChangeText={(value) => handleSocialLinkChange('facebook', value)}
                placeholder="https://facebook.com/username"
              />
            </View>
          </View>
        );
      case 'skills':
        return (
          <View style={styles.editSection}>
            {/* Professional Skills */}
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Kỹ năng chuyên môn
              </CustomText>
               <View style={styles.editSkillsContainer}>
                 {formData.skills && formData.skills.length > 0 ? (
                   formData.skills.map((skill, index) => (
                     <View key={index} style={styles.editSkillTag}>
                       <CustomText variant="caption" color="white">
                         {skill}
                       </CustomText>
                       <TouchableOpacity
                         style={styles.editRemoveButton}
                         onPress={() => removeArrayItem('skills', index)}
                       >
                         <CustomText variant="caption" color="white">×</CustomText>
                       </TouchableOpacity>
                     </View>
                   ))
                 ) : (
                   <CustomText variant="caption" color="secondary" style={{ fontStyle: 'italic' }}>
                     Chưa có kỹ năng nào
                   </CustomText>
                 )}
               </View>
              <View style={styles.addSkillContainer}>
                <TextInput
                  style={styles.addSkillInput}
                  placeholder="Thêm kỹ năng mới..."
                  value={newSkill}
                  onChangeText={setNewSkill}
                  onSubmitEditing={() => addArrayItem('skills', newSkill, setNewSkill)}
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => addArrayItem('skills', newSkill, setNewSkill)}
                >
                  <CustomText variant="caption" color="white">+ Thêm</CustomText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Languages */}
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Ngôn ngữ
              </CustomText>
               <View style={styles.editSkillsContainer}>
                 {formData.languages && formData.languages.length > 0 ? (
                   formData.languages.map((language, index) => (
                     <View key={index} style={styles.editSkillTag}>
                       <CustomText variant="caption" color="white">
                         {language}
                       </CustomText>
                       <TouchableOpacity
                         style={styles.editRemoveButton}
                         onPress={() => removeArrayItem('languages', index)}
                       >
                         <CustomText variant="caption" color="white">×</CustomText>
                       </TouchableOpacity>
                     </View>
                   ))
                 ) : (
                   <CustomText variant="caption" color="secondary" style={{ fontStyle: 'italic' }}>
                     Chưa có ngôn ngữ nào
                   </CustomText>
                 )}
               </View>
              <View style={styles.addSkillContainer}>
                <TextInput
                  style={styles.addSkillInput}
                  placeholder="Thêm ngôn ngữ mới..."
                  value={newLanguage}
                  onChangeText={setNewLanguage}
                  onSubmitEditing={() => addArrayItem('languages', newLanguage, setNewLanguage)}
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => addArrayItem('languages', newLanguage, setNewLanguage)}
                >
                  <CustomText variant="caption" color="white">+ Thêm</CustomText>
                </TouchableOpacity>
              </View>
            </View>

            {/* User Interests */}
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Sở thích cá nhân
              </CustomText>
               <View style={styles.editSkillsContainer}>
                 {formData.interests && formData.interests.length > 0 ? (
                   formData.interests.map((interest, index) => (
                     <View key={index} style={styles.editSkillTag}>
                       <CustomText variant="caption" color="white">
                         {interest}
                       </CustomText>
                       <TouchableOpacity
                         style={styles.editRemoveButton}
                         onPress={() => removeArrayItem('interests', index)}
                       >
                         <CustomText variant="caption" color="white">×</CustomText>
                       </TouchableOpacity>
                     </View>
                   ))
                 ) : (
                   <CustomText variant="caption" color="secondary" style={{ fontStyle: 'italic' }}>
                     Chưa có sở thích nào
                   </CustomText>
                 )}
               </View>
              <View style={styles.addSkillContainer}>
                <TextInput
                  style={styles.addSkillInput}
                  placeholder="Thêm sở thích mới..."
                  value={newInterest}
                  onChangeText={setNewInterest}
                  onSubmitEditing={() => addArrayItem('interests', newInterest, setNewInterest)}
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => addArrayItem('interests', newInterest, setNewInterest)}
                >
                  <CustomText variant="caption" color="white">+ Thêm</CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      case 'preferences':
        return (
          <View style={styles.editSection}>
             <View style={styles.formGroup}>
               <CustomText variant="body" color="primary" style={styles.label}>
                 Tần suất tham gia sự kiện
               </CustomText>
               <TouchableOpacity 
                 style={styles.pickerContainer}
                 onPress={() => setShowParticipationDropdown(!showParticipationDropdown)}
               >
                 <CustomText variant="body" color="primary">
                   {ParticipationFrequencyDisplay[formData.participationFrequency] || formData.participationFrequency}
                 </CustomText>
                 <CustomText variant="body" color="secondary">▼</CustomText>
               </TouchableOpacity>
               {showParticipationDropdown && (
                 <View style={styles.dropdown}>
                   <ScrollView showsVerticalScrollIndicator={false}>
                     {Object.entries(ParticipationFrequencyDisplay).map(([key, value], index) => {
                       const isLastItem = index === Object.entries(ParticipationFrequencyDisplay).length - 1;
                       return (
                         <TouchableOpacity
                           key={key}
                           style={[
                             isLastItem ? styles.dropdownItem : styles.dropdownItemWithBorder,
                             formData.participationFrequency === key && styles.selectedDropdownItem
                           ]}
                           onPress={() => {
                             handleInputChange('participationFrequency', key);
                             setShowParticipationDropdown(false);
                           }}
                           activeOpacity={0.7}
                         >
                           <CustomText 
                             variant="body" 
                             color={formData.participationFrequency === key ? "white" : "primary"}
                           >
                             {value}
                           </CustomText>
                         </TouchableOpacity>
                       );
                     })}
                   </ScrollView>
                 </View>
               )}
             </View>
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Ngân sách cho sự kiện
              </CustomText>
              <TouchableOpacity 
                style={styles.pickerContainer}
                onPress={() => setShowBudgetDropdown(!showBudgetDropdown)}
              >
                <CustomText variant="body" color="primary">
                  {BudgetOptionDisplay[formData.budgetOption] || formData.budgetOption}
                </CustomText>
                <CustomText variant="body" color="secondary">▼</CustomText>
              </TouchableOpacity>
               {showBudgetDropdown && (
                 <View style={styles.dropdown}>
                   <ScrollView showsVerticalScrollIndicator={false}>
                     {Object.entries(BudgetOptionDisplay).map(([key, value], index) => {
                       const isLastItem = index === Object.entries(BudgetOptionDisplay).length - 1;
                       return (
                         <TouchableOpacity
                           key={key}
                           style={[
                             isLastItem ? styles.dropdownItem : styles.dropdownItemWithBorder,
                             formData.budgetOption === key && styles.selectedDropdownItem
                           ]}
                           onPress={() => {
                             handleInputChange('budgetOption', key);
                             setShowBudgetDropdown(false);
                           }}
                           activeOpacity={0.7}
                         >
                           <CustomText 
                             variant="body" 
                             color={formData.budgetOption === key ? "white" : "primary"}
                           >
                             {value}
                           </CustomText>
                         </TouchableOpacity>
                       );
                     })}
                   </ScrollView>
                 </View>
               )}
            </View>

            {/* Interested Cities */}
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Thành phố quan tâm
              </CustomText>
               <View style={styles.editSkillsContainer}>
                 {formData.cities && formData.cities.length > 0 ? (
                   formData.cities.map((city, index) => (
                     <View key={index} style={styles.editSkillTag}>
                       <CustomText variant="caption" color="white">
                         {city}
                       </CustomText>
                       <TouchableOpacity
                         style={styles.editRemoveButton}
                         onPress={() => removeArrayItem('cities', index)}
                       >
                         <CustomText variant="caption" color="white">×</CustomText>
                       </TouchableOpacity>
                     </View>
                   ))
                 ) : (
                   <CustomText variant="caption" color="secondary" style={{ fontStyle: 'italic' }}>
                     Chưa có thành phố nào
                   </CustomText>
                 )}
               </View>
              <View style={styles.addSkillContainer}>
                <TextInput
                  style={styles.addSkillInput}
                  placeholder="Thêm thành phố quan tâm..."
                  value={newCity}
                  onChangeText={setNewCity}
                  onSubmitEditing={() => addArrayItem('cities', newCity, setNewCity)}
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => addArrayItem('cities', newCity, setNewCity)}
                >
                  <CustomText variant="caption" color="white">+ Thêm</CustomText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Favorite Event Types */}
            <View style={styles.formGroup}>
              <CustomText variant="body" color="primary" style={styles.label}>
                Loại sự kiện yêu thích
              </CustomText>
               <View style={styles.editSkillsContainer}>
                 {formData.eventTypes && formData.eventTypes.length > 0 ? (
                   formData.eventTypes.map((eventType, index) => (
                     <View key={index} style={styles.editSkillTag}>
                       <CustomText variant="caption" color="white">
                         {eventType}
                       </CustomText>
                       <TouchableOpacity
                         style={styles.editRemoveButton}
                         onPress={() => removeArrayItem('eventTypes', index)}
                       >
                         <CustomText variant="caption" color="white">×</CustomText>
                       </TouchableOpacity>
                     </View>
                   ))
                 ) : (
                   <CustomText variant="caption" color="secondary" style={{ fontStyle: 'italic' }}>
                     Chưa có loại sự kiện nào
                   </CustomText>
                 )}
               </View>
              <View style={styles.addSkillContainer}>
                <TextInput
                  style={styles.addSkillInput}
                  placeholder="Thêm loại sự kiện yêu thích..."
                  value={newEventType}
                  onChangeText={setNewEventType}
                  onSubmitEditing={() => addArrayItem('eventTypes', newEventType, setNewEventType)}
                />
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => addArrayItem('eventTypes', newEventType, setNewEventType)}
                >
                  <CustomText variant="caption" color="white">+ Thêm</CustomText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      default:
        return null;
    }
  };

   const closeAllDropdowns = () => {
     setShowParticipationDropdown(false);
     setShowBudgetDropdown(false);
     setShowExperienceDropdown(false);
   };

   return (
     <TouchableOpacity 
       style={styles.modalContainer} 
       activeOpacity={1}
       onPress={closeAllDropdowns}
     >
       <View style={styles.modalHeader}>
         <TouchableOpacity onPress={onClose}>
           <CustomText variant="h3" color="primary">✕</CustomText>
         </TouchableOpacity>
         <CustomText variant="h3" color="primary">
           Chỉnh sửa hồ sơ
         </CustomText>
         <View style={{ width: 24 }} />
       </View>

       <TouchableOpacity 
         style={styles.modalContent} 
         activeOpacity={1}
         onPress={(e) => e.stopPropagation()}
       >
         <View style={styles.sidebar}>
           <ScrollView horizontal showsHorizontalScrollIndicator={false}>
             <View style={{ flexDirection: 'row' }}>
               {sections.map((section) => (
                 <TouchableOpacity
                   key={section.id}
                   style={[
                     styles.sidebarItem,
                     activeSection === section.id && styles.activeSidebarItem
                   ]}
                   onPress={() => setActiveSection(section.id)}
                 >
                   <CustomText variant="caption" color={activeSection === section.id ? "white" : "primary"}>
                     {section.icon} {section.label}
                   </CustomText>
                 </TouchableOpacity>
               ))}
             </View>
           </ScrollView>
         </View>

         <ScrollView style={styles.contentArea} showsVerticalScrollIndicator={false}>
           <View style={styles.contentHeader}>
             <CustomText variant="h3" color="primary">
               {sections.find(s => s.id === activeSection)?.label}
             </CustomText>
             <CustomText variant="caption" color="secondary">
               {activeSection === 'basic' && 'Cập nhật thông tin cá nhân cơ bản'}
               {activeSection === 'professional' && 'Thông tin về nghề nghiệp và kinh nghiệm'}
               {activeSection === 'social' && 'Liên kết với các mạng xã hội'}
               {activeSection === 'skills' && 'Kỹ năng, ngôn ngữ và sở thích'}
               {activeSection === 'preferences' && 'Tùy chọn sự kiện và ngân sách'}
             </CustomText>
           </View>
           {renderSectionContent()}
         </ScrollView>
       </TouchableOpacity>

      <View style={styles.modalFooter}>
        <CustomText variant="caption" color="secondary" style={{ textAlign: 'center', marginBottom: 6, fontSize: 12 }}>
          *Lưu ý: Thay đổi sẽ được lưu khi bạn nhấn "Lưu thay đổi".
        </CustomText>
        <View style={styles.modalButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <CustomText variant="body" color="primary">Hủy</CustomText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButton, isUpdating && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.success} />
                <CustomText variant="body" color="white" style={{ marginLeft: 8 }}>
                  Đang cập nhật...
                </CustomText>
              </View>
            ) : (
              <CustomText variant="body" color="white">Lưu thay đổi</CustomText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProfileScreen;
