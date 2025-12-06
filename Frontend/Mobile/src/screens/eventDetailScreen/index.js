import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  Linking,
  Modal,
  StyleSheet,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import RenderHtml from 'react-native-render-html';
import styles from './styles.js';
import CustomText from '../../components/common/customTextRN';
import CustomButton from '../../components/common/customButtonRN';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';
import {useEvents} from '../../hooks/useEvents';
import {
  selectCurrentEvent,
  selectEventsLoading,
  selectEventsError,
} from '../../redux/slices/eventsSlice';
import EventService from '../../api/services/EventService';
import FriendService from '../../api/services/FriendService';
import RatingSectionMobile from '../../components/presentation/RatingSectionMobile';
import AuthService from '../../api/services/AuthService';
import {isStaffUser} from '../../utils/jwtUtils';
// import Clipboard from '@react-native-clipboard/clipboard';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';

const {width} = Dimensions.get('window');

const EventDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();

  // Check if eventId is properly passed in route params
  const {eventId} = route.params || {};

  // Use Redux selectors
  const currentEvent = useSelector(selectCurrentEvent);
  const loading = useSelector(selectEventsLoading);
  const error = useSelector(selectEventsError);
  // Simplify auth state selector to prevent potential issues with custom equality function
  const isLoggedIn = useSelector(state => state.auth.isLoggedIn);
  const accessToken = useSelector(state => state.auth.accessToken);
  
  // Use custom hooks
  const {getEventById} = useEvents();

  const [joining, setJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [event, setEvent] = useState(null);
  const [isStaff, setIsStaff] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [inviteMessage, setInviteMessage] = useState('Tham gia cùng tôi nhé!');
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);

  const shareUrl = `https://yourapp.com/event/${eventId}`;
  
  // Simplify share options - remove complex memoization that might cause issues
  const shareOptions = [
    {
      title: 'Hệ thống',
      onPress: handleShareSystem,
      icon: Images.shareSystem,
    },
    {title: 'Sao chép', onPress: handleCopyLink, icon: Images.copy},
    {title: 'Zalo', onPress: handleShareZalo, icon: Images.zalo},
    {
      title: 'Facebook',
      onPress: handleShareFacebook,
      icon: Images.facebook,
    },
    {
      title: 'Twitter',
      onPress: handleShareTwitter,
      icon: Images.twitter,
    },
    {
      title: 'LinkedIn',
      onPress: handleShareLinkedIn,
      icon: Images.linkedin,
    },
  ];

  const handleShareSystem = useCallback(async () => {
    try {
      await Share.share({
        message: `${event?.title}\n${shareUrl}`,
      });
      Toast.show({
        type: 'success',
        text1: 'Đã chia sẻ!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Không thể chia sẻ',
      });
    }
  }, [event?.title, shareUrl]);

  const handleCopyLink = useCallback(() => {
    Clipboard.setString(shareUrl);
    Toast.show({
      type: 'success',
      text1: 'Đã sao chép link!',
    });
  }, [shareUrl]);

  const handleShareZalo = useCallback(() => {
    const url = `zalo://qr/share?url=${encodeURIComponent(shareUrl)}`;
    Linking.openURL(url).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Zalo không khả dụng',
      });
    });
  }, [shareUrl]);

  const handleShareFacebook = useCallback(() => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    Linking.openURL(url).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Facebook không khả dụng',
      });
    });
  }, [shareUrl]);

  const handleShareTwitter = useCallback(() => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(event?.title || '')}`;
    Linking.openURL(url).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'Twitter không khả dụng',
      });
    });
  }, [shareUrl, event?.title]);

  const handleShareLinkedIn = useCallback(() => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    Linking.openURL(url).catch(() => {
      Toast.show({
        type: 'error',
        text1: 'LinkedIn không khả dụng',
      });
    });
  }, [shareUrl]);

  // Load friends when invite modal opens
  const loadFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      console.log('Loading friends...');
      // Get friends with Accepted status only
      const response = await FriendService.getFriends({ 
        pageNumber: 1, 
        pageSize: 100,
        status: 'Accepted' 
      });
      
      console.log('Friends response:', response);
      
      if (response.success && response.data) {
        // Handle different response structures
        let friendsList = [];
        
        // Check if data is an array directly
        if (Array.isArray(response.data)) {
          friendsList = response.data;
        } 
        // Check if data has items/Items property
        else if (response.data.items) {
          friendsList = response.data.items;
        } 
        else if (response.data.Items) {
          friendsList = response.data.Items;
        }
        // Check if data.data exists (nested structure)
        else if (response.data.data) {
          if (Array.isArray(response.data.data)) {
            friendsList = response.data.data;
          } else if (response.data.data.items) {
            friendsList = response.data.data.items;
          } else if (response.data.data.Items) {
            friendsList = response.data.data.Items;
          }
        }
        
        console.log('Friends list:', friendsList);
        setFriends(friendsList);
        
        if (friendsList.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'Bạn chưa có bạn bè nào',
          });
        }
      } else {
        console.error('Failed to load friends:', response);
        Toast.show({
          type: 'error',
          text1: response.message || 'Không thể tải danh sách bạn bè',
        });
      }
    } catch (error) {
      console.error('Error loading friends:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi tải danh sách bạn bè: ' + (error.message || 'Unknown error'),
      });
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  // Handle opening invite modal
  const handleOpenInviteModal = useCallback(() => {
    setSelectedFriends([]);
    setInviteMessage('Tham gia cùng tôi nhé!');
    setInviteModalVisible(true);
    loadFriends();
  }, [loadFriends]);

  // Toggle friend selection
  const toggleFriendSelection = useCallback((friendId) => {
    setSelectedFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });
  }, []);

  // Send invitations
  const handleSendInvitations = useCallback(async () => {
    if (selectedFriends.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng chọn ít nhất một bạn bè',
      });
      return;
    }

    try {
      setSendingInvites(true);
      const response = await EventService.inviteFriends(
        eventId,
        selectedFriends,
        inviteMessage
      );

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Đã gửi lời mời thành công!',
        });
        setInviteModalVisible(false);
        setSelectedFriends([]);
      } else {
        Toast.show({
          type: 'error',
          text1: response.message || 'Không thể gửi lời mời',
        });
      }
    } catch (error) {
      console.error('Error sending invitations:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi gửi lời mời',
      });
    } finally {
      setSendingInvites(false);
    }
  }, [eventId, selectedFriends, inviteMessage]);

  useEffect(() => {
    // Only load event detail if we have a valid eventId
    if (eventId && typeof eventId === 'string' && eventId.trim() !== '') {
      loadEventDetail();
    } else {
      console.warn('No valid eventId provided in route params:', eventId);
      Alert.alert('Error', 'No valid event ID provided');
      // Delay navigation back to avoid immediate navigation issues
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    }
  }, [eventId]);

  useEffect(() => {
    // If we have a current event from Redux and it matches the eventId, use it
    if (currentEvent && eventId && currentEvent.eventId === eventId) {
      setEvent(transformEventData(currentEvent));
    }
  }, [currentEvent, eventId]);

  // Check user role when component mounts and when auth state changes
  useEffect(() => {
    let isMounted = true;
    
    const checkRole = async () => {
      if (!isMounted) return;
      
      try {
        // Only check user role if we're logged in
        if (!isLoggedIn) {
          // Only update state if it actually changed to prevent unnecessary re-renders
          setIsStaff(prevIsStaff => {
            if (prevIsStaff !== false) {
              return false;
            }
            return prevIsStaff;
          });
          return;
        }
        
        // Only try to get token if we're still mounted
        if (!isMounted) return;
        
        const token = accessToken || await AuthService.getAccessToken();
        // Handle case where token is null/undefined after logout
        if (!token) {
          if (isMounted) {
            setIsStaff(false);
          }
          return;
        }
        
        const staffStatus = isStaffUser(token);
        // Only update state if it actually changed to prevent unnecessary re-renders
        if (isMounted) {
          setIsStaff(prevIsStaff => {
            if (prevIsStaff !== staffStatus) {
              return staffStatus;
            }
            return prevIsStaff;
          });
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        // Only update state if it actually changed to prevent unnecessary re-renders
        if (isMounted) {
          setIsStaff(prevIsStaff => {
            if (prevIsStaff !== false) {
              return false;
            }
            return prevIsStaff;
          });
        }
      }
    };
    
    checkRole();
    
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, accessToken, eventId]);

  const loadEventDetail = async () => {
    try {
      console.log('Loading event detail for ID:', eventId);
      // Only proceed if we have a valid eventId
      if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
        throw new Error('No valid event ID provided');
      }

      const response = await getEventById(eventId);
      console.log('Event detail response:', response);
      if (response && response.success) {
        const transformedEvent = transformEventData(response.data);
        setEvent(transformedEvent);
      } else if (response && response.message) {
        Alert.alert('Error', response.message);
        // Delay navigation back to allow user to see the error message
        setTimeout(() => {
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      console.error('Error loading event detail:', error);
      Alert.alert(
        'Error',
        'Failed to load event details: ' + (error.message || 'Unknown error'),
      );
      // Delay navigation back to allow user to see the error message
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    }
  };

  const transformEventData = eventData => {
    // Ensure we have a valid ID
    const eventId =
      eventData.eventId || eventData.EventId || eventData.id || 'unknown';

    // Transform tags to ensure they are strings
    const transformTags = tags => {
      if (!tags || !Array.isArray(tags)) return [];
      return tags.map(tag => {
        if (typeof tag === 'object') {
          return tag.tagName || tag.TagName || tag.tagId || tag.TagId || 'Tag';
        }
        return tag;
      });
    };

    return {
      id: eventId,
      eventId: eventId,
      title: eventData.title || eventData.Title || 'Chưa có tiêu đề',
      description:
        eventData.description || eventData.Description || 'Chưa có mô tả',
      detailedDescription:
        eventData.detailedDescription || eventData.DetailedDescription || '',
      date:
        eventData.startTime || eventData.StartTime
          ? new Date(
              eventData.startTime || eventData.StartTime,
            ).toLocaleDateString('vi-VN')
          : 'Chưa xác định',
      time:
        eventData.startTime || eventData.StartTime
          ? new Date(
              eventData.startTime || eventData.StartTime,
            ).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})
          : 'Chưa xác định',
      endTime:
        eventData.endTime || eventData.EndTime
          ? new Date(eventData.endTime || eventData.EndTime).toLocaleTimeString(
              'vi-VN',
              {hour: '2-digit', minute: '2-digit'},
            )
          : 'Chưa xác định',
      location:
        eventData.locationName || eventData.LocationName || 'Chưa xác định',
      address: eventData.address || eventData.Address || '',
      rating: eventData.averageRating !== undefined ? eventData.averageRating : 4.5,
      attendees: eventData.soldQuantity || eventData.SoldQuantity || 0,
      totalTickets: eventData.totalTickets || eventData.TotalTickets || 0,
      remainingTickets: eventData.remainingTickets || 0,
      // Fix the price calculation logic
      price: calculateDisplayPrice(eventData),
      image:
        eventData.imgListEvent && eventData.imgListEvent.length > 0
          ? {uri: eventData.imgListEvent[0]}
          : 'card1', // Use actual image if available
      category:
        eventData.eventCategory ?
          (eventData.eventCategory.eventCategoryName || eventData.eventCategory.EventCategoryName) :
          (eventData.eventCategoryName || eventData.EventCategoryName || 'Chưa phân loại'),
      organizer: eventData.organizerEvent
        ? (eventData.organizerEvent.companyName || eventData.organizerEvent.CompanyName || 'Nhà tổ chức')
        : 'Chưa xác định',
      isFavorite: eventData.isFavorite || false,
      tags: transformTags(
        eventData.eventTags || eventData.EventTags || eventData.tags || [],
      ),
      ticketDetails: eventData.ticketDetails || eventData.TicketDetails || [],
    };
  };

  // Calculate display price based on ticket details
  const calculateDisplayPrice = eventData => {
    // If we have ticket details, calculate from them
    if (eventData.ticketDetails && eventData.ticketDetails.length > 0) {
      const prices = eventData.ticketDetails.map(
        ticket => ticket.ticketPrice !== undefined ? ticket.ticketPrice : 0,
      );
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice === 0 && maxPrice === 0) {
        return '0đ';
      } else if (minPrice === maxPrice) {
        return `${minPrice.toLocaleString('vi-VN')}đ`;
      } else {
        return `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`;
      }
    }
    // Default to Miễn phí if no price information
    return '0đ';
  };

  const handleJoinEvent = () => {
    // Check if we have a valid eventId
    if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
      Alert.alert('Error', 'No valid event ID provided');
      return;
    }

    // Navigate to booking screen
    navigation.navigate('BookingScreen', {eventId});
  };

  const handleViewMap = () => {
    // Open map with event location
    if (event && event.location) {
      const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;
      Linking.openURL(mapUrl);
    } else {
      Alert.alert('Error', 'No location information available');
    }
  };

  const handleScanQR = () => {
    // Navigate to QR scanner screen
    navigation.navigate('QrScannerScreen', {eventId});
  };

  const getEventImage = () => {
    // If event has an image URI, use it
    if (
      event &&
      event.image &&
      typeof event.image === 'object' &&
      event.image.uri
    ) {
      return {uri: event.image.uri};
    }

    // If event.image is a string identifier, use the image map
    if (event && typeof event.image === 'string') {
      const imageMap = {
        card1: Images.event1,
        card2: Images.event2,
        card3: Images.event3,
        card4: Images.event4,
        card5: Images.event5,
      };
      return imageMap[event.image] || Images.event1;
    }

    // Default fallback
    return Images.event1;
  };

  // Get organizer initials for avatar
  const getOrganizerInitials = () => {
    if (event && event.organizer) {
      const words = event.organizer.split(' ');
      if (words.length > 1) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
      } else {
        return words[0][0].toUpperCase();
      }
    }
    return 'NT';
  };

  // Use Redux loading state or local loading state
  const isLoading = loading;

  // Show loading state only if we have a valid eventId
  if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
    return (
      <View style={styles.loadingContainer}>
        <CustomText variant="body" color="secondary" align="center">
          Invalid Event ID
        </CustomText>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomText variant="body" color="secondary" align="center">
          {Strings.LOADING}
        </CustomText>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <CustomText variant="h3" color="primary" align="center">
          Event not found
        </CustomText>
        <CustomButton
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    );
  }

  // Calculate available tickets
  const totalAvailableTickets = event.remainingTickets || event.totalTickets - (event.attendees || 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Premium Event Image */}
      <View style={styles.imageContainer}>
        <Image source={getEventImage()} style={styles.eventImage} />
        <View style={styles.imageOverlay} />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}>
          <Image source={Images.logout} style={styles.backIcon} />
        </TouchableOpacity>

        {/* QR Icon for Staff Users - Only visible for staff users */}
        {isStaff && (
          <TouchableOpacity
            style={styles.qrButton}
            onPress={handleScanQR}
            activeOpacity={0.8}>
            <Image source={Images.qrCode} style={styles.qrIcon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Premium Event Info */}
      <View style={styles.content}>
        {/* Title and Rating */}
        <View style={styles.titleSection}>
          <CustomText
            variant="h1"
            color="primary"
            style={{
              fontSize: 28,
              fontWeight: '800',
              fontFamily: Fonts.bold,
              marginBottom: 12,
              lineHeight: 36,
            }}>
            {event.title}
          </CustomText>
          <View style={styles.ratingContainer}>
            <Image source={Images.star} style={styles.starIcon} />
            <CustomText
              variant="body"
              color="primary"
              style={{fontSize: Fonts.md, fontWeight: '700', marginRight: 6}}>
              {event.rating}
            </CustomText>
            <CustomText
              variant="caption"
              color="secondary"
              style={{fontSize: Fonts.sm}}>
              ({event.attendees} {Strings.EVENT_ATTENDEES_COUNT})
            </CustomText>
          </View>
        </View>

        {/* Premium Price Badge */}
        <View style={styles.priceBadge}>
          <CustomText
            variant="button"
            color="white"
            style={{
              fontSize: Fonts.lg,
              fontWeight: '800',
              fontFamily: Fonts.bold,
            }}>
            {event.price}
          </CustomText>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <CustomText variant="h3" color="primary" style={styles.statValue}>
              {event.attendees || 0}
            </CustomText>
            <CustomText
              variant="body"
              color="secondary"
              style={styles.statLabel}>
              Người tham gia
            </CustomText>
          </View>
          <View style={styles.statBox}>
            <CustomText variant="h3" color="primary" style={styles.statValue}>
              {totalAvailableTickets}
            </CustomText>
            <CustomText
              variant="body"
              color="secondary"
              style={styles.statLabel}>
              Vé còn lại
            </CustomText>
          </View>
          <View style={styles.statBox}>
            <CustomText variant="h3" color="primary" style={styles.statValue}>
              {event.ticketDetails?.length || 0}
            </CustomText>
            <CustomText
              variant="body"
              color="secondary"
              style={styles.statLabel}>
              Loại vé
            </CustomText>
          </View>
        </View>

        {/* Organizer Section */}
        <View style={styles.organizerSection}>
          <View style={styles.organizerAvatar}>
            <CustomText
              variant="h3"
              color="white"
              style={styles.organizerAvatarText}>
              {getOrganizerInitials()}
            </CustomText>
          </View>
          <View style={styles.organizerInfo}>
            <CustomText
              variant="h4"
              color="primary"
              style={styles.organizerName}>
              {event.organizer}
            </CustomText>
            <CustomText
              variant="body"
              color="secondary"
              style={styles.organizerEvents}>
              Nhà tổ chức sự kiện
            </CustomText>
          </View>
        </View>

        {/* Tags Section */}
        {event.tags && event.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {event.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <CustomText
                  variant="caption"
                  color="primary"
                  style={styles.tagText}>
                  #
                  {typeof tag === 'object'
                    ? tag.tagName || tag.name || 'Tag'
                    : tag}
                </CustomText>
              </View>
            ))}
          </View>
        )}

        {/* Program Schedule Section */}
        <View style={styles.programSection}>
          <CustomText variant="h3" color="primary" style={styles.sectionTitle}>
            Lịch trình sự kiện
          </CustomText>

          <View style={styles.programItem}>
            <View style={styles.programTime}>
              <CustomText
                variant="caption"
                color="white"
                style={styles.programTimeText}>
                09:00
              </CustomText>
            </View>
            <View style={styles.programContent}>
              <CustomText
                variant="body"
                color="primary"
                style={styles.programTitle}>
                Khai mạc và giới thiệu
              </CustomText>
              <CustomText
                variant="caption"
                color="secondary"
                style={styles.programDescription}>
                Lễ khai mạc và giới thiệu chương trình sự kiện
              </CustomText>
            </View>
          </View>

          <View style={styles.programItem}>
            <View style={styles.programTime}>
              <CustomText
                variant="caption"
                color="white"
                style={styles.programTimeText}>
                10:30
              </CustomText>
            </View>
            <View style={styles.programContent}>
              <CustomText
                variant="body"
                color="primary"
                style={styles.programTitle}>
                Buổi thuyết trình chính
              </CustomText>
              <CustomText
                variant="caption"
                color="secondary"
                style={styles.programDescription}>
                Các bài thuyết trình quan trọng của sự kiện
              </CustomText>
            </View>
          </View>

          <View style={styles.programItem}>
            <View style={styles.programTime}>
              <CustomText
                variant="caption"
                color="white"
                style={styles.programTimeText}>
                12:00
              </CustomText>
            </View>
            <View style={styles.programContent}>
              <CustomText
                variant="body"
                color="primary"
                style={styles.programTitle}>
                Nghỉ trưa và giao lưu
              </CustomText>
              <CustomText
                variant="caption"
                color="secondary"
                style={styles.programDescription}>
                Thời gian nghỉ ngơi và giao lưu với các khách mời
              </CustomText>
            </View>
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <CustomText variant="h3" color="primary" style={styles.benefitsTitle}>
            Lợi ích khi tham gia
          </CustomText>

          <View style={styles.benefitItem}>
            <Image source={Images.check} style={styles.benefitIcon} />
            <CustomText
              variant="body"
              color="primary"
              style={styles.benefitText}>
              Kết nối với chuyên gia trong ngành
            </CustomText>
          </View>

          <View style={styles.benefitItem}>
            <Image source={Images.check} style={styles.benefitIcon} />
            <CustomText
              variant="body"
              color="primary"
              style={styles.benefitText}>
              Học hỏi kiến thức mới và cập nhật
            </CustomText>
          </View>

          <View style={styles.benefitItem}>
            <Image source={Images.check} style={styles.benefitIcon} />
            <CustomText
              variant="body"
              color="primary"
              style={styles.benefitText}>
              Cơ hội nghề nghiệp và việc làm
            </CustomText>
          </View>

          <View style={styles.benefitItem}>
            <Image source={Images.check} style={styles.benefitIcon} />
            <CustomText
              variant="body"
              color="primary"
              style={styles.benefitText}>
              Nhận chứng chỉ tham dự sự kiện
            </CustomText>
          </View>
        </View>

        {/* Premium Event Details */}
        <View style={styles.detailsSection}>
          <CustomText variant="h3" color="primary" style={styles.sectionTitle}>
            Thông tin sự kiện
          </CustomText>

          <View style={styles.detailRow}>
            <Image source={Images.calendar} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText
                variant="caption"
                color="secondary"
                style={{
                  fontSize: Fonts.xs,
                  marginBottom: 4,
                  fontFamily: Fonts.medium,
                }}>
                {Strings.EVENT_DATE}
              </CustomText>
              <CustomText
                variant="body"
                color="primary"
                style={{
                  fontSize: Fonts.md,
                  fontWeight: '600',
                  fontFamily: Fonts.semiBold,
                }}>
                {event.date}
              </CustomText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.clock} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText
                variant="caption"
                color="secondary"
                style={{
                  fontSize: Fonts.xs,
                  marginBottom: 4,
                  fontFamily: Fonts.medium,
                }}>
                {Strings.EVENT_TIME}
              </CustomText>
              <CustomText
                variant="body"
                color="primary"
                style={{
                  fontSize: Fonts.md,
                  fontWeight: '600',
                  fontFamily: Fonts.semiBold,
                }}>
                {event.time} - {event.endTime}
              </CustomText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.location} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText
                variant="caption"
                color="secondary"
                style={{
                  fontSize: Fonts.xs,
                  marginBottom: 4,
                  fontFamily: Fonts.medium,
                }}>
                {Strings.EVENT_LOCATION}
              </CustomText>
              <CustomText
                variant="body"
                color="primary"
                style={{
                  fontSize: Fonts.md,
                  fontWeight: '600',
                  fontFamily: Fonts.semiBold,
                }}>
                {event.location}
              </CustomText>
              {event.address ? (
                <CustomText
                  variant="caption"
                  color="secondary"
                  style={{fontSize: Fonts.sm, marginTop: 2}}>
                  {event.address}
                </CustomText>
              ) : null}
            </View>
          </View>

          {event.organizer && (
            <View style={styles.detailRow}>
              <Image source={Images.profile} style={styles.detailIcon} />
              <View style={styles.detailInfo}>
                <CustomText
                  variant="caption"
                  color="secondary"
                  style={{
                    fontSize: Fonts.xs,
                    marginBottom: 4,
                    fontFamily: Fonts.medium,
                  }}>
                  {Strings.EVENT_ORGANIZER}
                </CustomText>
                <CustomText
                  variant="body"
                  color="primary"
                  style={{
                    fontSize: Fonts.md,
                    fontWeight: '600',
                    fontFamily: Fonts.semiBold,
                  }}>
                  {event.organizer}
                </CustomText>
              </View>
            </View>
          )}

          {event.category && (
            <View
              style={[
                styles.detailRow,
                {borderBottomWidth: 0, marginBottom: 0},
              ]}>
              <Image source={Images.calendar} style={styles.detailIcon} />
              <View style={styles.detailInfo}>
                <CustomText
                  variant="caption"
                  color="secondary"
                  style={{
                    fontSize: Fonts.xs,
                    marginBottom: 4,
                    fontFamily: Fonts.medium,
                  }}>
                  {Strings.EVENT_CATEGORY}
                </CustomText>
                <CustomText
                  variant="body"
                  color="primary"
                  style={{
                    fontSize: Fonts.md,
                    fontWeight: '600',
                    fontFamily: Fonts.semiBold,
                  }}>
                  {event.category}
                </CustomText>
              </View>
            </View>
          )}
        </View>

        {/* Ticket Information Section */}
        {event.ticketDetails && event.ticketDetails.length > 0 && (
          <View style={styles.detailsSection}>
            <CustomText
              variant="h3"
              color="primary"
              style={styles.sectionTitle}>
              Loại vé có sẵn
            </CustomText>
            {event.ticketDetails.map((ticket, index) => {
              const availableTickets =
                ticket.ticketQuantity - (ticket.soldQuantity || 0);
              const isAvailable = availableTickets > 0;

              return (
                <View
                  key={index}
                  style={[
                    styles.ticketRow,
                    !isAvailable && styles.ticketRowUnavailable,
                  ]}>
                  <View style={styles.ticketInfo}>
                    <CustomText
                      variant="body"
                      color="primary"
                      style={styles.ticketName}>
                      {ticket.ticketName}
                    </CustomText>
                    {ticket.ticketDescription ? (
                      <CustomText
                        variant="caption"
                        color="secondary"
                        style={styles.ticketDescription}>
                        {ticket.ticketDescription}
                      </CustomText>
                    ) : null}
                    <View style={styles.ticketStats}>
                      <CustomText
                        variant="caption"
                        color="secondary"
                        style={styles.ticketStat}>
                        Đã bán: {ticket.soldQuantity || 0}/
                        {ticket.ticketQuantity}
                      </CustomText>
                      <CustomText
                        variant="caption"
                        color="secondary"
                        style={styles.ticketStat}>
                        Còn lại: {availableTickets} vé
                      </CustomText>
                    </View>
                  </View>
                  <View style={styles.ticketPriceContainer}>
                    <CustomText
                      variant="body"
                      color="primary"
                      style={styles.ticketPrice}>
                      {ticket.ticketPrice === 0 || ticket.ticketPrice === undefined
                        ? '0đ'
                        : `${ticket.ticketPrice.toLocaleString('vi-VN')}đ`}
                    </CustomText>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Premium Description */}
        <View style={styles.descriptionSection}>
          <CustomText variant="h3" color="primary" style={styles.sectionTitle}>
            {Strings.EVENT_DESCRIPTION}
          </CustomText>
          {event.detailedDescription ? (
            <RenderHtml
              contentWidth={width}
              source={{html: event.detailedDescription}}
              baseStyle={{
                fontSize: Fonts.md,
                lineHeight: 24,
                fontFamily: Fonts.regular,
                color: Colors.textSecondary,
              }}
            />
          ) : (
            <CustomText
              variant="body"
              color="secondary"
              style={{
                fontSize: Fonts.md,
                lineHeight: 24,
                fontFamily: Fonts.regular,
              }}>
              {event.description || 'Chưa có mô tả cho sự kiện này.'}
            </CustomText>
          )}
        </View>

        {/* Related Events Section */}
        <View style={styles.relatedEventsSection}>
          <CustomText variant="h3" color="primary" style={styles.sectionTitle}>
            Sự kiện liên quan
          </CustomText>

          <View style={styles.relatedEventCard}>
            <Image source={Images.event2} style={styles.relatedEventImage} />
            <View style={styles.relatedEventInfo}>
              <CustomText
                variant="body"
                color="primary"
                style={styles.relatedEventTitle}
                numberOfLines={1}>
                Workshop Công nghệ mới 2023
              </CustomText>
              <CustomText
                variant="caption"
                color="secondary"
                style={styles.relatedEventDate}>
                15 Tháng 12, 2023
              </CustomText>
              <CustomText
                variant="caption"
                color="primary"
                style={styles.relatedEventPrice}>
                250.000đ
              </CustomText>
            </View>
          </View>

          <View style={styles.relatedEventCard}>
            <Image source={Images.event3} style={styles.relatedEventImage} />
            <View style={styles.relatedEventInfo}>
              <CustomText
                variant="body"
                color="primary"
                style={styles.relatedEventTitle}
                numberOfLines={1}>
                Hội thảo AI và Tương lai
              </CustomText>
              <CustomText
                variant="caption"
                color="secondary"
                style={styles.relatedEventDate}>
                20 Tháng 12, 2023
              </CustomText>
              <CustomText
                variant="caption"
                color="primary"
                style={styles.relatedEventPrice}>
                Miễn phí
              </CustomText>
            </View>
          </View>
        </View>

        {/* Share Button - Only visible for non-staff users */}
        {!isStaff && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setShareModalVisible(true)}
            activeOpacity={0.8}>
            <Image
              source={Images.share}
              style={{width: 24, height: 24, tintColor: Colors.white}}
            />
            <CustomText
              variant="button"
              color="white"
              style={styles.shareButtonText}>
              Chia sẻ sự kiện
            </CustomText>
          </TouchableOpacity>
        )}

        {/* Premium Action Buttons - Only visible for non-staff users */}
        {!isStaff && (
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleJoinEvent}
              activeOpacity={0.8}>
              <CustomText
                variant="button"
                color="white"
                style={styles.shareButtonText}>
                Đặt vé ngay
              </CustomText>
            </TouchableOpacity>

            <View style={styles.secondaryActions}>
              <CustomButton
                title="Mời bạn bè"
                onPress={handleOpenInviteModal}
                variant="outline"
                style={styles.actionButton}
              />

              <CustomButton
                title={Strings.SHARE_EVENT}
                onPress={() => setShareModalVisible(true)}
                variant="outline"
                style={styles.actionButton}
              />

              <CustomButton
                title={Strings.EVENT_LOCATION_MAP}
                onPress={handleViewMap}
                variant="outline"
                style={styles.actionButton}
              />
            </View>
          </View>
        )}

        {/* Ratings Section */}
        <RatingSectionMobile eventId={eventId} />
      </View>

      {/*Share modal*/}
      {shareModalVisible && (
        <View style={styles.shareOverlay}>
          <TouchableOpacity
            style={styles.shareBackdrop}
            onPress={() => setShareModalVisible(false)}
          />

          <View style={styles.shareContainer}>
            <View style={styles.shareHeader}>
              <CustomText variant="h3" style={{fontWeight: '700'}}>
                Chia sẻ sự kiện
              </CustomText>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Image source={Images.close} style={styles.closeIcon} />
              </TouchableOpacity>
            </View>

            <View style={styles.shareGrid}>
              {shareOptions.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.shareGridItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}>
                  <Image source={item.icon} style={styles.shareGridIcon} />
                  <CustomText variant="caption" style={styles.shareGridText}>
                    {item.title}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Invite Friends Modal */}
      <Modal
        visible={inviteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInviteModalVisible(false)}>
        <View style={styles.inviteModalOverlay}>
          <TouchableOpacity
            style={styles.inviteModalBackdrop}
            activeOpacity={1}
            onPress={() => setInviteModalVisible(false)}
          />
          <View style={styles.inviteModalContent}>
            <View style={styles.inviteModalHeader}>
              <CustomText variant="h3" style={styles.inviteModalTitle}>
                Mời bạn bè
              </CustomText>
              <TouchableOpacity
                onPress={() => setInviteModalVisible(false)}
                style={styles.inviteModalCloseButton}>
                <Image source={Images.close} style={styles.inviteModalCloseIcon} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.inviteModalBody} showsVerticalScrollIndicator={false}>
              {/* Message Input */}
              <View style={styles.inviteMessageContainer}>
                <CustomText variant="body" color="primary" style={styles.inviteMessageLabel}>
                  Tin nhắn mời (tùy chọn)
                </CustomText>
                <TextInput
                  style={styles.inviteMessageInput}
                  placeholder="Nhập tin nhắn mời..."
                  placeholderTextColor={Colors.textLight}
                  value={inviteMessage}
                  onChangeText={setInviteMessage}
                  multiline
                  maxLength={200}
                />
              </View>

              {/* Friends List */}
              <View style={styles.friendsListContainer}>
                <CustomText variant="body" color="primary" style={styles.friendsListTitle}>
                  Chọn bạn bè ({selectedFriends.length} đã chọn)
                </CustomText>
                {loadingFriends ? (
                  <View style={styles.loadingFriendsContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <CustomText variant="body" color="secondary" style={{ marginTop: 12 }}>
                      Đang tải danh sách bạn bè...
                    </CustomText>
                  </View>
                ) : friends.length === 0 ? (
                  <View style={styles.emptyFriendsContainer}>
                    <CustomText variant="body" color="secondary" align="center">
                      Bạn chưa có bạn bè nào
                    </CustomText>
                  </View>
                ) : (
                  friends.map((friend) => {
                    const isSelected = selectedFriends.includes(friend.id);
                    return (
                      <TouchableOpacity
                        key={friend.id}
                        style={[
                          styles.friendItem,
                          isSelected && styles.friendItemSelected,
                        ]}
                        onPress={() => toggleFriendSelection(friend.id)}
                        activeOpacity={0.7}>
                        <View style={styles.friendItemContent}>
                          <View style={styles.friendAvatar}>
                            {friend.image ? (
                              <Image
                                source={{ uri: friend.image }}
                                style={styles.friendAvatarImage}
                              />
                            ) : (
                              <CustomText
                                variant="h4"
                                color="white"
                                style={styles.friendAvatarText}>
                                {friend.friendName?.[0]?.toUpperCase() || 'U'}
                              </CustomText>
                            )}
                          </View>
                          <View style={styles.friendInfo}>
                            <CustomText
                              variant="body"
                              color="primary"
                              style={styles.friendName}>
                              {friend.friendName || 'Người dùng'}
                            </CustomText>
                            {friend.district && (
                              <CustomText
                                variant="caption"
                                color="secondary"
                                style={styles.friendDistrict}>
                                {friend.district}
                              </CustomText>
                            )}
                          </View>
                        </View>
                        {isSelected && (
                          <View style={styles.friendCheckmark}>
                            <CustomText variant="h4" color="white">
                              ✓
                            </CustomText>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.inviteModalFooter}>
              <CustomButton
                title="Hủy"
                onPress={() => setInviteModalVisible(false)}
                variant="outline"
                style={[styles.inviteModalButton, styles.inviteModalCancelButton]}
              />
              <CustomButton
                title={sendingInvites ? 'Đang gửi...' : 'Gửi lời mời'}
                onPress={handleSendInvitations}
                disabled={sendingInvites || selectedFriends.length === 0}
                style={[styles.inviteModalButton, styles.inviteModalSendButton]}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default EventDetailScreen;