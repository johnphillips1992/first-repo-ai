import React, { useState, useEffect, useRef } from 'react';
import './CassetteDeck.css';
import { Track } from '../../contexts/PlaylistContext';

interface CassetteDeckProps {
  tracks: Track[];
  coverImage: string;
  title: string;
}

const CassetteDeck: React.FC<CassetteDeckProps> = ({ tracks, coverImage, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isEjected, setIsEjected] = useState(false);
  const [animation, setAnimation] = useState('');

  // Refs for tape reels
  const leftReelRef = useRef<HTMLDivElement>(null);
  const rightReelRef = useRef<HTMLDivElement>(null);

  // Simulated audio playback
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && tracks.length > 0) {
      // Rotate the reels
      animateReels(true);
      
      // Move to the next track every 30 seconds (simulated playback)
      interval = setInterval(() => {
        setCurrentTrackIndex((prevIndex) => {
          if (prevIndex >= tracks.length - 1) {
            // Stop at the end of the playlist
            setIsPlaying(false);
            return prevIndex;
          }
          return prevIndex + 1;
        });
      }, 30000);
    } else {
      animateReels(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, tracks]);

  const animateReels = (active: boolean) => {
    if (leftReelRef.current && rightReelRef.current) {
      if (active) {
        leftReelRef.current.style.animation = 'spin 2s linear infinite';
        rightReelRef.current.style.animation = 'spin 2s linear infinite';
      } else {
        leftReelRef.current.style.animation = 'none';
        rightReelRef.current.style.animation = 'none';
      }
    }
  };

  const handlePlay = () => {
    if (tracks.length === 0) return;
    
    setIsPlaying(true);
    setAnimation('tape-playing');
  };

  const handlePause = () => {
    setIsPlaying(false);
    setAnimation('');
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTrackIndex(0);
    setAnimation('');
  };

  const handleEject = () => {
    setIsPlaying(false);
    setIsEjected(!isEjected);
    setAnimation(isEjected ? 'tape-inserting' : 'tape-ejecting');
    
    // Reset after animation
    setTimeout(() => {
      if (!isEjected) {
        setCurrentTrackIndex(0);
      }
    }, 1000);
  };

  const handleFastForward = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };

  const handleRewind = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="cassette-deck">
      <div className="cassette-window">
        <div className={`cassette ${isEjected ? 'ejected' : ''} ${animation}`}>
          <div className="cassette-label">
            <img 
              src={coverImage || '/default-mixtape-cover.jpg'} 
              alt={title} 
              className="cassette-cover"
            />
            <div className="cassette-title">{title}</div>
          </div>
          <div className="cassette-reels">
            <div className="reel left-reel" ref={leftReelRef}></div>
            <div className="tape"></div>
            <div className="reel right-reel" ref={rightReelRef}></div>
          </div>
        </div>
      </div>
      
      <div className="deck-display">
        {tracks.length > 0 && currentTrack ? (
          <div className="track-info">
            <div className="track-title">{currentTrack.title}</div>
            <div className="track-artist">{currentTrack.artist}</div>
          </div>
        ) : (
          <div className="no-tracks">No tracks available</div>
        )}
        <div className="track-counter">
          Track {tracks.length > 0 ? currentTrackIndex + 1 : 0} of {tracks.length}
        </div>
      </div>
      
      <div className="deck-controls">
        <button 
          className="control-btn rewind-btn" 
          onClick={handleRewind}
          disabled={isEjected || currentTrackIndex === 0}
        >
          <i className="fas fa-backward"></i>
        </button>
        
        {isPlaying ? (
          <button 
            className="control-btn pause-btn" 
            onClick={handlePause}
            disabled={isEjected}
          >
            <i className="fas fa-pause"></i>
          </button>
        ) : (
          <button 
            className="control-btn play-btn" 
            onClick={handlePlay}
            disabled={isEjected || tracks.length === 0}
          >
            <i className="fas fa-play"></i>
          </button>
        )}
        
        <button 
          className="control-btn stop-btn" 
          onClick={handleStop}
          disabled={isEjected}
        >
          <i className="fas fa-stop"></i>
        </button>
        
        <button 
          className="control-btn ff-btn" 
          onClick={handleFastForward}
          disabled={isEjected || currentTrackIndex === tracks.length - 1}
        >
          <i className="fas fa-forward"></i>
        </button>
        
        <button 
          className="control-btn eject-btn" 
          onClick={handleEject}
        >
          <i className={`fas fa-${isEjected ? 'sign-in-alt' : 'eject'}`}></i>
        </button>
      </div>
    </div>
  );
};

export default CassetteDeck;