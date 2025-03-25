import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Cache the Spotify access token to avoid unnecessary token requests
let spotifyAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

const getSpotifyAccessToken = async (): Promise<string> => {
  // If we have a valid token, return it
  if (spotifyAccessToken && Date.now() < tokenExpiresAt) {
    return spotifyAccessToken;
  }

  // Otherwise, request a new token
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify client credentials not configured');
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        }
      }
    );

    spotifyAccessToken = response.data.access_token;
    // Set expiry time (subtract 60 seconds to be safe)
    tokenExpiresAt = Date.now() + (response.data.expires_in - 60) * 1000;

    return spotifyAccessToken;
  } catch (error: any) {
    console.error('Error fetching Spotify access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Spotify');
  }
};

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Extract query parameter
  const query = request.query.q as string;
  
  if (!query) {
    return response.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();

    // Search tracks on Spotify
    const spotifyResponse = await axios.get(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.status(200).json(spotifyResponse.data);
  } catch (error: any) {
    console.error('Error searching Spotify:', error.response?.data || error.message);
    return response.status(500).json({ 
      error: 'Failed to search Spotify',
      details: error.message
    });
  }
}