import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { styles, enhancedStyles } from './styles';
import CustomText from '../../components/common/customTextRN';
import Images from '../../constants/Images';
import Colors from '../../constants/Colors';
import Fonts from '../../constants/Fonts';
import Strings from '../../constants/Strings';
import { BookingService, EventService } from '../../api/services';

const { width } = Dimensions.get('window');

const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTime = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const formatTime = (date) => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const formatDateWithDayName = (date) => {
  const d = new Date(date);
  const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  const dayName = dayNames[d.getDay()];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${dayName}, ngày ${day} tháng ${month} năm ${year}`;
};

const formatMonthYear = (date) => {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `Tháng ${month} Năm ${year}`;
};

const getDayName = (date) => {
  const d = new Date(date);
  const dayNames = ['CHỦ NHẬT', 'THỨ HAI', 'THỨ BA', 'THỨ TƯ', 'THỨ NĂM', 'THỨ SÁU', 'THỨ BẢY'];
  return dayNames[d.getDay()];
};

const getStartOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getEndOfMonth = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const getStartOfWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  
  let daysToSubtract;
  if (dayOfWeek === 0) {
    daysToSubtract = 6;
  } else {
    daysToSubtract = dayOfWeek - 1;
  }
  
  const result = new Date(d);
  result.setDate(d.getDate() - daysToSubtract);
  return result;
};

const getEndOfWeek = (date) => {
  const start = getStartOfWeek(date);
  const result = new Date(start);
  result.setDate(start.getDate() + 6);
  return result;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const addWeeks = (date, weeks) => {
  return addDays(date, weeks * 7);
};

const isSameDay = (date1, date2) => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

const isSameMonth = (date1, date2) => {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

const getMonthMatrix = (date) => {
  const startOfMonth = getStartOfMonth(date);
  const endOfMonth = getEndOfMonth(date);
  const firstWeekStart = getStartOfWeek(startOfMonth);
  firstWeekStart.setHours(0, 0, 0, 0);
  const lastWeekEnd = getEndOfWeek(endOfMonth);
  lastWeekEnd.setHours(0, 0, 0, 0);

  const days = [];
  let current = new Date(firstWeekStart);
  current.setHours(0, 0, 0, 0);
  
  while (current <= lastWeekEnd) {
    const day = new Date(current);
    day.setHours(0, 0, 0, 0);
    days.push(day);
    current = addDays(current, 1);
    current.setHours(0, 0, 0, 0);
  }

  const remainder = days.length % 7;
  
  if (remainder !== 0) {
    const lastDay = days[days.length - 1];
    const daysToAdd = 7 - remainder;
    
    for (let i = 1; i <= daysToAdd; i++) {
      const nextDay = addDays(lastDay, i);
      nextDay.setHours(0, 0, 0, 0);
      days.push(nextDay);
    }
  }

  const finalLength = Math.floor(days.length / 7) * 7;
  return days.slice(0, finalLength);
};

const getWeekMatrix = (date) => {
  const start = getStartOfWeek(date);
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }
  return days;
};

const getDayKey = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TimelineScreen = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [currentDay, setCurrentDay] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [eventDetail, setEventDetail] = useState(null);
  const [qrCodes, setQrCodes] = useState({});
  const [loadingQR, setLoadingQR] = useState({});
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [statsFilterType, setStatsFilterType] = useState('all');

  const resetToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedDate(today);
    setCurrentMonth(today);
    setCurrentWeek(today);
    setCurrentDay(today);
  };

  useEffect(() => {
    resetToToday();
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await BookingService.getBookedEvents({ pageNumber: 1, pageSize: 100 });
      if (response.success) {
        const eventsData = response.data;
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    resetToToday();
    await loadEvents();
    setRefreshing(false);
  };

  const filteredEvents = useMemo(() => {
    if (!Array.isArray(events)) return [];
    let list = events;

    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      list = list.filter(
        (e) =>
          e &&
          ((e.title || '').toLowerCase().includes(query) ||
            (e.address || '').toLowerCase().includes(query))
      );
    }
    return list;
  }, [events, searchText]);

  const eventsByDay = useMemo(() => {
    const map = {};
    if (Array.isArray(filteredEvents)) {
      filteredEvents.forEach((e) => {
        if (e && e.startTime) {
          const key = getDayKey(e.startTime);
          if (!map[key]) map[key] = [];
          map[key].push(e);
        }
      });
    }
    return map;
  }, [filteredEvents]);

  const stats = useMemo(() => {
    if (!Array.isArray(events)) {
      return { attended: 0, upcoming: 0, total: 0 };
    }
    const now = new Date();
    const attended = events.filter((e) => e && e.endTime && new Date(e.endTime) < now).length;
    const upcoming = events.filter((e) => e && e.startTime && new Date(e.startTime) >= now).length;
    return { attended, upcoming, total: events.length };
  }, [events]);

  const getFilteredEventsByType = (type) => {
    if (!Array.isArray(events)) return [];
    const now = new Date();
    switch (type) {
      case 'attended':
        return events.filter((e) => e && e.endTime && new Date(e.endTime) < now);
      case 'upcoming':
        return events.filter((e) => e && e.startTime && new Date(e.startTime) >= now);
      case 'all':
      default:
        return events;
    }
  };

  const handleStatPress = (type) => {
    setStatsFilterType(type);
    setStatsModalVisible(true);
  };

  const monthMatrix = useMemo(() => getMonthMatrix(currentMonth), [currentMonth]);
  const weekMatrix = useMemo(() => getWeekMatrix(currentWeek), [currentWeek]);

  const handleEventPress = async (event) => {
    setSelectedEvent(event);
    setLoadingTickets(true);
    setModalVisible(true);

    try {
      const detailResponse = await EventService.getEventById(event.eventId);
      if (detailResponse.success) {
        setEventDetail(detailResponse.data);
      }

      const ticketsResponse = await BookingService.getEventTickets(event.eventId, {
        pageNumber: 1,
        pageSize: 100,
      });
      if (ticketsResponse.success) {
        setTickets(ticketsResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading event details:', error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleViewQR = async (ticketId) => {
    setLoadingQR((prev) => ({ ...prev, [ticketId]: true }));
    try {
      const response = await BookingService.getTicketQR(ticketId);
      if (response.success && response.data) {
        let qrCodeUri = response.data;
        if (typeof qrCodeUri === 'string' && !qrCodeUri.startsWith('data:') && !qrCodeUri.startsWith('http')) {
          qrCodeUri = `data:image/png;base64,${qrCodeUri}`;
        }
        setQrCodes((prev) => ({ ...prev, [ticketId]: qrCodeUri }));
      }
    } catch (error) {
      console.error('Error loading QR:', error);
    } finally {
      setLoadingQR((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <TouchableOpacity 
        style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: Colors.primary }]} 
        onPress={() => handleStatPress('all')}
        activeOpacity={0.7}
      >
        <CustomText variant="h2" color="primary" style={{ fontSize: 28, fontWeight: '700' }}>{stats.total}</CustomText>
        <CustomText variant="caption" color="secondary" style={{ marginTop: 4, fontSize: Fonts.sm }}>Tổng sự kiện</CustomText>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: Colors.success }]} 
        onPress={() => handleStatPress('attended')}
        activeOpacity={0.7}
      >
        <CustomText variant="h2" color="success" style={{ fontSize: 28, fontWeight: '700' }}>{stats.attended}</CustomText>
        <CustomText variant="caption" color="secondary" style={{ marginTop: 4, fontSize: Fonts.sm }}>Đã tham gia</CustomText>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.statCard, { borderLeftWidth: 4, borderLeftColor: Colors.warning }]} 
        onPress={() => handleStatPress('upcoming')}
        activeOpacity={0.7}
      >
        <CustomText variant="h2" color="primary" style={{ fontSize: 28, fontWeight: '700', color: Colors.warning }}>{stats.upcoming}</CustomText>
        <CustomText variant="caption" color="secondary" style={{ marginTop: 4, fontSize: Fonts.sm }}>Sắp diễn ra</CustomText>
      </TouchableOpacity>
    </View>
  );

  const renderViewModeTabs = () => (
    <View style={styles.viewModeTabs}>
      <TouchableOpacity
        style={[styles.viewModeTab, viewMode === 'month' && styles.activeViewModeTab]}
        onPress={() => setViewMode('month')}
      >
        <CustomText variant="caption" color={viewMode === 'month' ? 'white' : 'primary'}>
          Tháng
        </CustomText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.viewModeTab, viewMode === 'week' && styles.activeViewModeTab]}
        onPress={() => setViewMode('week')}
      >
        <CustomText variant="caption" color={viewMode === 'week' ? 'white' : 'primary'}>
          Tuần
        </CustomText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.viewModeTab, viewMode === 'day' && styles.activeViewModeTab]}
        onPress={() => setViewMode('day')}
      >
        <CustomText variant="caption" color={viewMode === 'day' ? 'white' : 'primary'}>
          Ngày
        </CustomText>
      </TouchableOpacity>
    </View>
  );

  const renderMonthView = () => {
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const monthYear = formatMonthYear(currentMonth);

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarMonthHeader}>
          <CustomText variant="h3" color="primary" style={styles.calendarMonthYearText}>
            {monthYear}
          </CustomText>
          <TouchableOpacity 
            style={styles.todayButton}
            onPress={resetToToday}
            activeOpacity={0.7}
          >
            <CustomText variant="caption" color="white" style={{ fontSize: Fonts.xs, fontWeight: '600' }}>
              Hôm nay
            </CustomText>
          </TouchableOpacity>
        </View>
        <View style={styles.calendarHeader}>
          {weekDays.map((day) => (
            <View key={day} style={styles.calendarHeaderDay}>
              <CustomText variant="caption" color="primary" style={styles.calendarHeaderText}>
                {day}
              </CustomText>
            </View>
          ))}
        </View>
        <View style={styles.calendarGrid}>
          {Array.from({ length: Math.floor(monthMatrix.length / 7) }, (_, weekIndex) => {
            const weekDays = monthMatrix.slice(weekIndex * 7, (weekIndex + 1) * 7);
            return (
              <View key={weekIndex} style={styles.calendarWeek}>
                {weekDays.map((day, dayIndex) => {
                  const key = getDayKey(day);
                  const dayEvents = eventsByDay[key] || [];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSameDay(day, selectedDate);
                  const globalIndex = weekIndex * 7 + dayIndex;

                  return (
                    <TouchableOpacity
                      key={globalIndex}
                      style={[
                        styles.calendarDay,
                        !isCurrentMonth && styles.calendarDayOtherMonth,
                        isToday && styles.calendarDayToday,
                        isSelected && styles.calendarDaySelected,
                        dayEvents.length > 0 && styles.calendarDayWithEvents,
                      ]}
                      onPress={() => {
                        setSelectedDate(day);
                        if (dayEvents.length > 0) {
                          setCurrentDay(day);
                          setViewMode('day');
                        }
                      }}
                    >
                      {dayEvents.length > 0 && (
                        <Image source={Images.pushpin} style={styles.pushpinIcon} resizeMode="contain" />
                      )}
                      <CustomText
                        variant="caption"
                        color={isToday ? 'white' : isSelected ? 'primary' : 'secondary'}
                        style={styles.calendarDayNumber}
                      >
                        {day.getDate()}
                      </CustomText>
                      {dayEvents.length > 0 && (
                        <View style={styles.eventIndicator}>
                          <View style={styles.eventDot} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </View>
        <View style={styles.selectedDateContainer}>
          <CustomText variant="body" color="primary" style={styles.selectedDateText}>
            {formatDateWithDayName(selectedDate)}
          </CustomText>
        </View>
      </View>
    );
  };

  const renderWeekView = () => {
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          {weekDays.map((day, idx) => {
            const date = weekMatrix[idx];
            const key = getDayKey(date);
            const dayEvents = eventsByDay[key] || [];
            const isToday = isSameDay(date, new Date());
            const isSelected = isSameDay(date, selectedDate);

            return (
              <View key={day} style={styles.weekDayColumn}>
                <View style={styles.weekDayHeader}>
                  <CustomText variant="caption" color="primary">{day}</CustomText>
                  <TouchableOpacity
                    style={[
                      styles.weekDayNumber,
                      isToday && styles.weekDayNumberToday,
                      isSelected && styles.weekDayNumberSelected,
                    ]}
                    onPress={() => {
                      setSelectedDate(date);
                      if (dayEvents.length > 0) {
                        setCurrentDay(date);
                        setViewMode('day');
                      }
                    }}
                  >
                    {dayEvents.length > 0 && (
                      <Image source={Images.pushpin} style={styles.pushpinIconWeek} resizeMode="contain" />
                    )}
                    <CustomText
                      variant="body"
                      color={isToday ? 'white' : isSelected ? 'primary' : 'secondary'}
                    >
                      {date.getDate()}
                    </CustomText>
                  </TouchableOpacity>
                  <CustomText variant="caption" color="secondary" style={styles.weekDayDate}>
                    {formatDate(date)}
                  </CustomText>
                </View>
                <ScrollView
                  style={styles.weekDayEvents}
                  contentContainerStyle={styles.weekDayEventsContent}
                  showsVerticalScrollIndicator={false}
                >
                  {dayEvents.length > 0 && (
                    <View style={styles.weekEventsIconsContainer}>
                      {dayEvents.map((event, eIdx) => (
                        <TouchableOpacity
                          key={eIdx}
                          style={styles.weekEventIcon}
                          onPress={() => handleEventPress(event)}
                        >
                          <Image source={Images.calendar} style={styles.weekEventIconImage} resizeMode="contain" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderDayView = () => {
    const key = getDayKey(currentDay);
    const dayEvents = eventsByDay[key] || [];
    const dayNumber = currentDay.getDate();
    const dayName = getDayName(currentDay);

    return (
      <ScrollView style={styles.dayViewContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.dayCard}>
          <View style={styles.dayCardHeader}>
            <CustomText variant="h3" style={styles.monthYearText}>
              {formatMonthYear(currentDay)}
            </CustomText>
          </View>
          
          <View style={styles.dayCardMain}>
            <CustomText variant="h1" style={styles.dayNumberText}>
              {dayNumber}
            </CustomText>
            <CustomText variant="h3" style={styles.dayNameText}>
              {dayName}
            </CustomText>
          </View>

          <View style={styles.dayInfoTable}>
            <View style={styles.dayInfoRow}>
              <View style={styles.dayInfoCell}>
                <CustomText variant="caption" style={styles.dayInfoLabel}>Giờ</CustomText>
                <CustomText variant="body" style={styles.dayInfoValue}>
                  {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
                </CustomText>
              </View>
              <View style={styles.dayInfoCell}>
                <CustomText variant="caption" style={styles.dayInfoLabel}>Ngày</CustomText>
                <CustomText variant="body" style={styles.dayInfoValue}>
                  {dayNumber}
                </CustomText>
              </View>
              <View style={styles.dayInfoCell}>
                <CustomText variant="caption" style={styles.dayInfoLabel}>Tháng</CustomText>
                <CustomText variant="body" style={styles.dayInfoValue}>
                  {currentDay.getMonth() + 1}
                </CustomText>
              </View>
              <View style={styles.dayInfoCell}>
                <CustomText variant="caption" style={styles.dayInfoLabel}>Năm</CustomText>
                <CustomText variant="body" style={styles.dayInfoValue}>
                  {currentDay.getFullYear()}
                </CustomText>
              </View>
            </View>
          </View>
        </View>

        {dayEvents.length === 0 ? (
          <View style={styles.emptyDayContainer}>
            <CustomText variant="body" color="textSecondary" align="center">
              Không có sự kiện trong ngày này
            </CustomText>
          </View>
        ) : (
          <View style={styles.dayEventsList}>
            <CustomText variant="h3" color="primary" style={styles.eventsTitle}>
              Sự kiện ({dayEvents.length})
            </CustomText>
            {dayEvents.map((event, idx) => {
              const isUpcoming = event.startTime && new Date(event.startTime) > new Date();
              const isPast = event.endTime && new Date(event.endTime) < new Date();
              
              return (
                <TouchableOpacity
                  key={idx}
                  style={enhancedStyles.dayEventCard}
                  onPress={() => handleEventPress(event)}
                  activeOpacity={0.8}
                >
                  <View style={enhancedStyles.dayEventIconContainer}>
                    <View style={enhancedStyles.dayEventIconGradient} />
                    <View style={enhancedStyles.dayEventIcon}>
                      <Image source={Images.calendar} style={{ width: 32, height: 32, tintColor: Colors.white }} />
                    </View>
                  </View>
                  <View style={enhancedStyles.dayEventContent}>
                    <View style={enhancedStyles.eventTitleRow}>
                      <CustomText variant="h3" color="primary" style={enhancedStyles.eventTitle}>
                        {event.title}
                      </CustomText>
                      {isUpcoming && (
                        <View style={[enhancedStyles.eventStatusBadge, { backgroundColor: '#4CAF50' }]}>
                          <CustomText variant="caption" color="white" style={enhancedStyles.eventStatusText}>
                            Sắp tới
                          </CustomText>
                        </View>
                      )}
                      {isPast && (
                        <View style={[enhancedStyles.eventStatusBadge, { backgroundColor: '#757575' }]}>
                          <CustomText variant="caption" color="white" style={enhancedStyles.eventStatusText}>
                            Đã qua
                          </CustomText>
                        </View>
                      )}
                    </View>
                    <View style={enhancedStyles.eventInfoItem}>
                      <View style={[enhancedStyles.eventInfoIconWrapper, { backgroundColor: '#E3F2FD' }]}>
                        <Image source={Images.clock} style={{ width: 18, height: 18, tintColor: Colors.primary }} />
                      </View>
                      <CustomText variant="caption" color="textSecondary" style={enhancedStyles.eventInfoText}>
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </CustomText>
                    </View>
                    {event.address && (
                      <View style={enhancedStyles.eventInfoItem}>
                        <View style={[enhancedStyles.eventInfoIconWrapper, { backgroundColor: '#E3F2FD' }]}>
                          <Image source={Images.location} style={{ width: 20, height: 20, tintColor: Colors.primary }} resizeMode="contain" />
                        </View>
                        <CustomText variant="caption" color="textSecondary" numberOfLines={2} style={enhancedStyles.eventInfoText}>
                          {event.address}
                        </CustomText>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderStatsModal = () => {
    const filteredEventsList = getFilteredEventsByType(statsFilterType);
    const titleMap = { all: 'Tổng sự kiện', attended: 'Đã tham gia', upcoming: 'Sắp diễn ra' };

    return (
      <Modal visible={statsModalVisible} animationType="slide" transparent={true} onRequestClose={() => setStatsModalVisible(false)}>
        <View style={enhancedStyles.modalOverlay}>
          <View style={enhancedStyles.modalContent}>
            <View style={enhancedStyles.modalHeaderGradient}>
              <View style={enhancedStyles.modalHeader}>
                <View style={enhancedStyles.modalHeaderLeft}>
                  <View style={enhancedStyles.modalHeaderIconBadge}>
                    <Image source={Images.calendar} style={{ width: 24, height: 24, tintColor: Colors.white }} />
                  </View>
                  <CustomText variant="h2" color="primary" style={enhancedStyles.modalTitle}>
                    {titleMap[statsFilterType] || 'Sự kiện'}
                  </CustomText>
                </View>
                <TouchableOpacity 
                  onPress={() => setStatsModalVisible(false)}
                  style={enhancedStyles.modalCloseButton}
                  activeOpacity={0.7}
                >
                  <Image source={Images.logout} style={{ width: 24, height: 24, tintColor: Colors.textSecondary }} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={enhancedStyles.modalBody}>
              {filteredEventsList.length === 0 ? (
                <View style={enhancedStyles.emptyEventsContainer}>
                  <Image source={Images.calendar} style={enhancedStyles.emptyStateIcon} />
                  <CustomText variant="h3" color="secondary" align="center" style={enhancedStyles.emptyStateTitle}>
                    Không có sự kiện nào
                  </CustomText>
                  <CustomText variant="body" color="secondary" align="center" style={enhancedStyles.emptyStateText}>
                    Hãy tham gia các sự kiện để xem danh sách ở đây
                  </CustomText>
                </View>
              ) : (
                <View style={styles.eventsListSection}>
                  {filteredEventsList.map((event, idx) => {
                    const isUpcoming = event.startTime && new Date(event.startTime) > new Date();
                    const isPast = event.endTime && new Date(event.endTime) < new Date();
                    
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={enhancedStyles.eventCard}
                        onPress={() => {
                          setStatsModalVisible(false);
                          handleEventPress(event);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={enhancedStyles.eventCardIcon}>
                          <Image source={Images.calendar} style={{ width: 32, height: 32, tintColor: Colors.white }} resizeMode="contain" />
                        </View>
                        <View style={enhancedStyles.eventCardContent}>
                          <View style={enhancedStyles.eventTitleRow}>
                            <CustomText variant="body" color="primary" style={enhancedStyles.eventTitle}>
                              {event.title}
                            </CustomText>
                            {isUpcoming && (
                              <View style={[enhancedStyles.eventStatusBadge, { backgroundColor: '#4CAF50' }]}>
                                <CustomText variant="caption" color="white" style={enhancedStyles.eventStatusText}>
                                  Sắp tới
                                </CustomText>
                              </View>
                            )}
                            {isPast && (
                              <View style={[enhancedStyles.eventStatusBadge, { backgroundColor: '#757575' }]}>
                                <CustomText variant="caption" color="white" style={enhancedStyles.eventStatusText}>
                                  Đã qua
                                </CustomText>
                              </View>
                            )}
                          </View>
                          <View style={enhancedStyles.eventInfoItem}>
                            <View style={[enhancedStyles.eventInfoIconWrapper, { backgroundColor: '#E3F2FD' }]}>
                              <Image source={Images.clock} style={{ width: 18, height: 18, tintColor: Colors.primary }} />
                            </View>
                            <CustomText variant="caption" color="secondary" style={enhancedStyles.eventInfoText}>
                              {formatDateTime(event.startTime)}
                            </CustomText>
                          </View>
                          {event.address && (
                            <View style={enhancedStyles.eventInfoItem}>
                              <View style={[enhancedStyles.eventInfoIconWrapper, { backgroundColor: '#E3F2FD' }]}>
                                <Image source={Images.location} style={{ width: 20, height: 20, tintColor: Colors.primary }} resizeMode="contain" />
                              </View>
                              <CustomText variant="caption" color="secondary" numberOfLines={2} style={enhancedStyles.eventInfoText}>
                                {event.address}
                              </CustomText>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const renderEventModal = () => {
    if (!selectedEvent) return null;

    return (
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={enhancedStyles.modalOverlay}>
          <View style={enhancedStyles.modalContent}>
            <View style={enhancedStyles.modalHeaderGradient}>
              <View style={enhancedStyles.modalHeader}>
                <View style={enhancedStyles.modalHeaderLeft}>
                  <View style={enhancedStyles.modalHeaderIconBadge}>
                    <Image source={Images.calendar} style={{ width: 24, height: 24, tintColor: Colors.white }} />
                  </View>
                  <CustomText variant="h2" color="primary" style={enhancedStyles.modalTitle}>
                    {selectedEvent.title}
                  </CustomText>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setModalVisible(false);
                    setSelectedEvent(null);
                    setTickets([]);
                    setEventDetail(null);
                  }}
                  style={enhancedStyles.modalCloseButton}
                  activeOpacity={0.7}
                >
                  <Image source={Images.logout} style={{ width: 24, height: 24, tintColor: Colors.textSecondary }} />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={enhancedStyles.modalBody} showsVerticalScrollIndicator={false}>
              {eventDetail && (
                <View style={enhancedStyles.eventDetailHero}>
                  <View style={enhancedStyles.sectionHeader}>
                    <View style={[enhancedStyles.sectionIconBadge, { backgroundColor: '#4CAF50' }]}>
                      <Image source={Images.calendar} style={{ width: 20, height: 20, tintColor: Colors.white }} />
                    </View>
                    <CustomText variant="h3" color="primary" style={enhancedStyles.sectionTitle}>
                      Mô tả sự kiện
                    </CustomText>
                  </View>
                  <CustomText variant="body" color="secondary" style={enhancedStyles.descriptionText}>
                    {eventDetail.description || eventDetail.detailedDescription || 'Chưa có mô tả cho sự kiện này.'}
                  </CustomText>
                </View>
              )}
              <View style={enhancedStyles.eventInfoSection}>
                <View style={enhancedStyles.sectionHeader}>
                  <View style={[enhancedStyles.sectionIconBadge, { backgroundColor: '#FF9800' }]}>
                    <Image source={Images.clock} style={{ width: 20, height: 20, tintColor: Colors.white }} />
                  </View>
                  <CustomText variant="h3" color="primary" style={enhancedStyles.sectionTitle}>
                    Thông tin chi tiết
                  </CustomText>
                </View>
                <View style={enhancedStyles.infoDetailRow}>
                  <View style={enhancedStyles.infoDetailLeft}>
                    <View style={[enhancedStyles.infoDetailIconCircle, { backgroundColor: '#E3F2FD' }]}>
                      <Image source={Images.clock} style={{ width: 16, height: 16, tintColor: Colors.primary }} />
                    </View>
                    <CustomText variant="caption" color="secondary" style={enhancedStyles.infoDetailLabel}>Ngày giờ:</CustomText>
                  </View>
                  <CustomText variant="body" color="primary" style={enhancedStyles.infoDetailValue}>
                    {formatDateTime(selectedEvent.startTime)}
                  </CustomText>
                </View>
                {selectedEvent.address && (
                  <View style={[enhancedStyles.infoDetailRow, { marginBottom: 0 }]}>
                    <View style={enhancedStyles.infoDetailLeft}>
                      <View style={[enhancedStyles.infoDetailIconCircle, { backgroundColor: '#E3F2FD' }]}>
                        <Image source={Images.location} style={{ width: 18, height: 18, tintColor: Colors.primary }} resizeMode="contain" />
                      </View>
                      <CustomText variant="caption" color="secondary" style={enhancedStyles.infoDetailLabel}>Địa điểm:</CustomText>
                    </View>
                    <CustomText variant="body" color="primary" numberOfLines={3} style={enhancedStyles.infoDetailValue}>
                      {selectedEvent.address}
                    </CustomText>
                  </View>
                )}
              </View>
              <View style={enhancedStyles.ticketsSection}>
                <View style={enhancedStyles.ticketsSectionHeader}>
                  <View style={enhancedStyles.ticketsHeaderRow}>
                    <View style={[enhancedStyles.sectionIconBadge, { backgroundColor: '#2196F3' }]}>
                      <Image source={Images.calendar} style={{ width: 20, height: 20, tintColor: Colors.white }} />
                    </View>
                    <CustomText variant="h3" color="primary" style={enhancedStyles.sectionTitle}>
                      Vé của bạn ({tickets.reduce((sum, t) => sum + (t.quantity || 0), 0)})
                    </CustomText>
                  </View>
                </View>
                {loadingTickets ? (
                  <ActivityIndicator size="large" color={Colors.primary} />
                ) : tickets.length === 0 ? (
                  <View style={enhancedStyles.emptyEventsContainer}>
                    <Image source={Images.calendar} style={enhancedStyles.emptyStateIcon} />
                    <CustomText variant="body" color="secondary" align="center" style={enhancedStyles.emptyStateTitle}>
                      Bạn chưa có vé cho sự kiện này
                    </CustomText>
                  </View>
                ) : (
                  <View style={enhancedStyles.ticketsList}>
                    {tickets.map((ticketGroup, idx) => {
                      const ticketList = Array.isArray(ticketGroup.tickets) ? ticketGroup.tickets : [];
                      return (
                        <View key={idx} style={enhancedStyles.ticketGroup}>
                          <View style={enhancedStyles.ticketGroupHeader}>
                            <CustomText variant="body" color="primary" style={enhancedStyles.ticketGroupTitle}>
                              {ticketGroup.ticketTypeName}
                            </CustomText>
                            <View style={enhancedStyles.ticketCountBadge}>
                              <CustomText variant="caption" color="white" style={enhancedStyles.eventStatusText}>
                                {ticketGroup.quantity} vé
                              </CustomText>
                            </View>
                          </View>
                          {ticketList.map((ticket) => (
                            <View key={ticket.ticketId} style={enhancedStyles.ticketItem}>
                              {/* Ticket Header */}
                              <View style={enhancedStyles.ticketItemHeader}>
                                <View style={enhancedStyles.ticketItemHeaderLeft}>
                                  <View style={enhancedStyles.ticketItemIcon}>
                                    <Image source={Images.calendar} style={{ width: 20, height: 20, tintColor: Colors.white }} />
                                  </View>
                                  <View style={enhancedStyles.ticketItemCodeContainer}>
                                    <CustomText variant="caption" style={enhancedStyles.ticketItemCodeLabel}>
                                      Mã vé
                                    </CustomText>
                                    <CustomText variant="body" style={enhancedStyles.ticketItemCode}>
                                      {ticket.ticketCode}
                                    </CustomText>
                                  </View>
                                </View>
                                <View style={[enhancedStyles.ticketStatusBadge, { backgroundColor: ticket.status === 'Valid' ? Colors.success : Colors.error }]}>
                                  <CustomText variant="caption" color="white" style={enhancedStyles.eventStatusText}>
                                    {ticket.status === 'Valid' ? 'Hợp lệ' : ticket.status}
                                  </CustomText>
                                </View>
                              </View>
                              
                              {/* Ticket Body */}
                              <View style={enhancedStyles.ticketItemBody}>
                                <View style={enhancedStyles.ticketInfoGrid}>
                                  <View style={enhancedStyles.ticketInfoRow}>
                                    <View style={enhancedStyles.ticketInfoIcon}>
                                      <Image source={Images.calendar} style={{ width: 18, height: 18, tintColor: Colors.primary }} />
                                    </View>
                                    <View style={enhancedStyles.ticketInfoContent}>
                                      <CustomText variant="caption" color="secondary" style={enhancedStyles.ticketLabel}>
                                        Loại vé
                                      </CustomText>
                                      <CustomText variant="body" color="primary" style={enhancedStyles.ticketValue}>
                                        {ticketGroup.ticketTypeName}
                                      </CustomText>
                                    </View>
                                  </View>
                                  
                                  <View style={enhancedStyles.ticketInfoRow}>
                                    <View style={[enhancedStyles.ticketInfoIcon, { backgroundColor: ticket.status === 'Valid' ? '#E8F5E9' : '#FFEBEE' }]}>
                                      <Image 
                                        source={Images.star} 
                                        style={{ 
                                          width: 18, 
                                          height: 18, 
                                          tintColor: ticket.status === 'Valid' ? Colors.success : Colors.error 
                                        }} 
                                      />
                                    </View>
                                    <View style={enhancedStyles.ticketInfoContent}>
                                      <CustomText variant="caption" color="secondary" style={enhancedStyles.ticketLabel}>
                                        Trạng thái
                                      </CustomText>
                                      <CustomText variant="body" color="primary" style={enhancedStyles.ticketValue}>
                                        {ticket.status === 'Valid' ? 'Vé hợp lệ' : 'Vé không hợp lệ'}
                                      </CustomText>
                                    </View>
                                  </View>
                                </View>
                                
                                {/* QR Code Button */}
                                <TouchableOpacity
                                  style={enhancedStyles.qrButton}
                                  onPress={() => {
                                    if (qrCodes[ticket.ticketId]) {
                                      setQrCodes((prev) => {
                                        const newCodes = { ...prev };
                                        delete newCodes[ticket.ticketId];
                                        return newCodes;
                                      });
                                    } else {
                                      handleViewQR(ticket.ticketId);
                                    }
                                  }}
                                  disabled={loadingQR[ticket.ticketId]}
                                  activeOpacity={0.8}
                                >
                                  {loadingQR[ticket.ticketId] ? (
                                    <ActivityIndicator size="small" color={Colors.white} />
                                  ) : (
                                    <>
                                      <Image source={Images.star} style={{ width: 20, height: 20, tintColor: Colors.white }} />
                                      <CustomText variant="caption" color="white" style={enhancedStyles.qrButtonText}>
                                        {qrCodes[ticket.ticketId] ? 'Ẩn QR Code' : 'Xem QR Code'}
                                      </CustomText>
                                    </>
                                  )}
                                </TouchableOpacity>
                                
                                {/* QR Code Display */}
                                {qrCodes[ticket.ticketId] && (
                                  <View style={enhancedStyles.qrContainer}>
                                    <CustomText variant="caption" color="primary" style={enhancedStyles.qrLabel}>
                                      Mã QR Code
                                    </CustomText>
                                    <View style={enhancedStyles.qrImageWrapper}>
                                      <Image source={{ uri: qrCodes[ticket.ticketId] }} style={enhancedStyles.qrImage} resizeMode="contain" />
                                    </View>
                                    <CustomText variant="caption" color="secondary" style={enhancedStyles.qrHelperText}>
                                      Hiển thị mã này tại cửa vào sự kiện để được quét mã
                                    </CustomText>
                                  </View>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomText variant="h2" color="primary" style={{ fontSize: Fonts.xxl, fontWeight: '700', fontFamily: Fonts.bold }}>
          Timeline Sự Kiện
        </CustomText>
      </View>

      <View style={styles.searchContainer}>
        <Image source={Images.search} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sự kiện..."
          placeholderTextColor={Colors.textLight}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {renderStats()}

      <View style={styles.viewModeContainer}>
        {renderViewModeTabs()}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              if (viewMode === 'month') setCurrentMonth(addMonths(currentMonth, -1));
              else if (viewMode === 'week') setCurrentWeek(addWeeks(currentWeek, -1));
              else setCurrentDay(addDays(currentDay, -1));
            }}
          >
            <CustomText variant="h3" color="primary">‹</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => {
              if (viewMode === 'month') setCurrentMonth(addMonths(currentMonth, 1));
              else if (viewMode === 'week') setCurrentWeek(addWeeks(currentWeek, 1));
              else setCurrentDay(addDays(currentDay, 1));
            }}
          >
            <CustomText variant="h3" color="primary">›</CustomText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <CustomText variant="body" color="secondary" align="center" style={styles.loadingText}>
              {Strings.LOADING}
            </CustomText>
          </View>
        ) : (
          <>
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </>
        )}
      </ScrollView>

      {renderEventModal()}
      {renderStatsModal()}
    </View>
  );
};

export default TimelineScreen;