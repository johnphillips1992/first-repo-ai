import axios from 'axios';
import { Song } from '../contexts/MixtapeContext';

// Search for music using the serverless API
export const searchMusic = async (query: string): Promise<Song[]> => {
  try {
    const response = await axios.get(`/api/music-search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching for music:', error);
    throw new Error('Failed to search for music');
  }
};