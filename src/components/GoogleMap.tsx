import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { MapPin } from 'lucide-react';

interface Property {
  id: string;
  address: string;
  estimatedDays: number;
  permitType: 'residential' | 'commercial';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  searchDate: string;
  // For map positioning
  lat?: number;
  lng?: number;
}

interface InteractiveMapProps {
  searchedLocation: { lat: number; lng: number } | null;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

// San Francisco center coordinates
const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194
};

// Mock geocoding function (in a real app, you would use Google's Geocoding API)
const mockGeocode = (address: string): { lat: number; lng: number } => {
  // Generate a random position near San Francisco
  const lat = defaultCenter.lat + (Math.random() - 0.5) * 0.05;
  const lng = defaultCenter.lng + (Math.random() - 0.5) * 0.05;
  return { lat, lng };
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({ searchedLocation }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [searchMarker, setSearchMarker] = useState<Property | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCHc60c2uiExWQsZgap0qPoJCLVkM37au8'
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const propertiesQuery = query(
          collection(db, 'properties'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(propertiesQuery);
        const propertiesList: Property[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Add geocoded coordinates if they don't exist
          let lat = data.lat;
          let lng = data.lng;
          
          if (!lat || !lng) {
            const coords = mockGeocode(data.address);
            lat = coords.lat;
            lng = coords.lng;
          }
          
          propertiesList.push({
            id: doc.id,
            address: data.address,
            estimatedDays: data.estimatedDays,
            permitType: data.permitType,
            confidence: data.confidence,
            riskLevel: data.riskLevel,
            searchDate: data.searchDate,
            lat,
            lng
          });
        });
        
        setProperties(propertiesList);
      } catch (error) {
        console.error("Error fetching properties for map: ", error);
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded) {
      fetchProperties();
    }
  }, [isLoaded]);

  // Handle searched location updates
  useEffect(() => {
    if (searchedLocation && mapInstance) {
      // Create a temporary marker for the searched location
      const newSearchMarker: Property = {
        id: 'search-marker',
        address: 'Searched Location',
        estimatedDays: 0,
        permitType: 'residential',
        confidence: 0,
        riskLevel: 'low',
        searchDate: new Date().toISOString().split('T')[0],
        lat: searchedLocation.lat,
        lng: searchedLocation.lng
      };
      
      setSearchMarker(newSearchMarker);
      
      // Center the map on the searched location
      mapInstance.panTo(searchedLocation);
      mapInstance.setZoom(15); // Zoom in closer
      
      // Select the marker to show info window
      setSelectedProperty(newSearchMarker);
    }
  }, [searchedLocation, mapInstance]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, []);

  const getMarkerIcon = (permitType: string, riskLevel: string, isSearchMarker: boolean = false) => {
    // Special styling for search marker
    if (isSearchMarker) {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#ef4444', // Red color for search marker
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff',
        scale: 12
      };
    }
    
    // Base color based on permit type
    let fillColor = permitType === 'residential' ? '#7c3aed' : '#3b82f6';
    
    // Adjust opacity based on risk level
    let opacity = 1;
    switch (riskLevel) {
      case 'low':
        opacity = 0.7;
        break;
      case 'medium':
        opacity = 0.85;
        break;
      case 'high':
        opacity = 1;
        break;
    }
    
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor,
      fillOpacity: opacity,
      strokeWeight: 2,
      strokeColor: '#ffffff',
      scale: 10
    };
  };

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: [
            {
              featureType: 'all',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }]
            },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#c9c9c9' }]
            },
            {
              featureType: 'water',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#9e9e9e' }]
            }
          ],
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true
        }}
      >
        {/* Regular property markers */}
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={{ lat: property.lat!, lng: property.lng! }}
            onClick={() => setSelectedProperty(property)}
            icon={getMarkerIcon(property.permitType, property.riskLevel)}
            animation={google.maps.Animation.DROP}
          />
        ))}

        {/* Search marker */}
        {searchMarker && (
          <Marker
            key="search-marker"
            position={{ lat: searchMarker.lat!, lng: searchMarker.lng! }}
            onClick={() => setSelectedProperty(searchMarker)}
            icon={getMarkerIcon('residential', 'low', true)}
            animation={google.maps.Animation.BOUNCE}
            zIndex={1000} // Ensure it's on top of other markers
          />
        )}

        {selectedProperty && (
          <InfoWindow
            position={{ lat: selectedProperty.lat!, lng: selectedProperty.lng! }}
            onCloseClick={() => setSelectedProperty(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-medium text-gray-800 mb-1">
                {selectedProperty.id === 'search-marker' ? 'Searched Location' : selectedProperty.address}
              </h3>
              {selectedProperty.id !== 'search-marker' && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Permit Type: <span className="capitalize">{selectedProperty.permitType}</span></p>
                  <p>Processing Time: {selectedProperty.estimatedDays} days</p>
                  <p>Risk Level: <span className="capitalize">{selectedProperty.riskLevel}</span></p>
                 <p>Confidence: {selectedProperty.confidence}%</p>
                </div>
              )}
              {selectedProperty.id === 'search-marker' && (
                <div className="text-sm text-gray-600">
                  <p className="text-red-500 font-medium">Current search result</p>
                  <p className="text-xs mt-1">Save this property to add it to your collection</p>
                </div>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md">
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
            <span>Residential</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            <span>Commercial</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
            <span>Search</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;