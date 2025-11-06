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
import { useDispatch, useSelector } from 'react-redux';
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
import { useEvents } from '../../hooks/useEvents';
import { useCategories } from '../../hooks/useCategories';
import { selectEvents, selectEventsLoading, selectEventsError } from '../../redux/slices/eventsSlice';
import { selectCategories, selectCategoriesLoading } from '../../redux/slices/categoriesSlice';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Use Redux selectors
  const events = useSelector(selectEvents);
  const eventsLoading = useSelector(selectEventsLoading);
  const eventsError = useSelector(selectEventsError);
  const categories = useSelector(selectCategories);
  const categoriesLoading = useSelector(selectCategoriesLoading);
  
  // Use custom hooks
  const { getEvents, searchEvents } = useEvents();
  const { refreshCategories } = useCategories();
  
  const [searchText, setSearchText] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    refreshCategories();
  }, []);

  useEffect(() => {
    if (searchText.trim() === '' && !selectedCategory) {
      // When no filter is applied, use the events from Redux
      // The events are already transformed in the Redux slice
      setFilteredEvents(events);
    } else {
      filterEvents();
    }
  }, [searchText, events, selectedCategory]);

  useEffect(() => {
    // Update loading state based on Redux loading states
    setLoading(eventsLoading || categoriesLoading);
  }, [eventsLoading, categoriesLoading]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      console.log('Loading events...');
      const response = await getEvents({
        pageNumber: 1,
        pageSize: 20
      });
      console.log('Events response:', response);
      // The data transformation is now handled in the Redux slice
      // We just need to check if the call was successful
      if (response && response.success) {
        // The events are already transformed in the Redux store
        // The useEffect will handle updating filteredEvents
        console.log('Events loaded successfully');
      } else if (response && response.message) {
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

  const filterEvents = () => {
    let result = events;
    
    // Filter by search text
    if (searchText.trim() !== '') {
      result = result.filter(event => 
        (event.title && event.title.toLowerCase().includes(searchText.toLowerCase())) ||
        (event.description && event.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(event => 
        (event.categoryId && event.categoryId === selectedCategory.eventCategoryId) ||
        (event.category && event.category === selectedCategory.eventCategoryName)
      );
    }
    
    setFilteredEvents(result);
  };

  const handleSearch = async (query) => {
    try {
      const response = await searchEvents(query);
      console.log('Search response:', response);
      // The data transformation is now handled in the Redux slice
      // We just need to check if the call was successful
      if (response && response.success) {
        // The events are already transformed in the Redux store
        // The useEffect will handle updating filteredEvents
        console.log('Search completed successfully');
      }
    } catch (error) {
      console.error('Error searching events:', error);
      Alert.alert('Error', 'Failed to search events: ' + error.message);
    }
  };

  const handleEventPress = (event) => {
    // Use the correct ID property - events have eventId, not id
    const eventId = event.eventId || event.EventId || event.id;
    
    // Only navigate if we have a valid eventId
    if (eventId) {
      navigation.navigate(ScreenNames.EVENT_DETAIL_SCREEN, { 
        eventId: eventId,
      });
    } else {
      console.warn('No valid eventId found for event:', event);
      Alert.alert('Error', 'Unable to open event details');
    }
  };

  const handleCategoryPress = (category) => {
    if (selectedCategory && selectedCategory.eventCategoryId === category.eventCategoryId) {
      setSelectedCategory(null); // Deselect if same category is pressed
    } else {
      setSelectedCategory(category);
    }
  };

  // Robust keyExtractor that handles undefined IDs
  const keyExtractor = (item, index) => {
    // Try multiple possible ID properties
    const id = item.id || item.eventId || item.EventId || index.toString();
    return id ? id.toString() : Math.random().toString();
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

      {/* Category Chips */}
      <View style={styles.categorySection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipSelected
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <CustomText 
              variant="caption" 
              style={[
                styles.categoryText,
                !selectedCategory && styles.categoryTextSelected
              ]}
            >
              Tất cả
            </CustomText>
          </TouchableOpacity>
          
          {categories.map((category) => (
            <TouchableOpacity
              key={category.eventCategoryId || category.id || Math.random().toString()}
              style={[
                styles.categoryChip,
                selectedCategory && selectedCategory.eventCategoryId === category.eventCategoryId && styles.categoryChipSelected
              ]}
              onPress={() => handleCategoryPress(category)}
            >
              <CustomText 
                variant="caption" 
                style={[
                  styles.categoryText,
                  selectedCategory && selectedCategory.eventCategoryId === category.eventCategoryId && styles.categoryTextSelected
                ]}
              >
                {category.eventCategoryName}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>
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
              keyExtractor={keyExtractor}
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