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
  },
  {
    address: '333 Folsom Street, San Francisco, CA 94105',
    estimatedDays: 40,
    permitType: 'residential',
    confidence: 88,
    riskLevel: 'low',
    searchDate: '2024-05-17',
    createdAt: Timestamp.now()
  },
  {
    address: '444 Bryant Street, San Francisco, CA 94107',
    estimatedDays: 55,
    permitType: 'commercial',
    confidence: 82,
    riskLevel: 'medium',
    searchDate: '2024-05-18',
    createdAt: Timestamp.now()
  },
  {
    address: '555 Brannan Street, San Francisco, CA 94107',
    estimatedDays: 35,
    permitType: 'residential',
    confidence: 91,
    riskLevel: 'low',
    searchDate: '2024-05-19',
    createdAt: Timestamp.now()
  },
  {
    address: '666 Harrison Street, San Francisco, CA 94107',
    estimatedDays: 65,
    permitType: 'commercial',
    confidence: 75,
    riskLevel: 'high',
    searchDate: '2024-05-20',
    createdAt: Timestamp.now()
  },
  {
    address: '777 King Street, San Francisco, CA 94107',
    estimatedDays: 50,
    permitType: 'residential',
    confidence: 87,
    riskLevel: 'medium',
    searchDate: '2024-05-21',
    createdAt: Timestamp.now()
  },
  {
    address: '888 Townsend Street, San Francisco, CA 94107',
    estimatedDays: 45,
    permitType: 'residential',
    confidence: 89,
    riskLevel: 'low',
    searchDate: '2024-05-22',
    createdAt: Timestamp.now()
  },
  {
    address: '999 Division Street, San Francisco, CA 94107',
    estimatedDays: 70,
    permitType: 'commercial',
    confidence: 73,
    riskLevel: 'high',
    searchDate: '2024-05-23',
    createdAt: Timestamp.now()
  },
  {
    address: '1010 Berry Street, San Francisco, CA 94107',
    estimatedDays: 40,
    permitType: 'residential',
    confidence: 93,
    riskLevel: 'low',
    searchDate: '2024-05-24',
    createdAt: Timestamp.now()
  },
  {
    address: '1111 Channel Street, San Francisco, CA 94107',
    estimatedDays: 55,
    permitType: 'commercial',
    confidence: 84,
    riskLevel: 'medium',
    searchDate: '2024-05-25',
    createdAt: Timestamp.now()
  },
  {
    address: '1212 De Haro Street, San Francisco, CA 94107',
    estimatedDays: 30,
    permitType: 'residential',
    confidence: 94,
    riskLevel: 'low',
    searchDate: '2024-05-26',
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