import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../redux/actions/Action';
import HomeScreen from '../screens/homeScreen';
import EventDetailScreen from '../screens/eventDetailScreen';
import TabNavigator from './TabNavigator';
import AuthNavigator from './AuthNavigator';
import ScreenNames from '../constants/ScreenNames';
import { LoadingScreen } from '../components/common';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isLoggedIn, isLoading } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen message="Đang đăng nhập..." />;
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