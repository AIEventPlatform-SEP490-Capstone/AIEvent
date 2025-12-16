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
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import NotificationBadge from '../../components/common/NotificationBadge';
import { LinearGradient } from 'expo-linear-gradient';
import EventCardWithFavorite from '../../components/presentation/EventCardWithFavorite';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';
import ScreenNames from '../../constants/ScreenNames';
import { useEvents } from '../../hooks/useEvents';
import { useCategories } from '../../hooks/useCategories';
import { useFavoriteEvents } from '../../hooks/useFavoriteEvents';
import { selectEvents, selectEventsLoading } from '../../redux/slices/eventsSlice';
import { selectCategories, selectCategoriesLoading } from '../../redux/slices/categoriesSlice';
import { EventService } from '../../api/services';
import { isStaffUser } from '../../utils/jwtUtils';
import AIChatFloating from '../../components/presentation/AIChatFloating';
import {
  Music,
  Palette,
  Briefcase,
  GraduationCap,
  Heart,
  Utensils,
  Plane,
  Trophy,
  Camera,
  Gamepad2,
  Sparkles,
  Users,
  Mic2,
  Film,
  BookOpen,
  Dumbbell,
  ShoppingBag,
  Landmark,
  Leaf,
  Baby,
  FolderOpen,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const categoryStylesMap = [
  { icon: Music, keywords: ["âm nhạc", "nhạc", "music", "ca nhạc", "concert", "hòa nhạc"] },
  { icon: Palette, keywords: ["nghệ thuật", "art", "hội họa", "triển lãm", "mỹ thuật", "sáng tạo"] },
  { icon: Briefcase, keywords: ["kinh doanh", "business", "doanh nghiệp", "công ty", "hội nghị", "networking"] },
  { icon: GraduationCap, keywords: ["giáo dục", "education", "học", "đào tạo", "workshop", "khóa học", "seminar"] },
  { icon: Heart, keywords: ["từ thiện", "charity", "tình nguyện", "quyên góp", "thiện nguyện"] },
  { icon: Utensils, keywords: ["ẩm thực", "food", "đồ ăn", "nấu ăn", "nhà hàng", "ăn uống", "cooking"] },
  { icon: Plane, keywords: ["du lịch", "travel", "tour", "khám phá", "phượt", "trip"] },
  { icon: Trophy, keywords: ["thể thao", "sport", "giải đấu", "thi đấu", "bóng đá", "chạy bộ", "marathon"] },
  { icon: Camera, keywords: ["nhiếp ảnh", "photo", "chụp ảnh", "photography", "hình ảnh"] },
  { icon: Gamepad2, keywords: ["trò chơi", "game", "gaming", "esport", "giải trí điện tử"] },
  { icon: Sparkles, keywords: ["giải trí", "entertainment", "vui chơi", "lễ hội", "festival", "party", "tiệc"] },
  { icon: Users, keywords: ["cộng đồng", "community", "giao lưu", "meetup", "offline", "họp mặt"] },
  { icon: Mic2, keywords: ["hội thảo", "conference", "talk", "diễn thuyết", "thuyết trình", "speaker"] },
  { icon: Film, keywords: ["phim", "movie", "điện ảnh", "cinema", "film", "chiếu phim"] },
  { icon: BookOpen, keywords: ["văn học", "sách", "book", "đọc sách", "thơ", "viết"] },
  { icon: Dumbbell, keywords: ["sức khỏe", "health", "fitness", "gym", "yoga", "thể dục"] },
  { icon: ShoppingBag, keywords: ["mua sắm", "shopping", "sale", "chợ", "hội chợ", "bazaar"] },
  { icon: Landmark, keywords: ["văn hóa", "culture", "di sản", "lịch sử", "truyền thống", "heritage"] },
  { icon: Leaf, keywords: ["môi trường", "environment", "xanh", "eco", "thiên nhiên", "bảo vệ"] },
  { icon: Baby, keywords: ["trẻ em", "kids", "children", "gia đình", "family", "thiếu nhi"] },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const { accessToken } = useSelector(state => state.auth);
  const user = useSelector(state => state.auth.user);

  const events = useSelector(selectEvents);
  const eventsLoading = useSelector(selectEventsLoading);
  const categories = useSelector(selectCategories);
  const categoriesLoading = useSelector(selectCategoriesLoading);

  const { getEvents, getEventsForStaff, searchEvents } = useEvents();
  const { refreshCategories } = useCategories();
  const { addFavoriteEvent, removeFavoriteEvent } = useFavoriteEvents();

  const [searchText, setSearchText] = useState('');
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [aiEvents, setAiEvents] = useState([]);
  const [loadingAIEvents, setLoadingAIEvents] = useState(false);
  const [showAIEvents, setShowAIEvents] = useState(false);
  const [aiRequestCount, setAiRequestCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
    refreshCategories();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadEvents(), refreshCategories()]);
      setAiEvents([]);
      setShowAIEvents(false);
      setAiRequestCount(0);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (searchText.trim() === '' && !selectedCategory) {
      const transformedEvents = events.map(event => transformEventData(event));
      setFilteredEvents(transformedEvents);
    } else {
      filterEvents();
    }
  }, [searchText, events, selectedCategory]);

  const loadEvents = async () => {
    try {
      console.log('Loading events...');
      const isStaff = isStaffUser(accessToken);

      let response;
      if (isStaff) {
        response = await getEventsForStaff({
          pageNumber: 1,
          pageSize: 20
        });
      } else {
        response = await getEvents({
          pageNumber: 1,
          pageSize: 20
        });
      }

      if (response && response.success) {
        console.log('Events loaded successfully');
      } else if (response && response.message) {
        console.error('Failed to load events:', response.message);
        Alert.alert('Error', response.message);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Failed to load events: ' + error.message);
    }
  };

  const calculateDisplayPrice = (eventData) => {
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

    if (eventData.ticketPrice !== undefined && eventData.ticketPrice > 0) {
      return `${eventData.ticketPrice.toLocaleString('vi-VN')}đ`;
    }
    return '0đ';
  };

  const transformEventData = (eventData) => {
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
      tags: transformTags(eventData.tags || eventData.Tags || eventData.eventTags || []),
      saleStartTime: eventData.saleStartTime || eventData.SaleStartTime,
      saleEndTime: eventData.saleEndTime || eventData.SaleEndTime,
      startTime: eventData.startTime || eventData.StartTime,
      endTime: eventData.endTime || eventData.EndTime,
    };
  };

  const filterEvents = () => {
    let result = events.map(event => transformEventData(event));

    if (searchText.trim() !== '') {
      result = result.filter(event =>
        (event.title && event.title.toLowerCase().includes(searchText.toLowerCase())) ||
        (event.description && event.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

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
      if (response && response.success) {
        console.log('Search completed successfully');
      }
    } catch (error) {
      console.error('Error searching events:', error);
      Alert.alert('Error', 'Failed to search events: ' + error.message);
    }
  };

  const handleEventPress = (event) => {
    const eventId = event.eventId || event.EventId || event.id;

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
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleAISuggestionPress = async () => {
    if (showAIEvents && aiEvents.length > 0) {
      setShowAIEvents(false);
      return;
    }

    if (loadingAIEvents) {
      return;
    }

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

  const keyExtractor = (item, index) => {
    const id = item.id || item.eventId || item.EventId || index.toString();
    return id ? id.toString() : Math.random().toString();
  };

  const shouldSplitEvents = filteredEvents.length > 3;
  const featuredEvents = shouldSplitEvents ? filteredEvents.slice(0, 3) : [];
  const eventList = filteredEvents;

  const renderFeaturedEventCard = ({ item, index }) => (
    <TouchableOpacity
      style={[styles.featuredCard, { marginLeft: index === 0 ? 20 : 12 }]}
      onPress={() => handleEventPress(item)}
      activeOpacity={0.9}
    >
      <Image
        source={getEventImage(item)}
        style={styles.featuredImage}
      />

      <View style={styles.featuredLocationBadge}>
        <Image source={Images.location} style={styles.featuredIcon} />
        <CustomText variant="caption" style={styles.featuredBadgeText} numberOfLines={1}>
          {item.location}
        </CustomText>
      </View>

      <View style={styles.featuredDateBadge}>
        <Image source={Images.calendar} style={styles.featuredIcon} />
        <CustomText variant="caption" style={styles.featuredBadgeText}>
          {item.date}
        </CustomText>
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.featuredGradient}
      >
        <View style={styles.featuredContent}>
          <CustomText variant="h3" style={styles.featuredTitle} numberOfLines={2}>
            {item.title}
          </CustomText>
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
    <EventCardWithFavorite
      event={item}
      onPress={handleEventPress}
      isStaff={isStaffUser(accessToken)}
    />
  );

  const renderCategoryChip = (category, index) => {
    const isSelected = selectedCategory && selectedCategory.eventCategoryId === category.eventCategoryId;

    const matched = categoryStylesMap.find(item =>
      item.keywords.some(kw => category.eventCategoryName?.toLowerCase().includes(kw.toLowerCase()))
    );
    const IconComponent = matched ? matched.icon : FolderOpen;

    return (
      <TouchableOpacity
        key={category.eventCategoryId || index}
        style={[
          styles.categoryChip,
          isSelected && styles.categoryChipSelected,
        ]}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.7}
      >
        <IconComponent
          size={18}
          strokeWidth={2}
          color={isSelected ? '#1E293B' : '#64748B'}
        />
        <CustomText
          variant="body"
          style={[
            styles.categoryChipText,
            isSelected && styles.categoryChipTextSelected,
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
      <StatusBar barStyle="light-content" backgroundColor="#1E88E5" />

      <LinearGradient
        colors={['#1E88E5', '#1976D2']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <CustomText variant="caption" style={styles.headerGreeting}>
              Hãy khám phá sự kiện!
            </CustomText>
            <CustomText variant="h1" style={styles.headerTitle}>
              Xin chào, {user?.fullName || user?.name || 'Bạn'} 👋
            </CustomText>
          </View>
          <NotificationBadge
            onPress={() => {
              navigation.navigate(ScreenNames.NOTIFICATIONS_SCREEN);
            }}
          />
        </View>

        <View style={styles.searchWrapper}>
          <View style={styles.searchContainer}>
            <Image source={Images.search} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm sự kiện, địa điểm..."
              placeholderTextColor="#94A3B8"
              value={searchText}
              onChangeText={setSearchText}
            />
            {!isStaffUser(accessToken) && (
              <TouchableOpacity
                onPress={handleAISuggestionPress}
                style={[
                  styles.aiButton,
                  showAIEvents && styles.aiButtonActive,
                  (loadingAIEvents || aiRequestCount >= 2) && styles.aiButtonDisabled
                ]}
                activeOpacity={0.7}
                disabled={loadingAIEvents || aiRequestCount >= 2}
              >
                <Image
                  source={Images.robotCycle}
                  style={styles.aiButtonIcon}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipSelected,
            ]}
            onPress={() => setSelectedCategory(null)}
            activeOpacity={0.7}
          >
            <Sparkles
              size={18}
              strokeWidth={2}
              color={!selectedCategory ? '#1E293B' : '#64748B'}
            />
            <CustomText
              variant="body"
              style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextSelected,
              ]}
            >
              Tất cả
            </CustomText>
          </TouchableOpacity>

          {categories.map((category, index) => renderCategoryChip(category, index))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {showAIEvents && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Image source={Images.robotCycle} style={styles.sectionIcon} />
                <CustomText variant="h2" style={styles.sectionTitle}>
                  Gợi ý cho bạn
                </CustomText>
              </View>
            </View>
            {loadingAIEvents ? (
              <View style={styles.loadingState}>
                <CustomText variant="body" style={styles.loadingText}>
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
                contentContainerStyle={styles.eventsList}
              />
            ) : (
              <View style={styles.emptyState}>
                <CustomText variant="body" style={styles.emptyText}>
                  Không có sự kiện gợi ý
                </CustomText>
              </View>
            )}
          </View>
        )}

        {!isStaffUser(accessToken) && shouldSplitEvents && featuredEvents.length > 0 && (
          <View style={styles.featuredSection}>
            <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
              <CustomText variant="h2" style={styles.sectionTitle}>
                Sự kiện nổi bật
              </CustomText>
            </View>
            <FlatList
              data={featuredEvents}
              renderItem={renderFeaturedEventCard}
              keyExtractor={keyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CustomText variant="h2" style={styles.sectionTitle}>
              {selectedCategory ? selectedCategory.eventCategoryName : 'Tất cả sự kiện'}
            </CustomText>
            <CustomText variant="caption" style={styles.sectionCount}>
              {eventList.length} sự kiện
            </CustomText>
          </View>

          {eventsLoading || categoriesLoading ? (
            <View style={styles.loadingState}>
              <CustomText variant="body" style={styles.loadingText}>
                {Strings.LOADING}
              </CustomText>
            </View>
          ) : eventList.length === 0 ? (
            <View style={styles.emptyState}>
              <Image source={Images.calendar} style={styles.emptyIcon} />
              <CustomText variant="h3" style={styles.emptyTitle}>
                Không tìm thấy sự kiện
              </CustomText>
              <CustomText variant="body" style={styles.emptyText}>
                Thử tìm kiếm với từ khóa khác
              </CustomText>
            </View>
          ) : (
            <FlatList
              data={eventList}
              renderItem={renderEventCard}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              contentContainerStyle={styles.eventsList}
            />
          )}
        </View>
      </ScrollView>

      <AIChatFloating />
    </View>
  );
};

export default HomeScreen;