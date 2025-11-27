import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, View } from 'react-native';
import { useSelector } from 'react-redux';
import { isStaffUser } from '../utils/jwtUtils';
import HomeScreen from '../screens/homeScreen';
import EventDetailScreen from '../screens/eventDetailScreen';
import MyEventsScreen from '../screens/myEventsScreen';
import ProfileScreen from '../screens/profileScreen';
import WalletScreen from '../screens/walletScreen';
import PaymentScreen from '../screens/paymentScreen';
import PaymentInformationScreen from '../screens/paymentInfoScreen';
import ChangePasswordScreen from '../screens/changePasswordScreen';
import SettingsScreen from '../screens/settingsScreen';
import TicketsScreen from '../screens/ticketsScreen';
import LikesScreen from '../screens/likesScreen';
import FavoriteEventsScreen from '../screens/favoriteEventsScreen';
import FriendsScreen from '../screens/friendsScreen';
import FriendDetailScreen from '../screens/friendDetailScreen';
import TimelineScreen from '../screens/timelineScreen';
import QrScannerScreen from '../screens/qrScannerScreen';
import ScreenNames from '../constants/ScreenNames';
import Images from '../constants/Images';
import Colors from '../constants/Colors';
import BookingScreen from '../screens/bookingScreen';

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

    </Stack.Navigator>
  );
};

// Stack Navigator cho Timeline tab
const TimelineStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
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
    </Stack.Navigator>
  );
};

// Stack Navigator cho Tickets tab (Vé của tôi)
const TicketsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="TicketsMain" component={TicketsScreen} />
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
    </Stack.Navigator>
  );
};

// Stack Navigator cho Favorite Events tab
const FavoriteEventsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="FavoriteEventsMain" component={FavoriteEventsScreen} />
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
    </Stack.Navigator>
  );
};

// Stack Navigator cho Profile tab
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen
        name={ScreenNames.WALLET_SCREEN}
        component={WalletScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.PAYMENT_SCREEN}
        component={PaymentScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.PAYMENT_INFORMATION_SCREEN}
        component={PaymentInformationScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.SETTINGS_SCREEN}
        component={SettingsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.CHANGE_PASSWORD_SCREEN}
        component={ChangePasswordScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.TICKETS_SCREEN}
        component={TicketsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.LIKES_SCREEN}
        component={LikesScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.FRIENDS_SCREEN}
        component={FriendsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={ScreenNames.FRIEND_DETAIL_SCREEN}
        component={FriendDetailScreen}
        options={{
          headerShown: false,
        }}
      />
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
    </Stack.Navigator>
  );
};

const TabNavigator = () => {
  const { accessToken, isLoggedIn } = useSelector(state => state.auth);
  const isStaff = isStaffUser(accessToken);
  const prevIsLoggedInRef = useRef(isLoggedIn);

  // Reset navigation when user logs out
  useEffect(() => {
    // Only run this effect when isLoggedIn changes from true to false
    if (prevIsLoggedInRef.current && !isLoggedIn) {
      // Clear any navigation state when user logs out
      console.log('User logged out, resetting navigation state');
    }
    
    // Update the ref to the current value
    prevIsLoggedInRef.current = isLoggedIn;
  }, [isLoggedIn]);

  // Memoize the tabs configuration to prevent re-rendering issues
  const tabScreens = useMemo(() => {
    const commonTabs = [
      {
        name: "HomeTab",
        component: HomeStack,
        options: {
          title: 'Trang chủ',
        }
      },
      {
        name: "Profile",
        component: ProfileStack,
        options: {
          title: 'Hồ sơ',
        }
      }
    ];

    // Always render the same tabs regardless of staff status to prevent re-rendering issues
    return [
      ...commonTabs.slice(0, 1), // HomeTab
      {
        name: "Timeline",
        component: TimelineStack,
        options: {
          title: 'Timeline',
        }
      },
      {
        name: "MyEvents",
        component: TicketsStack,
        options: {
          title: 'Vé của tôi',
        }
      },
      {
        name: "FavoriteEvents",
        component: FavoriteEventsStack,
        options: {
          title: 'Yêu thích',
        }
      },
      ...commonTabs.slice(1) // Profile
    ];
  }, []); // Empty dependencies to prevent re-rendering

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = Images.home;
          } else if (route.name === 'Timeline') {
            iconName = Images.calendar;
          } else if (route.name === 'MyEvents') {
            iconName = Images.ticket;
          } else if (route.name === 'FavoriteEvents') {
            iconName = Images.heart;
          } else if (route.name === 'Profile') {
            iconName = Images.profile;
          }

          return (
            <Image
              source={iconName}
              style={{
                width: size,
                height: size,
                tintColor: color,
              }}
            />
          );
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
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

export default TabNavigator;