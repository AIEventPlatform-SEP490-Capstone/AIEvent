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
import { EventService } from '../../api/services';

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
      if (response.success) {
        setEvent(response.data);
      } else {
        Alert.alert('Error', response.message);
        navigation.goBack();
      }
    } catch (error) {
      // Error loading event detail
      Alert.alert('Error', 'Failed to load event details');
    } finally {
      setLoading(false);
    }
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
      // Error joining event
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
      // Error sharing event
    }
  };

  const handleViewMap = () => {
    // Open map with event location
    const mapUrl = `https://maps.google.com/?q=${encodeURIComponent(event.location)}`;
    Linking.openURL(mapUrl);
  };

  const getEventImage = () => {
    const imageMap = {
      card1: Images.event1,
      card2: Images.event2,
      card3: Images.event3,
      card4: Images.event4,
      card5: Images.event5,
    };
    return imageMap[event?.image] || Images.event1;
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
                {event.time}
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