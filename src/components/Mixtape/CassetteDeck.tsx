import React, { useState, useEffect, useRef } from 'react';
import './CassetteDeck.css';

interface CassetteDeckProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onStop: () => void;
  onEject: () => void;
  coverImage?: string;
  mixtapeTitle: string;
}

const CassetteDeck: React.FC<CassetteDeckProps> = ({
  isPlaying,
  onPlayPause,
  onRewind,
  onFastForward,
  onStop,
  onEject,
  coverImage,
  mixtapeTitle
}) => {
  const [reelPosition, setReelPosition] = useState(0);
  const [isRewinding, setIsRewinding] = useState(false);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const animationRef = useRef<number | null>(null);

  // Handle tape animation
  useEffect(() => {
    if (!isPlaying && !isRewinding && !isFastForwarding) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let speed = 1;
    if (isRewinding) speed = -5;
    if (isFastForwarding) speed = 5;

    const animate = () => {
      setReelPosition((prev) => {
        // Loop the animation
        let newPosition = prev + speed;
        if (newPosition > 100) newPosition = 0;
        if (newPosition < 0) newPosition = 100;
        return newPosition;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, isRewinding, isFastForwarding]);

  const handleRewind = () => {
    setIsRewinding(true);
    onRewind();
    // Simulate rewinding for 2 seconds
    setTimeout(() => {
      setIsRewinding(false);
    }, 2000);
  };

  const handleFastForward = () => {
    setIsFastForwarding(true);
    onFastForward();
    // Simulate fast-forwarding for 2 seconds
    setTimeout(() => {
      setIsFastForwarding(false);
    }, 2000);
  };

  return (
    <div className="cassette-deck">
      <div className="cassette-deck-top">
        <div className="cassette-deck-display">
          <div className="cassette-title">{mixtapeTitle}</div>
          {isPlaying && <div className="playing-indicator">PLAYING</div>}
          {isRewinding && <div className="rewind-indicator">REWINDING</div>}
          {isFastForwarding && <div className="fastforward-indicator">FAST FORWARDING</div>}
        </div>
      </div>
      
      <div className="cassette-container">
        <div className="cassette">
          <div className="cassette-label">
            {coverImage ? (
              <img src={coverImage} alt={mixtapeTitle} className="cassette-cover" />
            ) : (
              <div className="cassette-default-cover">{mixtapeTitle}</div>
            )}
          </div>
          <div className="cassette-window">
            <div className="tape-reel left-reel" style={{ transform: `rotate(${reelPosition * 3.6}deg)` }}></div>
            <div className="tape-reel right-reel" style={{ transform: `rotate(${reelPosition * 3.6}deg)` }}></div>
            <div className="tape-path"></div>
          </div>
        </div>
      </div>
      
      <div className="cassette-controls">
        <button className="control-btn" onClick={onPlayPause} aria-label={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button className="control-btn" onClick={handleRewind} aria-label="Rewind">⏪</button>
        <button className="control-btn" onClick={onStop} aria-label="Stop">⏹️</button>
        <button className="control-btn" onClick={handleFastForward} aria-label="Fast Forward">⏩</button>
        <button className="control-btn" onClick={onEject} aria-label="Eject">⏏️</button>
      </div>
    </div>
  );
};

export default CassetteDeck;