import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { ActivityIndicator } from 'react-native';
import { checkAuth } from '../redux/actions/Action';
import HomeScreen from '../screens/homeScreen';
import EventDetailScreen from '../screens/eventDetailScreen';
import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';
import ScreenNames from '../constants/ScreenNames';
import Colors from '../constants/Colors.js';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isLoggedIn, isLoading } = useSelector(state => state.auth);

  useEffect(() => {
    // Kiểm tra xem người dùng khi app start
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) {
    return <ActivityIndicator size="large" color="#FF6B6B" />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {isLoggedIn ? (
        <Stack.Screen 
          name={ScreenNames.TAB_NAVIGATOR} 
          component={TabNavigator} 
        />
      ) : (
        <Stack.Screen 
          name={ScreenNames.AUTH_NAVIGATOR} 
          component={AuthNavigator} 
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;