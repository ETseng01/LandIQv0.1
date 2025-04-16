import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, StreetViewPanorama } from '@react-google-maps/api';
import { MapPin, Clock, Building2, Home, X, ChevronLeft, ChevronRight, Map as MapIcon } from 'lucide-react';

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

interface PropertyDetailsProps {
  property: Property;
  onClose: () => void;
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onClose }) => {
  const [showStreetView, setShowStreetView] = useState(true);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyCHc60c2uiExWQsZgap0qPoJCLVkM37au8'
  });

  const photos = property.permitType === 'residential' ? [
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&h=600'
  ] : [
    'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1577985043696-8bd54d9f093f?auto=format&fit=crop&w=800&h=600',
    'https://images.unsplash.com/photo-1554435493-93422e8220c8?auto=format&fit=crop&w=800&h=600'
  ];

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const previousPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-amber-600 bg-amber-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slideUp">
        <div className="flex justify-between items-center p-4 border-b">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Property Details
          </h2>
          <div className="w-9"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800">{property.address}</p>
                <p className="text-sm text-gray-500">Searched on {property.searchDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">{property.estimatedDays} days</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Processing Time</p>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50">
                <div className="flex items-center space-x-2">
                  {property.permitType === 'residential' ? (
                    <Home className="h-4 w-4 text-purple-500" />
                  ) : (
                    <Building2 className="h-4 w-4 text-purple-500" />
                  )}
                  <span className="text-sm font-medium capitalize">{property.permitType}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Property Type</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Confidence Score</span>
                <span className="text-sm font-medium">{property.confidence}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full" 
                  style={{ width: `${property.confidence}%` }}
                ></div>
              </div>
            </div>

            <div>
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getRiskLevelColor(property.riskLevel)}`}>
                {property.riskLevel.toUpperCase()} RISK
              </span>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowStreetView(true)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                  showStreetView 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <MapIcon className="h-4 w-4" />
                <span>Street View</span>
              </button>
              <button
                onClick={() => setShowStreetView(false)}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                  !showStreetView 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Building2 className="h-4 w-4" />
                <span>Photos</span>
              </button>
            </div>
          </div>

          <div className="relative h-[400px] rounded-xl overflow-hidden">
            {showStreetView ? (
              isLoaded && property.lat && property.lng ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={{ lat: property.lat, lng: property.lng }}
                  zoom={18}
                >
                  <StreetViewPanorama
                    position={{ lat: property.lat, lng: property.lng }}
                    visible={true}
                  />
                </GoogleMap>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              )
            ) : (
              <div className="h-full relative">
                <img
                  src={photos[currentPhotoIndex]}
                  alt={`Property view ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-4 flex justify-between">
                  <button
                    onClick={previousPhoto}
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;