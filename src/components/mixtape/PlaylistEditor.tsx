import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Track } from '../../contexts/PlaylistContext';
import { searchTracks } from '../../services/musicService';
import './PlaylistEditor.css';

interface PlaylistEditorProps {
  tracks: Track[];
  onTracksChange: (tracks: Track[]) => void;
  readOnly?: boolean;
}

const PlaylistEditor: React.FC<PlaylistEditorProps> = ({ 
  tracks, 
  onTracksChange,
  readOnly = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedService, setSelectedService] = useState<'spotify' | 'youtube' | 'applemusic'>('spotify');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchTracks(searchQuery, selectedService);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching tracks:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTrack = (track: Track) => {
    if (readOnly) return;
    
    onTracksChange([...tracks, track]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveTrack = (index: number) => {
    if (readOnly) return;
    
    const updatedTracks = [...tracks];
    updatedTracks.splice(index, 1);
    onTracksChange(updatedTracks);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination || readOnly) return;
    
    const items = Array.from(tracks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onTracksChange(items);
  };

  return (
    <div className="playlist-editor">
      {!readOnly && (
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for tracks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              className="search-btn"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
          
          <div className="service-selector">
            <button 
              className={`service-btn ${selectedService === 'spotify' ? 'active' : ''}`}
              onClick={() => setSelectedService('spotify')}
            >
              Spotify
            </button>
            <button 
              className={`service-btn ${selectedService === 'youtube' ? 'active' : ''}`}
              onClick={() => setSelectedService('youtube')}
            >
              YouTube
            </button>
            <button 
              className={`service-btn ${selectedService === 'applemusic' ? 'active' : ''}`}
              onClick={() => setSelectedService('applemusic')}
            >
              Apple Music
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              <ul className="results-list">
                {searchResults.map((track) => (
                  <li key={track.id} className="result-item">
                    <img 
                      src={track.imageUrl} 
                      alt={track.title} 
                      className="track-image"
                    />
                    <div className="track-info">
                      <div className="track-title">{track.title}</div>
                      <div className="track-artist">{track.artist}</div>
                    </div>
                    <button 
                      className="add-btn"
                      onClick={() => handleAddTrack(track)}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      <div className="playlist-section">
        <h3>Tracks</h3>
        {tracks.length === 0 ? (
          <div className="empty-playlist">
            {readOnly 
              ? 'This mixtape is empty.' 
              : 'Search for tracks to add to your mixtape.'}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="playlist">
              {(provided) => (
                <ul 
                  className="playlist-tracks"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {tracks.map((track, index) => (
                    <Draggable 
                      key={track.id} 
                      draggableId={track.id} 
                      index={index}
                      isDragDisabled={readOnly}
                    >
                      {(provided) => (
                        <li
                          className="playlist-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div className="track-number">{index + 1}.</div>
                          <img 
                            src={track.imageUrl} 
                            alt={track.title} 
                            className="track-image"
                          />
                          <div className="track-info">
                            <div className="track-title">{track.title}</div>
                            <div className="track-artist">{track.artist}</div>
                          </div>
                          {!readOnly && (
                            <button 
                              className="remove-btn"
                              onClick={() => handleRemoveTrack(index)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          )}
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
};

export default PlaylistEditor;