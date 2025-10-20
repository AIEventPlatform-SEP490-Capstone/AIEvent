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
import Strings from '../../constants/Strings';
import ApiCalls from '../../api/ApiCalls';

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
      const response = await ApiCalls.getEventDetail(eventId);
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
      const response = await ApiCalls.joinEvent(eventId);
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
      const response = await ApiCalls.shareEvent(eventId);
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
      {/* Event Image */}
      <View style={styles.imageContainer}>
        <Image source={getEventImage()} style={styles.eventImage} />
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Image source={Images.arrow} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      {/* Event Info */}
      <View style={styles.content}>
        {/* Title and Rating */}
        <View style={styles.titleSection}>
          <CustomText variant="h1" color="primary">
            {event.title}
          </CustomText>
          <View style={styles.ratingContainer}>
            <Image source={Images.star} style={styles.starIcon} />
            <CustomText variant="body" color="primary">
              {event.rating}
            </CustomText>
            <CustomText variant="caption" color="secondary">
              ({event.attendees} {Strings.EVENT_ATTENDEES_COUNT})
            </CustomText>
          </View>
        </View>

        {/* Price Badge */}
        <View style={styles.priceBadge}>
          <CustomText variant="button" color="white">
            {event.price}
          </CustomText>
        </View>

        {/* Event Details */}
        <View style={styles.detailsSection}>
          <CustomText variant="h3" color="primary" style={styles.sectionTitle}>
            Event Information
          </CustomText>
          
          <View style={styles.detailRow}>
            <Image source={Images.calendar} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" color="secondary">
                {Strings.EVENT_DATE}
              </CustomText>
              <CustomText variant="body" color="primary">
                {event.date}
              </CustomText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.clock} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" color="secondary">
                {Strings.EVENT_TIME}
              </CustomText>
              <CustomText variant="body" color="primary">
                {event.time}
              </CustomText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.location} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" color="secondary">
                {Strings.EVENT_LOCATION}
              </CustomText>
              <CustomText variant="body" color="primary">
                {event.location}
              </CustomText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.users} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" color="secondary">
                {Strings.EVENT_ORGANIZER}
              </CustomText>
              <CustomText variant="body" color="primary">
                {event.organizer}
              </CustomText>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Image source={Images.components} style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <CustomText variant="caption" color="secondary">
                {Strings.EVENT_CATEGORY}
              </CustomText>
              <CustomText variant="body" color="primary">
                {event.category}
              </CustomText>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <CustomText variant="h3" color="primary" style={styles.sectionTitle}>
            {Strings.EVENT_DESCRIPTION}
          </CustomText>
          <CustomText variant="body" color="secondary">
            {event.description}
          </CustomText>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <CustomButton
            title={isJoined ? 'Joined ✓' : Strings.JOIN_EVENT}
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