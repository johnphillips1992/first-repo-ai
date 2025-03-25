import axios from 'axios';
import { Track } from '../contexts/PlaylistContext';

export async function searchTracks(
  query: string, 
  service: 'spotify' | 'youtube' | 'applemusic'
): Promise<Track[]> {
  try {
    const response = await axios.get(
      `/api/musicSearch?query=${encodeURIComponent(query)}&service=${service}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error searching tracks:', error);
    throw new Error('Failed to search tracks');
  }
}

export async function getTrackById(
  id: string, 
  service: 'spotify' | 'youtube' | 'applemusic'
): Promise<Track | null> {
  try {
    const response = await axios.get(
      `/api/musicTrack?id=${id}&service=${service}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting track:', error);
    return null;
  }
}