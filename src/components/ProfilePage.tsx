import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { MapPin, Clock, Building2, Home, Trash2, ArrowLeft } from 'lucide-react';
import PropertyDetails from './PropertyDetails';

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

interface ProfilePageProps {
  onClose: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onClose }) => {
  const [savedProperties, setSavedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  useEffect(() => {
    fetchSavedProperties();
  }, []);

  const fetchSavedProperties = async () => {
    setLoading(true);
    try {
      const propertiesQuery = query(
        collection(db, 'properties'),
        orderBy('createdAt', 'desc')
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
      
      setSavedProperties(propertiesList);
    } catch (error) {
      console.error("Error fetching properties: ", error);
    } finally {
      setLoading(false);
    }
  };

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    setDeleting(propertyId);
    try {
      await deleteDoc(doc(db, 'properties', propertyId));
      setSavedProperties(prev => prev.filter(property => property.id !== propertyId));
      displayToast('Property deleted successfully');
    } catch (error) {
      console.error("Error deleting property: ", error);
      displayToast('Failed to delete property. Please try again.');
    } finally {
      setDeleting(null);
    }
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
    <div className="fixed inset-0 bg-gradient-to-br from-purple-50 to-blue-50 z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onClose}
            className="flex items-center space-x-2 text-gray-700 hover:text-purple-600 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
            Your Profile
          </h1>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md ring-1 ring-black/5 p-6 mb-8 hover:shadow-lg transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Account Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">user@example.com</p>
            </div>
            <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="font-medium">Premium</p>
            </div>
            <div className="animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">May 2024</p>
            </div>
            <div className="animate-slideUp" style={{ animationDelay: '0.4s' }}>
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="font-medium">Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md ring-1 ring-black/5 p-6 hover:shadow-lg transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">Saved Properties</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : savedProperties.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500 mb-2">No saved properties found</p>
              <p className="text-sm text-gray-400">Search for properties and save them to see them here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedProperties.map((property, index) => (
                <div 
                  key={property.id} 
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-all duration-300 animate-slideUp cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSelectedProperty(property)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-800">{property.address}</p>
                          <p className="text-sm text-gray-500">Searched on {property.searchDate}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-purple-500" />
                          <span className="text-sm">{property.estimatedDays} days</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {property.permitType === 'residential' ? (
                            <Home className="h-4 w-4 text-purple-500" />
                          ) : (
                            <Building2 className="h-4 w-4 text-purple-500" />
                          )}
                          <span className="text-sm capitalize">{property.permitType}</span>
                        </div>
                        <div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getRiskLevelColor(property.riskLevel)}`}>
                            {property.riskLevel.toUpperCase()} RISK
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProperty(property.id);
                      }}
                      disabled={deleting === property.id}
                      className="ml-4 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50"
                      title="Delete property"
                    >
                      {deleting === property.id ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-red-500"></div>
                      ) : (
                        <Trash2 className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Property Details Modal */}
      {selectedProperty && (
        <PropertyDetails
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
        />
      )}
      
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="w-2 h-10 bg-gradient-to-b from-purple-600 to-blue-500 rounded-full mr-2"></div>
          <p>{toastMessage}</p>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;