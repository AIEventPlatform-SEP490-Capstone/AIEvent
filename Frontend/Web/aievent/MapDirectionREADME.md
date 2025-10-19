# MapDirection Component Usage Guide

## Overview
The MapDirection component provides map visualization and directions between two addresses using OpenRouteService API and Leaflet.

## Setup Instructions

### 1. Install Dependencies
The required dependencies should already be installed:
- leaflet (for map rendering)

### 2. Get OpenRouteService API Key
1. Visit [OpenRouteService Developer Portal](https://openrouteservice.org/dev/#/signup)
2. Sign up for a free account
3. Create a new API key
4. Copy your API key

### 3. Configure API Key
Replace `YOUR_OPENROUTESERVICE_API_KEY` in the MapDirection.jsx file with your actual API key:
```javascript
const API_KEY = 'your-actual-api-key-here';
```

## Component Usage

### Props
- `destinationAddress` (string, required): The destination address for directions

### Example Usage
```jsx
import MapDirection from './components/Event/MapDirection';

function App() {
  return (
    <MapDirection destinationAddress="123 Lê Lợi, Quận 1, TP.HCM" />
  );
}
```

## Features
- Address geocoding using OpenRouteService
- Interactive map with Leaflet and OpenStreetMap
- Route visualization with blue polyline
- Current location detection with reverse geocoding
- Support for both address input and coordinate input
- Responsive design (100% width, min-height 400px)

## Testing
1. Start your development server: `npm run dev`
2. Navigate to a physical event detail page
3. Click on the "Bản đồ & Chỉ đường" tab
4. Enter your address or use current location
5. Click "Tìm đường" to see directions

## Troubleshooting

### "Cannot read properties of undefined (reading 'appendChild')" Error
This error typically occurs due to:
- Map container not being ready when Leaflet tries to initialize
- Multiple map instances conflicting with each other
- DOM element not being properly referenced

Solutions:
1. Ensure you're using the latest version of the component
2. Refresh the page if the error occurs
3. Check that the map container div has a valid ref
4. Make sure you're not trying to initialize the map before the DOM is ready

### Geolocation Issues
- Make sure you're using HTTPS (required for geolocation in modern browsers)
- Check that you've granted location permissions to the site
- Some browsers block geolocation in insecure contexts

### Address Not Found Errors
- Ensure the address format is correct and specific
- Try using a more detailed address
- Coordinate format should be: "latitude, longitude" (e.g., "10.857118, 106.759132")

## Notes
- The free tier of OpenRouteService allows 1000 requests per day
- For production, consider storing the API key in environment variables
- The component handles errors gracefully and shows user-friendly messages
- Coordinates from geolocation are automatically reverse-geocoded to readable addresses
- The map initialization has been optimized to prevent DOM-related errors