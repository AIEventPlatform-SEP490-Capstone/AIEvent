import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  Loader2,
  AlertCircle,
  ExternalLink,
  Search,
  X,
  Ruler,
  DollarSign,
  GripVertical,
  Maximize2,
  Minimize2,
  Radius,
  Share2,
  User
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { eventAPI } from "../../api/eventAPI";
import { eventCategoryAPI } from "../../api/eventCategoryAPI";
import { friendAPI } from "../../api/friendAPI";
import { userAPI } from "../../api/userAPI";
import { useLocationSharing } from "../../hooks/useLocationSharing";
import locationInfoIcon from "../../assets/location-info.png";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const createIconSVGString = (iconName, size = 14, color = '#6b7280') => {
  const iconPaths = {
    MapPin: ['M20 10c0 4.418-8 12-8 12s-8-7.582-8-12a8 8 0 0 1 16 0Z', 'M12 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'],
    Ruler: ['M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z', 'M14.5 12.5l2-2', 'M11.5 9.5l2-2', 'M8.5 6.5l2-2', 'M17.5 15.5l2-2'],
    DollarSign: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6']
  };
  const paths = iconPaths[iconName] || iconPaths.MapPin;
  const pathsString = paths.map(path => `<path d="${path}"/>`).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 4px;">${pathsString}</svg>`;
};

const DEFAULT_EVENT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23e5e7eb' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EEvent Image%3C/text%3E%3C/svg%3E";

