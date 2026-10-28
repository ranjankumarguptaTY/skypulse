import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export const SecretSearchModal = () => {
  const { searchModalOpen, setSearchModalOpen, subscribeStation } = useChat();
  const { user } = useAuth();

  const [phoneInput, setPhoneInput] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [chatPin, setChatPin] = useState('');
  const [alias, setAlias] = useState('');
  const [notificationMask, setNotificationMask] = useState('Severe Weather Warning');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setSearchModalOpen(false);
    setPhoneInput('');
    setFoundUser(null);
    setChatPin('');
    setAlias('');
    setError('');
  };

  const handleLookup = async () => {
    const clean = phoneInput.trim().replace(/[\s-]/g, '');
    if (!clean) return;
    if (clean === user?.phoneNumber) {
      setError('Cannot add your own mobile number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/stations/lookup', { phoneNumber: clean });
      if (res.found) setFoundUser(res);
    } catch (err) {
      setError(err.message || 'No registered user found with this mobile number. User must register first.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!chatPin.trim()) {
      setError('Please set a security PIN for this chat.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await subscribeStation({
        phoneNumber: foundUser.phoneNumber,
        stationId: foundUser.stationId,
        pin: chatPin.trim(),
        alias: alias.trim() || foundUser.phoneNumber,
        notificationMask: notificationMask.trim(),
      });
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to save secret chat.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={searchModalOpen} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>📱 Add Registered Contact</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Connect by registered mobile number &amp; set your per-chat PIN
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!foundUser ? (
            <View>
              <Text style={styles.label}>TARGET USER MOBILE NUMBER</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +1 555 123 4567 or 9876543210"
                placeholderTextColor="#5c5c72"
                value={phoneInput}
                onChangeText={setPhoneInput}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
              <Text style={styles.noteText}>
                The contact must already be registered on SkyPulse.
              </Text>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={handleLookup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#06060f" />
                ) : (
                  <Text style={styles.btnText}>Verify Mobile Number</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.foundBadge}>
                <Text style={styles.foundText}>
                  User Verified: {foundUser.phoneNumber}
                </Text>
              </View>

              <Text style={styles.label}>SET PER-CHAT SECURITY PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="4–8 digit PIN chosen by you"
                placeholderTextColor="#5c5c72"
                value={chatPin}
                onChangeText={setChatPin}
                secureTextEntry
              />
              <Text style={styles.noteText}>
                Only you will need this PIN to open this specific chat.
              </Text>

              <Text style={styles.label}>CUSTOM SECRET ALIAS</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Alex, Relay Alpha"
                placeholderTextColor="#5c5c72"
                value={alias}
                onChangeText={setAlias}
              />

              <Text style={styles.label}>NOTIFICATION DISGUISE NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Severe Weather Warning"
                placeholderTextColor="#5c5c72"
                value={notificationMask}
                onChangeText={setNotificationMask}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.btnSecondary, { flex: 1 }]}
                  onPress={() => setFoundUser(null)}
                >
                  <Text style={styles.btnSecondaryText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnPrimary, { flex: 2 }]}
                  onPress={handleConnect}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#06060f" />
                  ) : (
                    <Text style={styles.btnText}>Save &amp; Open Chat</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#0d0d1f',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#f0f0f8',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    color: '#9898b0',
    fontSize: 18,
    padding: 4,
  },
  subtitle: {
    color: '#9898b0',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  label: {
    color: '#9898b0',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
  },
  noteText: {
    color: '#5c5c72',
    fontSize: 10,
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: '#00d4ff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  btnText: {
    color: '#06060f',
    fontWeight: '700',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  btnSecondaryText: {
    color: '#fff',
    fontWeight: '600',
  },
  foundBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  foundText: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 10,
  },
});
