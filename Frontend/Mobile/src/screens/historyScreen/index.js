import React from 'react';
import {
  View,
  ScrollView,
} from 'react-native';
import { styles } from './styles';
import CustomText from '../../components/common/customTextRN';
import Fonts from '../../constants/Fonts';

const HistoryScreen = ({ navigation }) => {
  // Mock data - sẽ được thay thế bằng API call
  const history = [];

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <CustomText variant="h2" color="primary" style={styles.title}>
            Lịch sử hoạt động
          </CustomText>
          <CustomText variant="body" color="secondary" style={styles.subtitle}>
            Theo dõi hoạt động của bạn
          </CustomText>
        </View>

        {history.length > 0 ? (
          <View style={styles.content}>
            {/* History items will be rendered here */}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <CustomText variant="h1" color="secondary">📈</CustomText>
            </View>
            <CustomText variant="h4" color="primary" style={styles.emptyStateTitle}>
              Chưa có hoạt động
            </CustomText>
            <CustomText variant="body" color="secondary" style={styles.emptyStateDescription}>
              Lịch sử hoạt động của bạn sẽ được hiển thị ở đây khi bạn tham gia các sự kiện.
            </CustomText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default HistoryScreen;

