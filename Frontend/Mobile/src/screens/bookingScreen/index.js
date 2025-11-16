import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import GradientView from '../../components/common/GradientView';
import Colors from '../../constants/Colors';
import BookingService from '../../api/services/BookingService';
import EventService from '../../api/services/EventService';
import GradientButton from '../../components/common/GradientButton';
import LoadingScreen from '../../components/common/LoadingScreen';
import styles from './styles';

const BookingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {eventId} = route.params;

  // States
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [bookingError, setBookingError] = useState('');
  const [bookingComplete, setBookingComplete] = useState(false);
  const [qrCode, setQrCode] = useState(null);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await EventService.getEventById(eventId);
      if (response.success) {
        setEvent(response.data);
      } else {
        Alert.alert('Lỗi', 'Không thể tải thông tin sự kiện');
      }
    } catch (error) {
      Alert.alert(
        'Lỗi',
        error.message || 'Có lỗi xảy ra khi tải thông tin sự kiện',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    setBookingError('');
    const ticketTypeRequests = Object.entries(selectedTickets)
      .filter(([ticketTypeId, qty]) => {
        const type = event.ticketDetails.find(
          x => x.ticketDetailId === ticketTypeId,
        );
        return (
          Number(qty) > 0 &&
          type &&
          Number(qty) <= (type.remainingQuantity || 0)
        );
      })
      .map(([ticketTypeId, quantity]) => ({
        ticketTypeId,
        quantity: Number(quantity),
      }));

    if (ticketTypeRequests.length === 0) {
      setBookingError('Vui lòng chọn ít nhất một loại vé để đặt.');
      return;
    }

    try {
      setCreating(true);
      console.log('Creating booking...');
      const bookingResponse = await BookingService.createBooking(
        eventId,
        ticketTypeRequests,
      );
      console.log('Booking response:', bookingResponse);
      
      if (!bookingResponse.success) {
        throw new Error(bookingResponse.message || 'Đặt vé thất bại');
      }

      console.log('Booking created successfully, fetching tickets...');
      const ticketsResponse = await BookingService.getEventTickets(eventId);
      console.log('Tickets response:', ticketsResponse);
      
      if (!ticketsResponse.success) {
        console.warn('Failed to fetch tickets:', ticketsResponse.message);
        // Still show success even if we can't get the QR code
        setBookingComplete(true);
        return;
      }

      if (ticketsResponse.data && ticketsResponse.data.length > 0) {
        const latestTicket =
          ticketsResponse.data[ticketsResponse.data.length - 1];
        console.log('Latest ticket:', latestTicket);

        console.log('Fetching QR code for ticket:', latestTicket.id);
        const qrResponse = await BookingService.getTicketQR(latestTicket.id);
        console.log('QR response:', qrResponse);
        
        if (qrResponse.success && qrResponse.data) {
          setQrCode(qrResponse.data);
        } else {
          console.warn('Failed to fetch QR code:', qrResponse.message);
        }
      } else {
        console.warn('No tickets found in response');
      }
      
      // Always show success if booking was created
      setBookingComplete(true);
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(
        error.message ||
          'Đặt vé thất bại, vui lòng thử lại hoặc kiểm tra số dư ví.',
      );
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Đang tải thông tin sự kiện..." />;
  }

  if (bookingComplete) {
    return (
      <SafeAreaView style={styles.successContainer}>
        <GradientView
          colors={['#EEF2FF', '#FFFFFF', '#E0E7FF']}
          style={styles.successGradient}>
          <View style={styles.successContent}>
            <View style={styles.successIcon}>
              <Icon name="checkmark-circle" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.successTitle}>Đặt vé thành công!</Text>
            <Text style={styles.successMessage}>
              Vé đã được gửi tới email của bạn. Vui lòng kiểm tra hoặc mở vé
              dưới đây.
            </Text>

            {qrCode && (
              <View style={styles.qrContainer}>
                <Image source={{uri: qrCode}} style={styles.qrCode} />
              </View>
            )}

            <View style={styles.buttonGroup}>
              <GradientButton
                // onPress={() => navigation.navigate('TicketsScreen')}
                onPress={() =>
                  navigation.navigate('Profile', {screen: 'TicketsScreen'})
                }
                title="Xem vé của tôi"
                style={styles.mainButton}
              />
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.navigate('HomeScreen')}>
                <Text style={styles.secondaryButtonText}>Về trang chủ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GradientView>
      </SafeAreaView>
    );
  }

  const totalPrice =
    event?.ticketDetails?.reduce((sum, t) => {
      const qty = Number(selectedTickets[t.ticketDetailId]) || 0;
      if (qty > 0 && qty <= (t.remainingQuantity || 0)) {
        return sum + qty * (t.ticketPrice || 0);
      }
      return sum;
    }, 0) || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Image */}
        <View style={styles.headerContainer}>
          <Image
            source={{uri: event?.imgListEvent?.[0]}}
            style={styles.headerImage}
            resizeMode="cover"
          />
          <GradientView
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.headerGradient}>
            <View style={styles.headerContent}>
              <Text style={styles.eventTitle}>{event?.title}</Text>
              <View style={styles.eventInfo}>
                <View style={styles.infoRow}>
                  <Icon name="calendar-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.infoText}>
                    {new Date(event?.startTime).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Icon name="location-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.infoText}>
                    {event?.locationName || 'Không xác định'}
                  </Text>
                </View>
              </View>
            </View>
          </GradientView>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressStep}>
            <View style={[styles.stepCircle, styles.activeStep]}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <Text style={styles.stepText}>Chọn vé</Text>
          </View>
          <View style={styles.progressLine}>
            <View style={[styles.progressFill, {width: '40%'}]} />
          </View>
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={[styles.stepNumber, {color: '#6B7280'}]}>2</Text>
            </View>
            <Text style={[styles.stepText, {color: '#6B7280'}]}>Xác nhận</Text>
          </View>
          <View style={styles.progressLine}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.progressStep}>
            <View style={styles.stepCircle}>
              <Text style={[styles.stepNumber, {color: '#6B7280'}]}>3</Text>
            </View>
            <Text style={[styles.stepText, {color: '#6B7280'}]}>Hoàn tất</Text>
          </View>
        </View>

        {/* Ticket Selection */}
        <View style={styles.ticketsContainer}>
          <Text style={styles.sectionTitle}>Chọn vé</Text>
          <Text style={styles.sectionSubtitle}>
            Chọn loại vé và số lượng bạn muốn đặt. Giá đã bao gồm phí dịch vụ
            (nếu có).
          </Text>

          {event?.ticketDetails?.map(ticket => {
            const selectedQty = Number(
              selectedTickets[ticket.ticketDetailId] || 0,
            );
            const isOver = selectedQty > ticket.remainingQuantity;

            return (
              <View
                key={ticket.ticketDetailId}
                style={[
                  styles.ticketCard,
                  selectedQty > 0 && !isOver && styles.ticketCardSelected,
                ]}>
                <View style={styles.ticketInfo}>
                  <View style={styles.ticketIcon}>
                    <Icon name="ticket-outline" size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.ticketDetails}>
                    <Text style={styles.ticketName}>{ticket.ticketName}</Text>
                    <Text style={styles.ticketDescription}>
                      {ticket.ticketDescription || 'Không có mô tả'}
                    </Text>
                    <Text style={styles.ticketPrice}>
                      {ticket.ticketPrice === 0
                        ? 'Miễn phí'
                        : `${ticket.ticketPrice.toLocaleString('vi-VN')}đ`}
                    </Text>
                    <Text style={styles.ticketRemaining}>
                      Còn lại: {ticket.remainingQuantity}
                    </Text>
                  </View>
                </View>

                <View style={styles.quantityContainer}>
                  <TextInput
                    style={[
                      styles.quantityInput,
                      isOver && styles.quantityInputError,
                    ]}
                    keyboardType="numeric"
                    value={selectedTickets[ticket.ticketDetailId] || ''}
                    onChangeText={value => {
                      if (!/^\d*$/.test(value)) return;
                      setSelectedTickets(prev => ({
                        ...prev,
                        [ticket.ticketDetailId]: value,
                      }));
                      setBookingError('');
                    }}
                    placeholder="0"
                    maxLength={3}
                  />
                  {isOver && (
                    <Text style={styles.errorText}>
                      Chỉ còn {ticket.remainingQuantity} vé
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalPrice}>
            {totalPrice.toLocaleString('vi-VN')}đ
          </Text>
        </View>

        <GradientButton
          onPress={handleBooking}
          title={creating ? 'Đang đặt vé...' : 'Xác nhận đặt vé'}
          disabled={totalPrice === 0 || creating}
          style={styles.bookButton}
        />
      </View>

      {bookingError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>{bookingError}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default BookingScreen;
