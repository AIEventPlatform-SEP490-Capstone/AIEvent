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
        name="WalletScreen" 
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
        name="PaymentScreen" 
        component={PaymentScreen}
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
