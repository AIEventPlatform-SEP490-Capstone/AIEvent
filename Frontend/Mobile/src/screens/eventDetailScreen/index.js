import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Share,
  Linking,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import CustomButton from '../../components/common/customButtonRN';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';
import EventService from '../../api/services/EventService';

const EventDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params;
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      setLoading(true);
      const response = await EventService.getEventById(eventId);
      console.log('Event detail response:', response);
      if (response.success) {
        // Transform the event data to match the UI structure
        const transformedEvent = {
          id: response.data.eventId || response.data.EventId || response.data.id || eventId,
          title: response.data.title || response.data.Title || 'Chưa có tiêu đề',
          description: response.data.description || response.data.Description || 'Chưa có mô tả',
          detailedDescription: response.data.detailedDescription || response.data.DetailedDescription || '',
          date: response.data.startTime || response.data.StartTime ? 
            new Date(response.data.startTime || response.data.StartTime).toLocaleDateString('vi-VN') : 
            'Chưa xác định',
          time: response.data.startTime || response.data.StartTime ? 
            new Date(response.data.startTime || response.data.StartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 
            'Chưa xác định',
          endTime: response.data.endTime || response.data.EndTime ? 
            new Date(response.data.endTime || response.data.EndTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 
            'Chưa xác định',
          location: response.data.locationName || response.data.LocationName || 'Chưa xác định',
          address: response.data.address || response.data.Address || '',
          rating: response.data.averageRating || 4.5, // Use actual rating if available, otherwise mock
          attendees: response.data.soldQuantity || response.data.SoldQuantity || 0,
          totalTickets: response.data.totalTickets || response.data.TotalTickets || 0,
          // Fix the price calculation logic
          price: calculateDisplayPrice(response.data),
          image: response.data.imgListEvent && response.data.imgListEvent.length > 0 ? 
            { uri: response.data.imgListEvent[0] } : 
            'card1', // Use actual image if available
          category: response.data.eventCategoryName || response.data.EventCategoryName || 
            (response.data.eventCategory ? response.data.eventCategory.eventCategoryName : '') || 'Chưa phân loại',
          organizer: response.data.organizerEvent ? 
            (response.data.organizerEvent.companyName || response.data.organizerEvent.CompanyName || 'Nhà tổ chức') : 
            'Chưa xác định',
          isFavorite: response.data.isFavorite || false,
          tags: response.data.tags || response.data.Tags || response.data.eventTags || [],
          ticketDetails: response.data.ticketDetails || response.data.TicketDetails || []
        };
        setEvent(transformedEvent);
      } else {
        Alert.alert('Error', response.message);
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading event detail:', error);
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  // Calculate display price based on ticket details
  const calculateDisplayPrice = (eventData) => {
    // If we have ticket details, calculate from them
    if (eventData.ticketDetails && eventData.ticketDetails.length > 0) {
      const prices = eventData.ticketDetails.map(ticket => ticket.ticketPrice || 0);
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
    if (eventData.ticketPricingType === 'Free' || eventData.ticketPricingType === 'free') {
      return 'Miễn phí';
    }
    
    // Default to Miễn phí if no price information
    return 'Miễn phí';
  };

  const handleJoinEvent = async () => {
    try {
      setJoining(true);
      const response = await EventService.joinEvent(eventId);
      if (response.success) {
        setIsJoined(true);
        Alert.alert('Success', Strings.JOIN_SUCCESS);
      } else {
        Alert.alert('Error', Strings.JOIN_ERROR);
      }
    } catch (error) {
      console.error('Error joining event:', error);
      Alert.alert('Error', Strings.JOIN_ERROR);
    } finally {
      setJoining(false);
    }
  };

  const handleShareEvent = async () => {
    try {
      const response = await EventService.shareEvent(eventId);
      if (response.success) {
        await Share.share({
          message: `Check out this event: ${event.title}\n${response.data.shareUrl}`,
          title: event.title,
        });
        Alert.alert('Success', Strings.SHARE_SUCCESS);
      }
    } catch (error) {
      console.error('Error sharing event:', error);
    }
  };

  const handleViewMap = () => {
    // Open map with event location
    const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;
    Linking.openURL(mapUrl);
  };

  const getEventImage = () => {
    // If event has an image URI, use it
    if (event.image && typeof event.image === 'object' && event.image.uri) {
      return { uri: event.image.uri };
    }
    
    // If event.image is a string identifier, use the image map
    if (typeof event.image === 'string') {
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

  if (loading) {
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
          activeOpacity={0.8}
        >
          <Image source={Images.logout} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      {/* Premium Event Info */}
      <View style={styles.content}>
        {/* Title and Rating */}
        <View style={styles.titleSection}>
          <CustomText variant="h1" color="primary" style={{ fontSize: 28, fontWeight: '800', fontFamily: Fonts.bold, marginBottom: 12, lineHeight: 36 }}>
            {event.title}
          </CustomText>
          <View style={styles.ratingContainer}>
            <Image source={Images.star} style={styles.starIcon} />
            <CustomText variant="body" color="primary" style={{ fontSize: Fonts.md, fontWeight: '700', marginRight: 6 }}>
              {event.rating}
            </CustomText>
            <CustomText variant="caption" color="secondary" style={{ fontSize: Fonts.sm }}>
              ({event.attendees} {Strings.EVENT_ATTENDEES_COUNT})
            </CustomText>
          </View>
        </View>

        {/* Premium Price Badge */}
        <View style={styles.priceBadge}>
          <CustomText variant="button" color="white" style={{ fontSize: Fonts.lg, fontWeight: '800', fontFamily: Fonts.bold }}>
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
              <CustomText variant="caption" color="secondary" style={{ fontSize: Fonts.xs, marginBottom: 4, fontFamily: Fonts.medium }}>
                {Strings.EVENT_DATE}
              </CustomText>
              <CustomText variant="body" color="primary" style={{ fontSize: Fonts.md, fontWeight: '600', fontFamily: Fonts.semiBold }}>
                {event.date}
              </CustomText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.clock} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" color="secondary" style={{ fontSize: Fonts.xs, marginBottom: 4, fontFamily: Fonts.medium }}>
                {Strings.EVENT_TIME}
              </CustomText>
              <CustomText variant="body" color="primary" style={{ fontSize: Fonts.md, fontWeight: '600', fontFamily: Fonts.semiBold }}>
                {event.time} - {event.endTime}
              </CustomText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.location} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" color="secondary" style={{ fontSize: Fonts.xs, marginBottom: 4, fontFamily: Fonts.medium }}>
                {Strings.EVENT_LOCATION}
              </CustomText>
              <CustomText variant="body" color="primary" style={{ fontSize: Fonts.md, fontWeight: '600', fontFamily: Fonts.semiBold }}>
                {event.location}
              </CustomText>
              {event.address ? (
                <CustomText variant="caption" color="secondary" style={{ fontSize: Fonts.sm, marginTop: 2 }}>
                  {event.address}
                </CustomText>
              ) : null}
            </View>
          </View>

          {event.organizer && (
            <View style={styles.detailRow}>
              <Image source={Images.profile} style={styles.detailIcon} />
              <View style={styles.detailInfo}>
                <CustomText variant="caption" color="secondary" style={{ fontSize: Fonts.xs, marginBottom: 4, fontFamily: Fonts.medium }}>
                  {Strings.EVENT_ORGANIZER}
                </CustomText>
                <CustomText variant="body" color="primary" style={{ fontSize: Fonts.md, fontWeight: '600', fontFamily: Fonts.semiBold }}>
                  {event.organizer}
                </CustomText>
              </View>
            </View>
          )}

          {event.category && (
            <View style={[styles.detailRow, { borderBottomWidth: 0, marginBottom: 0 }]}>
              <Image source={Images.calendar} style={styles.detailIcon} />
              <View style={styles.detailInfo}>
                <CustomText variant="caption" color="secondary" style={{ fontSize: Fonts.xs, marginBottom: 4, fontFamily: Fonts.medium }}>
                  {Strings.EVENT_CATEGORY}
                </CustomText>
                <CustomText variant="body" color="primary" style={{ fontSize: Fonts.md, fontWeight: '600', fontFamily: Fonts.semiBold }}>
                  {event.category}
                </CustomText>
              </View>
            </View>
          )}
        </View>

        {/* Ticket Information Section */}
        {event.ticketDetails && event.ticketDetails.length > 0 && (
          <View style={styles.detailsSection}>
            <CustomText variant="h3" color="primary" style={styles.sectionTitle}>
              Loại vé có sẵn
            </CustomText>
            {event.ticketDetails.map((ticket, index) => {
              const availableTickets = ticket.ticketQuantity - (ticket.soldQuantity || 0);
              const isAvailable = availableTickets > 0;

              return (
                <View
                  key={index}
                  style={[
                    styles.ticketRow,
                    !isAvailable && styles.ticketRowUnavailable
                  ]}
                >
                  <View style={styles.ticketInfo}>
                    <CustomText variant="body" color="primary" style={styles.ticketName}>
                      {ticket.ticketName}
                    </CustomText>
                    {ticket.ticketDescription ? (
                      <CustomText variant="caption" color="secondary" style={styles.ticketDescription}>
                        {ticket.ticketDescription}
                      </CustomText>
                    ) : null}
                    <View style={styles.ticketStats}>
                      <CustomText variant="caption" color="secondary" style={styles.ticketStat}>
                        Đã bán: {ticket.soldQuantity || 0}/{ticket.ticketQuantity}
                      </CustomText>
                      <CustomText variant="caption" color="secondary" style={styles.ticketStat}>
                        Còn lại: {availableTickets} vé
                      </CustomText>
                    </View>
                  </View>
                  <View style={styles.ticketPriceContainer}>
                    <CustomText variant="body" color="primary" style={styles.ticketPrice}>
                      {ticket.ticketPrice === 0 ? "Miễn phí" : `${ticket.ticketPrice.toLocaleString('vi-VN')}đ`}
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
          <CustomText variant="body" color="secondary" style={{ fontSize: Fonts.md, lineHeight: 24, fontFamily: Fonts.regular }}>
            {event.description || event.detailedDescription || 'Chưa có mô tả cho sự kiện này.'}
          </CustomText>
        </View>

        {/* Premium Action Buttons */}
        <View style={styles.actionsSection}>
          <CustomButton
            title={isJoined ? 'Đã tham gia ✓' : Strings.JOIN_EVENT}
            onPress={handleJoinEvent}
            loading={joining}
            disabled={isJoined}
            variant={isJoined ? 'secondary' : 'primary'}
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