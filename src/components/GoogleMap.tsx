import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, StreetViewPanorama } from '@react-google-maps/api';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { MapPin } from 'lucide-react';
import { PermitOverlayControls, PermitLegend } from './PermitOverlay';

interface Property {
  id: string;
  address: string;
  estimatedDays: number;
  permitType: 'residential' | 'commercial';
  confidence: number;
  riskLevel: 'low' | 'high';
  searchDate: string;
  lat?: number;
  lng?: number;
}

interface InteractiveMapProps {
  searchedLocation: { lat: number; lng: number } | null;
  resetMap?: () => void;
}

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194
};

const defaultBounds = {
  north: 37.81,
  south: 37.74,
  east: -122.35,
  west: -122.48
};

const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
  const R = 6371e3;
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

const checkOverlap = (
  position: { lat: number; lng: number },
  radius: number,
  existingCircles: Array<{ position: { lat: number; lng: number }; radius: number }>
): boolean => {
  for (const circle of existingCircles) {
    const distance = calculateDistance(position, circle.position);
    if (distance < (radius + circle.radius + 50)) {
      return true;
    }
  }
  return false;
};

const findNonOverlappingPosition = (
  basePosition: { lat: number; lng: number },
  radius: number,
  existingCircles: Array<{ position: { lat: number; lng: number }; radius: number }>,
  attempts: number = 8
): { lat: number; lng: number } => {
  if (!checkOverlap(basePosition, radius, existingCircles)) {
    return basePosition;
  }

  const angleStep = (2 * Math.PI) / attempts;
  const distanceStep = radius * 2.2;

  for (let ring = 1; ring <= 3; ring++) {
    const currentDistance = distanceStep * ring;
    
    for (let i = 0; i < attempts; i++) {
      const angle = angleStep * i;
      const latOffset = (currentDistance / 111111) * Math.cos(angle);
      const lngOffset = (currentDistance / (111111 * Math.cos(basePosition.lat * Math.PI / 180))) * Math.sin(angle);
      
      const newPosition = {
        lat: basePosition.lat + latOffset,
        lng: basePosition.lng + lngOffset
      };

      if (!checkOverlap(newPosition, radius, existingCircles)) {
        return newPosition;
      }
    }
  }

  return basePosition;
};

