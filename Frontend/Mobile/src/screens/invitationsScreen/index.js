import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import CustomText from '../../components/common/customTextRN';
import CustomButton from '../../components/common/customButtonRN';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import EventService from '../../api/services/EventService';
import AuthService from '../../api/services/AuthService';
import { decodeJWT } from '../../utils/jwtUtils';
import Toast from 'react-native-toast-message';
import { styles } from './styles';

const { width } = Dimensions.get('window');

const InvitationsScreen = () => {
  const navigation = useNavigation();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all', 'sent', 'received'
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'approve' or 'reject'
  const [processing, setProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get current user ID from token or user object
  const accessToken = useSelector(state => state.auth.accessToken);
  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    const getUserId = async () => {
      // Try to get from user object first
      if (user?.id || user?.userId) {
        setCurrentUserId(user.id || user.userId);
        return;
      }

      // Try to get from token
      const token = accessToken || await AuthService.getAccessToken();
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded) {
          const userId = decoded.userId || decoded.UserId || decoded.sub || decoded.id || decoded.Id;
          if (userId) {
            setCurrentUserId(userId);
          }
        }
      }
    };

    getUserId();
  }, [accessToken, user]);

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await EventService.getInvitationsStatus();
      
      if (response.success && response.data) {
        setInvitations(response.data);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Không thể tải danh sách lời mời',
        });
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi tải danh sách lời mời',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInvitations();
    }, [loadInvitations])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInvitations();
  }, [loadInvitations]);

  // Filter invitations based on selected tab
  const filteredInvitations = invitations.filter(invitation => {
    if (selectedTab === 'sent') {
      // Sent invitations: inviterId matches current user
      return invitation.inviterId === currentUserId;
    } else if (selectedTab === 'received') {
      // Received invitations: invitedUserId matches current user
      return invitation.invitedUserId === currentUserId;
    }
    return true; // 'all' shows everything
  });

  // Get status badge color
  const getStatusColor = (status) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'approved' || normalizedStatus === 'accepted') {
      return '#4CAF50';
    }
    if (normalizedStatus === 'rejected') {
      return '#F44336';
    }
    if (normalizedStatus === 'pending') {
      return '#FF9800';
    }
    return Colors.secondary;
  };

  // Get status text in Vietnamese
  const getStatusText = (status) => {
    const normalizedStatus = status?.toLowerCase();
    if (normalizedStatus === 'approved' || normalizedStatus === 'accepted') {
      return 'Đã chấp nhận';
    }
    if (normalizedStatus === 'rejected') {
      return 'Đã từ chối';
    }
    if (normalizedStatus === 'pending') {
      return 'Đang chờ';
    }
    return status || 'Không xác định';
  };

  // Handle approve/reject with confirmation
  const handleConfirmAction = useCallback((invitation, action) => {
    setSelectedInvitation(invitation);
    setConfirmAction(action);
    setConfirmModalVisible(true);
  }, []);

  // Execute approve/reject action
  const executeAction = useCallback(async () => {
    if (!selectedInvitation || !confirmAction) return;

    try {
      setProcessing(true);
      const status = confirmAction === 'approve' ? 'Approved' : 'Rejected';
      
      const response = await EventService.confirmInvitation(
        selectedInvitation.invitationId,
        status
      );

      if (response.success) {
        Toast.show({
          type: 'success',
          text1: confirmAction === 'approve' 
            ? 'Đã chấp nhận lời mời' 
            : 'Đã từ chối lời mời',
        });
        setConfirmModalVisible(false);
        setSelectedInvitation(null);
        setConfirmAction(null);
        // Reload invitations
        loadInvitations();
      } else {
        Toast.show({
          type: 'error',
          text1: response.message || 'Không thể xử lý lời mời',
        });
      }
    } catch (error) {
      console.error('Error processing invitation:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi xử lý lời mời',
      });
    } finally {
      setProcessing(false);
    }
  }, [selectedInvitation, confirmAction, loadInvitations]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Navigate to event detail
  const handleViewEvent = useCallback((eventId) => {
    navigation.navigate('EventDetailScreen', { eventId });
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Image source={Images.logout} style={styles.backIcon} />
        </TouchableOpacity>
        <CustomText variant="h2" color="primary" style={styles.headerTitle}>
          Lời mời sự kiện
        </CustomText>
        <View style={styles.headerRight} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}>
          <CustomText
            variant="body"
            color={selectedTab === 'all' ? 'white' : 'secondary'}
            style={styles.tabText}>
            Tất cả
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'sent' && styles.tabActive]}
          onPress={() => setSelectedTab('sent')}>
          <CustomText
            variant="body"
            color={selectedTab === 'sent' ? 'white' : 'secondary'}
            style={styles.tabText}>
            Đã gửi
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'received' && styles.tabActive]}
          onPress={() => setSelectedTab('received')}>
          <CustomText
            variant="body"
            color={selectedTab === 'received' ? 'white' : 'secondary'}
            style={styles.tabText}>
            Đã nhận
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <CustomText variant="body" color="secondary" style={styles.loadingText}>
            Đang tải...
          </CustomText>
        </View>
      ) : filteredInvitations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText variant="h3" color="secondary" align="center">
            Chưa có lời mời nào
          </CustomText>
          <CustomText variant="body" color="secondary" align="center" style={styles.emptyText}>
            {selectedTab === 'sent' 
              ? 'Bạn chưa gửi lời mời nào'
              : selectedTab === 'received'
              ? 'Bạn chưa nhận lời mời nào'
              : 'Chưa có lời mời nào'}
          </CustomText>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {filteredInvitations.map((invitation) => {
            const isSent = invitation.inviterId === currentUserId;
            const isReceived = invitation.invitedUserId === currentUserId;
            const normalizedStatus = invitation.status?.toLowerCase();
            const isPending = normalizedStatus === 'pending';

            return (
              <View key={invitation.invitationId} style={styles.invitationCard}>
                {/* Event Image */}
                <TouchableOpacity
                  onPress={() => handleViewEvent(invitation.eventId)}
                  style={styles.eventImageContainer}>
                  {invitation.eventImage ? (
                    <Image
                      source={{ uri: invitation.eventImage }}
                      style={styles.eventImage}
                    />
                  ) : (
                    <View style={styles.eventImagePlaceholder}>
                      <CustomText variant="h4" color="white">
                        {invitation.eventTitle?.[0]?.toUpperCase() || 'E'}
                      </CustomText>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Invitation Info */}
                <View style={styles.invitationInfo}>
                  <TouchableOpacity
                    onPress={() => handleViewEvent(invitation.eventId)}>
                    <CustomText variant="h4" color="primary" style={styles.eventTitle}>
                      {invitation.eventTitle}
                    </CustomText>
                  </TouchableOpacity>

                  {/* User Info */}
                  <View style={styles.userInfo}>
                    {isSent ? (
                      <>
                        <CustomText variant="caption" color="secondary">
                          Đã mời:
                        </CustomText>
                        <CustomText variant="body" color="primary" style={styles.userName}>
                          {invitation.invitedUserName || invitation.invitedUserEmail}
                        </CustomText>
                      </>
                    ) : (
                      <>
                        <CustomText variant="caption" color="secondary">
                          Được mời bởi:
                        </CustomText>
                        <CustomText variant="body" color="primary" style={styles.userName}>
                          {invitation.inviteName || invitation.inviteEmail}
                        </CustomText>
                      </>
                    )}
                  </View>

                  {/* Message */}
                  {invitation.message && (
                    <View style={styles.messageContainer}>
                      <CustomText variant="caption" color="secondary" style={styles.messageText}>
                        "{invitation.message}"
                      </CustomText>
                    </View>
                  )}

                  {/* Status and Date */}
                  <View style={styles.statusContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(invitation.status) },
                      ]}>
                      <CustomText variant="caption" color="white" style={styles.statusText}>
                        {getStatusText(invitation.status)}
                      </CustomText>
                    </View>
                    <CustomText variant="caption" color="secondary" style={styles.dateText}>
                      {formatDate(invitation.createdAt)}
                    </CustomText>
                  </View>

                  {/* Action Buttons for Received Pending Invitations */}
                  {isReceived && isPending && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={() => handleConfirmAction(invitation, 'reject')}
                        activeOpacity={0.7}>
                        <CustomText variant="body" style={styles.rejectButtonText}>
                          Từ chối
                        </CustomText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.approveButton}
                        onPress={() => handleConfirmAction(invitation, 'approve')}
                        activeOpacity={0.7}>
                        <CustomText variant="body" style={styles.approveButtonText}>
                          Chấp nhận
                        </CustomText>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <CustomText variant="h3" color="primary" style={styles.modalTitle}>
              Xác nhận
            </CustomText>
            <CustomText variant="body" color="secondary" style={styles.modalMessage}>
              {confirmAction === 'approve'
                ? 'Bạn có chắc chắn muốn chấp nhận lời mời tham gia sự kiện này không?'
                : 'Bạn có chắc chắn muốn từ chối lời mời tham gia sự kiện này không?'}
            </CustomText>
            {selectedInvitation && (
              <View style={styles.modalEventInfo}>
                <CustomText variant="body" color="primary" style={styles.modalEventTitle}>
                  {selectedInvitation.eventTitle}
                </CustomText>
              </View>
            )}
            <View style={styles.modalButtons}>
              <CustomButton
                title="Hủy"
                onPress={() => {
                  setConfirmModalVisible(false);
                  setSelectedInvitation(null);
                  setConfirmAction(null);
                }}
                variant="outline"
                style={styles.modalCancelButton}
                disabled={processing}
              />
              <CustomButton
                title={processing ? 'Đang xử lý...' : confirmAction === 'approve' ? 'Chấp nhận' : 'Từ chối'}
                onPress={executeAction}
                style={styles.modalConfirmButton}
                disabled={processing}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default InvitationsScreen;

