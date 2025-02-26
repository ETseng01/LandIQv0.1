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

const InteractiveMap: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

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
          // Add geocoded coordinates
          const { lat, lng } = mockGeocode(data.address);
          
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

  const onLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, []);

  const getMarkerIcon = (permitType: string, riskLevel: string) => {
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
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={{ lat: property.lat!, lng: property.lng !}}
            onClick={() => setSelectedProperty(property)}
            icon={getMarkerIcon(property.permitType, property.riskLevel)}
            animation={google.maps.Animation.DROP}
          />
        ))}

        {selectedProperty && (
          <InfoWindow
            position={{ lat: selectedProperty.lat!, lng: selectedProperty.lng! }}
            onCloseClick={() => setSelectedProperty(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-medium text-gray-800 mb-1">{selectedProperty.address}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Permit Type: <span className="capitalize">{selectedProperty.permitType}</span></p>
                <p>Processing Time: {selectedProperty.estimatedDays} days</p>
                <p>Risk Level: <span className="capitalize">{selectedProperty.riskLevel}</span></p>
                <p>Confidence: {selectedProperty.confidence}%</p>
              </div>
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
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;