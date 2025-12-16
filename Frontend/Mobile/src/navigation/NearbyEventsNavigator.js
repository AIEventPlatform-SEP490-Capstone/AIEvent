// Stack cho Nearby Events
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import NearbyEventsScreen from '../screens/nearbyScreen';
import EventDetailScreen from '../screens/eventDetailScreen';
import QrScannerScreen from '../screens/qrScannerScreen';
import CheckInConfirmationScreen from '../screens/qrScannerScreen/CheckInConfirmationScreen';
import ScreenNames from '../constants/ScreenNames';
import Colors from '../constants/Colors';

const Stack = createStackNavigator();

export const NearbyEventsStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
            name="NearbyEventsMain"
            component={NearbyEventsScreen}
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
