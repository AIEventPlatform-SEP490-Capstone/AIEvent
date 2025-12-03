// AppNavigator.js
import React, { useEffect, useRef } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from '../redux/actions/Action';
import MainStackNavigator from './MainStackNavigator';  
import AuthNavigator from './AuthNavigator';
import ScreenNames from '../constants/ScreenNames';
import { LoadingScreen } from '../components/common';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const dispatch = useDispatch();
  const { isLoggedIn, isLoading } = useSelector(state => state.auth);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      dispatch(checkAuth());
    }
  }, [dispatch]);

  if (isLoading) {
    return <LoadingScreen message="Đang đăng nhập..." />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen
          name="MainApp"
          component={MainStackNavigator}
          options={{ unmountOnBlur: true }}
        />
      ) : (
        <Stack.Screen
          name={ScreenNames.AUTH_NAVIGATOR}
          component={AuthNavigator}
          options={{ unmountOnBlur: true }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;