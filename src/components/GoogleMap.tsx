import React, { useState, useCallback, useEffect } from 'react';
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
  riskLevel: 'low' | 'medium' | 'high';
  searchDate: string;
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

// Generate mock regulatory data
const generateMockRegulations = () => {
  const regulations = [];
  for (let i = 0; i < 10; i++) {
    const lat = defaultCenter.lat + (Math.random() - 0.5) * 0.1;
    const lng = defaultCenter.lng + (Math.random() - 0.5) * 0.1;
    regulations.push({
      id: `region-${i}`,
      center: { lat, lng },
      radius: Math.random() * 1000 + 500,
      restrictiveness: Math.random(),
      permitTypes: ['residential', 'commercial', 'industrial'],
      yearData: {
        2020: Math.random(),
        2021: Math.random(),
        2022: Math.random(),
        2023: Math.random(),
        2024: Math.random(),
      }
    });
  }
  return regulations;
};

// Sample architectural photos for demo
const getArchitecturalPhotos = (permitType: string) => {
  if (permitType === 'residential') {
    return [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&h=300',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&h=300',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=400&h=300'
    ];
  } else {
    return [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=400&h=300',
      'https://images.unsplash.com/photo-1577985043696-8bd54d9f093f?auto=format&fit=crop&w=400&h=300',
      'https://images.unsplash.com/photo-1554435493-93422e8220c8?auto=format&fit=crop&w=400&h=300'
    ];
  }
};

const InteractiveMap: React.FC<InteractiveMapProps> = ({ searchedLocation }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [searchMarker, setSearchMarker] = useState<Property | null>(null);
  const [showStreetView, setShowStreetView] = useState(false);
  
  // Overlay controls state
  const [opacity, setOpacity] = useState(0.7);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [showComparison, setShowComparison] = useState(false);
  const [permitType, setPermitType] = useState('all');
  const [regulations] = useState(generateMockRegulations());
  const [selectedRegion, setSelectedRegion] = useState<any>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCHc60c2uiExWQsZgap0qPoJCLVkM37au8'
  });

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        console.log('Fetching properties...');
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
        
        console.log('Fetched properties:', propertiesList);
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

  useEffect(() => {
    if (searchedLocation && mapInstance) {
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
      mapInstance.panTo(searchedLocation);
      mapInstance.setZoom(15);
      setSelectedProperty(newSearchMarker);
    }
  }, [searchedLocation, mapInstance]);

  // Draw regulatory overlay
  useEffect(() => {
    if (!mapInstance) return;

    // Clear existing circles
    regulations.forEach(region => {
      if (region.circle) {
        region.circle.setMap(null);
      }
    });

    // Draw new circles
    regulations.forEach(region => {
      if (permitType !== 'all' && !region.permitTypes.includes(permitType)) return;

      const restrictiveness = showComparison
        ? region.yearData[selectedYear] - region.yearData[selectedYear - 1]
        : region.yearData[selectedYear];

      const circle = new google.maps.Circle({
        center: region.center,
        radius: region.radius,
        fillColor: restrictiveness > 0.5 ? '#3b82f6' : '#ef4444',
        fillOpacity: opacity * (restrictiveness > 0.5 ? restrictiveness : 1 - restrictiveness),
        strokeColor: '#374151',
        strokeWeight: 1,
        map: mapInstance,
        clickable: true
      });

      circle.addListener('click', () => {
        setSelectedRegion({
          ...region,
          restrictiveness,
          position: region.center
        });
      });

      region.circle = circle;
    });
  }, [mapInstance, opacity, selectedYear, showComparison, permitType]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMapInstance(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMapInstance(null);
  }, []);

  const getMarkerIcon = (permitType: string, riskLevel: string, isSearchMarker: boolean = false) => {
    if (isSearchMarker) {
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: '#ffffff',
        scale: 12
      };
    }
    
    let fillColor = permitType === 'residential' ? '#7c3aed' : '#3b82f6';
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-800"></div>
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
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: true,
          rotateControl: false,
          fullscreenControl: true
        }}
      >
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={{ lat: property.lat!, lng: property.lng! }}
            onClick={() => {
              setSelectedProperty(property);
              setShowStreetView(false);
            }}
            icon={getMarkerIcon(property.permitType, property.riskLevel)}
            animation={google.maps.Animation.DROP}
          />
        ))}

        {searchMarker && (
          <Marker
            key="search-marker"
            position={{ lat: searchMarker.lat!, lng: searchMarker.lng! }}
            onClick={() => {
              setSelectedProperty(searchMarker);
              setShowStreetView(false);
            }}
            icon={getMarkerIcon('residential', 'low', true)}
            animation={google.maps.Animation.BOUNCE}
            zIndex={1000}
          />
        )}

        {selectedProperty && !showStreetView && (
          <InfoWindow
            position={{ lat: selectedProperty.lat!, lng: selectedProperty.lng! }}
            onCloseClick={() => setSelectedProperty(null)}
          >
            <div className="p-2 max-w-md">
              <h3 className="font-medium text-gray-800 mb-2">
                {selectedProperty.id === 'search-marker' ? 'Searched Location' : selectedProperty.address}
              </h3>
              {selectedProperty.id !== 'search-marker' && (
                <>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p>Permit Type: <span className="capitalize">{selectedProperty.permitType}</span></p>
                    <p>Processing Time: {selectedProperty.estimatedDays} days</p>
                    <p>Risk Level: <span className="capitalize">{selectedProperty.riskLevel}</span></p>
                    <p>Confidence: {selectedProperty.confidence}%</p>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowStreetView(true)}
                      className="w-full bg-emerald-800 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-emerald-900 transition-colors"
                    >
                      View Street View
                    </button>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      {getArchitecturalPhotos(selectedProperty.permitType).map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Property ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
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

        {selectedRegion && (
          <InfoWindow
            position={selectedRegion.position}
            onCloseClick={() => setSelectedRegion(null)}
          >
            <div className="p-2">
              <h3 className="font-medium text-gray-800 mb-2">Regulatory Information</h3>
              <div className="text-sm space-y-1">
                <p>Restrictiveness: {(selectedRegion.restrictiveness * 100).toFixed(1)}%</p>
                <p>Permit Types: {selectedRegion.permitTypes.join(', ')}</p>
                <p>Year: {selectedYear}</p>
                {showComparison && (
                  <p className="text-xs text-gray-500">
                    Showing change from {selectedYear - 1} to {selectedYear}
                  </p>
                )}
              </div>
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

      {loading && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-800"></div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;