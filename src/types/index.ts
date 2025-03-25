// User related types
export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
}

// Mixtape related types
export interface Mixtape {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  isPublic: boolean;
  tracks: Track[];
  notes: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  albumArt: string;
  spotifyUri?: string;
  youtubeId?: string;
  appleMusicId?: string;
}

// Form related types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  displayName: string;
}

export interface MixtapeFormData {
  title: string;
  description: string;
  coverImage: File | null;
  isPublic: boolean;
  notes: string;
}

// API related types
export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string }>;
  };
  duration_ms: number;
  uri: string;
}