import React, { useState, useRef, useEffect } from 'react';
import './NoteEditor.css';

interface NoteEditorProps {
  initialNote: string;
  onNoteChange: (note: string) => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ initialNote, onNoteChange }) => {
  const [note, setNote] = useState(initialNote);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // When initialNote prop changes, update the state
  useEffect(() => {
    setNote(initialNote);
  }, [initialNote]);

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Save note when exiting edit mode
      onNoteChange(note);
    }
    setIsEditing(!isEditing);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  };

  return (
    <div className="note-editor">
      <div className="note-header">
        <h3>Mixtape Notes</h3>
        <button 
          className="note-edit-button" 
          onClick={handleEditToggle}
          aria-label={isEditing ? "Save note" : "Edit note"}
        >
          {isEditing ? 'Save' : 'Edit'}
        </button>
      </div>
      <div className="note-content">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            className="note-textarea"
            value={note}
            onChange={handleNoteChange}
            placeholder="Add your personal note here..."
          />
        ) : (
          <div className="note-display">
            {note ? (
              <div className="handwritten-note">{note}</div>
            ) : (
              <div className="empty-note">No notes yet. Click 'Edit' to add a personal touch to your mixtape.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;