import React, { useState, useEffect } from 'react';

const NOTE_COLORS = [
  '#141428', // default deep navy
  '#2a1b3d', // amethyst
  '#1b323d', // oceanic cyan
  '#1b3d2b', // forest emerald
  '#3d281b', // amber wood
  '#3d1b28', // ruby wine
  '#252538', // slate steel
  '#1f2421', // midnight pine
];

export const NoteModal = ({ note, isOpen, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('#141428');
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setColor(note.color || '#141428');
      setIsPinned(note.isPinned || false);
      setIsArchived(note.isArchived || false);
    }
  }, [note]);

  if (!isOpen || !note) return null;

  const handleSave = () => {
    onSave(note._id, {
      title,
      content,
      color,
      isPinned,
      isArchived,
    });
    onClose();
  };

  return (
    <div className="modal-overlay note-edit-modal" onClick={onClose}>
      <div
        className="modal"
        style={{ background: color, borderColor: 'rgba(255,255,255,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input
            type="text"
            className="note-edit-title"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setIsPinned(!isPinned)}
            title={isPinned ? 'Unpin' : 'Pin note'}
            style={{ fontSize: '1.1rem', opacity: isPinned ? 1 : 0.4 }}
          >
            📌
          </button>
        </div>

        <textarea
          className="note-edit-content"
          placeholder="Take a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
        />

        <div className="note-edit-footer">
          <div className="notes-color-picker">
            {NOTE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`color-dot ${color === c ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setIsArchived(!isArchived);
                onSave(note._id, { isArchived: !isArchived });
                onClose();
              }}
              title={isArchived ? 'Unarchive' : 'Archive'}
            >
              📥
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                onDelete(note._id);
                onClose();
              }}
              title="Delete note"
            >
              🗑️
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
