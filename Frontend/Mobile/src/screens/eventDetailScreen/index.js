import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import RenderHtml from 'react-native-render-html';
import Toast from 'react-native-toast-message';

import styles from './styles'; 
import CustomText from '../../components/common/customTextRN';
import CustomButton from '../../components/common/customButtonRN';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';

import { useEvents } from '../../hooks/useEvents';
import EventService from '../../api/services/EventService';
import FriendService from '../../api/services/FriendService';
import AuthService from '../../api/services/AuthService';
import { isStaffUser } from '../../utils/jwtUtils';


import RatingSectionMobile from '../../components/presentation/RatingSectionMobile';
import EventTimeline from '../../components/presentation/EventTimeline';
import EventShareSection from '../../components/presentation/eventDetail/EventShareSection';
import EventInviteFriendsModal from '../../components/presentation/eventDetail/EventInviteFriendsModal';
import EventActionsSection from '../../components/presentation/eventDetail/EventActionsSection';

const { width } = Dimensions.get('window');

const EventDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params || {};

  const { getEventById } = useEvents();
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const accessToken = useSelector((state) => state.auth.accessToken);

  const [event, setEvent] = useState(null);
  const [isStaff, setIsStaff] = useState(false);

  // Share
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const shareUrl = `https://aievent.vercel.app/event/${eventId}`;

  // Invite friends
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [inviteMessage, setInviteMessage] = useState('Tham gia cùng tôi nhé!');
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);

  // Load event detail
  useEffect(() => {
    if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
      Alert.alert('Lỗi', 'Không có ID sự kiện hợp lệ');
      navigation.goBack();
      return;
    }
    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      const response = await getEventById(eventId);
      if (response?.success && response.data) {
        setEvent(transformEventData(response.data));
      } else {
        throw new Error(response?.message || 'Không tải được sự kiện');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Tải chi tiết sự kiện thất bại');
      navigation.goBack();
    }
  };

  // Check staff
  useEffect(() => {
    const checkStaff = async () => {
      if (!isLoggedIn) return setIsStaff(false);
      const token = accessToken || (await AuthService.getAccessToken());
      if (token) setIsStaff(isStaffUser(token));
    };
    checkStaff();
  }, [isLoggedIn, accessToken]);

  // Load friends for invite modal
  const loadFriends = useCallback(async () => {
    try {
      setLoadingFriends(true);
      const response = await FriendService.getFriends({
        pageNumber: 1,
        pageSize: 100,
        status: 'Accepted',
      });

      if (response.success) {
        let friendsList = [];
        if (Array.isArray(response.data)) friendsList = response.data;
        else if (response.data?.items) friendsList = response.data.items;
        else if (response.data?.Items) friendsList = response.data.Items;

        setFriends(friendsList);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi tải danh sách bạn bè' });
    } finally {
      setLoadingFriends(false);
    }
  }, []);

  const handleOpenInviteModal = () => {
    setSelectedFriends([]);
    setInviteMessage('Tham gia cùng tôi nhé!');
    loadFriends();
    setInviteModalVisible(true);
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const handleSendInvitations = async () => {
    if (selectedFriends.length === 0) {
      Toast.show({ type: 'error', text1: 'Vui lòng chọn ít nhất một bạn bè' });
      return;
    }

    try {
      setSendingInvites(true);
      const response = await EventService.inviteFriends(eventId, selectedFriends, inviteMessage);
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Đã gửi lời mời thành công!' });
        setInviteModalVisible(false);
      } else {
        Toast.show({ type: 'error', text1: response.message || 'Gửi lời mời thất bại' });
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Lỗi khi gửi lời mời' });
    } finally {
      setSendingInvites(false);
    }
  };

  // Helper functions
  const formatTime = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Chưa xác định';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xác định';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Chưa xác định';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const transformEventData = (eventData) => {
    const id = eventData.eventId || eventData.EventId || eventData.id || 'unknown';

    const transformTags = (tags) =>
      Array.isArray(tags)
        ? tags.map((tag) => (typeof tag === 'object' ? tag.tagName || tag.TagName || tag : tag))
        : [];

    const calculatePrice = () => {
      if (eventData.ticketDetails?.length > 0) {
        const prices = eventData.ticketDetails.map((t) => t.ticketPrice || 0);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min === 0 && max === 0) return '0đ';
        if (min === max) return `${min.toLocaleString('vi-VN')}đ`;
        return `${min.toLocaleString('vi-VN')}đ - ${max.toLocaleString('vi-VN')}đ`;
      }
      return '0đ';
    };

    return {
      id,
      eventId: id,
      title: eventData.title || eventData.Title || 'Chưa có tiêu đề',
      description: eventData.description || eventData.Description || 'Chưa có mô tả',
      detailedDescription: eventData.detailedDescription || eventData.DetailedDescription || '',
      date: formatDate(eventData.startTime || eventData.StartTime),
      location: eventData.locationName || eventData.LocationName || 'Chưa xác định',
      address: eventData.address || eventData.Address || '',
      rating: eventData.averageRating ?? 4.5,
      attendees: eventData.soldQuantity || eventData.SoldQuantity || 0,
      totalTickets: eventData.totalTickets || eventData.TotalTickets || 0,
      remainingTickets: eventData.remainingTickets || 0,
      price: calculatePrice(),
      image:
        eventData.imgListEvent?.length > 0
          ? { uri: eventData.imgListEvent[0] }
          : 'card1',
      category:
        eventData.eventCategory?.eventCategoryName ||
        eventData.eventCategory?.EventCategoryName ||
        eventData.eventCategoryName ||
        'Chưa phân loại',
      organizer:
        eventData.organizerEvent?.companyName ||
        eventData.organizerEvent?.CompanyName ||
        'Nhà tổ chức',
      tags: transformTags(eventData.eventTags || eventData.EventTags || eventData.tags || []),
      ticketDetails: eventData.ticketDetails || eventData.TicketDetails || [],
      saleStartTime: eventData.saleStartTime || eventData.SaleStartTime,
      saleEndTime: eventData.saleEndTime || eventData.SaleEndTime,
      startTime: eventData.startTime || eventData.StartTime,
      endTime: eventData.endTime || eventData.EndTime,
    };
  };

  const getTicketSaleStatus = () => {
    if (!event?.saleStartTime || !event?.saleEndTime) return { canBuy: true, message: 'Mua vé ngay' };

    const now = new Date();
    const saleStart = new Date(event.saleStartTime);
    const saleEnd = new Date(event.saleEndTime);

    if (now < saleStart) return { canBuy: false, message: 'Chưa mở bán' };
    if (now > saleEnd) return { canBuy: false, message: 'Hết bán' };
    return { canBuy: true, message: 'Mua vé ngay' };
  };

  const handleJoinEvent = () => {
    const { canBuy, message } = getTicketSaleStatus();
    if (!canBuy) {
      Toast.show({
        type: 'info',
        text1: message === 'Chưa mở bán' ? 'Vé chưa mở bán' : 'Đã hết hạn bán vé',
      });
      return;
    }
    navigation.navigate('BookingScreen', { eventId });
  };

  const handleViewMap = () => {
    if (event?.location) {
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(event.location)}`);
    }
  };



  const getEventImage = () => {
    if (event?.image && typeof event.image === 'object' && event.image.uri) {
      return { uri: event.image.uri };
    }
    const map = {
      card1: Images.event1,
      card2: Images.event2,
      card3: Images.event3,
      card4: Images.event4,
      card5: Images.event5,
    };
    return map[event?.image] || Images.event1;
  };

  const getOrganizerInitials = () => {
    if (!event?.organizer) return 'NT';
    const words = event.organizer.trim().split(' ');
    if (words.length > 1) return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
    return words[0][0].toUpperCase();
  };

  if (!event) {
    return (
      <View style={styles.loadingContainer}>
        <CustomText variant="body" color="secondary" align="center">
          Đang tải...
        </CustomText>
      </View>
    );
  }

  const { canBuy: canBuyTicket, message: ticketMessage } = getTicketSaleStatus();
  const totalAvailableTickets =
    event.remainingTickets || event.totalTickets - (event.attendees || 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image source={getEventImage()} style={styles.eventImage} resizeMode="cover" />
        <View style={styles.imageOverlay} />
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Image source={Images.logout} style={styles.backIcon} />
        </TouchableOpacity>

      </View>

      <View style={styles.content}>
        {/* Title & Rating */}
        <View style={styles.titleSection}>
          <CustomText
            variant="h1"
            color="primary"
            style={{
              fontSize: 26,
              fontWeight: '800',
              fontFamily: Fonts.bold,
              marginBottom: 14,
              lineHeight: 34,
              color: '#1E293B',
            }}>
            {event.title}
          </CustomText>
          <View style={styles.ratingContainer}>
            <Image source={Images.star} style={styles.starIcon} />
            <CustomText variant="body" style={{ fontSize: Fonts.md, fontWeight: '700', marginRight: 6, color: '#F59E0B' }}>
              {event.rating}
            </CustomText>
            <CustomText variant="caption" style={{ fontSize: Fonts.sm, color: '#64748B' }}>
              ({event.attendees} {Strings.EVENT_ATTENDEES_COUNT})
            </CustomText>
          </View>
        </View>

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <CustomText variant="button" color="white" style={{ fontSize: Fonts.lg, fontWeight: '800' }}>
            {event.price}
          </CustomText>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <CustomText variant="h3" style={styles.statValue}>{event.attendees || 0}</CustomText>
            <CustomText variant="body" style={styles.statLabel}>Người tham gia</CustomText>
          </View>
          <View style={styles.statBox}>
            <CustomText variant="h3" style={styles.statValue}>{totalAvailableTickets}</CustomText>
            <CustomText variant="body" style={styles.statLabel}>Vé còn lại</CustomText>
          </View>
          <View style={styles.statBox}>
            <CustomText variant="h3" style={styles.statValue}>{event.ticketDetails?.length || 0}</CustomText>
            <CustomText variant="body" style={styles.statLabel}>Loại vé</CustomText>
          </View>
        </View>

        {/* Organizer */}
        <View style={styles.organizerSection}>
          <View style={styles.organizerAvatar}>
            <CustomText variant="h3" color="white" style={styles.organizerAvatarText}>
              {getOrganizerInitials()}
            </CustomText>
          </View>
          <View style={styles.organizerInfo}>
            <CustomText variant="h4" color="primary" style={styles.organizerName}>
              {event.organizer}
            </CustomText>
            <CustomText variant="body" color="secondary">Nhà tổ chức sự kiện</CustomText>
          </View>
        </View>

        {/* Tags */}
        {event.tags?.length > 0 && (
          <View style={styles.tagsContainer}>
            {event.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <CustomText variant="caption" color="primary" style={styles.tagText}>
                  #{typeof tag === 'object' ? tag.tagName || tag : tag}
                </CustomText>
              </View>
            ))}
          </View>
        )}

        {/* Event Info Details */}
        <View style={styles.detailsSection}>
          <CustomText variant="h3" style={styles.sectionTitle}>Thông tin sự kiện</CustomText>
          <View style={styles.detailRow}>
            <Image source={Images.calendar} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" style={{ fontSize: Fonts.xs, marginBottom: 6, color: '#64748B' }}>
                {Strings.EVENT_DATE}
              </CustomText>
              <CustomText variant="body" style={{ fontSize: Fonts.md, fontWeight: '600', color: '#1E293B' }}>
                {event.date}
              </CustomText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.clock} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" style={{ fontSize: Fonts.xs, marginBottom: 6, color: '#64748B' }}>
                {Strings.EVENT_TIME}
              </CustomText>
              <CustomText variant="body" style={{ fontSize: Fonts.md, fontWeight: '600', color: '#1E293B' }}>
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </CustomText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.location} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" style={{ fontSize: Fonts.xs, marginBottom: 6, color: '#64748B' }}>
                {Strings.EVENT_LOCATION}
              </CustomText>
              <CustomText variant="body" style={{ fontSize: Fonts.md, fontWeight: '600', color: '#1E293B' }}>
                {event.location}
              </CustomText>
              {event.address && (
                <CustomText variant="caption" style={{ fontSize: Fonts.sm, marginTop: 4, color: '#64748B' }}>
                  {event.address}
                </CustomText>
              )}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.profile} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" style={{ fontSize: Fonts.xs, marginBottom: 6, color: '#64748B' }}>
                {Strings.EVENT_ORGANIZER}
              </CustomText>
              <CustomText variant="body" style={{ fontSize: Fonts.md, fontWeight: '600', color: '#1E293B' }}>
                {event.organizer}
              </CustomText>
            </View>
          </View>

          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Image source={Images.calendar} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" style={{ fontSize: Fonts.xs, marginBottom: 6, color: '#64748B' }}>
                {Strings.EVENT_CATEGORY}
              </CustomText>
              <CustomText variant="body" style={{ fontSize: Fonts.md, fontWeight: '600', color: '#1E293B' }}>
                {event.category}
              </CustomText>
            </View>
          </View>
        </View>

        {/* Timeline */}
        {event.saleStartTime && event.saleEndTime && (
          <EventTimeline
            saleStartTime={event.saleStartTime}
            saleEndTime={event.saleEndTime}
            startTime={event.startTime}
            endTime={event.endTime}
          />
        )}

        {/* Ticket Details */}
        {event.ticketDetails?.length > 0 && (
          <View style={styles.detailsSection}>
            <CustomText variant="h3" style={styles.sectionTitle}>Loại vé có sẵn</CustomText>
            {event.ticketDetails.map((ticket, index) => {
              const available = ticket.ticketQuantity - (ticket.soldQuantity || 0);
              return (
                <View
                  key={index}
                  style={[styles.ticketRow, available === 0 && styles.ticketRowUnavailable]}>
                  <View style={styles.ticketInfo}>
                    <CustomText variant="body" style={styles.ticketName}>{ticket.ticketName}</CustomText>
                    {ticket.ticketDescription && (
                      <CustomText variant="caption" style={styles.ticketDescription}>
                        {ticket.ticketDescription}
                      </CustomText>
                    )}
                    <View style={styles.ticketStats}>
                      <CustomText variant="caption" style={styles.ticketStat}>
                        Đã bán: {ticket.soldQuantity || 0}/{ticket.ticketQuantity}
                      </CustomText>
                      <CustomText variant="caption" style={styles.ticketStat}>
                        Còn lại: {available} vé
                      </CustomText>
                    </View>
                  </View>
                  <View style={styles.ticketPriceContainer}>
                    <CustomText variant="body" style={styles.ticketPrice}>
                      {ticket.ticketPrice === 0 ? '0đ' : `${ticket.ticketPrice.toLocaleString('vi-VN')}đ`}
                    </CustomText>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Description */}
        <View style={styles.descriptionSection}>
          <CustomText variant="h3" style={styles.sectionTitle}>{Strings.EVENT_DESCRIPTION}</CustomText>
          {event.detailedDescription ? (
            <RenderHtml
              contentWidth={width - 88}
              source={{ html: event.detailedDescription }}
              baseStyle={{ fontSize: Fonts.md, lineHeight: 26, color: Colors.textPrimary }}
              tagsStyles={{
                p: { marginBottom: 12 },
                img: { maxWidth: '100%', height: 'auto' },
              }}
            />
          ) : (
            <CustomText variant="body" color="secondary">
              {event.description || 'Chưa có mô tả cho sự kiện này.'}
            </CustomText>
          )}
        </View>

        {/* Related Events - giữ nguyên phần hardcode cũ */}
        <View style={styles.relatedEventsSection}>
          <CustomText variant="h3" style={styles.sectionTitle}>Sự kiện liên quan</CustomText>
          {/* Bạn có thể thay bằng FlatList thực tế sau */}
          <View style={styles.relatedEventCard}>
            <Image source={Images.event2} style={styles.relatedEventImage} />
            <View style={styles.relatedEventInfo}>
              <CustomText variant="body" style={styles.relatedEventTitle} numberOfLines={1}>
                Workshop Công nghệ mới 2023
              </CustomText>
              <CustomText variant="caption" style={styles.relatedEventDate}>15 Tháng 12, 2023</CustomText>
              <CustomText variant="caption" style={styles.relatedEventPrice}>250.000đ</CustomText>
            </View>
          </View>
          <View style={styles.relatedEventCard}>
            <Image source={Images.event3} style={styles.relatedEventImage} />
            <View style={styles.relatedEventInfo}>
              <CustomText variant="body" style={styles.relatedEventTitle} numberOfLines={1}>
                Hội thảo AI và Tương lai
              </CustomText>
              <CustomText variant="caption" style={styles.relatedEventDate}>20 Tháng 12, 2023</CustomText>
              <CustomText variant="caption" style={styles.relatedEventPrice}>Miễn phí</CustomText>
            </View>
          </View>
        </View>

        {/* Nút chia sẻ nhanh (không phải staff) */}
        {!isStaff && (
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => setShareModalVisible(true)}
            activeOpacity={0.8}>
            <Image source={Images.share} style={{ width: 24, height: 24, tintColor: Colors.white }} />
            <CustomText variant="button" color="white" style={styles.shareButtonText}>
              Chia sẻ sự kiện
            </CustomText>
          </TouchableOpacity>
        )}

        {/* Các hành động chính */}
        {!isStaff && (
          <EventActionsSection
            canBuyTicket={canBuyTicket}
            ticketMessage={ticketMessage}
            onBuyTicket={handleJoinEvent}
            onOpenInviteModal={handleOpenInviteModal}
            onOpenShareModal={() => setShareModalVisible(true)}
            onViewMap={handleViewMap}
          />
        )}

        {/* Đánh giá */}
        <RatingSectionMobile eventId={eventId} />
      </View>

      {/* Modal Chia sẻ */}
      <EventShareSection
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        eventTitle={event.title}
        shareUrl={shareUrl}
      />

      {/* Modal Mời bạn bè */}
      <EventInviteFriendsModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        friends={friends}
        loadingFriends={loadingFriends}
        selectedFriends={selectedFriends}
        onToggleFriend={toggleFriendSelection}
        inviteMessage={inviteMessage}
        onChangeMessage={setInviteMessage}
        onSendInvites={handleSendInvitations}
        sendingInvites={sendingInvites}
      />
    </ScrollView>
  );
};

export default EventDetailScreen;