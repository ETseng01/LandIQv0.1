import { db } from './firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

// Mock geocoding function (in a real app, you would use Google's Geocoding API)
const mockGeocode = (address: string): { lat: number; lng: number } => {
  // San Francisco center coordinates
  const defaultCenter = {
    lat: 37.7749,
    lng: -122.4194
  };
  
  // Generate a random position near San Francisco
  const lat = defaultCenter.lat + (Math.random() - 0.5) * 0.05;
  const lng = defaultCenter.lng + (Math.random() - 0.5) * 0.05;
  return { lat, lng };
};

// Sample property data
const sampleProperties = [
  {
    address: '123 Main Street, San Francisco, CA 94105',
    estimatedDays: 30,
    permitType: 'residential',
    confidence: 92,
    riskLevel: 'low',
    searchDate: '2024-05-10',
    createdAt: Timestamp.now()
  },
  {
    address: '456 Market Avenue, San Francisco, CA 94103',
    estimatedDays: 45,
    permitType: 'residential',
    confidence: 85,
    riskLevel: 'medium',
    searchDate: '2024-05-12',
    createdAt: Timestamp.now()
  },
  {
    address: '789 Mission Street, San Francisco, CA 94107',
    estimatedDays: 60,
    permitType: 'commercial',
    confidence: 78,
    riskLevel: 'medium',
    searchDate: '2024-05-14',
    createdAt: Timestamp.now()
  },
  {
    address: '101 Valencia Boulevard, San Francisco, CA 94110',
    estimatedDays: 25,
    permitType: 'residential',
    confidence: 95,
    riskLevel: 'low',
    searchDate: '2024-05-15',
    createdAt: Timestamp.now()
  },
  {
    address: '222 Howard Street, San Francisco, CA 94105',
    estimatedDays: 75,
    permitType: 'commercial',
    confidence: 70,
    riskLevel: 'high',
    searchDate: '2024-05-16',
    createdAt: Timestamp.now()
  }
];

// Function to seed the database
export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    const propertiesCollection = collection(db, 'properties');
    const addedProperties = [];
    
    for (const property of sampleProperties) {
      try {
        // Generate coordinates for each property
        const { lat, lng } = mockGeocode(property.address);
        
        // Add coordinates to the property data
        const propertyWithCoords = {
          ...property,
          lat,
          lng
        };
        
        const docRef = await addDoc(propertiesCollection, propertyWithCoords);
        addedProperties.push({ id: docRef.id, ...propertyWithCoords });
        console.log(`Added property with ID: ${docRef.id}`);
      } catch (error) {
        console.error(`Error adding property ${property.address}:`, error);
      }
    }
    
    console.log(`Successfully added ${addedProperties.length} properties to Firestore`);
    return addedProperties;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};