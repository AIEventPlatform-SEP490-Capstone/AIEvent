import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  Modal,
  Share,
  Linking,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import CustomText from '../../common/customTextRN';
import Images from '../../../constants/Images';
import Colors from '../../../constants/Colors';

const shareOptions = [
  { title: 'Hệ thống', icon: Images.shareSystem },
  { title: 'Sao chép', icon: Images.copy },
  { title: 'Zalo', icon: Images.zalo },
  { title: 'Facebook', icon: Images.facebook },
  { title: 'Twitter', icon: Images.twitter },
  { title: 'LinkedIn', icon: Images.linkedin },
];

const EventShareSection = ({ visible, onClose, eventTitle, shareUrl }) => {
  const handleShareSystem = async () => {
    try {
      await Share.share({ message: `${eventTitle}\n${shareUrl}` });
      Toast.show({ type: 'success', text1: 'Đã chia sẻ!' });
    } catch {
      Toast.show({ type: 'error', text1: 'Không thể chia sẻ' });
    }
  };

  const handleCopyLink = () => {
    Clipboard.setString(shareUrl);
    Toast.show({ type: 'success', text1: 'Đã sao chép link!' });
  };

  const handleShareZalo = () => {
    const url = `zalo://qr/share?url=${encodeURIComponent(shareUrl)}`;
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Zalo không khả dụng' }));
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Facebook không khả dụng' }));
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(eventTitle || '')}`;
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Twitter không khả dụng' }));
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'LinkedIn không khả dụng' }));
  };

  const handlers = {
    'Hệ thống': handleShareSystem,
    'Sao chép': handleCopyLink,
    'Zalo': handleShareZalo,
    'Facebook': handleShareFacebook,
    'Twitter': handleShareTwitter,
    'LinkedIn': handleShareLinkedIn,
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            <CustomText variant="h3" style={{ fontWeight: '700' }}>Chia sẻ sự kiện</CustomText>
            <TouchableOpacity onPress={onClose}>
              <Image source={Images.close} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {shareOptions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.gridItem}
                onPress={() => {
                  handlers[item.title]();
                  onClose();
                }}
                activeOpacity={0.7}>
                <Image source={item.icon} style={styles.gridIcon} />
                <CustomText variant="caption" style={styles.gridText}>{item.title}</CustomText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  backdrop: { flex: 1 },
  container: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeIcon: { width: 24, height: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  gridItem: { alignItems: 'center', width: '33%', marginBottom: 20 },
  gridIcon: { width: 48, height: 48, marginBottom: 8 },
  gridText: { fontSize: 12, color: Colors.textPrimary },
};

export default EventShareSection;