function NearbyEventsPage() {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);           // Event markers
  const userMarkerRef = useRef(null);      // User location marker (green)
  const friendMarkersRef = useRef([]);     // Friend markers
  const pickMarkerRef = useRef(null);      // Pick location marker (orange)

  const [events, setEvents] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [eventsError, setEventsError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [radius, setRadius] = useState(30);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [locationType, setLocationType] = useState("auto");
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPickingOnMap, setIsPickingOnMap] = useState(false);

  // Friends state
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [isLocationSharingEnabled, setIsLocationSharingEnabled] = useState(false);
  const [togglingLocationSharing, setTogglingLocationSharing] = useState(false);

  // Default dialog position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultX = window.innerWidth - 320 - 20;
      setDialogPosition({ x: defaultX, y: 80 });
    }
  }, []);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await eventCategoryAPI.getEventCategories(1, 100);
        let categoriesList = [];
        if (response?.data?.items) categoriesList = response.data.items;
        else if (response?.data && Array.isArray(response.data)) categoriesList = response.data;
        else if (response?.items) categoriesList = response.items;
        else if (Array.isArray(response)) categoriesList = response;

        categoriesList = categoriesList.filter(cat => cat && (cat.eventCategoryId || cat.id));
        setCategories(categoriesList);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      try {
        const defaultCenter = [10.8231, 106.6297];
        mapInstanceRef.current = L.map(mapRef.current, {
          center: defaultCenter,
          zoom: 12,
          zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(mapInstanceRef.current);

        setMapReady(true);
      } catch (err) {
        console.error('Error initializing map:', err);
        setLocationError('Không thể khởi tạo bản đồ');
      }
    };

    const timer = setTimeout(initMap, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle map click for picking location
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return;

    const handleMapClick = (e) => {
      if (!isPickingOnMap) return;

      const { lat, lng } = e.latlng;

      // Remove previous pick marker
      if (pickMarkerRef.current) {
        mapInstanceRef.current.removeLayer(pickMarkerRef.current);
        pickMarkerRef.current = null;
      }

      // Remove user marker to prevent overlap
      if (userMarkerRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }

      // Create orange pulsing pick marker
      const pickIcon = L.divIcon({
        className: 'custom-pick-marker',
        html: `
          <div style="
            background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
            width: 44px;
            height: 44px;
            border-radius: 50% 50% 50% 0;
            border: 5px solid white;
            box-shadow: 0 6px 24px rgba(249, 115, 22, 0.7);
            animation: pickPulse 1.8s ease-in-out infinite;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 16px;
              height: 16px;
              background: white;
              border-radius: 50%;
              transform: rotate(45deg);
            "></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
      });

      const newMarker = L.marker([lat, lng], { icon: pickIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div style="font-weight:700;color:#ea580c;text-align:center;">✓ Vị trí tìm kiếm đã chọn<br><small>Click lại để thay đổi</small></div>', { closeOnClick: false })
        .openPopup();

      pickMarkerRef.current = newMarker;

      // Update location and search
      setUserLocation({ lat, lng });
      setLocationError(null);
      setEvents([]);

      // Zoom to selected location
      mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.2 });
    };

    mapInstanceRef.current.on('click', handleMapClick);

    return () => {
      mapInstanceRef.current.off('click', handleMapClick);
    };
  }, [isPickingOnMap, mapReady]);

  // Add friend markers
  const addFriendMarkers = () => {
    if (!mapInstanceRef.current || !mapReady) return;

    friendMarkersRef.current.forEach(marker => marker && mapInstanceRef.current.removeLayer(marker));
    friendMarkersRef.current = [];

    friends.forEach((friend) => {
      if (friend.latitude && friend.longitude && friend.latitude !== 0 && friend.longitude !== 0) {
        const friendIcon = L.divIcon({
          className: 'friend-marker',
          html: `<div style="
            background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(139, 92, 246, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          ">
            ${friend.imageUrl ? `
              <img src="${friend.imageUrl}" 
                style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" 
                alt="${friend.friendName || 'Friend'}"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
              />
              <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 50%; color: white; font-weight: bold; font-size: 10px;">
                ${(friend.friendName || 'F').charAt(0).toUpperCase()}
              </div>
            ` : `
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 10px;">
                ${(friend.friendName || 'F').charAt(0).toUpperCase()}
              </div>
            `}
          </div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        let distanceText = '';
        if (userLocation) {
          const distance = calculateDistance(userLocation.lat, userLocation.lng, friend.latitude, friend.longitude);
          distanceText = `<p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
            <strong style="color: #374151;">${createIconSVGString('Ruler', 14, '#6b7280')} Khoảng cách:</strong> <span style="color: #8b5cf6; font-weight: 600;">${distance.toFixed(1)} km</span>
          </p>`;
        }

        const marker = L.marker([friend.latitude, friend.longitude], { icon: friendIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="min-width: 200px; padding: 4px;">
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                ${friend.imageUrl ? `
                  <img src="${friend.imageUrl}" 
                    style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" 
                    alt="${friend.friendName || 'Friend'}"
                    onerror="this.style.display='none';"
                  />
                ` : `
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    ${(friend.friendName || 'F').charAt(0).toUpperCase()}
                  </div>
                `}
                <div>
                  <h3 style="font-weight: 700; margin: 0; font-size: 14px; color: #1f2937;">${friend.friendName || 'Bạn bè'}</h3>
                  ${friend.email ? `<p style="font-size: 11px; color: #6b7280; margin: 2px 0 0 0;">${friend.email}</p>` : ''}
                </div>
              </div>
              ${distanceText}
            </div>
          `);
        friendMarkersRef.current.push(marker);
      }
    });
  };

  // Add event markers
  const addEventMarkers = () => {
    if (!mapInstanceRef.current || !mapReady) return;

    markersRef.current.forEach(marker => marker && mapInstanceRef.current.removeLayer(marker));
    markersRef.current = [];

    events.forEach((event) => {
      if (event.latitude && event.longitude && event.latitude !== 0 && event.longitude !== 0) {
        const customIcon = new L.Icon({
          iconUrl: locationInfoIcon,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
          className: 'event-marker',
        });

        const marker = L.marker([event.latitude, event.longitude], { icon: customIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="min-width: 220px; padding: 4px;">
              <h3 style="font-weight: 700; margin-bottom: 10px; font-size: 15px; color: #1f2937;">${event.title}</h3>
              <div style="margin-bottom: 8px;">
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                  <strong style="color: #374151;">${createIconSVGString('MapPin', 14, '#ef4444')} Địa điểm:</strong> ${event.locationName || 'N/A'}
                </p>
                ${event.distance !== null ? `
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                  <strong style="color: #374151;">${createIconSVGString('Ruler', 14, '#6b7280')} Khoảng cách:</strong> <span style="color: #3b82f6; font-weight: 600;">${event.distance.toFixed(1)} km</span>
                </p>
                ` : ''}
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                  <strong style="color: #374151;">${createIconSVGString('DollarSign', 14, '#f59e0b')} Giá:</strong> <span style="color: #10b981; font-weight: 600;">${event.ticketPrice === 0 ? 'Miễn phí' : event.ticketPrice.toLocaleString('vi-VN') + ' VND'}</span>
                </p>
              </div>
              <button onclick="window.navigateToEvent('${event.eventId}')" 
                style="background:linear-gradient(135deg,#3b82f6 0%,#2563eb 100%);color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;width:100%;box-shadow:0 2px 4px rgba(59,130,246,0.3);"
                onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">Xem chi tiết</button>
            </div>
          `)
          .on('click', () => setSelectedEvent(event));

        markersRef.current.push(marker);
      }
    });

    // Fit bounds including pick marker
    const allLayers = [...markersRef.current, ...friendMarkersRef.current];
    if (userMarkerRef.current) allLayers.push(userMarkerRef.current);
    if (pickMarkerRef.current) allLayers.push(pickMarkerRef.current);

    if (allLayers.length > 0) {
      const group = new L.featureGroup(allLayers);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.15));
    }
  };

  // Re-render markers
  useEffect(() => {
    if (mapReady) {
      addEventMarkers();
      addFriendMarkers();
    }
  }, [events, friends, mapReady, userLocation]);

  // Fetch nearby events
  const fetchNearbyEvents = useCallback(async () => {
    if (!userLocation) return;

    setLoadingEvents(true);
    setEventsError(null);

    try {
      const response = await eventAPI.getEventsByRadius({
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        radius: radius,
        categoryld: categoryId || undefined,
        pageNumber: 1,
        pageSize: 100
      });

      const mappedEvents = (response.items || []).map((event) => {
        const hasValidCoords = event.latitude && event.longitude && event.latitude !== 0 && event.longitude !== 0;
        let distance = null;
        if (hasValidCoords) {
          distance = calculateDistance(userLocation.lat, userLocation.lng, event.latitude, event.longitude);
        }

        return {
          eventId: event.eventId,
          title: event.title,
          description: event.description,
          startTime: event.startTime,
          endTime: event.endTime,
          locationName: event.locationName,
          address: event.locationName,
          latitude: hasValidCoords ? event.latitude : null,
          longitude: hasValidCoords ? event.longitude : null,
          distance,
          ticketPrice: event.ticketPrice || 0,
          categoryName: event.eventCategoryName || "",
          image: event.imgListEvent && event.imgListEvent.length > 0 ? event.imgListEvent[0] : DEFAULT_EVENT_IMAGE
        };
      })
        .filter(event => event.latitude !== null && event.longitude !== null)
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching nearby events:', error);
      setEventsError('Không thể tải danh sách sự kiện. Vui lòng thử lại.');
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [userLocation, radius, categoryId]);

  useEffect(() => {
    if (userLocation) fetchNearbyEvents();
  }, [userLocation, radius, categoryId, fetchNearbyEvents]);

  // Fetch friends location
  const fetchFriendsLocation = useCallback(async () => {
    if (!userLocation) return;
    setLoadingFriends(true);
    try {
      const response = await friendAPI.getFriendsLocation({
        radius,
        latitude: userLocation.lat,
        longitude: userLocation.lng
      });
      const friendsList = Array.isArray(response) ? response : (response?.data || []);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends location:', error);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  }, [userLocation, radius]);

  useEffect(() => {
    if (userLocation) {
      fetchFriendsLocation();
      const interval = setInterval(fetchFriendsLocation, 60000);
      return () => clearInterval(interval);
    }
  }, [userLocation, radius, fetchFriendsLocation]);

  // Toggle location sharing
  const handleToggleLocationSharing = async (enabled) => {
    setTogglingLocationSharing(true);
    try {
      await userAPI.toggleLocationSharing(enabled);
      setIsLocationSharingEnabled(enabled);
    } catch (error) {
      console.error('Error toggling location sharing:', error);
      setLocationError('Không thể thay đổi cài đặt chia sẻ vị trí');
    } finally {
      setTogglingLocationSharing(false);
    }
  };

  const { updateLocation: updateLocationViaSignalR } = useLocationSharing(
    (data) => {
      if (data && data.friendId) {
        setFriends(prev => {
          const updated = [...prev];
          const index = updated.findIndex(f => f.friendId === data.friendId);
          if (index >= 0) {
            updated[index] = { ...updated[index], latitude: data.latitude, longitude: data.longitude };
          }
          return updated;
        });
      }
    },
    isLocationSharingEnabled && userLocation !== null
  );

  useEffect(() => {
    if (isLocationSharingEnabled && userLocation && updateLocationViaSignalR) {
      updateLocationViaSignalR(userLocation.lat, userLocation.lng);
    }
  }, [userLocation, isLocationSharingEnabled, updateLocationViaSignalR]);

  // User location marker - ONLY show when NOT picking
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !mapReady || isPickingOnMap) {
      // Remove user marker if picking
      if (userMarkerRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      return;
    }

    if (userMarkerRef.current) {
      mapInstanceRef.current.removeLayer(userMarkerRef.current);
    }

    const userIcon = L.divIcon({
      className: 'user-marker',
      html: `<div style="
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: userPulse 2s ease-in-out infinite;
      ">
        <div style="width: 12px; height: 12px; background: white; border-radius: 50%;"></div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b style="color: #059669;">${createIconSVGString('MapPin', 14, '#059669')} Vị trí của bạn</b>`)
      .openPopup();

    mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13);
  }, [userLocation, isPickingOnMap, mapReady]);

  // Cleanup when turning off pick mode
  useEffect(() => {
    if (!isPickingOnMap && pickMarkerRef.current) {
      mapInstanceRef.current.removeLayer(pickMarkerRef.current);
      pickMarkerRef.current = null;
    }
  }, [isPickingOnMap]);

  // Window functions for popup
  useEffect(() => {
    window.navigateToEvent = (eventId) => {
      navigate(`/event/${eventId}`);
    };

    return () => {
      delete window.navigateToEvent;
    };
  }, [navigate]);

  // Geocode address
  const geocodeAddress = async (address) => {
    try {
      setLoadingGeocode(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=vn`,
        { headers: { 'User-Agent': 'AIEvent/1.0' } }
      );
      if (!response.ok) throw new Error('Không thể tìm thấy địa chỉ');
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), address: data[0].display_name };
      }
      throw new Error('Không tìm thấy địa chỉ');
    } catch (error) {
      throw new Error(error.message || 'Lỗi định vị địa chỉ');
    } finally {
      setLoadingGeocode(false);
    }
  };

  const handleSearchByAddress = async () => {
    if (!locationInput.trim()) {
      setLocationError('Vui lòng nhập địa chỉ');
      return;
    }
    try {
      const location = await geocodeAddress(locationInput);
      setUserLocation(location);
      setEvents([]);
    } catch (error) {
      setLocationError(error.message);
    }
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị');
      return;
    }
    setLoadingLocation(true);
    setLocationError(null);
    setEvents([]);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(newLocation);
        setLoadingLocation(false);
        if (isLocationSharingEnabled && updateLocationViaSignalR) {
          updateLocationViaSignalR(newLocation.lat, newLocation.lng);
        }
      },
      (error) => {
        let errorMessage = 'Không thể lấy vị trí của bạn. ';
        switch (error.code) {
          case error.PERMISSION_DENIED: errorMessage += 'Vui lòng cấp quyền truy cập vị trí.'; break;
          case error.POSITION_UNAVAILABLE: errorMessage += 'Thông tin vị trí không khả dụng.'; break;
          case error.TIMEOUT: errorMessage += 'Yêu cầu vị trí hết thời gian chờ.'; break;
          default: errorMessage += 'Vui lòng thử lại.'; break;
        }
        setLocationError(errorMessage);
        setLoadingLocation(false);
      }
    );
  };

  const handleEventClick = (event) => {
    if (event.eventId) {
      navigate(`/event/${event.eventId}`);
    }
  };

  const handleDrag = (event, info) => {
    const newX = dialogPosition.x + info.delta.x;
    const newY = dialogPosition.y + info.delta.y;
    setDialogPosition({
      x: Math.max(0, Math.min(window.innerWidth - 320, newX)),
      y: Math.max(0, Math.min(window.innerHeight - (isMinimized ? 60 : 750), newY))
    });
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-gray-50">
      {/* Map Container */}
      <div className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <div ref={mapRef} className="w-full h-full" />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Đang tải bản đồ...</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Alerts */}
      {locationError && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[1001] bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-start gap-3 shadow-lg max-w-md">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1"><p className="text-sm font-medium text-red-800">{locationError}</p></div>
          <Button variant="ghost" size="sm" onClick={() => setLocationError(null)} className="text-red-500 hover:text-red-700 hover:bg-red-100 h-6 w-6 p-0">
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {eventsError && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-[1001] bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-start gap-3 shadow-lg max-w-md">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-red-800">{eventsError}</p>
        </motion.div>
      )}

      {/* Draggable Dialog */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        animate={{ scale: isDragging ? 1.02 : 1 }}
        className={`fixed z-[1000] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col w-[320px] max-w-[90vw] ${isMinimized ? 'h-[60px]' : 'h-[750px] max-h-[85vh] overflow-hidden'}`}
        style={{ left: `${dialogPosition.x}px`, top: `${dialogPosition.y}px` }}
      >
        <div className={`flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-move select-none ${isMinimized ? 'border-b-0' : ''}`}>
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-800">Tìm kiếm sự kiện</h4>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
        </div>

        {!isMinimized && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search Section */}
            <div className="p-4 border-b border-gray-200 bg-white">
              {locationType === "auto" ? (
                <div className="flex gap-2">
                  <Input value={userLocation?.address || "Vị trí hiện tại"} readOnly className="flex-1" />
                  <Button onClick={getUserLocation} disabled={loadingLocation} size="icon" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {loadingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Nhập địa chỉ..."
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchByAddress()}
                    disabled={loadingGeocode}
                    className="flex-1"
                  />
                  <Button onClick={handleSearchByAddress} disabled={loadingGeocode || !locationInput.trim()} size="icon" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {loadingGeocode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Button variant={locationType === "auto" ? "default" : "outline"} size="sm" onClick={() => { setLocationType("auto"); setLocationInput(""); setIsPickingOnMap(false); }} className="flex-1 text-xs">
                  <Navigation className="w-3 h-3 mr-1" /> Tự động
                </Button>
                <Button variant={locationType === "manual" ? "default" : "outline"} size="sm" onClick={() => { setLocationType("manual"); setUserLocation(null); setEvents([]); setIsPickingOnMap(false); }} className="flex-1 text-xs">
                  <MapPin className="w-3 h-3 mr-1" /> Nhập địa chỉ
                </Button>
              </div>

              <div className="mt-3">
                <Button
                  variant={isPickingOnMap ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setIsPickingOnMap(!isPickingOnMap)}
                  className={`w-full text-xs ${isPickingOnMap ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {isPickingOnMap ? "Đang chọn trên bản đồ... (Click để hủy)" : "Chọn vị trí trên bản đồ"}
                </Button>
                {isPickingOnMap && (
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    Nhấp vào bản đồ để chọn vị trí tìm kiếm (có thể thay đổi nhiều lần)
                  </p>
                )}
              </div>
            </div>

            {/* Filter Section */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radius className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Bán kính tìm kiếm</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">Bán kính</Label>
                  <div className="flex gap-2">
                    {[5, 10, 20, 30].map((km) => (
                      <Button key={km} variant={radius === km ? "default" : "outline"} size="sm" onClick={() => setRadius(km)}
                        className={`flex-1 text-xs ${radius === km ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}>
                        {km}km
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-gray-600" />
                      <Label className="text-xs font-medium text-gray-700">Chia sẻ vị trí</Label>
                    </div>
                    <Button variant={isLocationSharingEnabled ? "default" : "outline"} size="sm"
                      onClick={() => handleToggleLocationSharing(!isLocationSharingEnabled)}
                      disabled={togglingLocationSharing || !userLocation}
                      className={`text-xs ${isLocationSharingEnabled ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}`}>
                      {togglingLocationSharing ? <Loader2 className="w-3 h-3 animate-spin" /> : (isLocationSharingEnabled ? "Đang bật" : "Bật")}
                    </Button>
                  </div>
                  {friends.length > 0 && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                        <div className="p-1.5 bg-purple-100 rounded-lg">
                          <User className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <div className="text-xs font-semibold text-gray-800">
                          {friends.length} bạn bè trong bán kính {radius}km
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Event List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loadingEvents && (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Đang tải sự kiện...</p>
                </div>
              )}

              {!userLocation && !loadingEvents && (
                <div className="p-8 text-center">
                  <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Navigation className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Bắt đầu tìm kiếm</h3>
                  <p className="text-xs text-gray-600">Chọn vị trí để tìm sự kiện gần bạn</p>
                </div>
              )}

              {userLocation && events.length === 0 && !loadingEvents && (
                <div className="p-8 text-center">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Không tìm thấy sự kiện</h3>
                  <p className="text-xs text-gray-600">Không có sự kiện nào trong bán kính {radius}km</p>
                </div>
              )}

              <div className="p-4 space-y-3">
                {events.map((event, index) => (
                  <motion.div
                    key={event.eventId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      setSelectedEvent(event);
                      if (mapInstanceRef.current && event.latitude && event.longitude) {
                        mapInstanceRef.current.flyTo([event.latitude, event.longitude], 15);
                        const marker = markersRef.current.find((m, i) => events[i]?.eventId === event.eventId);
                        if (marker) marker.openPopup();
                      }
                    }}
                    className={`cursor-pointer bg-white rounded-lg border transition-all duration-200 hover:shadow-lg ${selectedEvent?.eventId === event.eventId ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex gap-3 p-3">
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                        <img src={event.image} alt={event.title} className="w-full h-full object-cover" onError={(e) => e.target.src = DEFAULT_EVENT_IMAGE} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">{event.title}</h3>
                        {event.distance !== null && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 mb-1">
                            <MapPin className="w-3 h-3" />
                            <span>{event.distance.toFixed(1)} km</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="line-clamp-1">{event.locationName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 mb-2">
                          {event.categoryName && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{event.categoryName}</span>}
                          <span className={`text-xs font-semibold ${event.ticketPrice === 0 ? 'text-green-600' : 'text-blue-600'}`}>
                            {event.ticketPrice === 0 ? 'Miễn phí' : `${(event.ticketPrice / 1000).toFixed(0)}k`}
                          </span>
                        </div>
                        <Button onClick={(e) => { e.stopPropagation(); handleEventClick(event); }} size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 mt-1">
                          <ExternalLink className="w-3 h-3 mr-1" /> Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Custom Styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        @keyframes pickPulse {
          0%, 100% { transform: rotate(-45deg) scale(1); box-shadow: 0 6px 24px rgba(249, 115, 22, 0.7); }
          50% { transform: rotate(-45deg) scale(1.2); box-shadow: 0 10px 36px rgba(249, 115, 22, 0.9); }
        }

        @keyframes userPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
          50% { transform: scale(1.15); box-shadow: 0 6px 20px rgba(16, 185, 129, 0.7); }
        }

        .leaflet-div-icon { background: transparent !important; border: none !important; }
      `}</style>
    </div>
  );
}

export default NearbyEventsPage;