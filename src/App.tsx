import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Clock, Building2, Home, Filter, Bell, User, History, BarChart3, Map, AlertTriangle, Save, Database, Menu, X, ChevronRight, Info, Check, CheckCheck } from 'lucide-react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, Timestamp, DocumentData, updateDoc, doc } from 'firebase/firestore';
import { seedDatabase } from './seedDatabase';
import ProfilePage from './components/ProfilePage';
import InteractiveMap from './components/GoogleMap';

interface PredictionResult {
  address: string;
  estimatedDays: number;
  permitType: 'residential' | 'commercial';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  searchDate?: string;
  id?: string;
  lat?: number;
  lng?: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type?: 'info' | 'warning' | 'success';
}

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Permitting Regulation Update',
      message: 'New residential zoning regulations effective from next month',
      date: '2024-03-15',
      read: false,
      type: 'warning'
    },
    {
      id: '2',
      title: 'AI Model Updated',
      message: 'Prediction accuracy improved by 15%',
      date: '2024-03-14',
      read: true,
      type: 'success'
    },
    {
      id: '3',
      title: 'New Feature Available',
      message: 'Try our new address autofill feature for faster searches',
      date: '2024-03-10',
      read: false,
      type: 'info'
    }
  ]);
  const [savedProperties, setSavedProperties] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingProperty, setSavingProperty] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allAddresses, setAllAddresses] = useState<string[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState<{lat: number, lng: number} | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  // Handle scroll for sticky header
  useEffect(() => {
    const header = document.getElementById('header');
    const sticky = header?.offsetTop || 0;
    
    const handleScroll = () => {
      if (window.pageYOffset > sticky) {
        header?.classList.add('shadow-md');
      } else {
        header?.classList.remove('shadow-md');
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch saved properties from Firestore
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const propertiesQuery = query(
          collection(db, 'properties'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const querySnapshot = await getDocs(propertiesQuery);
        const propertiesList: PredictionResult[] = [];
        const addresses: string[] = [];
        
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
          addresses.push(data.address);
        });
        
        setSavedProperties(propertiesList);
        setAllAddresses(addresses);
      } catch (error) {
        console.error("Error fetching properties: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Fetch all addresses for autofill
  useEffect(() => {
    const fetchAllAddresses = async () => {
      try {
        const propertiesQuery = query(
          collection(db, 'properties'),
          orderBy('address')
        );
        
        const querySnapshot = await getDocs(propertiesQuery);
        const addresses: string[] = [];
        
        querySnapshot.forEach((doc) => {
          addresses.push(doc.data().address);
        });
        
        setAllAddresses(addresses);
      } catch (error) {
        console.error("Error fetching addresses: ", error);
      }
    };

    fetchAllAddresses();
  }, []);

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }

      // Handle click outside notifications panel
      if (
        notificationsRef.current && 
        !notificationsRef.current.contains(event.target as Node) &&
        notificationButtonRef.current && 
        !notificationButtonRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Mock geocoding function (in a real app, you would use Google's Geocoding API)
  const mockGeocode = (address: string): { lat: number; lng: number } => {
    // Generate a random position near San Francisco
    const defaultCenter = {
      lat: 37.7749,
      lng: -122.4194
    };
    const lat = defaultCenter.lat + (Math.random() - 0.5) * 0.05;
    const lng = defaultCenter.lng + (Math.random() - 0.5) * 0.05;
    return { lat, lng };
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate coordinates for the searched address
    const coordinates = mockGeocode(searchQuery);
    
    setPrediction({
      address: searchQuery,
      estimatedDays: 45,
      permitType: 'residential',
      confidence: 85,
      riskLevel: 'low',
      searchDate: new Date().toISOString().split('T')[0],
      lat: coordinates.lat,
      lng: coordinates.lng
    });
    
    // Update the map with the searched location
    setSearchedLocation(coordinates);
    
    setShowSuggestions(false);
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length > 2) {
      const filteredAddresses = allAddresses.filter(address => 
        address.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      
      setAddressSuggestions(filteredAddresses);
      setShowSuggestions(filteredAddresses.length > 0);
    } else {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (address: string) => {
    setSearchQuery(address);
    setShowSuggestions(false);
    
    // Generate coordinates for the selected address
    const coordinates = mockGeocode(address);
    
    // Auto-submit the search
    setPrediction({
      address: address,
      estimatedDays: 45,
      permitType: 'residential',
      confidence: 85,
      riskLevel: 'low',
      searchDate: new Date().toISOString().split('T')[0],
      lat: coordinates.lat,
      lng: coordinates.lng
    });
    
    // Update the map with the searched location
    setSearchedLocation(coordinates);
  };

  const displayToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const saveProperty = async () => {
    if (!prediction) {
      console.error("Cannot save property: prediction is null");
      displayToast('Error: No property data to save');
      return;
    }

    console.log('Starting property save...', { prediction });
    setSavingProperty(true);

    try {
      // Validate property data before saving
      if (!prediction.address || !prediction.lat || !prediction.lng) {
        throw new Error('Missing required property data');
      }

      const propertyData = {
        address: prediction.address,
        estimatedDays: prediction.estimatedDays,
        permitType: prediction.permitType,
        confidence: prediction.confidence,
        riskLevel: prediction.riskLevel,
        searchDate: prediction.searchDate,
        lat: prediction.lat,
        lng: prediction.lng,
        createdAt: Timestamp.now()
      };

      console.log('Attempting to save property data:', propertyData);

      // Get reference to properties collection
      const propertiesCollection = collection(db, 'properties');
      console.log('Got reference to properties collection');

      // Add document to Firestore
      const docRef = await addDoc(propertiesCollection, propertyData);
      console.log('Successfully added document with ID:', docRef.id);

      // Add the new property to the state
      setSavedProperties(prev => [{
        ...prediction,
        id: docRef.id
      }, ...prev]);

      // Add to addresses list for autofill
      if (!allAddresses.includes(prediction.address)) {
        setAllAddresses(prev => [...prev, prediction.address]);
      }

      // Add a notification
      const newNotification: Notification = {
        id: Date.now().toString(),
        title: 'Property Saved',
        message: `"${prediction.address}" has been saved to your properties`,
        date: new Date().toISOString().split('T')[0],
        read: false,
        type: 'success'
      };

      setNotifications(prev => [newNotification, ...prev]);

      // Show success message
      displayToast('Property saved successfully!');
    } catch (error: any) {
      console.error('Error saving property:', {
        error,
        code: error.code,
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      // Provide more specific error messages based on the error type
      let errorMessage = 'Failed to save property. ';
      if (error.code === 'permission-denied') {
        errorMessage += 'Permission denied. Please check your authentication status.';
      } else if (error.message.includes('Missing or insufficient permissions')) {
        errorMessage += 'Insufficient permissions to perform this action.';
      } else if (error.message === 'Missing required property data') {
        errorMessage += 'Missing required property information.';
      } else {
        errorMessage += 'An unexpected error occurred. Please try again.';
      }

      displayToast(errorMessage);
    } finally {
      setSavingProperty(false);
      console.log('Property save operation completed');
    }
  };

  const handleSeedDatabase = async () => {
    if (seeding) return;
    
    setSeeding(true);
    try {
      const addedProperties = await seedDatabase();
      setSavedProperties(prev => [...addedProperties.slice(0, 5), ...prev].slice(0, 5));
      
      // Update addresses list for autofill
      const newAddresses = addedProperties.map(prop => prop.address);
      setAllAddresses(prev => [...new Set([...prev, ...newAddresses])]);
      
      // Add a notification
      const newNotification: Notification = {
        id: Date.now().toString(),
        title: 'Database Seeded',
        message: `${addedProperties.length} sample properties have been added to the database`,
        date: new Date().toISOString().split('T')[0],
        read: false,
        type: 'info'
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      
      displayToast(`Successfully added ${addedProperties.length} sample properties to the database!`);
    } catch (error) {
      console.error("Error syncing database: ", error);
      displayToast('Failed to sync database. Please check console for details.');
    } finally {
      setSeeding(false);
    }
  };

  const toggleProfile = () => {
    setShowProfile(!showProfile);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleLearnMoreModal = () => {
    setShowLearnMoreModal(!showLearnMoreModal);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    displayToast('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type?: string, read?: boolean) => {
    const baseClass = read ? 'bg-gray-50' : 'bg-white';
    
    switch (type) {
      case 'warning':
        return `${baseClass} border-l-4 border-amber-500`;
      case 'success':
        return `${baseClass} border-l-4 border-green-500`;
      case 'info':
      default:
        return `${baseClass} border-l-4 border-blue-500`;
    }
  };

  if (showProfile) {
    return <ProfilePage onClose={toggleProfile} />;
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header id="header" className="bg-white/90 backdrop-blur-sm sticky top-0 z-50 transition-shadow duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                LandIQ
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="nav-button primary-gradient"
              >
                <Database className="h-4 w-4" />
                <span>{seeding ? 'Syncing...' : 'Sync Database'}</span>
              </button>
              <button 
                ref={notificationButtonRef}
                onClick={toggleNotifications}
                className="nav-button relative hover:text-purple-600 transition-colors"
                aria-label="Notifications"
              >
                <Bell className={`h-6 w-6 ${showNotifications ? 'text-purple-600' : 'text-gray-600'}`} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              <button 
                onClick={toggleProfile}
                className="nav-button hover:text-purple-600 transition-colors"
              >
                <User className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button 
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6 text-gray-700" />
                ) : (
                  <Menu className="h-6 w-6 text-gray-700" />
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 py-4 border-t border-gray-100 animate-slideDown">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={handleSeedDatabase}
                  disabled={seeding}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg primary-gradient"
                >
                  <Database className="h-4 w-4" />
                  <span>{seeding ? 'Syncing...' : 'Sync Database'}</span>
                </button>
                <button 
                  onClick={toggleNotifications}
                  className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span>Notifications</span>
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                </button>
                <button 
                  onClick={toggleProfile}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <User className="h-5 w-5 text-gray-600" />
                  <span>Profile</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Notifications Panel */}
          {showNotifications && (
            <div 
              ref={notificationsRef}
              className="absolute right-4 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-slideDown"
            >
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                  {notifications.some(n => !n.read) && (
                    <button 
                      onClick={markAllNotificationsAsRead}
                      className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                    >
                      <CheckCheck className="h-4 w-4 mr-1" />
                      Mark all as read
                    </button>
                  )}
                </div>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`${getNotificationBgColor(notification.type, notification.read)} p-4 hover:bg-gray-50 transition-colors`}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5 mr-3">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                              {notification.title}
                            </p>
                            <button 
                              onClick={() => deleteNotification(notification.id)}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              aria-label="Delete notification"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                          <div className="flex justify-between items-center mt-2">
                            <p className="text-xs text-gray-400">{notification.date}</p>
                            {!notification.read && (
                              <button 
                                onClick={() => markNotificationAsRead(notification.id)}
                                className="text-xs text-purple-600 hover:text-purple-800"
                              >
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="hero-section mt-8">
          <div className="hero-content">
            <h2 className="hero-title">Predict Permit Processing Times with AI</h2>
            <p className="hero-description">LandIQ uses advanced machine learning to forecast permit approval timelines for your property development projects.</p>
            <button 
              className="hero-cta"
              onClick={toggleLearnMoreModal}
            >
              <span>Learn More</span>
              <ChevronRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="search-bar relative">
          <Search className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearchInputChange}
            onFocus={() => {
              if (searchQuery.length > 2 && addressSuggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            placeholder="Enter property address..."
            className="search-input"
            autoComplete="off"
          />
          <button type="submit" className="search-button">
            Predict
          </button>
          
          {/* Address Suggestions */}
          {showSuggestions && (
            <div 
              ref={suggestionsRef}
              className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-purple-100 z-[60] max-h-60 overflow-y-auto"
            >
              {addressSuggestions.map((address, index) => (
                <div 
                  key={index}
                  className="px-4 py-3 hover:bg-purple-50 cursor-pointer flex items-center space-x-2 border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionClick(address)}
                >
                  <MapPin className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span className="truncate">{address}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Bento Grid Layout */}
        <div className="bento-grid">
          {/* Map Section */}
          <div className="bento-item bento-item-large">
            <div className="bento-item-header">
              <Map className="bento-icon" />
              <h2 className="bento-title">Property Map</h2>
            </div>
            <div className="h-[400px] rounded-lg overflow-hidden">
              <InteractiveMap searchedLocation={searchedLocation} />
            </div>
          </div>

          {/* Prediction Results */}
          {prediction && (
            <div className="bento-item animate-slideUp">
              <div className="bento-item-header">
                <AlertTriangle className="bento-icon" />
                <h2 className="bento-title">Permit Prediction</h2>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Property Address</p>
                    <p className="font-medium text-gray-800">{prediction.address}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Processing Time</p>
                    <p className="font-medium text-gray-800">{prediction.estimatedDays} days</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Filter className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">AI Confidence</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-blue-500 h-2.5 rounded-full" 
                        style={{ width: `${prediction.confidence}%` }}
                      ></div>
                    </div>
                    <p className="text-sm mt-1">{prediction.confidence}% confident</p>
                  </div>
                </div>

                <button 
                  onClick={saveProperty}
                  disabled={savingProperty}
                  className="w-full primary-gradient rounded-xl py-3 flex items-center justify-center space-x-2 mt-4 hover:scale-105 transition-transform duration-300"
                >
                  {savingProperty ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save Property</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bento-item">
            <div className="bento-item-header">
              <BarChart3 className="bento-icon" />
              <h2 className="bento-title">Quick Stats</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors duration-300">
                <p className="stat-value">24</p>
                <p className="stat-label">Properties Analyzed</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors duration-300">
                <p className="stat-value">85%</p>
                <p className="stat-label">Prediction Accuracy</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors duration-300">
                <p className="stat-value">12</p>
                <p className="stat-label">Permits Completed</p>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-colors duration-300">
                <p className="stat-value">3</p>
                <p className="stat-label">Active Applications</p>
              </div>
            </div>
          </div>

          {/* Recent Properties */}
          <div className="bento-item">
            <div className="bento-item-header">
              <History className="bento-icon" />
              <h2 className="bento-title">Recent Properties</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {savedProperties.length > 0 ? (
                  savedProperties.map((property, index) => (
                    <div 
                      key={property.id || index} 
                      className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 transition-all duration-300"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">{property.address}</p>
                          <p className="text-sm text-gray-500">Searched on {property.searchDate}</p>
                        </div>
                        <button 
                          onClick={toggleProfile}
                          className="text-purple-600 group-hover:translate-x-1 transition-transform duration-300"
                        >
                          <User className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-purple-500" />
                          {property.estimatedDays} days
                        </span>
                        <span className="flex items-center">
                          {property.permitType === 'residential' ? (
                            <Home className="h-4 w-4 mr-1 text-purple-500" />
                          ) : (
                            <Building2 className="h-4 w-4 mr-1 text-purple-500" />
                          )}
                          {property.permitType}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50">
                    <p className="text-center text-gray-600">No saved properties yet</p>
                    <p className="text-center text-sm text-gray-500 mt-1">Search for a property and save it to see it here</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Learn More Modal */}
      {showLearnMoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-2 rounded-xl shadow-md">
                    <Info className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                    About LandIQ
                  </h2>
                </div>
                <button 
                  onClick={toggleLearnMoreModal}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              
              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4">
                  For real estate developers, navigating the permitting and regulatory landscape is crucial for effective risk analysis. At LandIQ, we enhance transparency by aggregating regulatory information and delivering advanced insights.
                </p>
                
                <p className="text-gray-700 leading-relaxed mb-4">
                  Our platform combines permitting history, zoning codes, and political sentiment into clear metrics. With one central platform, LandIQ empowers developers to make better decisions and makes the American dream more accessible.
                </p>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Key Features</h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50">
                    <h4 className="font-medium text-purple-700 mb-2">AI-Powered Predictions</h4>
                    <p className="text-sm text-gray-600">Advanced machine learning algorithms predict permit processing times with high accuracy.</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50">
                    <h4 className="font-medium text-purple-700 mb-2">Regulatory Insights</h4>
                    <p className="text-sm text-gray-600">Stay updated on zoning changes and regulatory requirements affecting your properties.</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50">
                    <h4 className="font-medium text-purple-700 mb-2">Risk Assessment</h4>
                    <p className="text-sm text-gray-600">Identify potential obstacles and delays before they impact your development timeline.</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-blue-50">
                    <h4 className="font-medium text-purple-700 mb-2">Centralized Dashboard</h4>
                    <p className="text-sm text-gray-600">Manage all your properties and permit applications in one intuitive interface.</p>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">How It Works</h3>
                
                <ol className="list-decimal pl-5 space-y-2 mb-6">
                  <li className="text-gray-700">Enter your property address in our search bar</li>
                  <li className="text-gray-700">Our AI analyzes historical data and current regulations</li>
                  <li className="text-gray-700">Receive detailed predictions and risk assessments</li>
                  <li className="text-gray-700">Save properties to track and compare multiple projects</li>
                </ol>
              </div>
              
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={toggleLearnMoreModal}
                  className="primary-gradient px-6 py-3 rounded-xl font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
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
}

export default App;