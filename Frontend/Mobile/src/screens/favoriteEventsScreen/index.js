import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import styles from './styles';
import CustomText from '../../components/common/customTextRN';
import { LinearGradient } from 'expo-linear-gradient';
import EventCardWithFavorite from '../../components/presentation/EventCardWithFavorite';
import Colors from '../../constants/Colors';
import { fetchFavoriteEvents, selectFavoriteEvents, selectFavoriteEventsLoading, selectFavoriteEventsError } from '../../redux/slices/favoriteEventsSlice';

const FavoriteEventsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Use Redux selectors
  const favoriteEvents = useSelector(selectFavoriteEvents);
  const loading = useSelector(selectFavoriteEventsLoading);
  const error = useSelector(selectFavoriteEventsError);
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFavoriteEvents();
  }, []);

  const loadFavoriteEvents = async () => {
    try {
      await dispatch(fetchFavoriteEvents({ pageNumber: 1, pageSize: 20 })).unwrap();
    } catch (err) {
      console.error('Error loading favorite events:', err);
      Alert.alert('Error', 'Failed to load favorite events');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchFavoriteEvents({ pageNumber: 1, pageSize: 20 })).unwrap();
    } catch (err) {
      console.error('Error refreshing favorite events:', err);
      Alert.alert('Error', 'Failed to refresh favorite events');
    } finally {
      setRefreshing(false);
    }
  };

  const handleEventPress = (event) => {
    // Use the correct ID property - events have eventId, not id
    const eventId = event.eventId || event.EventId || event.id;
    
    // Only navigate if we have a valid eventId
    if (eventId) {
      navigation.navigate('EventDetailScreen', { 
        eventId: eventId,
      });
    } else {
      console.warn('No valid eventId found for event:', event);
      Alert.alert('Error', 'Unable to open event details');
    }
  };

  const renderEventCard = ({ item }) => (
    <EventCardWithFavorite event={item} onPress={handleEventPress} />
  );

  // Robust keyExtractor that handles undefined IDs
  const keyExtractor = (item, index) => {
    // Try multiple possible ID properties
    const id = item.id || item.eventId || item.EventId || index.toString();
    return id ? id.toString() : Math.random().toString();
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        <LinearGradient
          colors={Colors.gradientHeaderTitle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <CustomText variant="h2" color="white" style={styles.title}>
            Sự kiện yêu thích
          </CustomText>
          <CustomText variant="body" color="white" style={styles.subtitle}>
            Các sự kiện bạn đã lưu
          </CustomText>
        </LinearGradient>

        {favoriteEvents.length > 0 ? (
          <View style={styles.content}>
            <FlatList
              data={favoriteEvents}
              renderItem={renderEventCard}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <CustomText variant="h1" color="secondary">💔</CustomText>
            </View>
            <CustomText variant="h4" color="primary" style={styles.emptyStateTitle}>
              Chưa có sự kiện yêu thích
            </CustomText>
            <CustomText variant="body" color="secondary" style={styles.emptyStateDescription}>
              Bạn chưa lưu sự kiện nào vào danh sách yêu thích. Hãy khám phá và lưu những sự kiện thú vị!
            </CustomText>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => navigation.getParent()?.navigate('HomeTab')}
            >
              <CustomText variant="body" color="white">Khám phá sự kiện</CustomText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default FavoriteEventsScreen;