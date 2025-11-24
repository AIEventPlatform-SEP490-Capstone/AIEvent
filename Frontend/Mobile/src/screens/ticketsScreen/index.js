import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {X, Flag, Calendar, MapPin, FileText, MessageSquare} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import CustomText from '../../components/common/customTextRN';
import BookingService from '../../api/services/BookingService';
import {EventService} from '../../api/services';
import {styles} from './styles';
import { translateReportEventError } from '../../utility';
import AuthService from '../../api/services/AuthService';
import { isStaffUser } from '../../utils/jwtUtils';

const TicketsScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportType, setReportType] = useState('Scam');
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportingEvent, setReportingEvent] = useState(null);
  
  // Event detail and reports
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showReports, setShowReports] = useState(false);
  const [userReports, setUserReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Check if user is staff - staff users don't have access to booked events
      const token = await AuthService.getAccessToken();
      const isStaff = isStaffUser(token);
      if (isStaff) {
        setEvents([]);
        return;
      }
      
      const res = await BookingService.getBookedEvents();
      if (res.success) setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);


  const openReportModal = (event) => {
    setReportingEvent(event);
    setReportType('Scam');
    setReportReason('');
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    setReportModalVisible(false);
    setReportReason('');
    setReportingEvent(null);
  };

  const handleSubmitReport = async () => {
    if (!reportingEvent?.id && !reportingEvent?.eventId) {
      Alert.alert('Lỗi', 'Thiếu thông tin sự kiện để báo cáo.');
      return;
    }
    if (!reportReason.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập lý do báo cáo.');
      return;
    }

    try {
      setSubmittingReport(true);
      const eventId = reportingEvent.id || reportingEvent.eventId;
      const response = await EventService.reportEvent({
        eventId: eventId,
        type: reportType,
        reason: reportReason.trim(),
      });

      if (response.success) {
        Alert.alert('Thành công', 'Đã gửi báo cáo. Cảm ơn bạn đã phản hồi.');
        closeReportModal();
        // Refresh reports if viewing reports
        if (selectedEvent && showReports) {
          fetchUserReports(selectedEvent.id || selectedEvent.eventId);
        }
      } else {
        // Response already contains translated message from EventService
        const errorMessage = response.message || 'Không thể gửi báo cáo.';
        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Report error:', error);
      const errorMessage = translateReportEventError(error.message || 'Không thể gửi báo cáo.');
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSubmittingReport(false);
    }
  };

  const openEventDetail = (event) => {
    setSelectedEvent(event);
    setShowReports(false);
    setUserReports([]);
  };

  const closeEventDetail = () => {
    setSelectedEvent(null);
    setShowReports(false);
    setUserReports([]);
  };

  const fetchUserReports = async (eventId) => {
    try {
      setLoadingReports(true);
      const response = await EventService.getUserReports(eventId);
      if (response.success && response.data) {
        setUserReports(Array.isArray(response.data) ? response.data : []);
      } else {
        setUserReports([]);
      }
    } catch (err) {
      console.error('getUserReports error:', err);
      setUserReports([]);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (showReports && selectedEvent) {
      const eventId = selectedEvent.id || selectedEvent.eventId;
      if (eventId) {
        fetchUserReports(eventId);
      }
    } else {
      setUserReports([]);
    }
  }, [showReports, selectedEvent]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradientHeaderTitle} style={styles.header}>
        <CustomText variant="h2" color="white">
          Vé của tôi
        </CustomText>
        <CustomText variant="body" color="white">
          Quản lý các sự kiện bạn đã tham gia
        </CustomText>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchEvents} />
          }
          contentContainerStyle={styles.contentContainer}>
          {/* DANH SÁCH SỰ KIỆN */}
          {events.map(event => (
            <View key={event.id} style={styles.eventCardWrapper}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openEventDetail(event)}
                style={styles.card}>
                <Image
                  source={{
                    uri:
                      event.image ||
                      'https://res.cloudinary.com/demo/image/upload/v1690000000/default-event.jpg',
                  }}
                  style={styles.eventImage}
                />
                
                {/* Icon Report ở góc trên bên trái */}
                <TouchableOpacity
                  style={styles.reportIconButton}
                  activeOpacity={0.8}
                  onPress={(e) => {
                    e.stopPropagation();
                    openReportModal(event);
                  }}>
                  <View style={styles.reportIconContainer}>
                    <Flag color="#fff" size={18} />
                  </View>
                </TouchableOpacity>
                
                <View style={styles.cardOverlay}>
                  <CustomText style={styles.eventTitle}>
                    {event.title}
                  </CustomText>
                  <CustomText style={styles.eventSubtitle}>
                    📅 {new Date(event.startTime).toLocaleDateString('vi-VN')} |
                    📍 {event.address || 'Đang cập nhật'}
                  </CustomText>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* MODAL EVENT DETAIL */}
      <Modal
        visible={!!selectedEvent}
        transparent
        animationType="slide"
        onRequestClose={closeEventDetail}>
        <View style={styles.modalOverlay}>
          <View style={styles.eventDetailModalBox}>
            <View style={styles.eventDetailModalHeader}>
              <CustomText variant="h3" color="primary" style={styles.eventDetailModalTitle}>
                {selectedEvent?.title || 'Chi tiết sự kiện'}
              </CustomText>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={closeEventDetail}>
                <X color={Colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.eventDetailModalContent} showsVerticalScrollIndicator={false}>
              {/* Event Info */}
              <View style={styles.eventDetailInfo}>
                <View style={styles.eventDetailRow}>
                  <Calendar color={Colors.primary} size={20} style={{marginRight: 12}} />
                  <View style={{flex: 1}}>
                    <CustomText variant="body" color="primary" style={styles.eventDetailLabel}>
                      Ngày diễn ra
                    </CustomText>
                    <CustomText variant="body" style={styles.eventDetailValue}>
                      {selectedEvent?.startTime 
                        ? new Date(selectedEvent.startTime).toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Chưa cập nhật'}
                    </CustomText>
                  </View>
                </View>

                <View style={[styles.eventDetailRow, {marginTop: 16}]}>
                  <MapPin color={Colors.primary} size={20} style={{marginRight: 12}} />
                  <View style={{flex: 1}}>
                    <CustomText variant="body" color="primary" style={styles.eventDetailLabel}>
                      Địa điểm
                    </CustomText>
                    <CustomText variant="body" style={styles.eventDetailValue}>
                      {selectedEvent?.address || 'Chưa cập nhật'}
                    </CustomText>
                  </View>
                </View>

                {selectedEvent?.description && (
                  <View style={[styles.eventDetailRow, {marginTop: 16}]}>
                    <FileText color={Colors.primary} size={20} style={{marginRight: 12}} />
                    <View style={{flex: 1}}>
                      <CustomText variant="body" color="primary" style={styles.eventDetailLabel}>
                        Mô tả
                      </CustomText>
                      <CustomText variant="body" style={styles.eventDetailValue}>
                        {selectedEvent.description}
                      </CustomText>
                    </View>
                  </View>
                )}
              </View>

              {/* View Reports Button */}
              <TouchableOpacity
                style={[styles.viewReportsButton, showReports && styles.viewReportsButtonActive]}
                onPress={() => setShowReports(!showReports)}
                activeOpacity={0.8}>
                <Flag color={showReports ? '#fff' : Colors.primary} size={20} />
                <CustomText variant="body" color={showReports ? 'white' : 'primary'} style={{marginLeft: 8}}>
                  {showReports ? 'Ẩn báo cáo' : 'Xem báo cáo'}
                </CustomText>
              </TouchableOpacity>

              {/* Reports Section */}
              {showReports && (
                <View style={styles.reportsSection}>
                  <CustomText variant="h4" color="primary" style={styles.reportsSectionTitle}>
                    Báo cáo của bạn
                  </CustomText>

                  {loadingReports ? (
                    <View style={styles.reportsLoadingContainer}>
                      <ActivityIndicator size="large" color={Colors.primary} />
                      <CustomText variant="body" color="textLight" style={{marginTop: 12}}>
                        Đang tải báo cáo...
                      </CustomText>
                    </View>
                  ) : userReports.length === 0 ? (
                    <View style={styles.reportsEmptyContainer}>
                      <Flag color={Colors.textLight} size={48} />
                      <CustomText variant="body" color="textLight" style={{marginTop: 12, textAlign: 'center'}}>
                        Bạn chưa gửi báo cáo nào cho sự kiện này.
                      </CustomText>
                    </View>
                  ) : (
                    userReports.map((report, idx) => {
                      const createdAt = report.createdAt ? new Date(report.createdAt) : null;
                      const dateStr = createdAt 
                        ? createdAt.toLocaleDateString('vi-VN')
                        : 'Chưa có';
                      const timeStr = createdAt
                        ? createdAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                        : '';

                      const reportTypeLabel = {
                        Scam: 'Lừa đảo',
                        FakeInfo: 'Thông tin sai lệch',
                        Reactionary: 'Phản động',
                        SexualHarassment: 'Quấy rối tình dục',
                        Violence: 'Bạo lực',
                        Inappropriate: 'Không phù hợp',
                        Other: 'Khác',
                      }[report.type] || report.type;

                      return (
                        <View key={idx} style={styles.reportItem}>
                          <View style={styles.reportItemHeader}>
                            <View style={styles.reportTypeBadge}>
                              <CustomText variant="caption" color="white">
                                {reportTypeLabel}
                              </CustomText>
                            </View>
                            <CustomText variant="caption" color="textLight">
                              {dateStr} lúc {timeStr}
                            </CustomText>
                          </View>

                          <CustomText variant="body" color="primary" style={styles.reportItemLabel}>
                            Lý do:
                          </CustomText>
                          <CustomText variant="body" style={styles.reportItemReason}>
                            {report.reason || '(Không có lý do)'}
                          </CustomText>

                          {report.attachmentUrl && (
                            <>
                              <CustomText variant="body" color="primary" style={styles.reportItemLabel}>
                                Minh chứng:
                              </CustomText>
                              <CustomText variant="body" style={styles.reportItemLink}>
                                {report.attachmentUrl}
                              </CustomText>
                            </>
                          )}

                          <View style={styles.reportReplyContainer}>
                            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 8}}>
                              <MessageSquare color={Colors.primary} size={18} style={{marginRight: 8}} />
                              <CustomText variant="body" color="primary" style={styles.reportItemLabel}>
                                Phản hồi từ hệ thống
                              </CustomText>
                            </View>
                            {report.reply ? (
                              <CustomText variant="body" style={styles.reportItemReply}>
                                {report.reply}
                              </CustomText>
                            ) : (
                              <CustomText variant="body" color="textLight" style={styles.reportItemNoReply}>
                                Chưa có phản hồi
                              </CustomText>
                            )}
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {/* Report Button */}
              <TouchableOpacity
                style={styles.reportButtonInDetail}
                onPress={() => {
                  closeEventDetail();
                  setTimeout(() => {
                    openReportModal(selectedEvent);
                  }, 300);
                }}
                activeOpacity={0.8}>
                <Flag color="#fff" size={20} />
                <CustomText variant="body" color="white" style={{marginLeft: 8}}>
                  Báo cáo sự kiện
                </CustomText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL REPORT EVENT */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeReportModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalBox}>
            <View style={styles.reportModalHeader}>
              <CustomText variant="h3" color="primary" style={styles.reportModalTitle}>
                Báo cáo sự kiện
              </CustomText>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={closeReportModal}>
                <X color={Colors.textPrimary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.reportModalContent}>
              <CustomText variant="body" color="primary" style={styles.reportLabel}>
                Loại báo cáo
              </CustomText>
              <View style={styles.reportTypeContainer}>
                {['Scam', 'FakeInfo', 'Reactionary', 'SexualHarassment', 'Violence', 'Inappropriate', 'Other'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.reportTypeButton,
                      reportType === type && styles.reportTypeButtonActive,
                    ]}
                    onPress={() => setReportType(type)}>
                    <CustomText
                      variant="caption"
                      color={reportType === type ? 'white' : 'primary'}
                      style={styles.reportTypeText}>
                      {type === 'Scam' ? 'Lừa đảo' : 
                       type === 'FakeInfo' ? 'Thông tin giả' :
                       type === 'Reactionary' ? 'Phản động' :
                       type === 'SexualHarassment' ? 'Quấy rối tình dục' :
                       type === 'Violence' ? 'Bạo lực' :
                       type === 'Inappropriate' ? 'Không phù hợp' : 
                       'Khác'}
                    </CustomText>
                  </TouchableOpacity>
                ))}
              </View>

              <CustomText variant="body" color="primary" style={[styles.reportLabel, {marginTop: 16}]}>
                Lý do báo cáo *
              </CustomText>
              <TextInput
                style={styles.reportReasonInput}
                placeholder="Nhập lý do báo cáo..."
                placeholderTextColor={Colors.textLight}
                value={reportReason}
                onChangeText={setReportReason}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <View style={styles.reportModalButtons}>
                <TouchableOpacity
                  style={styles.reportCancelButton}
                  onPress={closeReportModal}
                  disabled={submittingReport}>
                  <CustomText variant="body" color="primary">
                    Hủy
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reportSubmitButton, submittingReport && styles.reportSubmitButtonDisabled]}
                  onPress={handleSubmitReport}
                  disabled={submittingReport}>
                  {submittingReport ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <CustomText variant="body" color="white">
                      Gửi báo cáo
                    </CustomText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TicketsScreen;
