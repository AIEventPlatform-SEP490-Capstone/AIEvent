import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';

const LikesScreen = ({ navigation }) => {
  // Mock data - sẽ được thay thế bằng API call
  const likedEvents = [];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <CustomText variant="h2" color="primary" style={styles.title}>
            Sự kiện yêu thích
          </CustomText>
          <CustomText variant="body" color="secondary" style={styles.subtitle}>
            Các sự kiện bạn đã lưu
          </CustomText>
        </View>

        {likedEvents.length > 0 ? (
          <View style={styles.content}>
            {/* Liked events will be rendered here */}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <CustomText variant="h1" color="secondary">💔</CustomText>
            </View>
            <CustomText variant="h4" color="primary" style={styles.emptyStateTitle}>
              Chưa có sự kiện yêu thích
            </CustomText>
            <CustomText variant="body" color="secondary" style={styles.emptyStateDescription}>
              Bạn chưa lưu sự kiện nào vào danh sách yêu thích. Hãy khám phá và lưu những sự kiện thú vị!
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

export default LikesScreen;

