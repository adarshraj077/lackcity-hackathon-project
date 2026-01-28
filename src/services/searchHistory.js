import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase/config';

const SEARCHES_COLLECTION = 'searches';

/**
 * Save a search to the user's history
 * @param {string} userId - The user's ID
 * @param {string} symptoms - The symptoms searched
 * @param {object} result - The triage result
 * @param {object} location - Optional user location { lat, lng }
 */
export async function saveSearch(userId, symptoms, result, location = null) {
  try {
    const searchData = {
      userId,
      symptoms,
      result,
      createdAt: serverTimestamp()
    };
    
    // Add location data for heatmap if available
    if (location && location.lat && location.lng) {
      searchData.lat = location.lat;
      searchData.lng = location.lng;
      searchData.urgency = result?.urgency || 'normal';
    }
    
    await addDoc(collection(db, SEARCHES_COLLECTION), searchData);
    // console.log('Search saved successfully');
  } catch (error) {
    console.error('Error saving search:', error);
    throw error;
  }
}

/**
 * Get the user's search history
 * @param {string} userId - The user's ID
 * @param {number} maxResults - Maximum number of results to return
 * @returns {Promise<Array>} Array of search history items
 */
export async function getSearchHistory(userId, maxResults = 10) {
  try {
    // Simple query without orderBy to avoid needing composite index
    // We'll sort client-side instead
    const q = query(
      collection(db, SEARCHES_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const searches = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      searches.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamp to JS Date, handle null case
        createdAt: data.createdAt?.toDate() || new Date()
      });
    });
    
    // Sort by createdAt descending (newest first) client-side
    searches.sort((a, b) => b.createdAt - a.createdAt);
    
    // Limit results
    const limitedSearches = searches.slice(0, maxResults);
    
    console.log('Fetched search history:', limitedSearches.length, 'items');
    return limitedSearches;
  } catch (error) {
    console.error('Error fetching search history:', error);
    // Return empty array instead of throwing to prevent UI breaking
    return [];
  }
}

/**
 * Get anonymized heatmap data for emergency activity visualization
 * Fetches all searches with location data from the last 24 hours (or specified time range)
 * @param {number} hoursAgo - Number of hours to look back (default 24)
 * @returns {Promise<Array>} Array of { lat, lng, urgency } objects
 */
export async function getHeatmapData(hoursAgo = 24) {
  try {
    // Calculate timestamp for time range
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursAgo);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);
    
    // Query all searches with location data from the time range
    // Note: This query fetches all recent searches - in production you'd want pagination
    const q = query(
      collection(db, SEARCHES_COLLECTION),
      where('createdAt', '>', cutoffTimestamp)
    );
    
    const querySnapshot = await getDocs(q);
    const heatmapPoints = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Only include records that have location data
      if (data.lat && data.lng) {
        heatmapPoints.push({
          lat: data.lat,
          lng: data.lng,
          urgency: data.urgency || data.result?.urgency || 'normal'
        });
      }
    });
    
    console.log('Fetched heatmap data:', heatmapPoints.length, 'points');
    return heatmapPoints;
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return [];
  }
}
