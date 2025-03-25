import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMixtape, Mixtape, Song } from '../contexts/MixtapeContext';
import { useAuth } from '../contexts/AuthContext';
import CassetteDeck from '../components/CassetteDeck';
import NoteEditor from '../components/NoteEditor';
import './MixtapePlayerPage.css';

const MixtapePlayerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMixtape, updateMixtape } = useMixtape();
  const { currentUser } = useAuth();
  
  const [mixtape, setMixtape] = useState<Mixtape | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  
  // Audio player reference
  const audioRef = React.useRef<HTMLAudioElement>(null);
  
  // Load mixtape data
  useEffect(() => {
    const fetchMixtape = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getMixtape(id);
        
        if (!data) {
          setError('Mixtape not found');
          return;
        }
        
        setMixtape(data);
        
        // Check if current user is the owner
        if (currentUser && data.createdBy === currentUser.uid) {
          setIsOwner(true);
        }
      } catch (err) {
        console.error('Error fetching mixtape:', err);
        setError('Failed to load mixtape');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMixtape();
  }, [id, getMixtape, currentUser]);
  
  // Handle play/pause
  const handlePlayPause = () => {
    if (!mixtape || mixtape.songs.length === 0) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle rewind
  const handleRewind = () => {
    if (!mixtape || mixtape.songs.length === 0) return;
    
    // Go to previous song or restart current if near the beginning
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      setCurrentSongIndex((prev) => {
        const newIndex = prev - 1;
        return newIndex < 0 ? mixtape.songs.length - 1 : newIndex;
      });
    }
  };
  
  // Handle fast forward
  const handleFastForward = () => {
    if (!mixtape || mixtape.songs.length === 0) return;
    
    // Go to next song
    setCurrentSongIndex((prev) => (prev + 1) % mixtape.songs.length);
  };
  
  // Handle stop
  const handleStop = () => {
    if (!mixtape || mixtape.songs.length === 0 || !audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };
  
  // Handle eject
  const handleEject = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    navigate(-1);
  };
  
  // Handle note update (for owners only)
  const handleNoteUpdate = async (newNote: string) => {
    if (!mixtape || !isOwner) return;
    
    try {
      await updateMixtape(mixtape.id, { notes: newNote });
      setMixtape({ ...mixtape, notes: newNote });
    } catch (err) {
      console.error('Error updating note:', err);
    }
  };
  
  // Handle song end - play next song
  const handleSongEnd = () => {
    if (!mixtape || mixtape.songs.length === 0) return;
    
    // If it's the last song, stop playing
    if (currentSongIndex === mixtape.songs.length - 1) {
      setIsPlaying(false);
    } else {
      // Otherwise play the next song
      setCurrentSongIndex((prev) => (prev + 1) % mixtape.songs.length);
    }
  };
  
  // Get current song URL
  const getCurrentSongUrl = (): string => {
    if (!mixtape || mixtape.songs.length === 0) return '';
    return mixtape.songs[currentSongIndex].streamingUrl || '';
  };
  
  // Format date for display
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  if (loading) {
    return <div className="loading">Loading mixtape...</div>;
  }
  
  if (error || !mixtape) {
    return <div className="error-message">{error || 'Something went wrong'}</div>;
  }
  
  return (
    <div className="mixtape-player-page">
      <div className="mixtape-header">
        <h1>{mixtape.title}</h1>
        {mixtape.description && <p className="mixtape-description">{mixtape.description}</p>}
        <p className="mixtape-meta">
          Created by {isOwner ? 'you' : 'another user'} on {formatDate(mixtape.createdAt)}
        </p>
      </div>
      
      <div className="player-section">
        <CassetteDeck
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onRewind={handleRewind}
          onFastForward={handleFastForward}
          onStop={handleStop}
          onEject={handleEject}
          coverImage={mixtape.coverImage}
          mixtapeTitle={mixtape.title}
        />
        
        <div className="song-info-container">
          <h3>Now Playing</h3>
          {mixtape.songs.length > 0 ? (
            <div className="now-playing">
              <h4>{mixtape.songs[currentSongIndex].title}</h4>
              <p>{mixtape.songs[currentSongIndex].artist}</p>
            </div>
          ) : (
            <div className="no-songs">This mixtape doesn't have any songs yet.</div>
          )}
        </div>
      </div>
      
      <div className="playlist-section">
        <h3>Playlist</h3>
        {mixtape.songs.length > 0 ? (
          <ul className="song-list">
            {mixtape.songs.map((song: Song, index: number) => (
              <li 
                key={song.id} 
                className={`song-item ${index === currentSongIndex ? 'active' : ''}`}
                onClick={() => {
                  setCurrentSongIndex(index);
                  if (isPlaying) {
                    audioRef.current?.play();
                  }
                }}
              >
                <div className="song-number">{index + 1}</div>
                <div className="song-info">
                  <h4>{song.title}</h4>
                  <p>{song.artist}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-songs">This mixtape doesn't have any songs yet.</div>
        )}
      </div>
      
      <div className="notes-section">
        <NoteEditor
          initialNote={mixtape.notes}
          onNoteChange={handleNoteUpdate}
        />
        {!isOwner && <div className="notes-readonly-message">You can view but not edit this mixtape's notes.</div>}
      </div>
      
      {/* Audio element for playing songs */}
      <audio
        ref={audioRef}
        src={getCurrentSongUrl()}
        onEnded={handleSongEnd}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default MixtapePlayerPage;