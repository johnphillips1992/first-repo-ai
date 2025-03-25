import { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// Environment variables should be set in the Vercel dashboard
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const APPLE_MUSIC_TOKEN = process.env.APPLE_MUSIC_TOKEN;

// Cache for Spotify access token to avoid requesting a new one for each search
let spotifyToken: { token: string; expiry: number } | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only accept GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { query, service = 'spotify' } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  try {
    switch (service) {
      case 'spotify':
        const spotifyTracks = await searchSpotify(query as string);
        return res.status(200).json(spotifyTracks);
        
      case 'youtube':
        const youtubeTracks = await searchYouTube(query as string);
        return res.status(200).json(youtubeTracks);
        
      case 'applemusic':
        const appleMusicTracks = await searchAppleMusic(query as string);
        return res.status(200).json(appleMusicTracks);
        
      default:
        return res.status(400).json({ error: 'Invalid music service' });
    }
  } catch (error) {
    console.error('Music search error:', error);
    return res.status(500).json({ error: 'Failed to search music' });
  }
}

async function getSpotifyToken() {
  // Return cached token if still valid
  if (spotifyToken && spotifyToken.expiry > Date.now()) {
    return spotifyToken.token;
  }
  
  // Request new token
  const response = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({
      grant_type: 'client_credentials'
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
      }
    }
  );
  
  // Cache token with expiry
  spotifyToken = {
    token: response.data.access_token,
    expiry: Date.now() + (response.data.expires_in * 1000)
  };
  
  return spotifyToken.token;
}

async function searchSpotify(query: string) {
  const token = await getSpotifyToken();
  
  const response = await axios.get(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return response.data.tracks.items.map((track: any) => ({
    id: `spotify-${track.id}`,
    title: track.name,
    artist: track.artists.map((artist: any) => artist.name).join(', '),
    imageUrl: track.album.images[0]?.url || '',
    serviceId: track.id,
    service: 'spotify' as const
  }));
}

async function searchYouTube(query: string) {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YouTube API key not configured');
  }
  
  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(query)}&part=snippet&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`
  );
  
  return response.data.items.map((item: any) => ({
    id: `youtube-${item.id.videoId}`,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    imageUrl: item.snippet.thumbnails.high.url,
    serviceId: item.id.videoId,
    service: 'youtube' as const
  }));
}

async function searchAppleMusic(query: string) {
  if (!APPLE_MUSIC_TOKEN) {
    throw new Error('Apple Music token not configured');
  }
  
  const response = await axios.get(
    `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(query)}&types=songs&limit=10`,
    {
      headers: {
        'Authorization': `Bearer ${APPLE_MUSIC_TOKEN}`
      }
    }
  );
  
  return response.data.results.songs.data.map((song: any) => ({
    id: `applemusic-${song.id}`,
    title: song.attributes.name,
    artist: song.attributes.artistName,
    imageUrl: song.attributes.artwork.url.replace('{w}', '300').replace('{h}', '300'),
    serviceId: song.id,
    service: 'applemusic' as const
  }));
}