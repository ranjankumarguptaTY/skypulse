import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export const AuthScreen = ({ navigation }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [stationId, setStationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const clean = phoneNumber.trim().replace(/[\s-]/g, '');
      if (clean.length < 8) {
        setError('Please enter a valid mobile number (min 8 digits).');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }

      if (isRegister) {
        await register(clean, password, stationId.trim() || undefined);
      } else {
        await login(clean, password);
      }
      navigation.navigate('MainTabs');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.logo}>🌤️ SkyPulse</Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? 'Register with your mobile number to deploy your station'
              : 'Sign in with your registered mobile number'}
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>REGISTERED MOBILE NUMBER</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. +1 555 123 4567 or 9876543210"
            placeholderTextColor="#5c5c72"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          <Text style={styles.label}>MASTER ACCESS PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••••••"
            placeholderTextColor="#5c5c72"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {isRegister && (
            <View>
              <Text style={styles.label}>STATION CALL-SIGN (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. echo-station-01 (optional)"
                placeholderTextColor="#5c5c72"
                value={stationId}
                onChangeText={setStationId}
                autoCapitalize="none"
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#06060f" />
            ) : (
              <Text style={styles.btnText}>
                {isRegister ? 'Register & Deploy Station' : 'Sign In with Mobile'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
          >
            <Text style={styles.toggleText}>
              {isRegister
                ? 'Already registered? Sign In'
                : 'First time? Register with Mobile Number'}
            </Text>
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
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  card: {
    backgroundColor: '#0d0d1f',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  logo: {
    color: '#00d4ff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#9898b0',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    padding: 14,
    fontSize: 14,
    marginBottom: 16,
  },
  btnPrimary: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#06060f',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleText: {
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
});
