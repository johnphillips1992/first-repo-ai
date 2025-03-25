import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMixtape, Song } from '../contexts/MixtapeContext';
import './CreateMixtapePage.css';

const CreateMixtapePage: React.FC = () => {
  const navigate = useNavigate();
  const { createMixtape } = useMixtape();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [songs] = useState<Song[]>([]);
  const [notes] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle cover image upload
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrors({ ...errors, coverImage: 'Please upload a valid image file (JPEG, PNG, GIF)' });
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, coverImage: 'Image file should be less than 2MB' });
      return;
    }

    // Convert to base64 for preview and storage
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCoverImage(result);
      setErrors({ ...errors, coverImage: '' });
    };
    reader.readAsDataURL(file);
  };

  // Validate form before submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (songs.length === 0) {
      newErrors.songs = 'You need to add at least one song to your mixtape';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const mixtapeId = await createMixtape({
        title,
        description,
        coverImage: coverImage || '/default-mixtape.jpg', // Use default if none uploaded
        songs,
        notes,
        createdBy: '', // This will be set by the createMixtape function
        isPublic
      });
      
      // Navigate to the new mixtape page
      navigate(`/mixtape/${mixtapeId}`);
    } catch (error) {
      console.error('Error creating mixtape:', error);
      setErrors({ ...errors, submit: 'Failed to create mixtape. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-mixtape-page">
      <h1>Create Your Mixtape</h1>
      
      <form onSubmit={handleSubmit} className="mixtape-form">
        <div className="form-section">
          <h2>Mixtape Details</h2>
          
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter mixtape title"
              maxLength={50}
            />
            {errors.title && <div className="error-message">{errors.title}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this mixtape about?"
              maxLength={200}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="coverImage">Cover Image (optional)</label>
            <div className="cover-image-container">
              {coverImage ? (
                <img src={coverImage} alt="Mixtape cover" className="cover-preview" />
              ) : (
                <div className="cover-placeholder">Upload a cover image</div>
              )}
              <input
                type="file"
                id="coverImage"
                onChange={handleCoverImageUpload}
                accept="image/jpeg, image/png, image/gif"
              />
            </div>
            {errors.coverImage && <div className="error-message">{errors.coverImage}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="isPublic" className="checkbox-label">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Make this mixtape public
            </label>
          </div>
        </div>

        
        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="create-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Mixtape'}
          </button>
        </div>
        
        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
      </form>
    </div>
  );
};

export default CreateMixtapePage;