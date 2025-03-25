import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Spotify API configuration
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

// Get access token from Spotify
const getSpotifyAccessToken = async () => {
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      params: {
        grant_type: 'client_credentials'
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      }
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw new Error('Failed to authenticate with Spotify');
  }
};

// Search music using Spotify API
const searchSpotify = async (query: string, accessToken: string) => {
  try {
    const response = await axios({
      method: 'get',
      url: `${SPOTIFY_API_URL}/search`,
      params: {
        q: query,
        type: 'track',
        limit: 20
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Map Spotify track data to our Song format
    return response.data.tracks.items.map((item: any) => ({
      id: item.id,
      title: item.name,
      artist: item.artists.map((artist: any) => artist.name).join(', '),
      album: item.album.name,
      duration: Math.floor(item.duration_ms / 1000),
      streamingUrl: item.preview_url,
      imageUrl: item.album.images[0]?.url || null
    }));
  } catch (error) {
    console.error('Error searching Spotify:', error);
    throw new Error('Failed to search for music');
  }
};

// Vercel serverless function handler
export default async (req: VercelRequest, res: VercelResponse) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get query parameter
  const query = req.query.q as string;
  
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();
    
    // Search for tracks
    const results = await searchSpotify(query, accessToken);
    
    // Return the search results
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in music-search API:', error);
    return res.status(500).json({ error: 'Failed to search for music' });
  }
};