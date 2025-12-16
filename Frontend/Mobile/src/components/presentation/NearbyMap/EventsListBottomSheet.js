import React from 'react';
import {
    View,
    Modal,
    TouchableOpacity,
    ScrollView,
    TouchableWithoutFeedback,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import Colors from '../../../constants/Colors';
import CustomText from '../../common/customTextRN';
import styles from '../../../screens/nearbyScreen/styles';

const { height } = Dimensions.get('window');

const EventsListBottomSheet = ({
    visible,
    onClose,
    events,
    onEventPress,
    loading,
    onRefresh,
}) => {
    const [refreshing, setRefreshing] = React.useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
    };

    const renderEventItem = (event, index) => {
        return (
            <TouchableOpacity
                key={event.eventId || index}
                style={styles.eventListItem}
                onPress={() => {
                    onEventPress(event.eventId);
                    onClose();
                }}
                activeOpacity={0.7}>
                <View style={styles.eventListIcon}>
                    <CustomText style={styles.eventListEmoji}>
                        {event.ticketPrice === 0 ? '🎉' : '🎫'}
                    </CustomText>
                </View>

                <View style={styles.eventListContent}>
                    <CustomText variant="h4" style={styles.eventListTitle} numberOfLines={2}>
                        {event.title}
                    </CustomText>
                    
                    <View style={styles.eventListMeta}>
                        <CustomText variant="caption" style={styles.eventListLocation} numberOfLines={1}>
                            📍 {event.locationName || 'Chưa xác định'}
                        </CustomText>
                        
                        {event.eventCategoryName && (
                            <View style={styles.eventListCategory}>
                                <CustomText variant="caption" style={styles.eventListCategoryText}>
                                    {event.eventCategoryName}
                                </CustomText>
                            </View>
                        )}
                    </View>

                    <View style={styles.eventListFooter}>
                        <CustomText style={styles.eventListPrice}>
                            {event.ticketPrice === 0
                                ? 'Miễn phí'
                                : `${(event.ticketPrice / 1000).toFixed(0)}k VND`}
                        </CustomText>
                        <View style={styles.eventListDistance}>
                            <CustomText style={styles.eventListDistanceText}>
                                {event.distance !== undefined && event.distance !== null
                                    ? (event.distance < 1
                                        ? `${(event.distance * 1000).toFixed(0)}m`
                                        : `${event.distance.toFixed(1)}km`)
                                    : 'N/A'}
                            </CustomText>
                        </View>
                    </View>
                </View>

                <View style={styles.eventListArrow}>
                    <CustomText style={styles.eventListArrowIcon}>›</CustomText>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.bottomSheet, styles.eventsBottomSheet]}>
                            {/* Handle Bar */}
                            <View style={styles.handleBar} />

                            {/* Header */}
                            <View style={styles.sheetHeader}>
                                <CustomText variant="h3" style={styles.sheetTitle}>
                                    Sự kiện gần bạn
                                </CustomText>
                                <TouchableOpacity onPress={onClose}>
                                    <CustomText style={styles.closeButton}>
                                        ×
                                    </CustomText>
                                </TouchableOpacity>
                            </View>

                            {/* Events Count */}
                            <View style={styles.eventsCount}>
                                <CustomText variant="body" style={styles.eventsCountText}>
                                    {loading ? 'Đang tải...' : `${events.length} sự kiện được tìm thấy`}
                                </CustomText>
                            </View>

                            {/* Events List */}
                            {loading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <CustomText variant="body" style={styles.loadingText}>
                                        Đang tìm sự kiện gần bạn...
                                    </CustomText>
                                </View>
                            ) : events.length === 0 ? (
                                <View style={styles.emptyListState}>
                                    <CustomText style={styles.emptyListEmoji}>📍</CustomText>
                                    <CustomText variant="h3" style={styles.emptyListTitle}>
                                        Không tìm thấy sự kiện
                                    </CustomText>
                                    <CustomText variant="body" style={styles.emptyListText}>
                                        Thử tăng bán kính tìm kiếm hoặc thay đổi bộ lọc
                                    </CustomText>
                                </View>
                            ) : (
                                <ScrollView
                                    style={styles.eventsList}
                                    showsVerticalScrollIndicator={false}
                                    refreshControl={
                                        <RefreshControl
                                            refreshing={refreshing}
                                            onRefresh={handleRefresh}
                                            tintColor={Colors.primary}
                                        />
                                    }>
                                    {events.map(renderEventItem)}
                                    <View style={{ height: 20 }} />
                                </ScrollView>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default EventsListBottomSheet;