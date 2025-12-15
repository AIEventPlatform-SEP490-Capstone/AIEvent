import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import CustomText from '../../common/customTextRN';
import CustomButton from '../../common/customButtonRN';
import Images from '../../../constants/Images';
import Colors from '../../../constants/Colors';

const EventInviteFriendsModal = ({
  visible,
  onClose,
  friends,
  loadingFriends,
  selectedFriends,
  onToggleFriend,
  inviteMessage,
  onChangeMessage,
  onSendInvites,
  sendingInvites,
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          <View style={styles.header}>
            <CustomText variant="h3" style={styles.title}>Mời bạn bè</CustomText>
            <TouchableOpacity onPress={onClose}>
              <Image source={Images.close} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.messageContainer}>
              <CustomText variant="body" color="primary">Tin nhắn mời (tùy chọn)</CustomText>
              <TextInput
                style={styles.messageInput}
                placeholder="Nhập tin nhắn mời..."
                placeholderTextColor={Colors.textLight}
                value={inviteMessage}
                onChangeText={onChangeMessage}
                multiline
                maxLength={200}
              />
            </View>

            <View style={styles.friendsContainer}>
              <CustomText variant="body" color="primary">
                Chọn bạn bè ({selectedFriends.length} đã chọn)
              </CustomText>

              {loadingFriends ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <CustomText variant="body" color="secondary" style={{ marginTop: 12 }}>
                    Đang tải danh sách bạn bè...
                  </CustomText>
                </View>
              ) : friends.length === 0 ? (
                <CustomText variant="body" color="secondary" align="center">
                  Bạn chưa có bạn bè nào
                </CustomText>
              ) : (
                friends.map(friend => {
                  const isSelected = selectedFriends.includes(friend.id);
                  return (
                    <TouchableOpacity
                      key={friend.id}
                      style={[styles.friendItem, isSelected && styles.friendItemSelected]}
                      onPress={() => onToggleFriend(friend.id)}>
                      <View style={styles.friendContent}>
                        <View style={styles.avatar}>
                          {friend.image ? (
                            <Image source={{ uri: friend.image }} style={styles.avatarImage} />
                          ) : (
                            <CustomText variant="h4" color="white">
                              {friend.friendName?.[0]?.toUpperCase() || 'U'}
                            </CustomText>
                          )}
                        </View>
                        <View style={styles.friendInfo}>
                          <CustomText variant="body" color="primary">{friend.friendName || 'Người dùng'}</CustomText>
                          {friend.district && (
                            <CustomText variant="caption" color="secondary">{friend.district}</CustomText>
                          )}
                        </View>
                      </View>
                      {isSelected && (
                        <CustomText variant="h4" color="white">✓</CustomText>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <CustomButton title="Hủy" onPress={onClose} variant="outline" style={styles.btn} />
            <CustomButton
              title={sendingInvites ? 'Đang gửi...' : 'Gửi lời mời'}
              onPress={onSendInvites}
              disabled={sendingInvites || selectedFriends.length === 0}
              style={styles.btnSend}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  backdrop: { flex: 1 },
  content: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontWeight: '700' },
  closeIcon: { width: 24, height: 24 },
  messageContainer: { padding: 20, paddingTop: 0 },
  messageInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 12, marginTop: 8, minHeight: 80, textAlignVertical: 'top' },
  friendsContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  loading: { alignItems: 'center', padding: 40 },
  friendItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginTop: 8, backgroundColor: '#f9f9f9' },
  friendItemSelected: { backgroundColor: Colors.primary + '20' },
  friendContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  friendInfo: { flex: 1 },
  footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderColor: '#eee' },
  btn: { flex: 1, marginRight: 10 },
  btnSend: { flex: 1, marginLeft: 10 },
};

export default EventInviteFriendsModal;