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
import EventCardWithFavorite from '../../components/presentation/EventCardWithFavorite';
import CompactEventCard from '../../components/presentation/CompactEventCard';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';
import ScreenNames from '../../constants/ScreenNames';
import { useEvents } from '../../hooks/useEvents';
import { useCategories } from '../../hooks/useCategories';
import { useFavoriteEvents } from '../../hooks/useFavoriteEvents';
import { selectEvents, selectEventsLoading, selectEventsError } from '../../redux/slices/eventsSlice';
import { selectCategories, selectCategoriesLoading } from '../../redux/slices/categoriesSlice';
import { EventService } from '../../api/services';
import { isStaffUser } from '../../utils/jwtUtils';
import AIChatFloating from '../../components/presentation/AIChatFloating';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const { accessToken } = useSelector(state => state.auth);

  // Use Redux selectors
  const events = useSelector(selectEvents);
  const eventsLoading = useSelector(selectEventsLoading);
  const categories = useSelector(selectCategories);
  const categoriesLoading = useSelector(selectCategoriesLoading);

  // Use custom hooks
  const { getEvents, getEventsForStaff, searchEvents } = useEvents();
  const { refreshCategories } = useCategories();
  const { addFavoriteEvent, removeFavoriteEvent } = useFavoriteEvents();

  const [searchText, setSearchText] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  // Remove the local loading state since we're using Redux loading states
  // const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [aiEvents, setAiEvents] = useState([]);
  const [loadingAIEvents, setLoadingAIEvents] = useState(false);
  const [showAIEvents, setShowAIEvents] = useState(false);
  const [aiRequestCount, setAiRequestCount] = useState(0);


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

  // Remove this useEffect as it creates a circular dependency
  // useEffect(() => {
  //   // Update loading state based on Redux loading states
  //   setLoading(eventsLoading || categoriesLoading);
  // }, [eventsLoading, categoriesLoading]);

  const loadEvents = async () => {
    try {
      // setLoading(true); // Remove manual loading state management
      console.log('Loading events...');

      // Check if user is staff
      const isStaff = isStaffUser(accessToken);

      let response;
      if (isStaff) {
        // Use staff-specific endpoint for staff users
        response = await getEventsForStaff({
          pageNumber: 1,
          pageSize: 20
        });
      } else {
        // Use regular endpoint for non-staff users
        response = await getEvents({
          pageNumber: 1,
          pageSize: 20
        });
      }

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
    }
    // Remove finally block since we're relying on Redux loading states
    // finally {
    //   setLoading(false);
    // }
  };

  // Calculate display price based on ticket details
  const calculateDisplayPrice = (eventData) => {
    // If we have ticket details, calculate from them
    if (eventData.ticketDetails && eventData.ticketDetails.length > 0) {
      const prices = eventData.ticketDetails.map(ticket => ticket.ticketPrice || 0);
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

    // Fallback to direct ticketPrice property
    if (eventData.ticketPrice !== undefined && eventData.ticketPrice > 0) {
      return `${eventData.ticketPrice.toLocaleString('vi-VN')}đ`;
    }
    // Default to Miễn phí if no price information
    return '0đ';
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

  const handleAISuggestionPress = async () => {
    if (showAIEvents && aiEvents.length > 0) {
      // If already showing AI events, hide them
      setShowAIEvents(false);
      return;
    }

    // Prevent request if already loading or exceeded request limit
    if (loadingAIEvents) {
      return;
    }

    // Limit to maximum 2 requests
    if (aiRequestCount >= 2) {
      Alert.alert('Thông báo', 'Bạn đã tải sự kiện gợi ý tối đa 2 lần. Vui lòng làm mới trang để tiếp tục.');
      return;
    }

    try {
      setLoadingAIEvents(true);
      const response = await EventService.getAIRecommendedEvents({
        pageNumber: 1,
        pageSize: 5
      });

      if (response && response.success && response.data) {
        const transformedEvents = response.data.map(event => transformEventData(event));
        setAiEvents(transformedEvents);
        setShowAIEvents(true);
        setAiRequestCount(prev => prev + 1);
      } else {
        Alert.alert('Thông báo', 'Không thể tải sự kiện gợi ý');
      }
    } catch (error) {
      console.error('Error loading AI events:', error);
      Alert.alert('Lỗi', 'Không thể tải sự kiện gợi ý: ' + error.message);
    } finally {
      setLoadingAIEvents(false);
    }
  };

  // Robust keyExtractor that handles undefined IDs
  const keyExtractor = (item, index) => {
    // Try multiple possible ID properties
    const id = item.id || item.eventId || item.EventId || index.toString();
    return id ? id.toString() : Math.random().toString();
  };

  // Get latest events (first 3 events) - only show separate section if we have more than 3 events
  const shouldSplitEvents = filteredEvents.length > 3;
  const latestEvents = shouldSplitEvents ? filteredEvents.slice(0, 3) : [];
  // Show all events in the main list instead of splitting them
  const eventList = filteredEvents;

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
    <EventCardWithFavorite event={item} onPress={handleEventPress} />
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

        {/* Chỉ hiện nút AI với user thường */}
        {!isStaffUser(accessToken) && (
          <TouchableOpacity
            onPress={handleAISuggestionPress}
            style={styles.aiIconButton}
            activeOpacity={0.7}
            disabled={loadingAIEvents || aiRequestCount >= 2}
          >
            <Image
              source={Images.robotCycle}
              style={[
                styles.aiIcon,
                showAIEvents && styles.aiIconActive,
                (loadingAIEvents || aiRequestCount >= 2) && styles.aiIconDisabled
              ]}
            />
          </TouchableOpacity>
        )}
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
        {/* AI Recommended Events Section */}
        {showAIEvents && (
          <View style={styles.aiEventsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.aiSectionTitleContainer}>
                <Image source={Images.robotCycle} style={styles.aiSectionIcon} />
                <CustomText variant="h2" color="primary" style={styles.sectionTitle}>
                  Sự kiện gợi ý
                </CustomText>
              </View>
            </View>
            {loadingAIEvents ? (
              <View style={styles.loadingContainer}>
                <CustomText variant="body" color="secondary" align="center">
                  {Strings.LOADING}
                </CustomText>
              </View>
            ) : aiEvents.length > 0 ? (
              <FlatList
                data={aiEvents}
                renderItem={renderEventCard}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <CustomText variant="body" color="secondary" align="center">
                  Không có sự kiện gợi ý
                </CustomText>
              </View>
            )}
          </View>
        )}

        {/* Latest Events Section */}
        {shouldSplitEvents && latestEvents.length > 0 && (
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
          </View>

          {eventsLoading || categoriesLoading ? (
            <View style={styles.loadingContainer}>
              <CustomText variant="body" color="secondary" align="center">
                {Strings.LOADING}
              </CustomText>
            </View>
          ) : eventList.length === 0 ? (
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
      <AIChatFloating />
    </View>
  );
};

export default HomeScreen;