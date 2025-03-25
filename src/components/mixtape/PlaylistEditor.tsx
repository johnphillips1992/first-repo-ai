import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Song } from '../contexts/MixtapeContext';
import MusicSearchModal from './MusicSearchModal';
import './PlaylistManager.css';

interface PlaylistManagerProps {
  songs: Song[];
  onSongsChange: (songs: Song[]) => void;
}

const PlaylistManager: React.FC<PlaylistManagerProps> = ({ songs, onSongsChange }) => {
  const [playlist, setPlaylist] = useState<Song[]>(songs);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  // Update internal state when props change
  useEffect(() => {
    setPlaylist(songs);
  }, [songs]);

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(playlist);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPlaylist(items);
    onSongsChange(items);
  };

  // Handle adding a song to the playlist
  const handleAddSong = (song: Song) => {
    const updatedPlaylist = [...playlist, song];
    setPlaylist(updatedPlaylist);
    onSongsChange(updatedPlaylist);
    setIsSearchOpen(false);
  };

  // Handle removing a song from the playlist
  const handleRemoveSong = (index: number) => {
    const updatedPlaylist = [...playlist];
    updatedPlaylist.splice(index, 1);
    setPlaylist(updatedPlaylist);
    onSongsChange(updatedPlaylist);
  };

  // Total duration of the playlist in seconds
  const totalDuration = playlist.reduce((total, song) => {
    return total + (song.duration || 0);
  }, 0);

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
  };

  return (
    <div className="playlist-manager">
      <div className="playlist-header">
        <h3>Mixtape Playlist</h3>
        <button 
          className="add-song-button" 
          onClick={() => setIsSearchOpen(true)}
          aria-label="Add song to playlist"
        >
          Add Song
        </button>
      </div>
      
      {playlist.length === 0 ? (
        <div className="empty-playlist">
          Your mixtape is empty! Click "Add Song" to start building your playlist.
        </div>
      ) : (
        <div className="playlist-container">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="playlist">
              {(provided) => (
                <ul
                  className="song-list"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {playlist.map((song, index) => (
                    <Draggable key={song.id} draggableId={song.id} index={index}>
                      {(provided) => (
                        <li
                          className="song-item"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div className="song-number">{index + 1}</div>
                          <div className="song-info">
                            <h4>{song.title}</h4>
                            <p>{song.artist}</p>
                          </div>
                          <div className="song-duration">
                            {song.duration ? formatDuration(song.duration) : '--:--'}
                          </div>
                          <button 
                            className="remove-song-button" 
                            onClick={() => handleRemoveSong(index)}
                            aria-label={`Remove ${song.title} from playlist`}
                          >
                            ✕
                          </button>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
          
          <div className="playlist-info">
            <div>{playlist.length} songs</div>
            <div>Total time: {formatDuration(totalDuration)}</div>
          </div>
        </div>
      )}
      
      {isSearchOpen && (
        <MusicSearchModal 
          onAddSong={handleAddSong} 
          onClose={() => setIsSearchOpen(false)} 
        />
      )}
    </div>
  );
};

export default PlaylistManager;