import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  Modal,
} from 'react-native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import CustomButton from '../../components/common/customButtonRN';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import FriendService from '../../api/services/FriendService';

const FriendDetailScreen = ({ route, navigation }) => {
  const { friendId } = route.params || {};
  const [friendProfile, setFriendProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const [unfriendDialogOpen, setUnfriendDialogOpen] = useState(false);
  const [isUnfriending, setIsUnfriending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  
  // Common events pagination state
  const [commonEvents, setCommonEvents] = useState([]);
  const [commonEventsPagination, setCommonEventsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10
  });
  const [isLoadingCommonEvents, setIsLoadingCommonEvents] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  useEffect(() => {
    if (friendId) {
      fetchFriendProfile();
    } else {
      setError('Friend ID is required');
      setIsLoading(false);
    }
  }, [friendId]);

  // Load common events when tab changes to 'likes'
  useEffect(() => {
    if (activeTab === 'likes' && friendProfile) {
      loadCommonEvents(1);
    }
  }, [activeTab, friendProfile]);

  const fetchFriendProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await FriendService.getFriendProfile(friendId);
      if (result.success && result.data) {
        setFriendProfile(result.data);
        // Don't initialize common events here, wait for tab selection
      } else {
        throw new Error(result.message || 'Failed to fetch friend profile');
      }
    } catch (err) {
      console.error('Error fetching friend profile:', err);
      setError(err.message || 'Không thể tải thông tin bạn bè');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadCommonEvents = (pageNumber = 1) => {
    setIsLoadingCommonEvents(true);
    try {
      const allEvents = friendProfile?.listCommonEvent || [];
      const pageSize = 10;
      const startIndex = (pageNumber - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedEvents = allEvents.slice(startIndex, endIndex);
      
      setCommonEvents(paginatedEvents);
      setCommonEventsPagination({
        currentPage: pageNumber,
        totalPages: Math.ceil(allEvents.length / pageSize),
        totalItems: allEvents.length,
        pageSize: pageSize
      });
    } catch (err) {
      console.error('Error loading common events:', err);
    } finally {
      setIsLoadingCommonEvents(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFriendProfile();
  };

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
  }).filter(skill => skill && skill.trim() !== '');

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
    likes: 0,
    friends: 0
  };

  const handleUnfriend = () => {
    handleCloseMenu();
    Alert.alert(
      'Xác nhận hủy kết bạn',
      `Bạn có chắc chắn muốn hủy kết bạn với ${profileData.name || 'người dùng này'}?\n\nHành động này không thể hoàn tác. Bạn sẽ không còn là bạn của người này nữa!`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận hủy kết bạn',
          style: 'destructive',
          onPress: confirmUnfriend
        }
      ]
    );
  };

  const handleBlockFromMenu = () => {
    handleCloseMenu();
    handleBlock();
  };

  const handleBlock = () => {
    Alert.alert(
      'Xác nhận chặn người dùng',
      `Bạn có chắc chắn muốn chặn ${profileData.name || 'người dùng này'}?\n\nKhi chặn, bạn sẽ không thể nhìn thấy hoạt động của người này và họ cũng không thể nhìn thấy hoạt động của bạn.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận chặn',
          style: 'destructive',
          onPress: confirmBlock
        }
      ]
    );
  };

  const confirmBlock = async () => {
    if (!friendId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID của bạn bè. Vui lòng thử lại.');
      return;
    }

    setIsBlocking(true);
    try {
      const result = await FriendService.blockFriend(friendId);
      
      const statusCode = result?.statusCode || result?.data?.statusCode;
      const isSuccess = statusCode === "AIE20000" || 
                       statusCode === "AIE20100" ||
                       statusCode === "200" || 
                       statusCode === 200;
      
      if (isSuccess) {
        Alert.alert('Thành công', `Đã chặn ${profileData.name || 'người dùng này'}`);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể chặn bạn bè. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error blocking friend:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi chặn bạn bè.');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleOpenMenu = () => {
    setShowActionMenu(true);
  };

  const handleCloseMenu = () => {
    setShowActionMenu(false);
  };

  const confirmUnfriend = async () => {
    if (!friendId) {
      Alert.alert('Lỗi', 'Không tìm thấy ID của bạn bè. Vui lòng thử lại.');
      return;
    }

    setIsUnfriending(true);
    try {
      const result = await FriendService.deleteFriend(friendId);
      
      const statusCode = result?.statusCode || result?.data?.statusCode;
      const isSuccess = statusCode === "AIE20000" || 
                       statusCode === "AIE20100" ||
                       statusCode === "200" || 
                       statusCode === 200;
      
      if (isSuccess) {
        Alert.alert('Thành công', `Đã hủy kết bạn với ${profileData.name || 'người dùng này'}`);
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể hủy kết bạn. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error unfriending:', error);
      Alert.alert('Lỗi', 'Đã xảy ra lỗi khi hủy kết bạn.');
    } finally {
      setIsUnfriending(false);
    }
  };

  const handleSocialLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Error opening URL:', err);
        Alert.alert('Lỗi', 'Không thể mở liên kết này.');
      });
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <CustomText variant="body" color="secondary" style={styles.loadingText}>
          Đang tải thông tin bạn bè...
        </CustomText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <CustomText variant="h3" color="error" style={styles.errorText}>
          {error}
        </CustomText>
        <CustomButton
          title="Quay lại"
          onPress={() => navigation.goBack()}
          variant="outline"
          size="medium"
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradientHeaderTitle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <CustomText variant="h3" color="white">←</CustomText>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <CustomText variant="h2" color="white" style={styles.title}>
            Hồ sơ bạn bè
          </CustomText>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeaderCard}>
          <LinearGradient
            colors={Colors.gradientHeaderTitle}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.profileHeaderGradient}
          >
            {/* Menu Button - Top Right */}
            <TouchableOpacity
              style={styles.profileMenuButton}
              onPress={handleOpenMenu}
            >
              <CustomText variant="h3" color="white" style={styles.menuIcon}>⋮</CustomText>
            </TouchableOpacity>

            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                {profileData.avatarImgUrl ? (
                  <Image
                    source={{ uri: profileData.avatarImgUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <CustomText variant="h1" color="white">👤</CustomText>
                  </View>
                )}
              </View>
              <CustomText variant="h2" color="white" style={styles.userName}>
                {profileData.name}
              </CustomText>
              <CustomText variant="body" color="white" style={styles.userLocation}>
                📍 {profileData.city}
              </CustomText>
              <CustomText variant="body" color="white" style={styles.userBio}>
                {profileData.bio}
              </CustomText>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <CustomText variant="h3" color="white" style={styles.statNumber}>
                  {stats.eventsAttended}
                </CustomText>
                <CustomText variant="caption" color="white" style={styles.statLabel}>
                  SỰ KIỆN CHUNG
                </CustomText>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <CustomText
              variant="body"
              color={activeTab === 'info' ? 'primary' : 'secondary'}
              style={styles.tabText}
            >
              Thông tin
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
            onPress={() => setActiveTab('likes')}
          >
            <CustomText
              variant="body"
              color={activeTab === 'likes' ? 'primary' : 'secondary'}
              style={styles.tabText}
            >
              Sự kiện chung
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'info' && (
            <View style={styles.infoContent}>
              {/* Thông tin nghề nghiệp Card */}
              {(profileData.occupation || profileData.careerObjective || profileData.website) && (
                <View style={styles.infoCard}>
                  <CustomText variant="h4" color="primary" style={styles.cardTitle}>
                    💼 Thông tin nghề nghiệp
                  </CustomText>
                  
                  {profileData.occupation && profileData.occupation !== "Chưa cập nhật" && (
                    <View style={styles.infoRow}>
                      <CustomText variant="caption" color="secondary" style={styles.infoLabel}>
                        Nghề nghiệp
                      </CustomText>
                      <CustomText variant="body" color="primary" style={styles.infoValue}>
                        {profileData.occupation}
                      </CustomText>
                    </View>
                  )}

                  {profileData.careerObjective && profileData.careerObjective !== "Chưa cập nhật" && (
                    <View style={styles.infoRow}>
                      <CustomText variant="caption" color="secondary" style={styles.infoLabel}>
                        Mục tiêu nghề nghiệp
                      </CustomText>
                      <CustomText variant="body" color="primary" style={styles.infoValue}>
                        {profileData.careerObjective}
                      </CustomText>
                    </View>
                  )}

                  {profileData.website && (
                    <TouchableOpacity
                      style={styles.infoRow}
                      onPress={() => handleSocialLink(profileData.website)}
                    >
                      <CustomText variant="caption" color="secondary" style={styles.infoLabel}>
                        Website
                      </CustomText>
                      <CustomText variant="body" color="primary" style={[styles.infoValue, styles.link]}>
                        {profileData.website}
                      </CustomText>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Sở thích Card */}
              {profileData.interests && profileData.interests.length > 0 && (
                <View style={styles.infoCard}>
                  <CustomText variant="h4" color="primary" style={styles.cardTitle}>
                    ✨ Sở thích
                  </CustomText>
                  <View style={styles.interestsContainer}>
                    {profileData.interests.map((interest, index) => (
                      <View key={index} style={styles.interestTag}>
                        <CustomText variant="caption" color="primary">
                          {interest}
                        </CustomText>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Liên kết mạng xã hội Card */}
              {(profileData.socialLinks.linkedin || 
                profileData.socialLinks.github || 
                profileData.socialLinks.twitter || 
                profileData.socialLinks.instagram || 
                profileData.socialLinks.facebook) && (
                <View style={styles.infoCard}>
                  <CustomText variant="h4" color="primary" style={styles.cardTitle}>
                    🌐 Liên kết mạng xã hội
                  </CustomText>
                  <View style={styles.socialLinksContainer}>
                    {profileData.socialLinks.linkedin && (
                      <TouchableOpacity
                        style={styles.socialLink}
                        onPress={() => handleSocialLink(profileData.socialLinks.linkedin)}
                      >
                        <CustomText variant="caption" color="primary">LinkedIn</CustomText>
                      </TouchableOpacity>
                    )}
                    {profileData.socialLinks.github && (
                      <TouchableOpacity
                        style={styles.socialLink}
                        onPress={() => handleSocialLink(profileData.socialLinks.github)}
                      >
                        <CustomText variant="caption" color="primary">GitHub</CustomText>
                      </TouchableOpacity>
                    )}
                    {profileData.socialLinks.twitter && (
                      <TouchableOpacity
                        style={styles.socialLink}
                        onPress={() => handleSocialLink(profileData.socialLinks.twitter)}
                      >
                        <CustomText variant="caption" color="primary">Twitter</CustomText>
                      </TouchableOpacity>
                    )}
                    {profileData.socialLinks.instagram && (
                      <TouchableOpacity
                        style={styles.socialLink}
                        onPress={() => handleSocialLink(profileData.socialLinks.instagram)}
                      >
                        <CustomText variant="caption" color="primary">Instagram</CustomText>
                      </TouchableOpacity>
                    )}
                    {profileData.socialLinks.facebook && (
                      <TouchableOpacity
                        style={styles.socialLink}
                        onPress={() => handleSocialLink(profileData.socialLinks.facebook)}
                      >
                        <CustomText variant="caption" color="primary">Facebook</CustomText>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'likes' && (
            <View style={styles.eventsContent}>
              {isLoadingCommonEvents ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <CustomText variant="body" color="secondary" style={styles.loadingText}>
                    Đang tải sự kiện...
                  </CustomText>
                </View>
              ) : commonEvents.length > 0 ? (
                <>
                  <View style={styles.eventsList}>
                    {commonEvents.map((event, index) => {
                      const eventId = event.eventId || event.id;
                      return (
                        <TouchableOpacity
                          key={eventId || index}
                          style={styles.eventListItem}
                          onPress={() => {
                            navigation.navigate('EventDetailScreen', { eventId });
                          }}
                        >
                          {/* Event Image - Left Side */}
                          <View style={styles.eventListImageContainer}>
                            {event.eventImage ? (
                              <Image
                                source={{ uri: event.eventImage }}
                                style={styles.eventListImage}
                              />
                            ) : (
                              <View style={styles.eventListImagePlaceholder}>
                                <CustomText variant="h2" color="secondary">📅</CustomText>
                              </View>
                            )}
                          </View>
                          
                          {/* Event Info - Right Side */}
                          <View style={styles.eventListInfo}>
                            <CustomText variant="h4" color="primary" style={styles.eventListName} numberOfLines={2}>
                              {event.eventName || 'Sự kiện'}
                            </CustomText>
                            
                            {event.date && (
                              <View style={styles.eventListDetailRow}>
                                <CustomText variant="caption" color="secondary" style={styles.eventListIcon}>📅</CustomText>
                                <CustomText variant="caption" color="secondary" style={styles.eventListDetailText} numberOfLines={1}>
                                  {formatDate(event.date)}
                                </CustomText>
                              </View>
                            )}
                            
                            {event.address && (
                              <View style={styles.eventListDetailRow}>
                                <CustomText variant="caption" color="secondary" style={styles.eventListIcon}>📍</CustomText>
                                <CustomText variant="caption" color="secondary" style={styles.eventListDetailText} numberOfLines={1}>
                                  {event.address}
                                </CustomText>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  
                  {/* Pagination */}
                  {commonEventsPagination.totalPages > 1 && (
                    <View style={styles.pagination}>
                      <CustomButton
                        title="Trước"
                        onPress={() => loadCommonEvents(commonEventsPagination.currentPage - 1)}
                        disabled={commonEventsPagination.currentPage === 1}
                        variant="outline"
                        size="small"
                      />
                      <CustomText variant="body" color="secondary" style={styles.paginationText}>
                        Trang {commonEventsPagination.currentPage} / {commonEventsPagination.totalPages}
                      </CustomText>
                      <CustomButton
                        title="Sau"
                        onPress={() => loadCommonEvents(commonEventsPagination.currentPage + 1)}
                        disabled={commonEventsPagination.currentPage === commonEventsPagination.totalPages}
                        variant="outline"
                        size="small"
                      />
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <CustomText variant="h1" color="secondary">📅</CustomText>
                  <CustomText variant="h3" color="primary" style={styles.emptyStateTitle}>
                    Chưa có sự kiện chung nào
                  </CustomText>
                  <CustomText variant="body" color="secondary" style={styles.emptyStateDescription}>
                    Bạn và người này chưa có sự kiện nào chung
                  </CustomText>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Menu Modal */}
      <Modal
        visible={showActionMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={handleCloseMenu}
        >
          <View style={styles.menuContainer} onStartShouldSetResponder={() => true}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleUnfriend}
              disabled={isUnfriending}
            >
              {isUnfriending ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <CustomText variant="body" color="error" style={styles.menuItemText}>
                  Xóa kết bạn
                </CustomText>
              )}
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleBlockFromMenu}
              disabled={isBlocking}
            >
              {isBlocking ? (
                <ActivityIndicator size="small" color={Colors.warning} />
              ) : (
                <CustomText variant="body" color="warning" style={styles.menuItemText}>
                  🚫 Chặn
                </CustomText>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default FriendDetailScreen;

