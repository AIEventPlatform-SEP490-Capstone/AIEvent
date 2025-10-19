import React, { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapDirection = ({ destinationAddress }) => {
  const [userAddress, setUserAddress] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  // Initialize map
  useEffect(() => {
    let isMounted = true;
    
    const initMap = () => {
      if (mapRef.current && !mapInstanceRef.current && isMounted) {
        try {
          // Clean up any existing map instance
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
          
          mapInstanceRef.current = L.map(mapRef.current, {
            center: [10.762622, 106.660172],
            zoom: 13,
            zoomControl: true
          });
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
          }).addTo(mapInstanceRef.current);
        } catch (err) {
          console.error('Error initializing map:', err);
          setError('Không thể khởi tạo bản đồ');
        }
      }
    };

    // Initialize map after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      initMap();
    }, 100);

    return () => {
      isMounted = false;
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

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (lat, lon) => {
    try {
      // TODO: Replace with your OpenRouteService API key
      const API_KEY = 'YOUR_OPENROUTESERVICE_API_KEY'; // Get from https://openrouteservice.org/dev/#/signup
      const response = await fetch(
        `https://api.openrouteservice.org/geocode/reverse?api_key=${API_KEY}&point.lon=${lon}&point.lat=${lat}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to reverse geocode coordinates');
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        return data.features[0].properties.label;
      }
      
      // Fallback to coordinates if reverse geocoding fails
      return `${lat}, ${lon}`;
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      // Fallback to coordinates if reverse geocoding fails
      return `${lat}, ${lon}`;
    }
  };

  // Get coordinates from address using OpenRouteService Geocoding API
  const geocodeAddress = async (address) => {
    try {
      // Check if the address is already in coordinate format
      const coordinateRegex = /^[-+]?(?:[1-8]?\d(?:\.\d+)?|90(?:\.0+)?),\s*[-+]?(?:180(?:\.0+)?|(?:(?:1[0-7]\d)|(?:[1-9]?\d))(?:\.\d+)?)$/;
      if (coordinateRegex.test(address)) {
        const [lat, lon] = address.split(',').map(coord => parseFloat(coord.trim()));
        // For coordinates, we reverse geocode to get a readable address
        const readableAddress = await reverseGeocode(lat, lon);
        return { latitude: lat, longitude: lon, address: readableAddress };
      }
      
      // TODO: Replace with your OpenRouteService API key
      const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQ1ZWU0MWIyMWZhYzRlZjNiMjUzOTA5NjJmMTZkYTdmIiwiaCI6Im11cm11cjY0In0='; // Get from https://openrouteservice.org/dev/#/signup
      const response = await fetch(
        `https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(address)}&size=1`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }
      
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].geometry.coordinates;
        return { latitude, longitude, address: data.features[0].properties.label };
      }
      
      throw new Error('Address not found');
    } catch (err) {
      console.error('Geocoding error:', err);
      throw new Error(`Không thể tìm thấy địa chỉ: ${address}`);
    }
  };

  // Get directions between two points using OpenRouteService Directions API
  const getDirections = async (startCoords, endCoords) => {
    try {
      // TODO: Replace with your OpenRouteService API key
      const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQ1ZWU0MWIyMWZhYzRlZjNiMjUzOTA5NjJmMTZkYTdmIiwiaCI6Im11cm11cjY0In0='; // Get from https://openrouteservice.org/dev/#/signup
      const response = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          method: 'POST',
          headers: {
            'Authorization': API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          },
          body: JSON.stringify({
            coordinates: [
              [startCoords.longitude, startCoords.latitude],
              [endCoords.longitude, endCoords.latitude]
            ],
            format: 'geojson'
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get directions');
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Directions error:', err);
      throw new Error('Không thể tìm đường đi');
    }
  };

  // Clear previous markers and route
  const clearMap = () => {
    try {
      // Remove previous markers
      markersRef.current.forEach(marker => {
        if (mapInstanceRef.current && marker) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      markersRef.current = [];

      // Remove previous route
      if (polylineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(polylineRef.current);
        polylineRef.current = null;
      }
    } catch (err) {
      console.error('Error clearing map:', err);
    }
  };

  // Draw markers and route on map
  const drawOnMap = (startCoords, endCoords, routeGeometry) => {
    if (!mapInstanceRef.current) {
      setError('Bản đồ chưa được khởi tạo');
      return;
    }

    try {
      clearMap();

      // Add start marker
      const startMarker = L.marker([startCoords.latitude, startCoords.longitude])
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>Vị trí của bạn</b><br>${startCoords.address}`)
        .openPopup();
      markersRef.current.push(startMarker);

      // Add end marker
      const endMarker = L.marker([endCoords.latitude, endCoords.longitude])
        .addTo(mapInstanceRef.current)
        .bindPopup(`<b>Địa điểm sự kiện</b><br>${endCoords.address}`);
      markersRef.current.push(endMarker);

      // Draw route
      if (routeGeometry) {
        polylineRef.current = L.polyline(routeGeometry.coordinates.map(coord => [coord[1], coord[0]]), {
          color: 'blue',
          weight: 5,
          opacity: 0.7
        }).addTo(mapInstanceRef.current);
      }

      // Fit map to bounds
      const group = new L.featureGroup([startMarker, endMarker]);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.5));
    } catch (err) {
      console.error('Error drawing on map:', err);
      setError('Không thể vẽ đường đi trên bản đồ');
    }
  };

  // Handle finding directions
  const handleFindDirections = async () => {
    if (!destinationAddress) {
      setError('Địa điểm sự kiện không hợp lệ');
      return;
    }

    if (!mapInstanceRef.current) {
      setError('Bản đồ chưa được khởi tạo, vui lòng thử lại');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let startAddress = userAddress;
      
      // If using current location, get coordinates from browser
      if (useCurrentLocation) {
        if (!navigator.geolocation) {
          throw new Error('Trình duyệt không hỗ trợ định vị');
        }
        
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true
          });
        });
        
        // For coordinates from geolocation, we reverse geocode to get a readable address
        const readableAddress = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        startAddress = `${position.coords.latitude}, ${position.coords.longitude}`;
      } else if (!userAddress.trim()) {
        throw new Error('Vui lòng nhập địa chỉ của bạn');
      }

      // Geocode both addresses
      const startCoords = await geocodeAddress(startAddress);
      const endCoords = await geocodeAddress(destinationAddress);

      // Get directions
      const directions = await getDirections(startCoords, endCoords);

      // Draw on map
      drawOnMap(
        startCoords, 
        endCoords, 
        directions.features[0].geometry
      );
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tìm đường đi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useCurrentLocation"
            checked={useCurrentLocation}
            onChange={(e) => setUseCurrentLocation(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="useCurrentLocation" className="text-sm font-medium text-gray-700">
            Sử dụng vị trí hiện tại
          </label>
        </div>

        {!useCurrentLocation && (
          <div>
            <label htmlFor="userAddress" className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ của bạn
            </label>
            <input
              type="text"
              id="userAddress"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="Nhập địa chỉ của bạn"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
        )}

        <button
          onClick={handleFindDirections}
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {loading ? 'Đang tìm đường...' : 'Tìm đường'}
        </button>

        {error && (
          <div className="text-red-500 text-sm py-2">
            {error}
          </div>
        )}
      </div>

      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border border-gray-300"
        style={{ minHeight: '400px' }}
      />
      
      <div className="mt-3 text-xs text-gray-500">
        <p><strong>Hướng dẫn:</strong> Để sử dụng bản đồ:</p>
        <ol className="list-decimal list-inside space-y-1 mt-1">
          <li>Nhập địa chỉ của bạn hoặc chọn "Sử dụng vị trí hiện tại"</li>
          <li>Nhấn "Tìm đường" để xem hướng dẫn đường đi</li>
          <li>Click vào marker để xem thông tin địa điểm</li>
        </ol>
      </div>
    </div>
  );
};

export default MapDirection;