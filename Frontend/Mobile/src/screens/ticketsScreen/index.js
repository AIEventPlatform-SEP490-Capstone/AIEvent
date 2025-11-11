import React, {useState, useEffect} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import {Download, X, ArrowLeft} from 'lucide-react-native';
import Colors from '../../constants/Colors';
import CustomText from '../../components/common/customTextRN';
import BookingService from '../../api/services/BookingService';
import {styles} from './styles';
import TicketCard from '../../components/presentation/TicketCard';

const TicketsScreen = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [selectedTicketType, setSelectedTicketType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
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

  const handleSelectEvent = async event => {
    setSelectedEvent(event);
    setSelectedTicketType(null);
    setTicketTypes([]);
    const res = await BookingService.getEventTickets(event.id);
    if (res.success) {
      // res.data = flattened tickets, ta gom lại theo ticketTypeName
      const grouped = {};
      res.data.forEach(t => {
        if (!grouped[t.ticketTypeName]) grouped[t.ticketTypeName] = [];
        grouped[t.ticketTypeName].push(t);
      });
      setTicketTypes(
        Object.keys(grouped).map(key => ({
          name: key,
          tickets: grouped[key],
          price: grouped[key][0]?.price ?? 0,
        })),
      );
    }
  };

  const handleShowQR = async ticket => {
    setQrModalVisible(true);
    setQrLoading(true);
    const res = await BookingService.getTicketQR(ticket.id);
    if (res.success) setQrCode(res.data);
    else setQrCode(null);
    setQrLoading(false);
  };

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
          {/* CẤP 1: DANH SÁCH SỰ KIỆN */}

          {!selectedEvent &&
            events.map(event => (
              <TouchableOpacity
                key={event.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => handleSelectEvent(event)}>
                <Image
                  source={{
                    uri:
                      event.image ||
                      'https://res.cloudinary.com/demo/image/upload/v1690000000/default-event.jpg',
                  }}
                  style={styles.eventImage}
                />
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
            ))}

          {/* CẤP 2: CÁC LOẠI VÉ TRONG SỰ KIỆN */}
          {selectedEvent && !selectedTicketType && (
            <View>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.8}
                onPress={() => setSelectedEvent(null)}>
                <LinearGradient
                  colors={['#4A90E2', '#007AFF']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.backGradient}>
                  <View style={styles.backContent}>
                    <ArrowLeft color="#fff" size={16} />
                    <CustomText style={styles.backText}>
                      Quay lại danh sách sự kiện
                    </CustomText>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <CustomText
                variant="h3"
                color="primary"
                style={styles.sectionTitle}>
                {selectedEvent.title}
              </CustomText>

              {ticketTypes.map(type => (
                <TouchableOpacity
                  key={type.name}
                  style={styles.ticketTypeCard}
                  activeOpacity={0.8}
                  onPress={() => setSelectedTicketType(type)}>
                  <CustomText style={styles.ticketTypeTitle}>
                    🎟️ {type.name}
                  </CustomText>
                  <CustomText style={styles.ticketTypeSub}>
                    Số lượng: {type.tickets.length} vé
                  </CustomText>
                  <CustomText style={styles.ticketTypeSub}>
                    Giá: {type.price.toLocaleString('vi-VN')}₫
                  </CustomText>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* CẤP 3: DANH SÁCH VÉ CỤ THỂ */}
          {selectedTicketType && (
            <View>
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.8}
                onPress={() => setSelectedTicketType(null)}>
                <LinearGradient
                  colors={['#4A90E2', '#007AFF']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.backGradient}>
                  <View style={styles.backContent}>
                    <ArrowLeft color="#fff" size={16} />
                    <CustomText style={styles.backText}>
                      Quay lại loại vé
                    </CustomText>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              <CustomText
                variant="h3"
                color="primary"
                style={styles.sectionTitle}>
                {selectedTicketType.name}
              </CustomText>

              {selectedTicketType.tickets.map(ticket => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  event={selectedEvent}
                  onPressQR={handleShowQR}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL QR */}
      <Modal
        visible={qrModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQrModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#1E3C72', '#2A5298']}
            style={styles.qrModalBox}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setQrModalVisible(false)}>
              <X color="white" size={26} />
            </TouchableOpacity>

            <CustomText variant="h4" color="white" style={{marginBottom: 10}}>
              Mã QR Vé
            </CustomText>

            {qrLoading ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : qrCode ? (
              <View style={styles.qrBox}>
                <QRCode value={qrCode} size={220} backgroundColor="white" />
              </View>
            ) : (
              <CustomText variant="body" color="error">
                Không thể tải QR
              </CustomText>
            )}

            <TouchableOpacity style={styles.downloadBtn}>
              <Download color="white" size={20} />
              <CustomText
                variant="caption"
                color="white"
                style={{marginLeft: 6}}>
                Tải xuống QR
              </CustomText>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
};

export default TicketsScreen;
