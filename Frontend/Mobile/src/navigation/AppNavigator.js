import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/homeScreen';
import EventDetailScreen from '../screens/eventDetailScreen';
import ScreenNames from '../constants/ScreenNames';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName={ScreenNames.HOME_SCREEN}
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
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;