const getPermitOverlay = (
  property: Property,
  existingCircles: Array<{ position: { lat: number; lng: number }; radius: number }>,
  permitType: string
) => {
  // Determine if the property should be shown based on restriction level
  const shouldShow = permitType === 'all' || 
    (permitType === 'less' && property.riskLevel === 'low') ||
    (permitType === 'more' && property.riskLevel === 'high');

  if (!shouldShow) {
    return null;
  }

  // Set color based on risk level (only green for low and red for high)
  const color = property.riskLevel === 'low' ? '#15803d' : '#ef4444';
  const opacity = 0.6;
  const baseRadius = 150;
  
  const basePosition = {
    lat: property.lat!,
    lng: property.lng!
  };

  const position = findNonOverlappingPosition(basePosition, baseRadius, existingCircles);

  return { 
    color, 
    opacity, 
    radius: baseRadius,
    position
  };
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({ searchedLocation, resetMap }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [searchMarker, setSearchMarker] = useState<Property | null>(null);
  const [showStreetView, setShowStreetView] = useState(false);
  const [propertyCircles, setPropertyCircles] = useState<google.maps.Circle[]>([]);
  
  const [opacity, setOpacity] = useState(0.7);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [showComparison, setShowComparison] = useState(false);
  const [permitType, setPermitType] = useState('all');

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCHc60c2uiExWQsZgap0qPoJCLVkM37au8'
  });

  const normalizeAddress = (address: string): string => {
    return address
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/,\s*/g, ',')
      .trim();
  };

  useEffect(() => {
    return () => {
      propertyCircles.forEach(circle => circle.setMap(null));
    };
  }, [propertyCircles]);

  const fetchProperties = useCallback(async () => {
    try {
      const propertiesQuery = query(
        collection(db, 'properties'),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(propertiesQuery);
      const propertiesList: Property[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        propertiesList.push({
          id: doc.id,
          address: data.address,
          estimatedDays: data.estimatedDays,
          permitType: data.permitType,
          confidence: data.confidence,
          riskLevel: data.riskLevel,
          searchDate: data.searchDate,
          lat: data.lat,
          lng: data.lng
        });
      });
      
      setProperties(propertiesList);
    } catch (error) {
      console.error("Error fetching properties for map: ", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      fetchProperties();
    }
  }, [isLoaded, fetchProperties]);

  useEffect(() => {
    if (!mapInstance || !properties.length) return;

    propertyCircles.forEach(circle => circle.setMap(null));
    const newCircles: google.maps.Circle[] = [];
    const existingCirclePositions: Array<{ position: { lat: number; lng: number }; radius: number }> = [];

    properties.forEach((property) => {
      if (property.lat && property.lng) {
        const overlay = getPermitOverlay(property, existingCirclePositions, permitType);
        if (overlay) {
          const { color, opacity: circleOpacity, radius, position } = overlay;
          
          const circle = new google.maps.Circle({
            center: position,
            radius: radius,
            fillColor: color,
            fillOpacity: circleOpacity * opacity,
            strokeColor: color,
            strokeOpacity: (circleOpacity + 0.2) * opacity,
            strokeWeight: 3,
            map: mapInstance,
            clickable: true,
            zIndex: 1
          });

          circle.addListener('click', () => {
            setSelectedProperty(property);
            setShowStreetView(false);
          });

          existingCirclePositions.push({ position, radius });
          newCircles.push(circle);
        }
      }
    });

    setPropertyCircles(newCircles);
  }, [mapInstance, properties, permitType, opacity]);

  const resetMapView = useCallback(() => {
    if (mapInstance) {
      mapInstance.fitBounds(defaultBounds);
      setSelectedProperty(null);
      setShowStreetView(false);
      setSearchMarker(null);
      if (resetMap) {
        resetMap();
      }
      fetchProperties();
    }
  }, [mapInstance, resetMap, fetchProperties]);

  useEffect(() => {
    if (searchedLocation && mapInstance) {
      const matchedProperty = properties.find(
        property => property.lat === searchedLocation.lat && property.lng === searchedLocation.lng
      );

      const newSearchMarker: Property = matchedProperty || {
        id: 'search-marker',
        address: 'Searched Location',
        estimatedDays: 45,
        permitType: 'residential',
        confidence: 85,
        riskLevel: 'low',
        searchDate: new Date().toISOString().split('T')[0],
        lat: searchedLocation.lat,
        lng: searchedLocation.lng
      };
      
      setSearchMarker(newSearchMarker);
      setSelectedProperty(newSearchMarker);
      mapInstance.panTo(searchedLocation);
      mapInstance.setZoom(14);

      propertyCircles.forEach(circle => circle.setMap(null));
      
      const searchCircle = new google.maps.Circle({
        center: searchedLocation,
        radius: 150,
        fillColor: matchedProperty ? '#15803d' : '#ef4444',
        fillOpacity: 0.6,
        strokeColor: matchedProperty ? '#15803d' : '#ef4444',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: mapInstance,
        zIndex: 1000,
        clickable: true
      });

      searchCircle.addListener('click', () => {
        setSelectedProperty(newSearchMarker);
        setShowStreetView(false);
      });

      setPropertyCircles([searchCircle]);
    }
  }, [searchedLocation, mapInstance, properties]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
    map.fitBounds(defaultBounds);
  }, []);

  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, []);

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-800"></div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={resetMapView}
          className="bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-sm font-medium text-gray-700 flex items-center space-x-2"
        >
          <MapPin className="h-4 w-4" />
          <span>Show All Properties</span>
        </button>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: true,
          rotateControl: false,
          fullscreenControl: true
        }}
      >
        {selectedProperty && !showStreetView && (
          <InfoWindow
            position={{ lat: selectedProperty.lat!, lng: selectedProperty.lng! }}
            onCloseClick={() => setSelectedProperty(null)}
            options={{
              pixelOffset: new window.google.maps.Size(0, -5),
              maxWidth: 320
            }}
          >
            <div className="p-4 min-w-[280px]">
              <h3 className="font-medium text-gray-800 mb-3">
                {selectedProperty.id === 'search-marker' ? 'Searched Location' : selectedProperty.address}
              </h3>
              {selectedProperty.id !== 'search-marker' && (
                <>
                  <div className="text-sm text-gray-600 space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span>Permit Type:</span>
                      <span className="font-medium capitalize">{selectedProperty.permitType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Processing Time:</span>
                      <span className="font-medium">{selectedProperty.estimatedDays} days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Risk Level:</span>
                      <span className="font-medium capitalize">{selectedProperty.riskLevel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Land Confidence:</span>
                      <span className="font-medium">{selectedProperty.confidence}%</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowStreetView(true)}
                    className="w-full bg-emerald-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-900 transition-colors"
                  >
                    View Street View
                  </button>
                </>
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

        {selectedProperty && showStreetView && (
          <StreetViewPanorama
            position={{ lat: selectedProperty.lat!, lng: selectedProperty.lng! }}
            visible={true}
            onCloseClick={() => setShowStreetView(false)}
          />
        )}
      </GoogleMap>

      {!showStreetView && (
        <>
          <PermitOverlayControls
            opacity={opacity}
            setOpacity={setOpacity}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            showComparison={showComparison}
            setShowComparison={setShowComparison}
            permitType={permitType}
            setPermitType={setPermitType}
          />

          <PermitLegend />
        </>
      )}

      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-800"></div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;