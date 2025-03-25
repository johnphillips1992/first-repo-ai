import React, { useState, useRef, useEffect } from 'react';
import './NoteEditor.css';

interface NoteEditorProps {
  initialNote: string;
  onSave: (note: string) => void;
  readOnly?: boolean;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ 
  initialNote, 
  onSave,
  readOnly = false
}) => {
  const [note, setNote] = useState(initialNote || '');
  const [isEditing, setIsEditing] = useState(false);
  const [fontFamily, setFontFamily] = useState('Indie Flower');
  const [textColor, setTextColor] = useState('#000000');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (readOnly) return;
    setIsEditing(true);
  };

  const handleSave = () => {
    onSave(note);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setNote(initialNote);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="note-editor editing">
        <div className="note-toolbar">
          <select 
            value={fontFamily} 
            onChange={(e) => setFontFamily(e.target.value)}
            className="font-select"
          >
            <option value="Indie Flower">Handwritten</option>
            <option value="Permanent Marker">Marker</option>
            <option value="Dancing Script">Cursive</option>
            <option value="Caveat">Casual</option>
          </select>
          
          <input 
            type="color" 
            value={textColor} 
            onChange={(e) => setTextColor(e.target.value)}
            className="color-picker"
          />
        </div>
        
        <textarea
          ref={textareaRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a handwritten note to your mixtape..."
          style={{ fontFamily, color: textColor }}
          className="note-textarea"
        />
        
        <div className="note-actions">
          <button 
            onClick={handleSave} 
            className="btn save-btn"
          >
            Save
          </button>
          <button 
            onClick={handleCancel} 
            className="btn cancel-btn"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="note-editor display"
      onClick={handleEdit}
    >
      {note ? (
        <div 
          className="note-content"
          style={{ fontFamily, color: textColor }}
        >
          {note.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      ) : (
        !readOnly && (
          <div className="no-note">
            <p>Click to add a handwritten note</p>
          </div>
        )
      )}
      
      {!readOnly && (
        <button 
          className="edit-btn"
          onClick={handleEdit}
        >
          <i className="fas fa-pen"></i>
        </button>
      )}
    </div>
  );
};

export default NoteEditor;