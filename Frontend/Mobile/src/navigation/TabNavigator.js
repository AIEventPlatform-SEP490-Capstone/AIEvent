import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Image, View } from 'react-native';
import HomeScreen from '../screens/homeScreen';
import EventDetailScreen from '../screens/eventDetailScreen';
import MyEventsScreen from '../screens/myEventsScreen';
import ProfileScreen from '../screens/profileScreen';
import WalletScreen from '../screens/walletScreen';
import PaymentScreen from '../screens/paymentScreen';
import ChangePasswordScreen from '../screens/changePasswordScreen';
import SettingsScreen from '../screens/settingsScreen';
import TicketsScreen from '../screens/ticketsScreen';
import LikesScreen from '../screens/likesScreen';
import FriendsScreen from '../screens/friendsScreen';
import HistoryScreen from '../screens/historyScreen';
import TimelineScreen from '../screens/timelineScreen';
import ScreenNames from '../constants/ScreenNames';
import Images from '../constants/Images';
import Colors from '../constants/Colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator cho Home tab
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name={ScreenNames.HOME_SCREEN} 
        component={HomeScreen}
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
    </Stack.Navigator>
  );
};

// Stack Navigator cho Timeline tab
const TimelineStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
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
    </Stack.Navigator>
  );
};

// Stack Navigator cho MyEvents tab
const MyEventsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="MyEventsMain" 
        component={MyEventsScreen}
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
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
      />
      <Stack.Screen 
        name={ScreenNames.WALLET_SCREEN} 
        component={WalletScreen}
        options={{
          headerShown: true,
          title: 'Ví điện tử',
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
        name={ScreenNames.PAYMENT_SCREEN} 
        component={PaymentScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name={ScreenNames.SETTINGS_SCREEN} 
        component={SettingsScreen}
        options={{
          headerShown: true,
          title: 'Cài đặt',
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
          headerShown: true,
          title: 'Vé của tôi',
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
        name={ScreenNames.LIKES_SCREEN} 
        component={LikesScreen}
        options={{
          headerShown: true,
          title: 'Yêu thích',
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
        name={ScreenNames.FRIENDS_SCREEN} 
        component={FriendsScreen}
        options={{
          headerShown: true,
          title: 'Bạn bè',
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
        name={ScreenNames.HISTORY_SCREEN} 
        component={HistoryScreen}
        options={{
          headerShown: true,
          title: 'Lịch sử',
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

const TabNavigator = () => {
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
            iconName = Images.calendar;
          } else if (route.name === 'Profile') {
            iconName = Images.profile;
          }

          return (
            <Image 
              source={iconName} 
              style={{ 
                width: size, 
                height: size, 
                tintColor: color 
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
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack}
        options={{
          title: 'Trang chủ',
        }}
      />
      <Tab.Screen 
        name="Timeline" 
        component={TimelineStack}
        options={{
          title: 'Timeline',
        }}
      />
      <Tab.Screen 
        name="MyEvents" 
        component={MyEventsStack}
        options={{
          title: 'Sự kiện của tôi',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileStack}
        options={{
          title: 'Hồ sơ',
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
