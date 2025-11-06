import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import CustomButton from '../../components/common/customButtonRN';
import { GradientBackground } from '../../components/common';
import { LinearGradient } from 'expo-linear-gradient';
import EventCard from '../../components/presentation/EventCard';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';
import ScreenNames from '../../constants/ScreenNames';
import EventService from '../../api/services/EventService';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const [searchText, setSearchText] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredEvents(events);
    } else {
      handleSearch(searchText);
    }
  }, [searchText, events]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('Loading events...');
      const response = await EventService.getEvents({
        pageNumber: 1,
        pageSize: 20
      });
      console.log('Events response:', response);
      if (response.success) {
        // Transform events to match the mobile UI structure
        const transformedEvents = response.data.map(event => ({
          id: event.eventId || event.EventId || event.id || 'unknown',
          title: event.title || event.Title || 'Chưa có tiêu đề',
          description: event.description || event.Description || 'Chưa có mô tả',
          date: event.startTime || event.StartTime ? 
            new Date(event.startTime || event.StartTime).toLocaleDateString('vi-VN') : 
            'Chưa xác định',
          time: event.startTime || event.StartTime ? 
            new Date(event.startTime || event.StartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 
            'Chưa xác định',
          location: event.locationName || event.LocationName || 'Chưa xác định',
          rating: event.averageRating || 4.5, // Use actual rating if available, otherwise mock
          attendees: event.soldQuantity || event.SoldQuantity || 0,
          // Fix the price calculation logic
          price: calculateDisplayPrice(event),
          image: event.imgListEvent && event.imgListEvent.length > 0 ? 
            { uri: event.imgListEvent[0] } : 
            'card1', // Use actual image if available
          category: event.eventCategoryName || event.EventCategoryName || 'Chưa phân loại',
          isFavorite: event.isFavorite || false,
          totalTickets: event.totalTickets || event.TotalTickets || 0,
          tags: event.tags || event.Tags || []
        }));
        console.log('Transformed events:', transformedEvents);
        setEvents(transformedEvents);
        setFilteredEvents(transformedEvents);
      } else {
        console.error('Failed to load events:', response.message);
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events: ' + error.message);
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

  const handleSearch = async (query) => {
    try {
      const response = await EventService.searchEvents(query);
      console.log('Search response:', response);
      if (response.success) {
        // Transform events to match the mobile UI structure
        const transformedEvents = response.data.map(event => ({
          id: event.eventId || event.EventId || event.id || 'unknown',
          title: event.title || event.Title || 'Chưa có tiêu đề',
          description: event.description || event.Description || 'Chưa có mô tả',
          date: event.startTime || event.StartTime ? 
            new Date(event.startTime || event.StartTime).toLocaleDateString('vi-VN') : 
            'Chưa xác định',
          time: event.startTime || event.StartTime ? 
            new Date(event.startTime || event.StartTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 
            'Chưa xác định',
          location: event.locationName || event.LocationName || 'Chưa xác định',
          rating: event.averageRating || 4.5, // Use actual rating if available, otherwise mock
          attendees: event.soldQuantity || event.SoldQuantity || 0,
          // Fix the price calculation logic
          price: calculateDisplayPrice(event),
          image: event.imgListEvent && event.imgListEvent.length > 0 ? 
            { uri: event.imgListEvent[0] } : 
            'card1', // Use actual image if available
          category: event.eventCategoryName || event.EventCategoryName || 'Chưa phân loại',
          isFavorite: event.isFavorite || false,
          totalTickets: event.totalTickets || event.TotalTickets || 0,
          tags: event.tags || event.Tags || []
        }));
        setFilteredEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error searching events:', error);
      Alert.alert('Error', 'Failed to search events: ' + error.message);
    }
  };

  // Test API connection
  const testApiConnection = async () => {
    try {
      const result = await EventService.testConnection();
      if (result.success) {
        Alert.alert('Success', 'API connection successful!');
      } else {
        Alert.alert('Error', 'API connection failed: ' + result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test API connection: ' + error.message);
    }
  };

  const handleEventPress = (event) => {
    navigation.navigate(ScreenNames.EVENT_DETAIL_SCREEN, { 
      eventId: event.id,
     });
  };

  const renderEventCard = ({ item }) => (
    <EventCard event={item} onPress={handleEventPress} />
  );

  return (
    <GradientBackground style={styles.container}>
      {/* Premium Header */}
      <LinearGradient
        colors={Colors.gradientHeaderTitle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <CustomText variant="h2" color="white" style={styles.headerTitle}>
          Danh sách sự kiện
        </CustomText>
        
        <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
          <Image source={Images.bell} style={styles.notificationIcon} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Modern Search Bar */}
      <View style={styles.searchContainer}>
        <Image source={Images.search} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={Strings.SEARCH_PLACEHOLDER}
          placeholderTextColor={Colors.textLight}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <CustomText variant="h1" color="primary" align="center" style={styles.welcomeTitle}>
            {Strings.HOME_TITLE}
          </CustomText>
          <CustomText variant="body" color="secondary" align="center" style={styles.welcomeSubtitle}>
            {Strings.HOME_SUBTITLE}
          </CustomText>
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>
          <CustomText variant="h2" color="primary" style={styles.sectionTitle}>
            {Strings.UPCOMING_EVENTS}
          </CustomText>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <CustomText variant="body" color="secondary" align="center">
                {Strings.LOADING}
              </CustomText>
            </View>
          ) : filteredEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image source={Images.calendar} style={styles.emptyIcon} />
              <CustomText variant="h3" color="secondary" align="center" style={styles.emptyText}>
                Không tìm thấy sự kiện nào
              </CustomText>
            </View>
          ) : (
            <FlatList
              data={filteredEvents}
              renderItem={renderEventCard}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

export default HomeScreen;