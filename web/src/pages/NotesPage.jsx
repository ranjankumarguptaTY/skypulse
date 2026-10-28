import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { NoteModal } from '../components/NoteModal';
import { api } from '../services/api';

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

export const NotesPage = () => {
  const [notes, setNotes] = useState([]);
  const [archivedNotes, setArchivedNotes] = useState([]);
  const [viewArchived, setViewArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalNote, setActiveModalNote] = useState(null);

  // New Note state
  const [isExpanded, setIsExpanded] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('#141428');
  const [newPinned, setNewPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    try {
      const [activeList, archivedList] = await Promise.all([
        api.get('/notes'),
        api.get('/notes/archived'),
      ]);
      setNotes(activeList);
      setArchivedNotes(archivedList);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async () => {
    if (!newTitle.trim() && !newContent.trim()) {
      setIsExpanded(false);
      return;
    }

    try {
      setLoading(true);
      const created = await api.post('/notes', {
        title: newTitle.trim(),
        content: newContent.trim(),
        color: newColor,
        isPinned: newPinned,
      });
      setNotes((prev) => [created, ...prev]);
      setNewTitle('');
      setNewContent('');
      setNewColor('#141428');
      setNewPinned(false);
      setIsExpanded(false);
    } catch (err) {
      console.error('Create note failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (id, updates) => {
    try {
      const updated = await api.put(`/notes/${id}`, updates);
      fetchNotes();
    } catch (err) {
      console.error('Update note failed:', err);
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
      setArchivedNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Delete note failed:', err);
    }
  };

  const currentList = viewArchived ? archivedNotes : notes;
  const filteredNotes = currentList.filter(
    (n) =>
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedList = filteredNotes.filter((n) => n.isPinned);
  const othersList = filteredNotes.filter((n) => !n.isPinned);

  return (
    <div className="notes-page page-enter">
      <div className="notes-content">
        <Navbar />

        {/* Header & Controls */}
        <div className="flex-between mt-24 mb-16" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              Meteorological Logs & Notes
            </h1>
            <p className="text-sm text-secondary">
              Field observations, calibration values, and personal research memos
            </p>
          </div>

          <div className="flex-center gap-8">
            <button
              type="button"
              className={`btn btn-sm ${!viewArchived ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewArchived(false)}
            >
              Active Notes ({notes.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewArchived ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewArchived(true)}
            >
              📥 Archive ({archivedNotes.length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ maxWidth: '600px', margin: '0 auto 24px' }}>
          <div className="search-input-wrapper">
            <input
              type="text"
              className="sidebar-search-input"
              placeholder="Search telemetry records and memos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Create Note Card (Google Keep style) */}
        {!viewArchived && (
          <div
            className="notes-create"
            style={{ background: newColor }}
          >
            {isExpanded && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px 0' }}>
                <input
                  type="text"
                  className="notes-create-input notes-create-title"
                  placeholder="Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setNewPinned(!newPinned)}
                  style={{ opacity: newPinned ? 1 : 0.4 }}
                  title={newPinned ? 'Unpin' : 'Pin note'}
                >
                  📌
                </button>
              </div>
            )}

            <textarea
              className="notes-create-input"
              placeholder={isExpanded ? 'Take a note...' : 'Take a field note or observation...'}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              rows={isExpanded ? 3 : 1}
              style={{ resize: 'none' }}
            />

            {isExpanded && (
              <div className="notes-create-actions">
                <div className="notes-color-picker">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-dot ${newColor === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setNewColor(c)}
                    />
                  ))}
                </div>

                <div className="flex-center gap-8">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setIsExpanded(false);
                      setNewTitle('');
                      setNewContent('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleCreateNote}
                    disabled={loading}
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pinned Notes Section */}
        {pinnedList.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <div className="text-xs text-muted mb-8" style={{ letterSpacing: '1px', fontWeight: 700 }}>
              PINNED OBSERVATIONS
            </div>
            <div className="notes-grid">
              {pinnedList.map((n) => (
                <div
                  key={n._id}
                  className="note-card"
                  style={{ background: n.color || '#141428' }}
                  onClick={() => setActiveModalNote(n)}
                >
                  <span className="note-pin-icon">📌</span>
                  {n.title && <h3 className="note-card-title">{n.title}</h3>}
                  <p className="note-card-content">{n.content}</p>

                  <div className="note-card-footer" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleUpdateNote(n._id, { isPinned: false })}
                      title="Unpin"
                    >
                      📌
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleUpdateNote(n._id, { isArchived: true })}
                      title="Archive"
                    >
                      📥
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteNote(n._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Others Section */}
        <div>
          {pinnedList.length > 0 && othersList.length > 0 && (
            <div className="text-xs text-muted mb-8" style={{ letterSpacing: '1px', fontWeight: 700 }}>
              ALL OBSERVATIONS
            </div>
          )}

          {filteredNotes.length === 0 ? (
            <div className="card text-center" style={{ padding: '60px 20px', maxWidth: '400px', margin: '40px auto' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💡</div>
              <h3>{viewArchived ? 'No archived notes' : 'No notes yet'}</h3>
              <p className="text-xs text-muted mt-8">
                {viewArchived
                  ? 'Archived field logs will be cataloged here.'
                  : 'Capture station telemetry logs, weather checklists, or secret personal notes.'}
              </p>
            </div>
          ) : (
            <div className="notes-grid">
              {othersList.map((n) => (
                <div
                  key={n._id}
                  className="note-card"
                  style={{ background: n.color || '#141428' }}
                  onClick={() => setActiveModalNote(n)}
                >
                  {n.title && <h3 className="note-card-title">{n.title}</h3>}
                  <p className="note-card-content">{n.content}</p>

                  <div className="note-card-footer" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleUpdateNote(n._id, { isPinned: true })}
                      title="Pin note"
                    >
                      📌
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleUpdateNote(n._id, { isArchived: !n.isArchived })}
                      title={n.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      📥
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteNote(n._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Note Edit Modal */}
        <NoteModal
          note={activeModalNote}
          isOpen={!!activeModalNote}
          onClose={() => setActiveModalNote(null)}
          onSave={handleUpdateNote}
          onDelete={handleDeleteNote}
        />
      </div>
    </div>
  );
};
