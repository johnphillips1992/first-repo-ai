import React, { useState, useEffect, useRef } from 'react';
import { Track } from '../../types';

interface CassetteDeckProps {
  tracks: Track[];
  onTrackChange?: (trackIndex: number) => void;
}

const CassetteDeck: React.FC<CassetteDeckProps> = ({ tracks, onTrackChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<number | null>(null);

  const currentTrack = tracks[currentTrackIndex];

  // Handle play/pause
  const togglePlayPause = () => {
    if (tracks.length === 0) return;
    
    setIsPlaying(prev => !prev);
  };

  // Handle next track
  const nextTrack = () => {
    if (tracks.length === 0) return;
    
    const newIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(newIndex);
    setElapsedTime(0);
    
    if (onTrackChange) {
      onTrackChange(newIndex);
    }
  };

  // Handle previous track
  const prevTrack = () => {
    if (tracks.length === 0) return;
    
    const newIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(newIndex);
    setElapsedTime(0);
    
    if (onTrackChange) {
      onTrackChange(newIndex);
    }
  };

  // Initialize the elapsed time timer when play status changes
  useEffect(() => {
    if (isPlaying && tracks.length > 0) {
      timerRef.current = window.setInterval(() => {
        setElapsedTime(prev => {
          // If we've reached the end of the track, move to the next one
          if (prev >= currentTrack.duration) {
            nextTrack();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, currentTrackIndex, tracks.length]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg max-w-2xl mx-auto">
      <div className="bg-gray-700 p-4 rounded-md mb-4 relative overflow-hidden">
        {/* Cassette tape visualization */}
        <div className="relative h-40 bg-black rounded-md flex items-center justify-center">
          <div className="text-white text-center p-4">
            {tracks.length > 0 ? (
              <>
                <div className="text-xl font-bold">{currentTrack.title}</div>
                <div className="text-gray-400">{currentTrack.artist}</div>
              </>
            ) : (
              <div className="text-gray-400">No tracks available</div>
            )}
          </div>
          
          {/* Tape reels that rotate when playing */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div 
              className={`absolute top-1/2 left-6 w-12 h-12 bg-gray-800 rounded-full transition-transform transform -translate-y-1/2 ${
                isPlaying ? 'animate-spin' : ''
              }`}
            />
            <div 
              className={`absolute top-1/2 right-6 w-12 h-12 bg-gray-800 rounded-full transition-transform transform -translate-y-1/2 ${
                isPlaying ? 'animate-spin' : ''
              }`}
            />
          </div>
        </div>
        
        {/* Time display */}
        <div className="flex justify-between text-white mt-2">
          <div>{formatTime(elapsedTime)}</div>
          <div>{currentTrack ? formatTime(currentTrack.duration) : '00:00'}</div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-900 h-2 rounded-full mt-2">
          <div 
            className="bg-blue-500 h-full rounded-full" 
            style={{ 
              width: `${currentTrack ? (elapsedTime / currentTrack.duration) * 100 : 0}%` 
            }}
          />
        </div>
      </div>
      
      {/* Control buttons */}
      <div className="flex justify-center space-x-6">
        <button 
          onClick={prevTrack}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-3"
          aria-label="Previous track"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          onClick={togglePlayPause}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          disabled={tracks.length === 0}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>
        
        <button 
          onClick={nextTrack}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-3"
          aria-label="Next track"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Track list */}
      <div className="mt-6">
        <h3 className="text-white text-lg font-bold mb-2">Tracks</h3>
        {tracks.length > 0 ? (
          <ul className="bg-gray-700 rounded-md divide-y divide-gray-600">
            {tracks.map((track, index) => (
              <li 
                key={track.id}
                className={`flex items-center p-3 ${
                  index === currentTrackIndex ? 'bg-gray-600' : ''
                } hover:bg-gray-600 cursor-pointer`}
                onClick={() => {
                  setCurrentTrackIndex(index);
                  setElapsedTime(0);
                  if (onTrackChange) {
                    onTrackChange(index);
                  }
                }}
              >
                <div className="w-8 text-white text-center">{index + 1}.</div>
                <div className="flex-grow">
                  <div className="text-white">{track.title}</div>
                  <div className="text-gray-400 text-sm">{track.artist}</div>
                </div>
                <div className="text-gray-400">{formatTime(track.duration)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 italic">No tracks in this mixtape yet.</p>
        )}
      </div>
    </div>
  );
};

export default CassetteDeck;