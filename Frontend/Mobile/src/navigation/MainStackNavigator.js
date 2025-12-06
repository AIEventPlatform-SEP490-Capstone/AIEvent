import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import TabNavigator from './TabNavigator';
import WalletScreen from '../screens/walletScreen';
import PaymentInformationScreen from '../screens/paymentInfoScreen';
import TicketsScreen from '../screens/ticketsScreen';
import LikesScreen from '../screens/likesScreen';
import FriendsScreen from '../screens/friendsScreen';
import FriendDetailScreen from '../screens/friendDetailScreen';
import InvitationsScreen from '../screens/invitationsScreen';
import ChangePasswordScreen from '../screens/changePasswordScreen';

import ScreenNames from '../constants/ScreenNames';

const Stack = createStackNavigator();

const MainStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tab chính */}
      <Stack.Screen name={ScreenNames.TAB_NAVIGATOR} component={TabNavigator} />

      {/* TẤT CẢ các màn hình phụ mà Profile cần nhảy tới */}
      <Stack.Screen name={ScreenNames.WALLET_SCREEN} component={WalletScreen} />
      <Stack.Screen name={ScreenNames.PAYMENT_INFORMATION_SCREEN} component={PaymentInformationScreen} />
      <Stack.Screen name={ScreenNames.TICKETS_SCREEN} component={TicketsScreen} />
      <Stack.Screen name={ScreenNames.LIKES_SCREEN} component={LikesScreen} />
      <Stack.Screen name={ScreenNames.FRIENDS_SCREEN} component={FriendsScreen} />
      <Stack.Screen name={ScreenNames.FRIEND_DETAIL_SCREEN} component={FriendDetailScreen} />
      <Stack.Screen name={ScreenNames.INVITATIONS_SCREEN} component={InvitationsScreen} />
      <Stack.Screen name={ScreenNames.CHANGE_PASSWORD_SCREEN} component={ChangePasswordScreen} />

      {/* Nếu còn màn hình nào khác thì thêm vào đây luôn */}
    </Stack.Navigator>
  );
};

export default MainStackNavigator;