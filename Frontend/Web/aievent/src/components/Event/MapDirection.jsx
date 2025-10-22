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
  const [routeInfo, setRouteInfo] = useState(null); // Add state for route information
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
      // Using the provided API key
      const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQ1ZWU0MWIyMWZhYzRlZjNiMjUzOTA5NjJmMTZkYTdmIiwiaCI6Im11cm11cjY0In0='; 
      
      // Direct API call without proxy for reverse geocoding (this usually works better)
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
        // For coordinates, we try to reverse geocode to get a readable address
        // If CORS prevents this, we'll use the coordinates as the address
        try {
          const readableAddress = await reverseGeocode(lat, lon);
          return { latitude: lat, longitude: lon, address: readableAddress };
        } catch (err) {
          // If reverse geocoding fails due to CORS, use coordinates as address
          return { latitude: lat, longitude: lon, address: `${lat}, ${lon}` };
        }
      }
      
      // Using the provided API key
      const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQ1ZWU0MWIyMWZhYzRlZjNiMjUzOTA5NjJmMTZkYTdmIiwiaCI6Im11cm11cjY0In0=';
      
      // Use a different approach for geocoding to avoid CORS issues
      // Try direct call first, fallback to proxy if needed
      try {
        const directResponse = await fetch(
          `https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(address)}&size=1`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            }
          }
        );
        
        if (directResponse.ok) {
          const data = await directResponse.json();
          if (data.features && data.features.length > 0) {
            const [longitude, latitude] = data.features[0].geometry.coordinates;
            return { latitude, longitude, address: data.features[0].properties.label };
          }
        }
      } catch (directError) {
        console.warn('Direct geocoding failed, trying with proxy:', directError);
        // Fallback to proxy if direct call fails
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const apiUrl = `https://api.openrouteservice.org/geocode/search?api_key=${API_KEY}&text=${encodeURIComponent(address)}&size=1`;
        
        const proxyResponse = await fetch(proxyUrl + apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            'Origin': 'http://localhost:5173' // Add origin header
          }
        });
        
        if (proxyResponse.ok) {
          const data = await proxyResponse.json();
          if (data.features && data.features.length > 0) {
            const [longitude, latitude] = data.features[0].geometry.coordinates;
            return { latitude, longitude, address: data.features[0].properties.label };
          }
        }
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
      // Using the provided API key
      const API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjQ1ZWU0MWIyMWZhYzRlZjNiMjUzOTA5NjJmMTZkYTdmIiwiaCI6Im11cm11cjY0In0=';
      
      // Try direct call first for directions
      try {
        const directResponse = await fetch(
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
              format: 'geojson',
              units: 'km',
              language: 'vi'
            })
          }
        );
        
        if (directResponse.ok) {
          const data = await directResponse.json();
          return data;
        }
      } catch (directError) {
        console.warn('Direct directions failed, trying with proxy:', directError);
        // Fallback to proxy if direct call fails
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        const apiUrl = 'https://api.openrouteservice.org/v2/directions/driving-car/geojson';
        
        const proxyResponse = await fetch(proxyUrl + apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            'Origin': 'http://localhost:5173' // Add origin header
          },
          body: JSON.stringify({
            coordinates: [
              [startCoords.longitude, startCoords.latitude],
              [endCoords.longitude, endCoords.latitude]
            ],
            format: 'geojson',
            units: 'km',
            language: 'vi'
          })
        });
        
        if (proxyResponse.ok) {
          const data = await proxyResponse.json();
          return data;
        }
      }
      
      throw new Error('Failed to get directions');
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
      
      // Clear route info
      setRouteInfo(null);
    } catch (err) {
      console.error('Error clearing map:', err);
    }
  };

  // Draw markers and route on map
  const drawOnMap = (startCoords, endCoords, routeData) => {
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
      if (routeData && routeData.features && routeData.features[0]) {
        const routeGeometry = routeData.features[0].geometry;
        const routeProperties = routeData.features[0].properties;
        
        polylineRef.current = L.polyline(routeGeometry.coordinates.map(coord => [coord[1], coord[0]]), {
          color: 'blue',
          weight: 5,
          opacity: 0.7
        }).addTo(mapInstanceRef.current);
        
        // Set route information (distance and duration)
        if (routeProperties && routeProperties.summary) {
          const summary = routeProperties.summary;

          let distanceInMeters = 0;
          let durationInSeconds = 0;

          if (summary.distance !== undefined && summary.distance !== null) {
            distanceInMeters = parseFloat(summary.distance) || 0;
          }
          
          if (summary.duration !== undefined && summary.duration !== null) {
            durationInSeconds = parseFloat(summary.duration) || 0;
          }

          // Convert to user-friendly units
          let distanceDisplay = 'N/A';
          let durationDisplay = 'N/A';
          
          // Ensure we're working with valid numbers
          if (!isNaN(distanceInMeters) && distanceInMeters > 0) {
            // Convert meters to kilometers and round to 1 decimal place
            distanceDisplay = (distanceInMeters).toFixed(2);
          } else {
            // Handle case where distance is exactly 0 or invalid
            distanceDisplay = '0.0';
          }
          
          // Ensure we're working with valid numbers
          if (!isNaN(durationInSeconds) && durationInSeconds > 0) {
            // Convert seconds to minutes and round
            durationDisplay = Math.round(durationInSeconds / 60);
          } else {
            // Handle case where duration is exactly 0 or invalid
            durationDisplay = '0';
          }
          
          
          setRouteInfo({
            distance: distanceDisplay,
            duration: durationDisplay,
            units: {
              distance: 'km',
              duration: 'phút'
            }
          });
        } else {
          // Fallback if summary is not available
          console.warn('Route summary not available in response');
          setRouteInfo({
            distance: 'N/A',
            duration: 'N/A',
            units: {
              distance: 'km',
              duration: 'phút'
            }
          });
        }
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
        directions
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

        {/* Display route information */}
        {routeInfo && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="font-medium text-blue-800">Thông tin tuyến đường</span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="bg-white rounded p-2 text-center">
                <p className="text-xs text-gray-500">Khoảng cách</p>
                <p className="font-bold text-blue-600">{routeInfo.distance} {routeInfo.units.distance}</p>
              </div>
              <div className="bg-white rounded p-2 text-center">
                <p className="text-xs text-gray-500">Thời gian</p>
                <p className="font-bold text-blue-600">{routeInfo.duration} {routeInfo.units.duration}</p>
              </div>
            </div>
          </div>
        )}

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