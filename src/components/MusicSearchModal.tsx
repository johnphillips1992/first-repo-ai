import React, { useState, useEffect } from 'react';
import { Song } from '../contexts/MixtapeContext';
import './MusicSearchModal.css';
import { searchMusic } from '../services/musicApi';

interface MusicSearchModalProps {
  onAddSong: (song: Song) => void;
  onClose: () => void;
}

const MusicSearchModal: React.FC<MusicSearchModalProps> = ({ onAddSong, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Search for music when query changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (searchQuery.trim().length < 3) return;
    
    setLoading(true);
    setError('');
    
    try {
      const results = await searchMusic(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching for music:', err);
      setError('Failed to search for music. Please try again.');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="music-search-modal">
        <div className="modal-header">
          <h3>Search for Music</h3>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close search"
          >
            ✕
          </button>
        </div>
        
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search for songs, artists, or albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="search-results">
          {loading && <div className="loading">Searching...</div>}
          
          {error && <div className="error-message">{error}</div>}
          
          {!loading && !error && searchResults.length === 0 && (
            <div className="no-results">
              {searchQuery.trim().length > 2 
                ? 'No results found. Try a different search.' 
                : 'Enter at least 3 characters to search.'}
            </div>
          )}
          
          {!loading && !error && searchResults.length > 0 && (
            <ul className="results-list">
              {searchResults.map((song) => (
                <li key={song.id} className="result-item">
                  <div className="result-info">
                    <div className="song-image">
                      {song.imageUrl ? (
                        <img src={song.imageUrl} alt={song.title} />
                      ) : (
                        <div className="placeholder-image">🎵</div>
                      )}
                    </div>
                    <div className="song-details">
                      <h4>{song.title}</h4>
                      <p>{song.artist}</p>
                      {song.album && <p className="album-name">{song.album}</p>}
                    </div>
                  </div>
                  <button 
                    className="add-button" 
                    onClick={() => onAddSong(song)}
                    aria-label={`Add ${song.title} to playlist`}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicSearchModal;