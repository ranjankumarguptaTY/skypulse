import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { clearAllData } from '../services/storage';
import { api } from '../services/api';

export const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const [currentPass, setCurrentPass] = useState('');
  const [newPin, setNewPin] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleUpdatePin = async () => {
    if (!currentPass || !newPin) {
      Alert.alert('Required', 'Enter master password and new PIN.');
      return;
    }
    try {
      await api.put('/auth/change-pin', {
        currentPassword: currentPass,
        newPin,
      });
      setStatusMsg('Station security PIN updated.');
      setCurrentPass('');
      setNewPin('');
    } catch (err) {
      Alert.alert('Error', err.message || 'Update failed.');
    }
  };

  const handleWipeData = async () => {
    Alert.alert(
      'Purge Device Data',
      'This will erase all encrypted messages and contact relays stored on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase All',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            setStatusMsg('Local device messages purged.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.headerTitle}>Station Config & Mask</Text>
        <Text style={styles.headerSubtitle}>
          Undercover notification preferences and peer security
        </Text>

        {statusMsg ? <Text style={styles.statusText}>{statusMsg}</Text> : null}

        {/* Station Identity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>OBSERVATION STATION NODE</Text>
          <Text style={styles.stationId}>{user?.stationId || 'Local-Station'}</Text>
          <Text style={styles.metaText}>
            End-to-end encrypted telemetry protocol
          </Text>
        </View>

        {/* Change Peer PIN */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CHANGE PEER ACCESS CODE (PIN)</Text>
          <Text style={styles.metaText}>
            New PIN required for peers to connect to your station
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Master password"
            placeholderTextColor="#5c5c72"
            value={currentPass}
            onChangeText={setCurrentPass}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="New 4-8 digit PIN"
            placeholderTextColor="#5c5c72"
            value={newPin}
            onChangeText={setNewPin}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btnPrimary} onPress={handleUpdatePin}>
            <Text style={styles.btnText}>Update Peer PIN</Text>
          </TouchableOpacity>
        </View>

        {/* Data Management */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>LOCAL PRIVACY</Text>
          <TouchableOpacity style={styles.btnDanger} onPress={handleWipeData}>
            <Text style={styles.btnDangerText}>Purge Local Encrypted Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnSecondary, { marginTop: 12 }]}
            onPress={logout}
          >
            <Text style={styles.btnSecondaryText}>Disconnect Station Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060f',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  headerTitle: {
    color: '#f0f0f8',
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#9898b0',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#0d0d1f',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    marginBottom: 16,
  },
  cardTitle: {
    color: '#9898b0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  stationId: {
    color: '#00d4ff',
    fontSize: 18,
    fontWeight: '800',
  },
  metaText: {
    color: '#5c5c72',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    color: '#fff',
    padding: 12,
    fontSize: 13,
    marginBottom: 10,
  },
  btnPrimary: {
    backgroundColor: '#00d4ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  btnText: {
    color: '#06060f',
    fontSize: 13,
    fontWeight: '700',
  },
  btnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  btnDangerText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  btnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: '#9898b0',
    fontSize: 13,
    fontWeight: '600',
  },
  statusText: {
    color: '#10b981',
    fontSize: 12,
    marginBottom: 12,
  },
});
