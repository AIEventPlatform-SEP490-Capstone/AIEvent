import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, Loader2, Navigation, Check, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { smartReverseGeocode, smartSearchAddress } from '../../utils/geocoding';
import { toast } from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LocationMapPicker.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icon
const createCustomIcon = (color = '#3B82F6') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Default center: TP.HCM
const DEFAULT_CENTER = { lat: 10.7769, lng: 106.7009 };
const DEFAULT_ZOOM = 13;

const LocationMapPicker = ({
  open,
  onOpenChange,
  initialLocation = null,
  onLocationSelect,
  currentDistrict = '',
  currentAddress = '',
  currentLocationName = ''
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [addressInfo, setAddressInfo] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!open) return;
    
    // Clean up existing map if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    }

    // Wait for DOM to be ready with a small delay
    const initTimer = setTimeout(() => {
      if (!mapRef.current) return;

      // Create map instance
      const map = L.map(mapRef.current, {
        center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        attributionControl: true
      });

      // Add tile layer (OpenStreetMap)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      // Add click handler
      map.on('click', handleMapClick);

      mapInstanceRef.current = map;
      
      // Force map to recalculate size after render
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          setMapReady(true);
        }
      }, 100);

      // If initial location provided, set marker
      if (initialLocation && initialLocation.lat && initialLocation.lng) {
        setMarkerPosition(initialLocation.lat, initialLocation.lng);
        map.setView([initialLocation.lat, initialLocation.lng], 16);
      } else if (currentAddress || currentLocationName) {
        // Try to geocode current address
        searchCurrentAddress();
      }
    }, 50);

    return () => {
      clearTimeout(initTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        setMapReady(false);
      }
    };
  }, [open]);

  // Search current address on map
  const searchCurrentAddress = async () => {
    if (!currentAddress && !currentLocationName && !currentDistrict) return;
    
    setIsLoading(true);
    try {
      // Xây dựng query từ các thông tin có sẵn
      const queryParts = [currentAddress, currentLocationName, currentDistrict].filter(Boolean);
      const query = queryParts.join(', ');
      
      const result = await smartSearchAddress(query);
      if (result && mapInstanceRef.current) {
        setMarkerPosition(result.latitude, result.longitude);
        mapInstanceRef.current.setView([result.latitude, result.longitude], 16);
      }
    } catch (error) {
      console.error('Error geocoding current address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle map click
  const handleMapClick = useCallback(async (e) => {
    const { lat, lng } = e.latlng;
    setMarkerPosition(lat, lng);
    await reverseGeocodePosition(lat, lng);
  }, []);

  // Set marker position
  const setMarkerPosition = (lat, lng) => {
    if (!mapInstanceRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Create new marker
    const marker = L.marker([lat, lng], {
      icon: createCustomIcon('#3B82F6'),
      draggable: true
    }).addTo(mapInstanceRef.current);

    // Handle marker drag
    marker.on('dragend', async (e) => {
      const position = e.target.getLatLng();
      await reverseGeocodePosition(position.lat, position.lng);
    });

    markerRef.current = marker;
    setSelectedLocation({ lat, lng });
  };

  // Reverse geocode position
  const reverseGeocodePosition = async (lat, lng) => {
    setIsLoading(true);
    try {
      const result = await smartReverseGeocode(lat, lng);
      
      if (result) {
        setAddressInfo(result);
        setSelectedLocation({ lat, lng });
        
        // Update marker popup
        if (markerRef.current) {
          const popupContent = `
            <div style="min-width: 200px; padding: 8px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${result.district || 'Chưa xác định'}</div>
              <div style="font-size: 12px; color: #666;">${result.ward || ''}</div>
              <div style="font-size: 11px; color: #888; margin-top: 4px;">${result.address || ''}</div>
              <div style="font-size: 10px; color: ${result.confidence === 'high' ? '#22c55e' : result.confidence === 'medium' ? '#f59e0b' : '#ef4444'}; margin-top: 4px;">
                Độ tin cậy: ${result.confidence === 'high' ? 'Cao' : result.confidence === 'medium' ? 'Trung bình' : 'Thấp'}
              </div>
            </div>
          `;
          markerRef.current.bindPopup(popupContent).openPopup();
        }
      } else {
        setAddressInfo(null);
        toast.error('Không thể xác định địa chỉ tại vị trí này');
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      toast.error('Lỗi khi xác định địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // Sử dụng smartSearchAddress (Nominatim trước, fallback OpenCage)
      const result = await smartSearchAddress(searchQuery);
      
      if (result && mapInstanceRef.current) {
        setMarkerPosition(result.latitude, result.longitude);
        mapInstanceRef.current.setView([result.latitude, result.longitude], 16);
        await reverseGeocodePosition(result.latitude, result.longitude);
      } else {
        toast.error('Không tìm thấy địa chỉ. Thử nhập chi tiết hơn hoặc chọn trực tiếp trên bản đồ.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Lỗi khi tìm kiếm địa chỉ');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search on Enter
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ định vị');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapInstanceRef.current) {
          setMarkerPosition(latitude, longitude);
          mapInstanceRef.current.setView([latitude, longitude], 16);
          await reverseGeocodePosition(latitude, longitude);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Không thể lấy vị trí hiện tại');
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Build full address from components
  const buildFullAddress = (info) => {
    if (!info) return '';
    
    const parts = [];
    
    // Add house number and road first
    if (info.address) {
      parts.push(info.address);
    }
    
    // Add ward/suburb
    if (info.ward) {
      // Add "Phường" prefix if not already present
      const wardText = info.ward.toLowerCase().startsWith('phường') 
        ? info.ward 
        : `Phường ${info.ward}`;
      parts.push(wardText);
    }
    
    // Add district
    if (info.district) {
      parts.push(info.district);
    }
    
    // Add city
    parts.push('TP. Hồ Chí Minh');
    
    return parts.filter(Boolean).join(', ');
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (!selectedLocation || !addressInfo) {
      toast.error('Vui lòng chọn vị trí trên bản đồ');
      return;
    }

    // Build full address string
    const fullAddress = buildFullAddress(addressInfo);

    onLocationSelect({
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      district: addressInfo.district,
      ward: addressInfo.ward,
      address: fullAddress, // Return full address instead of just road/house_number
      shortAddress: addressInfo.address, // Keep original short address
      formattedAddress: addressInfo.formattedAddress,
      confidence: addressInfo.confidence
    });
    
    onOpenChange(false);
  };

  // Get confidence badge color
  const getConfidenceBadgeClass = (confidence) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Chọn vị trí trên bản đồ
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Nhấp vào bản đồ hoặc tìm kiếm để chọn vị trí tổ chức sự kiện
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="px-4 py-3 border-b bg-gray-50 flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10 h-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading} className="h-10">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Tìm'}
            </Button>
            <Button 
              variant="outline" 
              onClick={getCurrentLocation} 
              disabled={isLoading}
              className="h-10"
              title="Vị trí hiện tại"
            >
              <Navigation className="w-4 h-4" />
            </Button>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative min-h-[400px]" style={{ zIndex: 0 }}>
            <div 
              ref={mapRef} 
              className="absolute inset-0" 
              style={{ minHeight: '400px', width: '100%', height: '100%' }} 
            />
            
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[1000]">
                <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm">Đang xử lý...</span>
                </div>
              </div>
            )}

            {/* Instructions */}
            {!selectedLocation && mapReady && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 z-[1000]">
                <p className="text-sm text-gray-600">
                  Nhấp vào bản đồ để chọn vị trí hoặc tìm kiếm địa chỉ
                </p>
              </div>
            )}
          </div>

          {/* Selected Location Info */}
          {addressInfo && (
            <div className="px-4 py-3 border-t bg-white">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      {addressInfo.district || 'Chưa xác định quận/huyện'}
                    </span>
                    <Badge className={`text-xs ${getConfidenceBadgeClass(addressInfo.confidence)}`}>
                      {addressInfo.confidence === 'high' ? 'Độ tin cậy cao' : 
                       addressInfo.confidence === 'medium' ? 'Độ tin cậy TB' : 'Cần xác minh'}
                    </Badge>
                  </div>
                  {addressInfo.ward && (
                    <p className="text-sm text-muted-foreground">Phường: {addressInfo.ward}</p>
                  )}
                  {addressInfo.address && (
                    <p className="text-sm text-muted-foreground">{addressInfo.address}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Tọa độ: {selectedLocation?.lat.toFixed(6)}, {selectedLocation?.lng.toFixed(6)}
                  </p>
                  {addressInfo.confidence !== 'high' && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {addressInfo.reason}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedLocation || !addressInfo}
            className="gap-2"
          >
            <Check className="w-4 h-4" />
            Xác nhận vị trí
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationMapPicker;
