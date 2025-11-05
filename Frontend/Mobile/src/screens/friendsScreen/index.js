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

const FriendsScreen = ({ navigation }) => {
  // Mock data - sẽ được thay thế bằng API call
  const friends = [];

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
            Bạn bè
          </CustomText>
          <CustomText variant="body" color="white" style={styles.subtitle}>
            Kết nối với cộng đồng
          </CustomText>
        </LinearGradient>

        {friends.length > 0 ? (
          <View style={styles.content}>
            {/* Friends list will be rendered here */}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <CustomText variant="h1" color="secondary">👤</CustomText>
            </View>
            <CustomText variant="h4" color="primary" style={styles.emptyStateTitle}>
              Chưa có bạn bè
            </CustomText>
            <CustomText variant="body" color="secondary" style={styles.emptyStateDescription}>
              Bạn chưa kết bạn với ai. Hãy tham gia các sự kiện để gặp gỡ và kết bạn với những người có cùng sở thích!
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

export default FriendsScreen;

