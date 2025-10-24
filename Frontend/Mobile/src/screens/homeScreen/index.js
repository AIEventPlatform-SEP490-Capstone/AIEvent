import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import CustomButton from '../../components/common/customButtonRN';
import EventCard from '../../components/presentation/EventCard';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';
import ScreenNames from '../../constants/ScreenNames';
import { EventService } from '../../api/services';

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
      const response = await EventService.getEvents();
      if (response.success) {
        setEvents(response.data);
        setFilteredEvents(response.data);
      }
    } catch (error) {
      // Error loading events
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      const response = await EventService.searchEvents(query);
      if (response.success) {
        setFilteredEvents(response.data);
      }
    } catch (error) {
      // Error searching events
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
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <CustomText variant="h2" color="primary">
              {Strings.APP_NAME}
            </CustomText>
            
            <TouchableOpacity style={styles.notificationButton}>
              <Image source={Images.bell} style={styles.notificationIcon} />
            </TouchableOpacity>
          </View>
    
          {/* Search Bar */}
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
          <CustomText variant="h1" color="primary" align="center">
            {Strings.HOME_TITLE}
          </CustomText>
          <CustomText variant="body" color="secondary" align="center">
            {Strings.HOME_SUBTITLE}
          </CustomText>
        </View>

        {/* Events List */}
        <View style={styles.eventsSection}>
          <CustomText variant="h2" color="primary">
            {Strings.UPCOMING_EVENTS}
          </CustomText>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <CustomText variant="body" color="secondary" align="center">
                {Strings.LOADING}
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
        </View>
      );
    };

export default HomeScreen;