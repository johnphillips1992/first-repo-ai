import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaylist, Track } from '../contexts/PlaylistContext';
import CassetteDeck from '../components/mixtape/CassetteDeck';
import PlaylistEditor from '../components/mixtape/PlaylistEditor';
import NoteEditor from '../components/mixtape/NoteEditor';
import './CreateMixtapePage.css';

const CreateMixtapePage: React.FC = () => {
  const navigate = useNavigate();
  const { createMixtape } = usePlaylist();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [note, setNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (tracks.length === 0) {
      newErrors.tracks = 'At least one track is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      const mixtapeId = await createMixtape({
        title,
        description,
        coverImage: coverImage || '/default-mixtape-cover.jpg',
        tracks,
        note,
        createdBy: '',  // This will be set by the backend
        collaborators: [],
        isPublic
      });
      
      navigate(`/mixtape/${mixtapeId}`);
    } catch (error) {
      console.error('Error creating mixtape:', error);
      setErrors({ submit: 'Failed to create mixtape. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type and size
    if (!file.type.startsWith('image/')) {
      setErrors({ coverImage: 'Please upload an image file' });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ coverImage: 'Image size should be less than 5MB' });
      return;
    }
    
    setUploadingImage(true);
    try {
      // In a real app, you would upload to a storage service
      // For this example, we'll use a local URL
      const imageUrl = URL.createObjectURL(file);
      setCoverImage(imageUrl);
      setErrors({});
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors({ coverImage: 'Failed to upload image. Please try again.' });
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="create-mixtape-page">
      <h1>Create Your Mixtape</h1>
      
      <form onSubmit={handleSubmit} className="create-mixtape-form">
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Mixtape"
              className={errors.title ? 'error' : ''}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this mixtape all about?"
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="coverImage">Cover Image</label>
            <div className="image-upload">
              <input
                type="file"
                id="coverImage"
                accept="image/*"
                onChange={handleImageUpload}
                className="file-input"
              />
              <div className="image-preview">
                {coverImage ? (
                  <img src={coverImage} alt="Cover Preview" />
                ) : (
                  <div className="no-image">No image selected</div>
                )}
              </div>
              <label htmlFor="coverImage" className="upload-btn">
                {uploadingImage ? 'Uploading...' : 'Choose Image'}
              </label>
            </div>
            {errors.coverImage && (
              <div className="error-message">{errors.coverImage}</div>
            )}
          </div>
          
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Make this mixtape public
            </label>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Add Tracks</h2>
          <PlaylistEditor 
            tracks={tracks} 
            onTracksChange={setTracks} 
          />
          {errors.tracks && <div className="error-message">{errors.tracks}</div>}
        </div>
        
        <div className="form-section">
          <h2>Add a Note</h2>
          <NoteEditor 
            initialNote={note} 
            onSave={setNote} 
          />
        </div>
        
        <div className="mixtape-preview">
          <h2>Preview</h2>
          <CassetteDeck 
            tracks={tracks} 
            coverImage={coverImage || '/default-mixtape-cover.jpg'} 
            title={title || 'Untitled Mixtape'} 
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Mixtape...' : 'Create Mixtape'}
          </button>
          <button 
            type="button" 
            className="cancel-btn"
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </button>
        </div>
        
        {errors.submit && (
          <div className="error-message submit-error">{errors.submit}</div>
        )}
      </form>
    </div>
  );
};

export default CreateMixtapePage;