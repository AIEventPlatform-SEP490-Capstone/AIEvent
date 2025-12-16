import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    Dimensions,
    Platform,
    ActivityIndicator,
    Alert,
    Linking,
    Animated,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_DEFAULT, Circle } from 'react-native-maps';
import Toast from 'react-native-toast-message';

import styles from './styles';
import CustomText from '../../components/common/customTextRN';
import EventService from '../../api/services/EventService';
import CategoryService from '../../api/services/CategoryService';
import Colors from '../../constants/Colors';
import FilterBottomSheet from '../../components/presentation/NearbyMap/FilterBottomSheet ';
import EventsListBottomSheet from '../../components/presentation/NearbyMap/EventsListBottomSheet';

const { width, height } = Dimensions.get('window');

const NearbyEventsScreen = () => {
    const navigation = useNavigation();
    const mapRef = useRef(null);

    // Location states
    const [userLocation, setUserLocation] = useState(null);
    const [locationPermission, setLocationPermission] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Events data
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Filter states
    const [radius, setRadius] = useState(10);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // UI states
    const [showFilterSheet, setShowFilterSheet] = useState(false);
    const [showEventsSheet, setShowEventsSheet] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    // Animation
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Pulse animation for location button
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, []);

    // Request location permission and get location when screen loads
    useFocusEffect(
        useCallback(() => {
            requestLocationPermission();
        }, [])
    );

    // Load events when location or filters change
    useEffect(() => {
        if (userLocation) {
            loadNearbyEvents();
        }
    }, [userLocation, radius, selectedCategory]);

    const loadCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await CategoryService.getCategories({
                pageNumber: 1,
                pageSize: 100,
            });

            if (response.success) {
                const cats = response.data || [];
                setCategories(cats);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const requestLocationPermission = async () => {
        try {
            setLoadingLocation(true);
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                setLocationPermission(false);
                Alert.alert(
                    'Quyền truy cập vị trí',
                    'Vui lòng cấp quyền truy cập vị trí để tìm sự kiện gần bạn.',
                    [
                        { text: 'Hủy', style: 'cancel' },
                        {
                            text: 'Cài đặt',
                            onPress: () => Linking.openSettings(),
                        },
                    ]
                );
                return;
            }

            setLocationPermission(true);
            await getUserLocation();
        } catch (error) {
            console.error('Error requesting location permission:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể yêu cầu quyền truy cập vị trí',
            });
        } finally {
            setLoadingLocation(false);
        }
    };

    const getUserLocation = async () => {
        try {
            setLoadingLocation(true);
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const newLocation = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setUserLocation(newLocation);

            // Animate to user location
            if (mapRef.current) {
                mapRef.current.animateToRegion({
                    ...newLocation,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }, 500);
            }
        } catch (error) {
            console.error('Error getting user location:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể lấy vị trí hiện tại',
            });
        } finally {
            setLoadingLocation(false);
        }
    };

    const loadNearbyEvents = async () => {
        if (!userLocation) return;

        try {
            setLoadingEvents(true);

            const response = await EventService.getEventsByRadius({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                radius: radius,
                categoryld: selectedCategory?.eventCategoryId || '',
                pageNumber: 1,
                pageSize: 100,
            });

            if (response.success) {
                const nearbyEvents = response.data || [];
                setEvents(nearbyEvents);

                if (nearbyEvents.length === 0) {
                    Toast.show({
                        type: 'info',
                        text1: 'Không tìm thấy sự kiện',
                        text2: `Không có sự kiện nào trong bán kính ${radius}km`,
                    });
                }
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Lỗi',
                    text2: response.message || 'Không thể tải sự kiện',
                });
            }
        } catch (error) {
            console.error('Error loading nearby events:', error);
            Toast.show({
                type: 'error',
                text1: 'Lỗi',
                text2: 'Không thể tải danh sách sự kiện',
            });
        } finally {
            setLoadingEvents(false);
        }
    };

    const handleEventPress = (eventId) => {
        navigation.navigate('EventDetailScreen', { eventId });
    };

    const handleMarkerPress = (event) => {
        setSelectedEvent(event);
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: event.latitude,
                longitude: event.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 300);
        }
    };

    const handleApplyFilters = (newRadius, newCategory) => {
        setRadius(newRadius);
        setSelectedCategory(newCategory);
        setShowFilterSheet(false);
    };

    if (!locationPermission) {
        return (
            <View style={styles.permissionContainer}>
                <View style={styles.permissionContent}>
                    <View style={styles.permissionIcon}>
                        <CustomText style={styles.permissionIconText}>📍</CustomText>
                    </View>
                    <CustomText variant="h2" style={styles.permissionTitle}>
                        Cần quyền truy cập vị trí
                    </CustomText>
                    <CustomText variant="body" style={styles.permissionDescription}>
                        Để tìm và hiển thị các sự kiện gần bạn trên bản đồ, chúng tôi cần quyền truy cập vị trí của bạn
                    </CustomText>
                    <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={requestLocationPermission}>
                        <CustomText style={styles.permissionButtonText}>
                            Cấp quyền truy cập
                        </CustomText>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Map View - Full Screen */}
            {userLocation && (
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_DEFAULT}
                    style={styles.map}
                    initialRegion={{
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                    onMapReady={() => setMapReady(true)}
                    showsUserLocation={true}
                    showsMyLocationButton={false}
                    showsCompass={false}
                    loadingEnabled={true}
                    customMapStyle={[]}
                    onPress={() => setSelectedEvent(null)}
                >
                    {/* Radius Circle */}
                    <Circle
                        center={{
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                        }}
                        radius={radius * 1000}
                        strokeColor="rgba(59, 130, 246, 0.3)"
                        fillColor="rgba(59, 130, 246, 0.1)"
                        strokeWidth={2}
                    />

                    {/* Event Markers */}
                    {events.map((event, index) => {
                        if (!event.latitude || !event.longitude) return null;

                        const isSelected = selectedEvent?.eventId === event.eventId;

                        return (
                            <Marker
                                key={event.eventId || index}
                                coordinate={{
                                    latitude: event.latitude,
                                    longitude: event.longitude,
                                }}
                                onPress={() => handleMarkerPress(event)}
                            >
                                <View style={[
                                    styles.customMarker,
                                    isSelected && styles.customMarkerSelected
                                ]}>
                                    <CustomText style={styles.markerText}>
                                        {event.ticketPrice === 0 ? '🎉' : '🎫'}
                                    </CustomText>
                                </View>
                            </Marker>
                        );
                    })}
                </MapView>
            )}

            {/* Top Controls Overlay */}
            <View style={styles.topOverlay}>
                {/* Back Button */}
                <TouchableOpacity
                    style={styles.overlayButton}
                    onPress={() => navigation.goBack()}>
                    <CustomText style={styles.overlayButtonIcon}>←</CustomText>
                </TouchableOpacity>

                {/* Location Button */}
                <Animated.View style={{ transform: [{ scale: loadingLocation ? pulseAnim : 1 }] }}>
                    <TouchableOpacity
                        style={[styles.overlayButton, styles.locationOverlayButton]}
                        onPress={getUserLocation}
                        disabled={loadingLocation}>
                        {loadingLocation ? (
                            <ActivityIndicator size="small" color="#3B82F6" />
                        ) : (
                            <CustomText style={styles.locationButtonIcon}>📍</CustomText>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Bottom Controls */}
            <View style={styles.bottomControls}>
                {/* Filter Button */}
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilterSheet(true)}>
                    <CustomText style={styles.filterButtonIcon}>⚙️</CustomText>
                    <CustomText style={styles.filterButtonText}>
                        Bộ lọc
                    </CustomText>
                    {(selectedCategory || radius !== 10) && (
                        <View style={styles.filterBadge} />
                    )}
                </TouchableOpacity>

                {/* Events List Button */}
                <TouchableOpacity
                    style={styles.eventsListButton}
                    onPress={() => setShowEventsSheet(true)}>
                    <View style={styles.eventsListButtonContent}>
                        <CustomText style={styles.eventsListButtonText}>
                            {loadingEvents ? 'Đang tìm...' : `${events.length} sự kiện gần đây`}
                        </CustomText>
                        <CustomText style={styles.eventsListButtonIcon}>↑</CustomText>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Selected Event Card */}
            {selectedEvent && (
                <View style={styles.selectedEventCard}>
                    <TouchableOpacity
                        style={styles.selectedEventContent}
                        onPress={() => handleEventPress(selectedEvent.eventId)}
                        activeOpacity={0.9}>
                        <View style={styles.selectedEventIcon}>
                            <CustomText style={styles.selectedEventEmoji}>
                                {selectedEvent.ticketPrice === 0 ? '🎉' : '🎫'}
                            </CustomText>
                        </View>
                        <View style={styles.selectedEventInfo}>
                            <CustomText variant="h4" style={styles.selectedEventTitle} numberOfLines={1}>
                                {selectedEvent.title}
                            </CustomText>
                            <CustomText variant="caption" style={styles.selectedEventLocation} numberOfLines={1}>
                                📍 {selectedEvent.locationName || 'Chưa xác định'}
                            </CustomText>
                            <View style={styles.selectedEventFooter}>
                                <CustomText style={styles.selectedEventPrice}>
                                    {selectedEvent.ticketPrice === 0
                                        ? 'Miễn phí'
                                        : `${(selectedEvent.ticketPrice / 1000).toFixed(0)}k VND`}
                                </CustomText>
                                <CustomText style={styles.selectedEventDistance}>
                                    {selectedEvent.distance !== undefined && selectedEvent.distance !== null
                                        ? (selectedEvent.distance < 1
                                            ? `${(selectedEvent.distance * 1000).toFixed(0)}m`
                                            : `${selectedEvent.distance.toFixed(1)}km`)
                                        : 'N/A'}
                                </CustomText>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.selectedEventCloseButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(null);
                            }}>
                            <CustomText style={styles.selectedEventCloseIcon}>×</CustomText>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            )}

            {/* Filter Bottom Sheet */}
            <FilterBottomSheet
                visible={showFilterSheet}
                onClose={() => setShowFilterSheet(false)}
                radius={radius}
                selectedCategory={selectedCategory}
                categories={categories}
                onApply={handleApplyFilters}
            />

            {/* Events List Bottom Sheet */}
            <EventsListBottomSheet
                visible={showEventsSheet}
                onClose={() => setShowEventsSheet(false)}
                events={events}
                onEventPress={handleEventPress}
                loading={loadingEvents}
                onRefresh={loadNearbyEvents}
            />
        </View>
    );
};

export default NearbyEventsScreen;