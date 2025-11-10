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
import CompactEventCard from '../../components/presentation/CompactEventCard';
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
  const [currentDate, setCurrentDate] = useState(new Date());


  useEffect(() => {
    loadEvents();
    refreshCategories();
  }, []);

  useEffect(() => {
    if (searchText.trim() === '' && !selectedCategory) {
      // When no filter is applied, use the events from Redux
      // Transform all events to ensure consistent structure
      const transformedEvents = events.map(event => transformEventData(event));
      setFilteredEvents(transformedEvents);
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
      // The data transformation is now handled in the Redux slice
      // We just need to check if the call was successful
      // console.log('Events response:', response);
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

  // Transform event data to ensure consistent structure
  const transformEventData = (eventData) => {
    // Transform tags to ensure they are strings
    const transformTags = (tags) => {
      if (!tags || !Array.isArray(tags)) return [];
      return tags.map(tag => {
        if (typeof tag === 'object') {
          return tag.tagName || tag.name || tag.tagId || 'Tag';
        }
        return tag;
      });
    };
    
    return {
      ...eventData,
      price: calculateDisplayPrice(eventData),
      tags: transformTags(eventData.tags || eventData.Tags || eventData.eventTags || [])
    };
  };

  const filterEvents = () => {
    let result = events.map(event => transformEventData(event));
    
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

  // Get formatted date
  const getFormattedDate = () => {
    return currentDate.toLocaleDateString('vi-VN', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  // Get featured event (first event in the list)
  const getFeaturedEvent = () => {
    if (events && events.length > 0) {
      return transformEventData(events[0]);
    }
    return null;
  };

  const featuredEvent = getFeaturedEvent();


  return (
    <View style={styles.container}>
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

      {/* Main Content - All content scrolls together */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
          
          {/* Clear Search Button */}
          {(searchText.trim() !== '' || selectedCategory) && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchText('');
                setSelectedCategory(null);
              }}
            >
              <CustomText variant="body" color="primary" style={styles.clearButtonText}>
                Clear
              </CustomText>
            </TouchableOpacity>
          )}
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
                styles.categoryChipWebStyle,
                !selectedCategory && styles.categoryChipWebStyleSelected
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <CustomText 
                variant="caption" 
                style={[
                  styles.categoryTextWebStyle,
                  !selectedCategory && styles.categoryTextWebStyleSelected
                ]}
              >
                Tất cả
              </CustomText>
            </TouchableOpacity>
            
            {categories.map((category) => (
              <TouchableOpacity
                key={category.eventCategoryId || category.id || Math.random().toString()}
                style={[
                  styles.categoryChipWebStyle,
                  selectedCategory && selectedCategory.eventCategoryId === category.eventCategoryId && styles.categoryChipWebStyleSelected
                ]}
                onPress={() => handleCategoryPress(category)}
              >
                <CustomText 
                  variant="caption" 
                  style={[
                    styles.categoryTextWebStyle,
                    selectedCategory && selectedCategory.eventCategoryId === category.eventCategoryId && styles.categoryTextWebStyleSelected
                  ]}
                >
                  {category.eventCategoryName}
                </CustomText>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity style={styles.filterButton}>
              <Image source={Images.filter} style={styles.filterIcon} />
              <CustomText variant="body" color="secondary" style={styles.filterButtonText}>
                Bộ lọc
              </CustomText>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Featured Events - Show first 3 events in horizontal scroll */}
        {/* Only show featured events when there's no search text and no category selected */}
        {searchText.trim() === '' && !selectedCategory && events && events.length > 0 && (
          <View style={styles.featuredEventsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWithDivider}>
                <CustomText variant="h2" color="primary" style={styles.sectionTitleText}>
                  Sự kiện nổi bật
                </CustomText>
              </View>
              <View style={styles.divider} />
            </View>
            
            <FlatList
              data={events.slice(0, 3)}
              renderItem={({ item }) => (
                <CompactEventCard 
                  event={item} 
                  onPress={handleEventPress} 
                  isRecommended={true} 
                />
              )}
              keyExtractor={keyExtractor}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={356} // Card width (340) + margin (16)
              decelerationRate="fast"
              contentContainerStyle={{ paddingRight: 20 }}
            />
          </View>
        )}


        {/* All Events */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleWithDivider}>
              <CustomText variant="h2" color="primary" style={styles.sectionTitleText}>
                Danh sách sự kiện
              </CustomText>
            </View>
            <View style={styles.divider} />
          </View>
          
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
            <View>
              {filteredEvents.map((event, index) => (
                <View key={keyExtractor(event, index)}>
                  <EventCard event={event} onPress={handleEventPress} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;