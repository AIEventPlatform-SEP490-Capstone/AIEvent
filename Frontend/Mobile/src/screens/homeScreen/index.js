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
import { useSelector } from 'react-redux';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
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
  
  // Use Redux selectors
  const events = useSelector(selectEvents);
  const eventsLoading = useSelector(selectEventsLoading);
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

  // Get latest events (first 3 events)
  const latestEvents = filteredEvents.slice(0, 3);
  // Get remaining events for the list
  const eventList = filteredEvents.slice(3);

  const renderLatestEventCard = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.latestEventCard, { marginLeft: index === 0 ? 0 : 15 }]}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.9}
    >
      <Image 
        source={getEventImage(item)} 
        style={styles.latestEventImage}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.latestEventGradient}
      >
        <View style={styles.latestEventContent}>
          <CustomText variant="h3" color="white" style={styles.latestEventTitle} numberOfLines={2}>
            {item.title}
          </CustomText>
          <View style={styles.latestEventInfo}>
            <View style={[styles.latestEventInfoRow, { marginBottom: 8 }]}>
              <Image source={Images.location} style={styles.latestEventIcon} />
              <CustomText variant="caption" color="white" style={styles.latestEventText} numberOfLines={1}>
                {item.location}
              </CustomText>
            </View>
            <View style={styles.latestEventInfoRow}>
              <Image source={Images.calendar} style={styles.latestEventIcon} />
              <CustomText variant="caption" color="white" style={styles.latestEventText}>
                {item.date}
              </CustomText>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const getEventImage = (event) => {
    if (event.image && typeof event.image === 'object' && event.image.uri) {
      return { uri: event.image.uri };
    }
    if (typeof event.image === 'string') {
      const imageMap = {
        card1: Images.event1,
        card2: Images.event2,
      };
      return imageMap[event.image] || Images.event1;
    }
    return Images.event1;
  };

  const renderEventCard = ({ item }) => (
    <EventCard event={item} onPress={handleEventPress} />
  );

  const renderCategoryButton = (category, index) => {
    const isSelected = selectedCategory && selectedCategory.eventCategoryId === category.eventCategoryId;
    const categoryColors = [
      { bg: '#E3F2FD', icon: '#2196F3' },
      { bg: '#F3E5F5', icon: '#9C27B0' },
      { bg: '#E8F5E9', icon: '#4CAF50' },
      { bg: '#FFF3E0', icon: '#FF9800' },
      { bg: '#FCE4EC', icon: '#E91E63' },
    ];
    const colorIndex = index % categoryColors.length;
    const colors = isSelected 
      ? { bg: Colors.primary, icon: Colors.white }
      : categoryColors[colorIndex];

    return (
      <TouchableOpacity
        key={category.eventCategoryId || category.id || Math.random().toString()}
        style={[
          styles.categoryButton,
          { backgroundColor: colors.bg },
          isSelected && styles.categoryButtonSelected
        ]}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.8}
      >
        <View style={[styles.categoryIconContainer, { backgroundColor: colors.icon + '20' }]}>
          <Image 
            source={Images.calendar} 
            style={[styles.categoryIcon, { tintColor: colors.icon }]} 
          />
        </View>
        <CustomText 
          variant="caption" 
          style={[
            styles.categoryButtonText,
            { color: colors.icon },
            isSelected && styles.categoryButtonTextSelected
          ]}
          numberOfLines={1}
        >
          {category.eventCategoryName}
        </CustomText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Colors.gradientHeaderTitle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <CustomText variant="h2" color="white" style={styles.headerTitle}>
            Khám phá sự kiện
          </CustomText>
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
            <Image source={Images.bell} style={styles.notificationIcon} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Image source={Images.search} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sự kiện..."
          placeholderTextColor={Colors.textLight}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Category Section */}
      <View style={styles.categorySection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryButton,
              { backgroundColor: selectedCategory ? '#F5F5F5' : Colors.primary },
            ]}
            onPress={() => setSelectedCategory(null)}
            activeOpacity={0.8}
          >
            <View style={[
              styles.categoryIconContainer, 
              { backgroundColor: selectedCategory ? Colors.primary + '20' : Colors.white + '40' }
            ]}>
              <Image 
                source={Images.calendar} 
                style={[
                  styles.categoryIcon, 
                  { tintColor: selectedCategory ? Colors.primary : Colors.white }
                ]} 
              />
            </View>
            <CustomText 
              variant="caption" 
              style={[
                styles.categoryButtonText,
                { color: selectedCategory ? Colors.primary : Colors.white }
              ]}
            >
              Tất cả
            </CustomText>
          </TouchableOpacity>
          
          {categories.map((category, index) => renderCategoryButton(category, index))}
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Latest Events Section */}
        {latestEvents.length > 0 && (
          <View style={styles.latestEventsSection}>
            <View style={styles.sectionHeader}>
              <CustomText variant="h2" color="primary" style={styles.sectionTitle}>
                Sự kiện mới nhất
              </CustomText>
            </View>
            <FlatList
              data={latestEvents}
              renderItem={renderLatestEventCard}
              keyExtractor={keyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.latestEventsList}
            />
          </View>
        )}

        {/* Events List Section */}
        <View style={styles.eventsListSection}>
          <View style={styles.sectionHeader}>
            <CustomText variant="h2" color="primary" style={styles.sectionTitle}>
              Danh sách sự kiện
            </CustomText>
            {filteredEvents.length > 3 && (
              <TouchableOpacity>
                <CustomText variant="body" color="primary" style={styles.viewAllText}>
                  Xem tất cả
                </CustomText>
              </TouchableOpacity>
            )}
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <CustomText variant="body" color="secondary" align="center">
                {Strings.LOADING}
              </CustomText>
            </View>
          ) : eventList.length === 0 && latestEvents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Image source={Images.calendar} style={styles.emptyIcon} />
              <CustomText variant="h3" color="secondary" align="center" style={styles.emptyText}>
                Không tìm thấy sự kiện nào
              </CustomText>
            </View>
          ) : (
            <FlatList
              data={eventList}
              renderItem={renderEventCard}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;