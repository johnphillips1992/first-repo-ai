import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlaylist, Mixtape } from '../contexts/PlaylistContext';
import { useAuth } from '../contexts/AuthContext';
import CassetteDeck from '../components/mixtape/CassetteDeck';
import PlaylistEditor from '../components/mixtape/PlaylistEditor';
import NoteEditor from '../components/mixtape/NoteEditor';
import './MixtapeDetailsPage.css';

const MixtapeDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMixtapeById, updateMixtape, deleteMixtape } = usePlaylist();
  const { currentUser } = useAuth();
  
  const [mixtape, setMixtape] = useState<Mixtape | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Mixtape ID is missing');
      setLoading(false);
      return;
    }
    
    const fetchMixtape = async () => {
      try {
        const mixtapeData = await getMixtapeById(id);
        if (!mixtapeData) {
          setError('Mixtape not found');
        } else {
          setMixtape(mixtapeData);
          
          // Check if current user is owner or collaborator
          if (currentUser) {
            setIsOwner(mixtapeData.createdBy === currentUser.uid);
            setIsCollaborator(mixtapeData.collaborators.includes(currentUser.uid));
          }
        }
      } catch (error) {
        console.error('Error fetching mixtape:', error);
        setError('Failed to load mixtape');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMixtape();
  }, [id, getMixtapeById, currentUser]);

  const handleUpdateNote = async (note: string) => {
    if (!mixtape || (!isOwner && !isCollaborator)) return;
    
    try {
      await updateMixtape(mixtape.id, { note });
      setMixtape({ ...mixtape, note });
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Failed to update note');
    }
  };

  const handleShare = () => {
    if (!mixtape) return;
    
    navigator.clipboard.writeText(window.location.href);
    alert('Mixtape link copied to clipboard!');
  };

  const handleDelete = async () => {
    if (!mixtape || !isOwner) return;
    
    try {
      await deleteMixtape(mixtape.id);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting mixtape:', error);
      setError('Failed to delete mixtape');
    }
  };

  if (loading) {
    return <div className="loading">Loading mixtape...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!mixtape) {
    return <div className="not-found">Mixtape not found</div>;
  }

  const canEdit = isOwner || isCollaborator;

  return (
    <div className="mixtape-details">
      <div className="mixtape-header">
        <h1>{mixtape.title}</h1>
        <p className="mixtape-description">{mixtape.description}</p>
        
        <div className="mixtape-meta">
          <div className="mixtape-owner">
            Created by: {mixtape.createdBy}
          </div>
          <div className="mixtape-date">
            {mixtape.createdAt.toLocaleDateString()}
          </div>
        </div>
        
        <div className="mixtape-actions">
          <button 
            className="share-btn"
            onClick={handleShare}
          >
            <i className="fas fa-share-alt"></i> Share
          </button>
          
          {isOwner && (
            <>
              <button 
                className="edit-btn"
                onClick={() => navigate(`/edit-mixtape/${mixtape.id}`)}
              >
                <i className="fas fa-edit"></i> Edit
              </button>
              
              <button 
                className="delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <i className="fas fa-trash"></i> Delete
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="mixtape-content">
        <div className="mixtape-player">
          <CassetteDeck 
            tracks={mixtape.tracks} 
            coverImage={mixtape.coverImage} 
            title={mixtape.title} 
          />
        </div>
        
        <div className="mixtape-tracks">
          <h2>Tracks</h2>
          <PlaylistEditor 
            tracks={mixtape.tracks} 
            onTracksChange={() => {}} 
            readOnly={true} 
          />
        </div>
        
        <div className="mixtape-note">
          <h2>Note</h2>
          <NoteEditor 
            initialNote={mixtape.note} 
            onSave={handleUpdateNote} 
            readOnly={!canEdit} 
          />
        </div>
      </div>
      
      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-content">
            <h2>Delete Mixtape?</h2>
            <p>Are you sure you want to delete this mixtape? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="confirm-btn"
                onClick={handleDelete}
              >
                Yes, Delete
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MixtapeDetailsPage;