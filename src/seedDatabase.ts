/**
 * Firestore Database Seeding and Mock Geocoding
 *
 * Overview:
 * This script includes a mock geocoding function to simulate address-to-coordinate conversion,
 * typically used in development environments to avoid using external API calls. It also defines
 * a set of sample property data and includes a function to seed these properties into a Firestore database.
 *
 * Functionality:
 * - `mockGeocode`: Simulates geocoding by providing pseudo-random coordinates near a predefined center (San Francisco).
 * - `sampleProperties`: An array of objects representing hypothetical properties with attributes like address, permit type, confidence level, and risk.
 * - `seedDatabase`: Asynchronously adds each property from `sampleProperties` to the Firestore database, incorporating geocoded coordinates.
 *
 * Dependencies:
 * - Firebase Firestore: Utilized for storing and retrieving the property data.
 * - Timestamp from Firebase: Used to set creation timestamps for seeded data.
 *
 * Usage:
 * This file is meant to be used in development to populate the database with initial data for testing or presentation purposes.
 *
 * Notes:
 * Replace the `mockGeocode` function with a real geocoding API such as Google's Geocoding API for production environments to ensure accurate address-to-coordinate conversion.
 */

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
  // Original properties
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
    address: '444 Harrison Street, San Francisco, CA 94107',
    estimatedDays: 55,
    permitType: 'commercial',
    confidence: 82,
    riskLevel: 'medium',
    searchDate: '2024-05-18',
    createdAt: Timestamp.now()
  },
  {
    address: '555 Bryant Street, San Francisco, CA 94107',
    estimatedDays: 35,
    permitType: 'residential',
    confidence: 90,
    riskLevel: 'low',
    searchDate: '2024-05-19',
    createdAt: Timestamp.now()
  },
  {
    address: '666 Brannan Street, San Francisco, CA 94107',
    estimatedDays: 65,
    permitType: 'commercial',
    confidence: 75,
    riskLevel: 'high',
    searchDate: '2024-05-20',
    createdAt: Timestamp.now()
  },
  {
    address: '777 Townsend Street, San Francisco, CA 94107',
    estimatedDays: 50,
    permitType: 'residential',
    confidence: 86,
    riskLevel: 'medium',
    searchDate: '2024-05-21',
    createdAt: Timestamp.now()
  },
  // Additional San Francisco properties
  {
    address: '1234 Lombard Street, San Francisco, CA 94123',
    estimatedDays: 42,
    permitType: 'residential',
    confidence: 89,
    riskLevel: 'low',
    searchDate: '2024-05-22',
    createdAt: Timestamp.now()
  },
  {
    address: '890 Geary Boulevard, San Francisco, CA 94109',
    estimatedDays: 58,
    permitType: 'commercial',
    confidence: 76,
    riskLevel: 'medium',
    searchDate: '2024-05-22',
    createdAt: Timestamp.now()
  },
  {
    address: '2100 Van Ness Avenue, San Francisco, CA 94109',
    estimatedDays: 70,
    permitType: 'commercial',
    confidence: 72,
    riskLevel: 'high',
    searchDate: '2024-05-23',
    createdAt: Timestamp.now()
  },
  {
    address: '450 Sutter Street, San Francisco, CA 94108',
    estimatedDays: 38,
    permitType: 'commercial',
    confidence: 91,
    riskLevel: 'low',
    searchDate: '2024-05-23',
    createdAt: Timestamp.now()
  },
  {
    address: '1001 California Street, San Francisco, CA 94108',
    estimatedDays: 45,
    permitType: 'residential',
    confidence: 87,
    riskLevel: 'medium',
    searchDate: '2024-05-24',
    createdAt: Timestamp.now()
  },
  // Oakland properties
  {
    address: '350 Frank H Ogawa Plaza, Oakland, CA 94612',
    estimatedDays: 52,
    permitType: 'commercial',
    confidence: 83,
    riskLevel: 'medium',
    searchDate: '2024-05-24',
    createdAt: Timestamp.now()
  },
  {
    address: '1200 Broadway, Oakland, CA 94612',
    estimatedDays: 48,
    permitType: 'commercial',
    confidence: 85,
    riskLevel: 'medium',
    searchDate: '2024-05-25',
    createdAt: Timestamp.now()
  },
  {
    address: '3300 Telegraph Avenue, Oakland, CA 94609',
    estimatedDays: 32,
    permitType: 'residential',
    confidence: 93,
    riskLevel: 'low',
    searchDate: '2024-05-25',
    createdAt: Timestamp.now()
  },
  {
    address: '4800 Shattuck Avenue, Oakland, CA 94609',
    estimatedDays: 28,
    permitType: 'residential',
    confidence: 94,
    riskLevel: 'low',
    searchDate: '2024-05-26',
    createdAt: Timestamp.now()
  },
  {
    address: '2201 Broadway, Oakland, CA 94612',
    estimatedDays: 65,
    permitType: 'commercial',
    confidence: 77,
    riskLevel: 'high',
    searchDate: '2024-05-26',
    createdAt: Timestamp.now()
  },
  // Berkeley properties
  {
    address: '2121 Allston Way, Berkeley, CA 94704',
    estimatedDays: 40,
    permitType: 'commercial',
    confidence: 88,
    riskLevel: 'low',
    searchDate: '2024-05-27',
    createdAt: Timestamp.now()
  },
  {
    address: '2299 Piedmont Avenue, Berkeley, CA 94720',
    estimatedDays: 55,
    permitType: 'commercial',
    confidence: 81,
    riskLevel: 'medium',
    searchDate: '2024-05-27',
    createdAt: Timestamp.now()
  },
  {
    address: '1885 University Avenue, Berkeley, CA 94703',
    estimatedDays: 35,
    permitType: 'residential',
    confidence: 90,
    riskLevel: 'low',
    searchDate: '2024-05-28',
    createdAt: Timestamp.now()
  },
  // San Jose properties
  {
    address: '150 S 2nd Street, San Jose, CA 95113',
    estimatedDays: 62,
    permitType: 'commercial',
    confidence: 79,
    riskLevel: 'medium',
    searchDate: '2024-05-28',
    createdAt: Timestamp.now()
  },
  {
    address: '1 Paseo de San Antonio, San Jose, CA 95113',
    estimatedDays: 70,
    permitType: 'commercial',
    confidence: 73,
    riskLevel: 'high',
    searchDate: '2024-05-29',
    createdAt: Timestamp.now()
  },
  {
    address: '1401 N 1st Street, San Jose, CA 95112',
    estimatedDays: 45,
    permitType: 'commercial',
    confidence: 86,
    riskLevel: 'medium',
    searchDate: '2024-05-29',
    createdAt: Timestamp.now()
  },
  {
    address: '1035 Coleman Avenue, San Jose, CA 95110',
    estimatedDays: 38,
    permitType: 'residential',
    confidence: 89,
    riskLevel: 'low',
    searchDate: '2024-05-30',
    createdAt: Timestamp.now()
  },
  // Palo Alto properties
  {
    address: '555 University Avenue, Palo Alto, CA 94301',
    estimatedDays: 42,
    permitType: 'commercial',
    confidence: 87,
    riskLevel: 'medium',
    searchDate: '2024-05-30',
    createdAt: Timestamp.now()
  },
  {
    address: '2600 El Camino Real, Palo Alto, CA 94306',
    estimatedDays: 50,
    permitType: 'commercial',
    confidence: 84,
    riskLevel: 'medium',
    searchDate: '2024-05-31',
    createdAt: Timestamp.now()
  },
  {
    address: '101 Lytton Avenue, Palo Alto, CA 94301',
    estimatedDays: 35,
    permitType: 'residential',
    confidence: 91,
    riskLevel: 'low',
    searchDate: '2024-05-31',
    createdAt: Timestamp.now()
  }
];

// Function to seed the database
export const seedDatabase = async () => {
  try {
    const propertiesCollection = collection(db, 'properties');
    
    // Add each property to Firestore
    const addedProperties = [];
    
    for (const property of sampleProperties) {
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
    }
    
    console.log(`Successfully added ${addedProperties.length} properties to Firestore`);
    return addedProperties;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
