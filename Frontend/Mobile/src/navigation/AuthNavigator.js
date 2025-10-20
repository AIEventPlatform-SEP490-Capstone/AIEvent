import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/loginScreen';
import RegisterScreen from '../screens/registerScreen';
import ScreenNames from '../constants/ScreenNames';

const Stack = createStackNavigator();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ScreenNames.LOGIN_SCREEN}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name={ScreenNames.LOGIN_SCREEN} 
        component={LoginScreen} 
      />
      <Stack.Screen 
        name={ScreenNames.REGISTER_SCREEN} 
        component={RegisterScreen} 
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;