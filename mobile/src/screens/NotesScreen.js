import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { api } from '../services/api';

const COLORS = ['#141428', '#2a1b3d', '#1b323d', '#1b3d2b', '#3d281b', '#3d1b28'];

export const NotesScreen = () => {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('#141428');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    try {
      const data = await api.get('/notes');
      setNotes(data || []);
    } catch (err) {
      console.warn('Failed to fetch notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreate = async () => {
    if (!title.trim() && !content.trim()) {
      setExpanded(false);
      return;
    }
    setLoading(true);
    try {
      const created = await api.post('/notes', {
        title: title.trim(),
        content: content.trim(),
        color: selectedColor,
      });
      setNotes((prev) => [created, ...prev]);
      setTitle('');
      setContent('');
      setSelectedColor('#141428');
      setExpanded(false);
    } catch (err) {
      console.warn('Failed to save note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.warn('Failed to delete note:', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Field Observations & Memos</Text>
      </View>

      {/* Create Note Card */}
      <View style={[styles.createCard, { backgroundColor: selectedColor }]}>
        {expanded && (
          <TextInput
            style={styles.titleInput}
            placeholder="Title"
            placeholderTextColor="#5c5c72"
            value={title}
            onChangeText={setTitle}
          />
        )}
        <TextInput
          style={styles.contentInput}
          placeholder={expanded ? 'Take observation note...' : 'Take a note or field memo...'}
          placeholderTextColor="#5c5c72"
          value={content}
          onChangeText={setContent}
          onFocus={() => setExpanded(true)}
          multiline={expanded}
        />

        {expanded && (
          <View style={styles.actionRow}>
            <View style={styles.colorPalette}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorDotActive,
                  ]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleCreate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#06060f" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Notes List */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16 }}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <View
            style={[
              styles.noteCard,
              { backgroundColor: item.color || '#141428' },
            ]}
          >
            {item.title ? <Text style={styles.noteTitle}>{item.title}</Text> : null}
            <Text style={styles.noteContent} numberOfLines={5}>
              {item.content}
            </Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item._id)}
            >
              <Text style={{ fontSize: 12 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060f',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    color: '#f0f0f8',
    fontSize: 16,
    fontWeight: '700',
  },
  createCard: {
    margin: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  titleInput: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  contentInput: {
    color: '#f0f0f8',
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 8,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorDotActive: {
    borderColor: '#fff',
    borderWidth: 2,
  },
  saveBtn: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#06060f',
    fontSize: 12,
    fontWeight: '700',
  },
  noteCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 90,
  },
  noteTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  noteContent: {
    color: '#9898b0',
    fontSize: 12,
    lineHeight: 16,
  },
  deleteBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    opacity: 0.7,
  },
});
