import { useState } from 'react';
import axios from 'axios';
import { Track, SpotifySearchResponse, SpotifyTrack } from '../types';

export const useSpotifySearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Track[]>([]);

  const searchTracks = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get<SpotifySearchResponse>(
        `/api/spotify/search?q=${encodeURIComponent(query)}`
      );

      // Transform Spotify tracks to our Track type
      const transformedTracks: Track[] = response.data.tracks.items.map(
        (spotifyTrack: SpotifyTrack) => ({
          id: spotifyTrack.id,
          title: spotifyTrack.name,
          artist: spotifyTrack.artists.map(artist => artist.name).join(', '),
          album: spotifyTrack.album.name,
          duration: Math.floor(spotifyTrack.duration_ms / 1000),
          albumArt: spotifyTrack.album.images[0]?.url || '',
          spotifyUri: spotifyTrack.uri
        })
      );

      setSearchResults(transformedTracks);
    } catch (err: any) {
      setError(err.message || 'Failed to search tracks');
      console.error('Error searching tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    searchResults,
    searchTracks
  };
};