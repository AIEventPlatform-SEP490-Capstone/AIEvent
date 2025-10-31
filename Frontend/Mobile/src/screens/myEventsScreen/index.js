import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import { LinearGradient } from 'expo-linear-gradient';
import EventCard from '../../components/presentation/EventCard';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';
import ScreenNames from '../../constants/ScreenNames';
import { EventService } from '../../api/services';

const MyEventsScreen = () => {
  const navigation = useNavigation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMyEvents();
  }, []);

  const loadMyEvents = async () => {
    try {
      setLoading(true);
      // TODO: Implement API call for user's events
      // const response = await ApiCalls.getMyEvents();
      // if (response.success) {
      //   setEvents(response.data);
      // }
      
      // Mock data for now
      setEvents([]);
    } catch (error) {
      console.error('Error loading my events:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyEvents();
    setRefreshing(false);
  };

  const handleEventPress = (event) => {
    navigation.navigate(ScreenNames.EVENT_DETAIL_SCREEN, { 
      eventId: event.id,
    });
  };

  const renderEventCard = ({ item }) => (
    <EventCard event={item} onPress={handleEventPress} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image source={Images.calendar} style={styles.emptyIcon} />
      <CustomText variant="h3" color="primary" align="center" style={styles.emptyTitle}>
        Chưa có sự kiện nào
      </CustomText>
      <CustomText variant="body" color="secondary" align="center" style={styles.emptySubtitle}>
        Bạn chưa tham gia sự kiện nào. Hãy khám phá các sự kiện thú vị!
      </CustomText>
      <TouchableOpacity 
        style={styles.exploreButton}
        onPress={() => navigation.navigate('HomeTab')}
      >
        <CustomText variant="body" color="white" align="center">
          Khám phá sự kiện
        </CustomText>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Premium Header */}
      <LinearGradient
        colors={Colors.gradientHeaderTitle}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <CustomText variant="h2" color="white" style={{ fontSize: Fonts.xxl, fontWeight: '800', fontFamily: Fonts.bold }}>
          Sự kiện của tôi
        </CustomText>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <Image source={Images.settings} style={styles.filterIcon} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <CustomText variant="body" color="secondary" align="center">
              {Strings.LOADING}
            </CustomText>
          </View>
        ) : events.length === 0 ? (
          renderEmptyState()
        ) : (
          <View style={styles.eventsList}>
            <FlatList
              data={events}
              renderItem={renderEventCard}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MyEventsScreen;
