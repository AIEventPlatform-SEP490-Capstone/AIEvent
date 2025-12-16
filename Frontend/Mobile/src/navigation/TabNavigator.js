import React, { useEffect, useMemo, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { isStaffUser } from '../utils/jwtUtils';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/homeScreen';
import EventDetailScreen from '../screens/eventDetailScreen';
import ProfileScreen from '../screens/profileScreen';
import SettingsScreen from '../screens/settingsScreen';
import QrScannerScreen from '../screens/qrScannerScreen';
import CheckInConfirmationScreen from '../screens/qrScannerScreen/CheckInConfirmationScreen';
import BookingScreen from '../screens/bookingScreen';
import NotificationsScreen from '../screens/notificationsScreen';
import { NearbyEventsStack } from './NearbyEventsNavigator';

import ScreenNames from '../constants/ScreenNames';
import Images from '../constants/Images';
import Colors from '../constants/Colors';
import AIChatScreen from '../screens/aiChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator cho Home tab
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name={ScreenNames.HOME_SCREEN} component={HomeScreen} />
      <Stack.Screen
        name={ScreenNames.EVENT_DETAIL_SCREEN}
        component={EventDetailScreen}
        options={{
          headerShown: true,
          title: 'Chi tiết sự kiện',
          headerStyle: {
            backgroundColor: Colors.white,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          },
          headerTitleStyle: {
            color: Colors.textPrimary,
            fontSize: 18,
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen
        name={ScreenNames.QR_SCANNER_SCREEN}
        component={QrScannerScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.CHECK_IN_CONFIRMATION_SCREEN}
        component={CheckInConfirmationScreen}
        options={{
          headerShown: true,
          title: 'Xác nhận Check-in',
          headerStyle: {
            backgroundColor: Colors.white,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          },
          headerTitleStyle: {
            color: Colors.textPrimary,
            fontSize: 18,
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen
        name={ScreenNames.BOOKING_SCREEN}
        component={BookingScreen}
        options={{
          headerShown: true,
          title: 'Đặt vé',
          headerStyle: {
            backgroundColor: Colors.white,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          },
          headerTitleStyle: {
            color: Colors.textPrimary,
            fontSize: 18,
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen
        name={ScreenNames.AI_CHAT_SCREEN}
        component={AIChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.NOTIFICATIONS_SCREEN}
        component={NotificationsScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Stack Navigator cho QR Scanner tab (chỉ dành cho staff)
const QrScannerStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name={ScreenNames.QR_SCANNER_SCREEN}
        component={QrScannerScreen}
      />
      <Stack.Screen
        name={ScreenNames.CHECK_IN_CONFIRMATION_SCREEN}
        component={CheckInConfirmationScreen}
        options={{
          headerShown: true,
          title: 'Xác nhận Check-in',
          headerStyle: {
            backgroundColor: Colors.white,
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          },
          headerTitleStyle: {
            color: Colors.textPrimary,
            fontSize: 18,
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Stack cho Profile (cả user và staff đều vào được Settings)
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen
      name={ScreenNames.SETTINGS_SCREEN}
      component={SettingsScreen}
    />
    <Stack.Screen
      name={ScreenNames.EVENT_DETAIL_SCREEN}
      component={EventDetailScreen}
      options={{
        headerShown: true,
        title: 'Chi tiết sự kiện',
        headerStyle: {
          backgroundColor: Colors.white,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          color: Colors.textPrimary,
          fontSize: 18,
          fontWeight: '600',
        },
      }}
    />
    <Stack.Screen
      name={ScreenNames.QR_SCANNER_SCREEN}
      component={QrScannerScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name={ScreenNames.CHECK_IN_CONFIRMATION_SCREEN}
      component={CheckInConfirmationScreen}
      options={{
        headerShown: true,
        title: 'Xác nhận Check-in',
        headerStyle: {
          backgroundColor: Colors.white,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          color: Colors.textPrimary,
          fontSize: 18,
          fontWeight: '600',
        },
      }}
    />
  </Stack.Navigator>
);

// Dynamic import cho các màn hình chỉ dành cho user thường (lazy load + tránh lỗi nếu file không tồn tại)
const getTimelineStack = () => {
  try {
    const TimelineScreen = require('../screens/timelineScreen').default;
    return () => (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={ScreenNames.TIMELINE_SCREEN}
          component={TimelineScreen}
        />
        <Stack.Screen
          name={ScreenNames.EVENT_DETAIL_SCREEN}
          component={EventDetailScreen}
          options={{
            headerShown: true,
            title: 'Chi tiết sự kiện',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            },
            headerTitleStyle: {
              color: Colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
            },
          }}
        />
        <Stack.Screen
          name={ScreenNames.QR_SCANNER_SCREEN}
          component={QrScannerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenNames.CHECK_IN_CONFIRMATION_SCREEN}
          component={CheckInConfirmationScreen}
          options={{
            headerShown: true,
            title: 'Xác nhận Check-in',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            },
            headerTitleStyle: {
              color: Colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
            },
          }}
        />
      </Stack.Navigator>
    );
  } catch (e) {
    return () => null;
  }
};

const getTicketsStack = () => {
  try {
    const TicketsScreen = require('../screens/ticketsScreen').default;
    return () => (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TicketsMain" component={TicketsScreen} />
        <Stack.Screen
          name={ScreenNames.EVENT_DETAIL_SCREEN}
          component={EventDetailScreen}
          options={{
            headerShown: true,
            title: 'Chi tiết sự kiện',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            },
            headerTitleStyle: {
              color: Colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
            },
          }}
        />
        <Stack.Screen
          name={ScreenNames.QR_SCANNER_SCREEN}
          component={QrScannerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenNames.CHECK_IN_CONFIRMATION_SCREEN}
          component={CheckInConfirmationScreen}
          options={{
            headerShown: true,
            title: 'Xác nhận Check-in',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            },
            headerTitleStyle: {
              color: Colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
            },
          }}
        />
      </Stack.Navigator>
    );
  } catch (e) {
    return () => null;
  }
};

const getFavoriteEventsStack = () => {
  try {
    const FavoriteEventsScreen =
      require('../screens/favoriteEventsScreen').default;
    return () => (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="FavoriteEventsMain"
          component={FavoriteEventsScreen}
        />
        <Stack.Screen
          name={ScreenNames.EVENT_DETAIL_SCREEN}
          component={EventDetailScreen}
          options={{
            headerShown: true,
            title: 'Chi tiết sự kiện',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            },
            headerTitleStyle: {
              color: Colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
            },
          }}
        />
        <Stack.Screen
          name={ScreenNames.QR_SCANNER_SCREEN}
          component={QrScannerScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenNames.CHECK_IN_CONFIRMATION_SCREEN}
          component={CheckInConfirmationScreen}
          options={{
            headerShown: true,
            title: 'Xác nhận Check-in',
            headerStyle: {
              backgroundColor: Colors.white,
              borderBottomWidth: 1,
              borderBottomColor: Colors.border,
            },
            headerTitleStyle: {
              color: Colors.textPrimary,
              fontSize: 18,
              fontWeight: '600',
            },
          }}
        />
      </Stack.Navigator>
    );
  } catch (e) {
    return () => null;
  }
};

const TabNavigator = () => {
  const { accessToken, isLoggedIn } = useSelector(state => state.auth);
  const isStaff = accessToken ? isStaffUser(accessToken) : false;
  const prevIsLoggedInRef = useRef(isLoggedIn);

  // Optional: reset navigation khi logout (nếu cần)
  useEffect(() => {
    if (prevIsLoggedInRef.current && !isLoggedIn) {
      console.log('User logged out');
    }
    prevIsLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  const tabScreens = useMemo(() => {
    if (isStaff) {
      return [
        {
          name: 'HomeTab',
          component: HomeStack,
          options: { title: 'Sự kiện' },
          icon: Images.home,
        },
        {
          name: 'QrScanner',
          component: QrScannerStack,
          options: { title: 'Quét QR' },
          icon: 'qr-code-outline', // Special icon for center tab
          isCenter: true,
        },
        {
          name: 'Profile',
          component: ProfileStack,
          options: { title: 'Hồ sơ' },
          icon: Images.profile,
        },
      ];
    }

    // Người dùng thường - 5 tab
    return [
      {
        name: 'HomeTab',
        component: HomeStack,
        options: { title: 'Trang chủ' },
        icon: Images.home,
      },
      {
        name: 'Timeline',
        component: getTimelineStack(),
        options: { title: 'Timeline' },
        icon: Images.calendar,
      },
      {
        name: 'Nearby',
        component: NearbyEventsStack,
        options: { title: 'Gần tôi' },
        icon: Images.location,
      },
      {
        name: 'FavoriteEvents',
        component: getFavoriteEventsStack(),
        options: { title: 'Yêu thích' },
        icon: Images.heart,
      },
      {
        name: 'Profile',
        component: ProfileStack,
        options: { title: 'Hồ sơ' },
        icon: Images.profile,
      },
    ];
  }, [isStaff]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const tab = tabScreens.find(t => t.name === route.name);
          const iconSource = tab?.icon;

          if (!iconSource) return null;

          // Center tab với icon đặc biệt (QR Scanner cho staff)
          if (tab?.isCenter) {
            return (
              <View style={tabStyles.centerTabContainer}>
                <View style={[
                  tabStyles.centerTabButton,
                  focused && tabStyles.centerTabButtonActive
                ]}>
                  <Ionicons 
                    name={iconSource} 
                    size={28} 
                    color="#fff" 
                  />
                </View>
              </View>
            );
          }

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Image
                source={iconSource}
                style={{
                  width: 24,   
                  height: 24,
                  tintColor: color,
                  resizeMode: 'contain',
                }}
              />
            </View>
          );
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 90,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      })}>
      {tabScreens.map((tab, index) => (
        <Tab.Screen
          key={`${tab.name}-${index}`}
          name={tab.name}
          component={tab.component}
          options={tab.options}
        />
      ))}
    </Tab.Navigator>
  );
};

const tabStyles = StyleSheet.create({
  centerTabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    top: -15,
  },
  centerTabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerTabButtonActive: {
    backgroundColor: Colors.secondary,
    transform: [{ scale: 1.05 }],
  },
});

export default TabNavigator;
