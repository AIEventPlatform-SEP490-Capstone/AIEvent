import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Heart,
  Navigation,
  Loader2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Ruler,
  DollarSign,
  GripVertical,
  Maximize2,
  Minimize2,
  Radius
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { eventAPI } from "../../api/eventAPI";
import { eventCategoryAPI } from "../../api/eventCategoryAPI";
import locationInfoIcon from "../../assets/location-info.png";
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Tính toán khoảng cách giữa hai điểm trên bề mặt trái đất (công thức Haversine)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
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
    MapPin: [
      'M20 10c0 4.418-8 12-8 12s-8-7.582-8-12a8 8 0 0 1 16 0Z',
      'M12 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z'
    ],
    Ruler: [
      'M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z',
      'M14.5 12.5l2-2',
      'M11.5 9.5l2-2',
      'M8.5 6.5l2-2',
      'M17.5 15.5l2-2'
    ],
    DollarSign: [
      'M12 2v20',
      'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'
    ]
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
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  const [events, setEvents] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [eventsError, setEventsError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [radius, setRadius] = useState(20); // Default radius 20km
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [locationInput, setLocationInput] = useState(""); // Input for manual address
  const [locationType, setLocationType] = useState("auto"); // "auto" or "manual"
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [showFilter, setShowFilter] = useState(true); // Toggle filter visibility
  const [dialogPosition, setDialogPosition] = useState({ x: 0, y: 80 }); // Dialog position - will be calculated on mount
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragRef = useRef(null);

  // Calculate default position on mount (right side)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const defaultX = window.innerWidth - 320 - 20;
      setDialogPosition({ x: defaultX, y: 80 });
    }
  }, []);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await eventCategoryAPI.getEventCategories(1, 100);

      // Handle different response structures
      let categoriesList = [];
      if (response?.data?.items) {
        categoriesList = response.data.items;
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesList = response.data;
      } else if (response?.items) {
        categoriesList = response.items;
      } else if (Array.isArray(response)) {
        categoriesList = response;
      }

      // Filter out any null/undefined categories and ensure we have valid structure
      categoriesList = categoriesList.filter(cat => cat && (cat.eventCategoryId || cat.id));
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Initialize map
  useEffect(() => {
    const initMap = () => {
      if (mapRef.current && !mapInstanceRef.current) {
        try {
          // Default center: Ho Chi Minh City
          const defaultCenter = [10.8231, 106.6297];

          mapInstanceRef.current = L.map(mapRef.current, {
            center: defaultCenter,
            zoom: 12,
            zoomControl: true
          });

          // Add OpenStreetMap tile layer
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
          }).addTo(mapInstanceRef.current);

          setMapReady(true);
          addEventMarkers();
        } catch (err) {
          console.error('Error initializing map:', err);
          setLocationError('Không thể khởi tạo bản đồ');
        }
      }
    };

    const timer = setTimeout(() => {
      initMap();
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          console.error('Error removing map:', err);
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add event markers to map
  const addEventMarkers = () => {
    if (!mapInstanceRef.current || !mapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(marker);
      }
    });
    markersRef.current = [];

    // Add markers for each event
    events.forEach((event) => {
      // Check if event has valid coordinates
      if (event.latitude !== null && event.latitude !== undefined &&
        event.longitude !== null && event.longitude !== undefined &&
        event.latitude !== 0 && event.longitude !== 0) {
        const markerId = `marker-${event.eventId}`;
        const customIcon = new L.Icon({
          iconUrl: locationInfoIcon,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
          className: 'event-marker',
        });

        // Thay đổi phần bindPopup trong hàm addEventMarkers
        const marker = L.marker([event.latitude, event.longitude], { icon: customIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div style="min-width: 220px; padding: 4px;">
              <h3 style="font-weight: 700; margin-bottom: 10px; font-size: 15px; color: #1f2937;">${event.title}</h3>
              <div style="margin-bottom: 8px;">
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                  <strong style="color: #374151;">${createIconSVGString('MapPin', 14, '#ef4444')} Địa điểm:</strong> ${event.locationName || 'N/A'}
                </p>
                ${event.distance !== null && event.distance !== undefined ? `
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                  <strong style="color: #374151;">${createIconSVGString('Ruler', 14, '#6b7280')} Khoảng cách:</strong> <span style="color: #3b82f6; font-weight: 600;">${event.distance.toFixed(1)} km</span>
                </p>
                ` : ''}
                <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                  <strong style="color: #374151;">${createIconSVGString('DollarSign', 14, '#f59e0b')} Giá:</strong> <span style="color: #10b981; font-weight: 600;">${event.ticketPrice === 0 ? 'Miễn phí' : event.ticketPrice.toLocaleString('vi-VN') + ' VND'}</span>
                </p>
              </div>
              <button onclick="window.navigateToEvent('${event.eventId}')" 
                style="
                  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                  color: white;
                  border: none;
                  padding: 8px 16px;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 13px;
                  font-weight: 600;
                  width: 100%;
                  transition: transform 0.2s;
                  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
                " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">Xem chi tiết</button>
            </div>
          `)
          .on('click', () => {
            setSelectedEvent(event);
          });
        markersRef.current.push(marker);
      }
    });

    // Fit map to show all markers (include user location if available)
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current);
      if (userMarkerRef.current) {
        group.addLayer(userMarkerRef.current);
      }
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.15));
    }
  };

  // Update markers when events change
  useEffect(() => {
    if (mapReady) {
      addEventMarkers();
    }
  }, [events, mapReady]);

  // Fetch events from API
  const fetchNearbyEvents = useCallback(async () => {
    if (!userLocation) {
      return; // Don't fetch if no user location
    }

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

      // Map API response to component format
      const mappedEvents = (response.items || []).map((event) => {
        // Check if latitude and longitude are valid (not null, not undefined, not 0)
        const hasValidCoords =
          event.latitude !== null &&
          event.latitude !== undefined &&
          event.latitude !== 0 &&
          event.longitude !== null &&
          event.longitude !== undefined &&
          event.longitude !== 0;

        // Calculate distance if coordinates are available
        let distance = null;
        if (hasValidCoords) {
          distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            event.latitude,
            event.longitude
          );
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
          distance: distance,
          ticketPrice: event.ticketPrice || 0,
          categoryName: event.eventCategoryName || "",
          image: event.imgListEvent && event.imgListEvent.length > 0
            ? event.imgListEvent[0]
            : DEFAULT_EVENT_IMAGE
        };
      }).filter(event => event.latitude !== null && event.longitude !== null)
        .sort((a, b) => {
          // Sort by distance if available, otherwise by title
          if (a.distance !== null && b.distance !== null) {
            return a.distance - b.distance;
          }
          return a.title.localeCompare(b.title);
        });

      setEvents(mappedEvents);
    } catch (error) {
      console.error('Error fetching nearby events:', error);
      setEventsError('Không thể tải danh sách sự kiện. Vui lòng thử lại.');
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [userLocation, radius, categoryId]);

  // Fetch events when user location or radius changes
  useEffect(() => {
    if (userLocation) {
      fetchNearbyEvents();
    }
  }, [userLocation, radius, fetchNearbyEvents]);

  // Add user location marker
  useEffect(() => {
    if (mapInstanceRef.current && userLocation) {
      // Remove existing user marker
      if (userMarkerRef.current) {
        mapInstanceRef.current.removeLayer(userMarkerRef.current);
      }

      // Add user location marker (different color)
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
          <div style="
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
          "></div>
          <style>
            @keyframes userPulse {
              0%, 100% {
                transform: scale(1);
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
              }
              50% {
                transform: scale(1.15);
                box-shadow: 0 6px 20px rgba(16, 185, 129, 0.7);
              }
            }
          </style>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b style="color: #059669;">${createIconSVGString('MapPin', 14, '#059669')} Vị trí của bạn</b>`)
        .openPopup();

      // Center map on user location
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 13);
    }
  }, [userLocation]);

  // Expose selectEvent to window for popup buttons
  useEffect(() => {
    window.selectEvent = (eventId) => {
      const event = events.find(e => e.eventId === eventId);
      if (event) {
        setSelectedEvent(event);
        // Scroll to event list
        const eventElement = document.getElementById(`event-${eventId}`);
        if (eventElement) {
          eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    window.navigateToEvent = (eventId) => {
      const event = events.find(e => e.eventId === eventId);
      if (event && event.eventId) {
        navigate(`/event/${event.eventId}`);
      }
    };

    return () => {
      delete window.selectEvent;
      delete window.navigateToEvent;
    };
  }, [events, navigate]);

  
  // Geocode address to coordinates using Nominatim (OpenStreetMap)
  const geocodeAddress = async (address) => {
    try {
      setLoadingGeocode(true);
      setLocationError(null);

      // Using Nominatim geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=vn`,
        {
          headers: {
            'User-Agent': 'AIEvent/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Không thể tìm thấy địa chỉ');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lon = parseFloat(result.lon);

        return {
          lat,
          lng: lon,
          address: result.display_name || address
        };
      } else {
        throw new Error('Không tìm thấy địa chỉ. Vui lòng thử lại với địa chỉ khác.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error(error.message || 'Không thể tìm thấy địa chỉ. Vui lòng thử lại.');
    } finally {
      setLoadingGeocode(false);
    }
  };

  // Handle manual address input
  const handleSearchByAddress = async () => {
    if (!locationInput.trim()) {
      setLocationError('Vui lòng nhập địa chỉ');
      return;
    }

    try {
      const location = await geocodeAddress(locationInput);
      setUserLocation(location);
      setEventsError(null);
      setEvents([]); // Clear previous events
    } catch (error) {
      setLocationError(error.message);
    }
  };

  // Lấy vị trí chính xác của người dùng từ geolocation của trình duyệt
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt của bạn không hỗ trợ định vị');
      return;
    }

    setLoadingLocation(true);
    setLocationError(null);
    setEventsError(null);
    setEvents([]); // Clear previous events

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLoadingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Không thể lấy vị trí của bạn. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Vui lòng cấp quyền truy cập vị trí.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Thông tin vị trí không khả dụng.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Yêu cầu vị trí hết thời gian chờ.';
            break;
          default:
            errorMessage += 'Vui lòng thử lại.';
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

  // Handle drag for dialog
  const handleDrag = (event, info) => {
    const newX = dialogPosition.x + info.delta.x;
    const newY = dialogPosition.y + info.delta.y;

    setDialogPosition({
      x: Math.max(0, Math.min((window.innerWidth || 1920) - 320, newX)),
      y: Math.max(0, Math.min((window.innerHeight || 1080) - (isMinimized ? 60 : 750), newY))
    });
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-gray-50">
      {/* Full Screen Map */}
      <div
        className="absolute inset-0 w-full h-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{
          zIndex: 0
        }}
      >
        <div
          ref={mapRef}
          className="w-full h-full"
        />
        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Đang tải bản đồ...</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {locationError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[1001] bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-start gap-3 shadow-lg max-w-md"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{locationError}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocationError(null)}
            className="text-red-500 hover:text-red-700 hover:bg-red-100 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}

      {eventsError && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[1001] bg-red-50 border-l-4 border-red-500 rounded-lg p-3 flex items-start gap-3 shadow-lg max-w-md"
        >
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
        dragConstraints={{
          left: 0,
          right: typeof window !== 'undefined' ? window.innerWidth - 320 : 0,
          top: 0,
          bottom: typeof window !== 'undefined' ? window.innerHeight - (isMinimized ? 60 : 750) : 0
        }}
        animate={{
          scale: isDragging ? 1.02 : 1
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 50
        }}
        className={`fixed z-[1000] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col ${isMinimized ? 'h-[60px] overflow-visible' : 'h-[750px] max-h-[85vh] overflow-hidden'
          } w-[320px] max-w-[90vw]`}
        style={{
          left: `${dialogPosition.x}px`,
          top: `${dialogPosition.y}px`
        }}
      >
        {/* Dialog Header - Draggable Handle - Always visible */}
        <div
          ref={dragRef}
          className={`flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200 cursor-move select-none ${isMinimized ? 'border-b-0' : ''
            }`}
          onMouseDown={(e) => setIsDragging(true)}
        >
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="w-4 h-4 text-gray-400" />
            <h4 className="text-sm font-semibold text-gray-800">Tìm kiếm sự kiện</h4>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(!isMinimized);
              }}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search Section */}
            <div className="p-4 border-b border-gray-200 bg-white">
              {locationType === "auto" ? (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={userLocation?.address || ""}
                    placeholder="Vị trí hiện tại"
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={getUserLocation}
                    disabled={loadingLocation}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loadingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nhập địa chỉ..."
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchByAddress();
                      }
                    }}
                    className="flex-1"
                    disabled={loadingGeocode}
                  />
                  <Button
                    onClick={handleSearchByAddress}
                    disabled={loadingGeocode || !locationInput.trim()}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loadingGeocode ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={locationType === "auto" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setLocationType("auto");
                    setLocationInput("");
                    setLocationError(null);
                  }}
                  className="flex-1 text-xs"
                >
                  <Navigation className="w-3 h-3 mr-1" />
                  Tự động
                </Button>
                <Button
                  type="button"
                  variant={locationType === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setLocationType("manual");
                    setUserLocation(null);
                    setEvents([]);
                    setLocationError(null);
                  }}
                  className="flex-1 text-xs"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  Nhập địa chỉ
                </Button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radius className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Bán kính tìm kiếm</h4>
                </div>
                {categoryId && (
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    1 selected
                  </span>
                )}
              </div>

              {categoryId && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    {categories.find(c => (c.eventCategoryId || c.id) === categoryId)?.eventCategoryName || categories.find(c => (c.eventCategoryId || c.id) === categoryId)?.name || 'Category'}
                    <button
                      onClick={() => setCategoryId("")}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <Label className="text-xs font-medium text-gray-700 mb-2 block">
                    Bán kính tìm kiếm
                  </Label>
                  <div className="flex gap-2">
                    {[5, 10, 20, 30].map((km) => (
                      <Button
                        key={km}
                        type="button"
                        variant={radius === km ? "default" : "outline"}
                        size="sm"
                        onClick={() => setRadius(km)}
                        className={`flex-1 text-xs ${radius === km
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "bg-white hover:bg-gray-50"
                          }`}
                      >
                        {km}km
                      </Button>
                    ))}
                  </div>
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
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Bắt đầu tìm kiếm
                  </h3>
                  <p className="text-xs text-gray-600">
                    Nhập địa chỉ hoặc lấy vị trí để tìm sự kiện
                  </p>
                </div>
              )}

              {userLocation && events.length === 0 && !loadingEvents && (
                <div className="p-8 text-center">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Không tìm thấy sự kiện
                  </h3>
                  <p className="text-xs text-gray-600">
                    Không có sự kiện nào trong bán kính {radius}km
                  </p>
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
                        const marker = markersRef.current.find(
                          (m, i) => events[i]?.eventId === event.eventId
                        );
                        if (marker) {
                          marker.openPopup();
                        }
                      }
                    }}
                    className={`cursor-pointer bg-white rounded-lg border transition-all duration-200 hover:shadow-lg ${selectedEvent?.eventId === event.eventId
                      ? 'border-blue-500 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex gap-3 p-3">
                      {/* Event Image */}
                      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = DEFAULT_EVENT_IMAGE;
                          }}
                        />
                      </div>

                      {/* Event Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                          {event.title}
                        </h3>

                        {event.distance !== null && event.distance !== undefined && (
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
                          {event.categoryName && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {event.categoryName}
                            </span>
                          )}
                          <span className={`text-xs font-semibold ${event.ticketPrice === 0 ? 'text-green-600' : 'text-blue-600'
                            }`}>
                            {event.ticketPrice === 0
                              ? 'Miễn phí'
                              : `${(event.ticketPrice / 1000).toFixed(0)}k`}
                          </span>
                        </div>

                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 mt-1"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Xem chi tiết
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
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Marker animations */
        @keyframes markerPulse {
          0%, 100% {
            transform: scale(1);
            filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.4));
          }
          50% {
            transform: scale(1.1);
            filter: drop-shadow(0 6px 20px rgba(59, 130, 246, 0.6));
          }
        }

        @keyframes userPulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          }
          50% {
            transform: scale(1.15);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.7);
          }
        }

        .leaflet-div-icon {
          background: transparent !important;
          border: none !important;
        }

        .event-marker img {
          animation: markerPulse 2s ease-in-out infinite;
          transition: transform 0.3s ease;
        }

        .event-marker:hover img {
          animation-play-state: paused !important;
          transform: scale(1.15) !important;
          filter: drop-shadow(0 8px 24px rgba(59, 130, 246, 0.8)) !important;
        }

        .user-marker div {
          animation: userPulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default NearbyEventsPage;
