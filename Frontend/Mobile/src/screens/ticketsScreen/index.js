import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const TicketsScreen = ({ navigation }) => {
  // Mock data - sẽ được thay thế bằng API call
  const eventTickets = [];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={Colors.gradientHeaderTitle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <CustomText variant="h2" color="white" style={styles.title}>
            Vé của tôi
          </CustomText>
          <CustomText variant="body" color="white" style={styles.subtitle}>
            Quản lý vé tham gia sự kiện
          </CustomText>
        </LinearGradient>

        {eventTickets.length > 0 ? (
          <View style={styles.content}>
            {/* Ticket cards will be rendered here */}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <CustomText variant="h1" color="secondary">🎫</CustomText>
            </View>
            <CustomText variant="h4" color="primary" style={styles.emptyStateTitle}>
              Chưa có vé nào
            </CustomText>
            <CustomText variant="body" color="secondary" style={styles.emptyStateDescription}>
              Bạn chưa tham gia sự kiện nào. Hãy khám phá và đăng ký tham gia các sự kiện thú vị!
            </CustomText>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => navigation.getParent()?.navigate('HomeTab')}
            >
              <CustomText variant="body" color="white">Khám phá sự kiện</CustomText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TicketsScreen;

