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
import ApiCalls from '../../api/ApiCalls';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      const response = await ApiCalls.getEvents();
      if (response.success) {
        setEvents(response.data);
        setFilteredEvents(response.data);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    try {
      const response = await ApiCalls.searchEvents(query);
      if (response.success) {
        setFilteredEvents(response.data);
      }
    } catch (error) {
      console.error('Error searching events:', error);
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

  const renderSideMenu = () => (
    <View style={styles.sideMenu}>
      <View style={styles.menuHeader}>
        <Image source={Images.avatar1} style={styles.menuAvatar} />
        <CustomText variant="h3" color="primary">
          {Strings.USER_NAME}
        </CustomText>
        <CustomText variant="caption" color="secondary">
          {Strings.USER_EMAIL}
        </CustomText>
      </View>
      
      <View style={styles.menuItems}>
        <TouchableOpacity style={styles.menuItem}>
          <Image source={Images.home} style={styles.menuIcon} />
          <CustomText variant="body" color="primary">
            {Strings.MENU_HOME}
          </CustomText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Image source={Images.calendar} style={styles.menuIcon} />
          <CustomText variant="body" color="primary">
            {Strings.MENU_MY_EVENTS}
          </CustomText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Image source={Images.profile} style={styles.menuIcon} />
          <CustomText variant="body" color="primary">
            {Strings.MENU_PROFILE}
          </CustomText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Image source={Images.settings} style={styles.menuIcon} />
          <CustomText variant="body" color="primary">
            {Strings.MENU_SETTINGS}
          </CustomText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <Image source={Images.notification} style={styles.menuIcon} />
          <CustomText variant="body" color="primary">
            {Strings.MENU_NOTIFICATIONS}
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
    
      return (
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setIsMenuOpen(!isMenuOpen)}
            >
              <Image source={Images.menu} style={styles.menuIcon} />
            </TouchableOpacity>
            
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
    
          {/* Side Menu Overlay */}
          {isMenuOpen && (
            <>
              <TouchableOpacity 
                style={styles.menuOverlay}
                onPress={() => setIsMenuOpen(false)}
                activeOpacity={1}
              />
              {renderSideMenu()}
            </>
          )}
    
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