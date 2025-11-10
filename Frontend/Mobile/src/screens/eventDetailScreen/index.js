import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  Linking,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
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

  // Use custom hooks
  const {getEventById} = useEvents();

  const [joining, setJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [event, setEvent] = useState(null);

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

    return {
      id: eventId,
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
      rating: eventData.averageRating || 4.5, // Use actual rating if available, otherwise mock
      attendees: eventData.soldQuantity || eventData.SoldQuantity || 0,
      totalTickets: eventData.totalTickets || eventData.TotalTickets || 0,
      // Fix the price calculation logic
      price: calculateDisplayPrice(eventData),
      image:
        eventData.imgListEvent && eventData.imgListEvent.length > 0
          ? {uri: eventData.imgListEvent[0]}
          : 'card1', // Use actual image if available
      category:
        eventData.eventCategoryName ||
        eventData.EventCategoryName ||
        (eventData.eventCategory
          ? eventData.eventCategory.eventCategoryName
          : '') ||
        'Chưa phân loại',
      organizer: eventData.organizerEvent
        ? eventData.organizerEvent.companyName ||
          eventData.organizerEvent.CompanyName ||
          'Nhà tổ chức'
        : 'Chưa xác định',
      isFavorite: eventData.isFavorite || false,
      tags: eventData.tags || eventData.Tags || eventData.eventTags || [],
      ticketDetails: eventData.ticketDetails || eventData.TicketDetails || [],
    };
  };

  // Calculate display price based on ticket details
  const calculateDisplayPrice = eventData => {
    // If we have ticket details, calculate from them
    if (eventData.ticketDetails && eventData.ticketDetails.length > 0) {
      const prices = eventData.ticketDetails.map(
        ticket => ticket.ticketPrice || 0,
      );
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      if (minPrice === 0 && maxPrice === 0) {
        return 'Miễn phí';
      } else if (minPrice === maxPrice) {
        return `${minPrice.toLocaleString('vi-VN')}đ`;
      } else {
        return `${minPrice.toLocaleString('vi-VN')}đ - ${maxPrice.toLocaleString('vi-VN')}đ`;
      }
    }

    // Fallback to direct ticketPrice property
    if (eventData.ticketPrice !== undefined && eventData.ticketPrice > 0) {
      return `${eventData.ticketPrice.toLocaleString('vi-VN')}đ`;
    }

    // Check ticketPricingType
    if (
      eventData.ticketPricingType === 'Free' ||
      eventData.ticketPricingType === 'free'
    ) {
      return 'Miễn phí';
    }

    // Default to Miễn phí if no price information
    return 'Miễn phí';
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

  const handleShareEvent = async () => {
    try {
      // Check if we have a valid eventId
      if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
        Alert.alert('Error', 'No valid event ID provided');
        return;
      }

      const response = await EventService.shareEvent(eventId);
      if (response.success) {
        await Share.share({
          message: `Check out this event: ${event?.title || 'Event'}\n${response.data.shareUrl}`,
          title: event?.title || 'Event',
        });
        Alert.alert('Success', Strings.SHARE_SUCCESS);
      }
    } catch (error) {
      console.error('Error sharing event:', error);
      Alert.alert('Error', 'Failed to share event');
    }
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
  const totalAvailableTickets = event.totalTickets - (event.attendees || 0);

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
                      {ticket.ticketPrice === 0
                        ? 'Miễn phí'
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
          <CustomText
            variant="body"
            color="secondary"
            style={{
              fontSize: Fonts.md,
              lineHeight: 24,
              fontFamily: Fonts.regular,
            }}>
            {event.description ||
              event.detailedDescription ||
              'Chưa có mô tả cho sự kiện này.'}
          </CustomText>
        </View>

        {/* Premium Action Buttons */}
        <View style={styles.actionsSection}>
          <CustomButton
            title="Đặt vé ngay"
            onPress={handleJoinEvent}
            variant="primary"
            style={styles.joinButton}
          />

          <View style={styles.secondaryActions}>
            <CustomButton
              title={Strings.SHARE_EVENT}
              onPress={handleShareEvent}
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
      </View>
    </ScrollView>
  );
};

export default EventDetailScreen;
