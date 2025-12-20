import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

const LeafletMapView = ({
    userLocation,
    events = [],
    radius = 10,
    selectedEvent,
    onMarkerPress,
    onMapPress,
    style,
}) => {
    const webViewRef = useRef(null);
    const [mapReady, setMapReady] = useState(false);

    // Generate HTML with Leaflet
    const generateHTML = () => {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { height: 100%; width: 100%; overflow: hidden; }
        #map { height: 100vh; width: 100vw; }
        
        /* Custom Marker Styles */
        .custom-marker {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transform: rotate(-45deg);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .custom-marker:hover {
            transform: rotate(-45deg) scale(1.15);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }
        
        .custom-marker.selected {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            transform: rotate(-45deg) scale(1.2);
            box-shadow: 0 8px 24px rgba(245, 87, 108, 0.5);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { box-shadow: 0 8px 24px rgba(245, 87, 108, 0.5); }
            50% { box-shadow: 0 8px 32px rgba(245, 87, 108, 0.8); }
        }
        
        .marker-emoji {
            font-size: 20px;
            transform: rotate(45deg);
            user-select: none;
        }
        
        .user-marker {
            background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
            width: 24px;
            height: 24px;
            position: relative;
            animation: userPulse 2s infinite;
        }
        
        @keyframes userPulse {
            0%, 100% { 
                box-shadow: 0 4px 16px rgba(59, 130, 246, 0.5);
                transform: scale(1);
            }
            50% { 
                box-shadow: 0 4px 24px rgba(59, 130, 246, 0.8);
                transform: scale(1.1);
            }
        }
        
        .user-marker::before {
            content: '';
            position: absolute;
            width: 100%;
            height: 100%;
            border: 2px solid #3B82F6;
            border-radius: 50%;
            opacity: 0.4;
            animation: ripple 2s infinite;
        }
        
        @keyframes ripple {
            0% {
                transform: scale(1);
                opacity: 0.4;
            }
            100% {
                transform: scale(2.5);
                opacity: 0;
            }
        }
        
        /* Radius Circle */
        .radius-circle {
            stroke: rgba(59, 130, 246, 0.5);
            stroke-width: 2;
            fill: rgba(59, 130, 246, 0.1);
        }
        
        /* Leaflet Control Styles */
        .leaflet-control-zoom {
            border: none !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
        }
        
        .leaflet-control-zoom a {
            background: white !important;
            color: #374151 !important;
            border: none !important;
            font-size: 18px !important;
            font-weight: bold !important;
            transition: all 0.2s !important;
        }
        
        .leaflet-control-zoom a:hover {
            background: #F3F4F6 !important;
            color: #3B82F6 !important;
        }
        
        .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        // Initialize map
        const map = L.map('map', {
            zoomControl: true,
            attributionControl: false,
            minZoom: 3,
            maxZoom: 19,
        }).setView([21.0285, 105.8542], 13);

        // Add OpenStreetMap tiles with retina support
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            detectRetina: true,
        }).addTo(map);

        // Store markers and circles
        let userMarker = null;
        let radiusCircle = null;
        let eventMarkers = [];
        let selectedMarkerId = null;

        // Map click handler
        map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapPress'
            }));
        });

        // Update user location
        function updateUserLocation(lat, lng) {
            if (userMarker) {
                userMarker.setLatLng([lat, lng]);
            } else {
                const userIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: '<div class="user-marker"></div>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 12],
                });
                userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
            }
            map.setView([lat, lng], map.getZoom());
        }

        // Update radius circle
        function updateRadius(lat, lng, radiusKm) {
            if (radiusCircle) {
                map.removeLayer(radiusCircle);
            }
            radiusCircle = L.circle([lat, lng], {
                radius: radiusKm * 1000,
                className: 'radius-circle',
                interactive: false,
            }).addTo(map);
        }

        // Update event markers
        function updateEventMarkers(eventsData, selectedId) {
            // Remove existing markers
            eventMarkers.forEach(marker => map.removeLayer(marker));
            eventMarkers = [];
            selectedMarkerId = selectedId;

            // Add new markers
            eventsData.forEach(event => {
                const isSelected = selectedId === event.eventId;
                const emoji = event.ticketPrice === 0 ? '🎉' : '🎫';
                
                const markerHtml = \`
                    <div class="custom-marker \${isSelected ? 'selected' : ''}">
                        <div class="marker-emoji">\${emoji}</div>
                    </div>
                \`;

                const eventIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: markerHtml,
                    iconSize: [40, 40],
                    iconAnchor: [12, 36],
                });

                const marker = L.marker([event.latitude, event.longitude], { 
                    icon: eventIcon,
                    eventId: event.eventId,
                }).addTo(map);

                marker.on('click', function() {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'markerPress',
                        eventId: event.eventId,
                    }));
                });

                eventMarkers.push(marker);
            });
        }

        // Animate to location
        function animateToLocation(lat, lng, zoom) {
            map.flyTo([lat, lng], zoom || map.getZoom(), {
                duration: 0.5,
                easeLinearity: 0.25,
            });
        }

        // Notify React Native that map is ready
        setTimeout(() => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'mapReady'
            }));
        }, 500);
    </script>
</body>
</html>
        `;
    };

    // Update map when props change
    useEffect(() => {
        if (!mapReady || !webViewRef.current || !userLocation) return;

        const command = `
            updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});
            updateRadius(${userLocation.latitude}, ${userLocation.longitude}, ${radius});
        `;
        webViewRef.current.injectJavaScript(command);
    }, [mapReady, userLocation, radius]);

    // Update event markers
    useEffect(() => {
        if (!mapReady || !webViewRef.current) return;

        const eventsJson = JSON.stringify(events);
        const selectedId = selectedEvent?.eventId || null;
        const command = `updateEventMarkers(${eventsJson}, ${selectedId ? `"${selectedId}"` : 'null'});`;

        webViewRef.current.injectJavaScript(command);
    }, [mapReady, events, selectedEvent]);

    // Handle messages from WebView
    const handleMessage = (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            switch (data.type) {
                case 'mapReady':
                    setMapReady(true);
                    break;
                case 'markerPress':
                    const event = events.find(e => e.eventId === data.eventId);
                    if (event && onMarkerPress) {
                        onMarkerPress(event);
                    }
                    break;
                case 'mapPress':
                    if (onMapPress) {
                        onMapPress();
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling map message:', error);
        }
    };

    // Animate to location (exposed method)
    useEffect(() => {
        if (mapReady && webViewRef.current && userLocation) {
            const command = `animateToLocation(${userLocation.latitude}, ${userLocation.longitude}, 15);`;
            webViewRef.current.injectJavaScript(command);
        }
    }, [mapReady, userLocation]);

    return (
        <View style={[styles.container, style]}>
            <WebView
                ref={webViewRef}
                source={{ html: generateHTML() }}
                style={styles.webview}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                    </View>
                )}
                scalesPageToFit={false}
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
});

export default LeafletMapView;
