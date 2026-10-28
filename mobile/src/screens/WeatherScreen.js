import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { HelpManualModal } from '../components/HelpManualModal';

export const WeatherScreen = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const { setSearchModalOpen } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);
  const [weather, setWeather] = useState({
    city: 'San Francisco',
    temp: 22,
    condition: 'Partly Cloudy',
    humidity: 58,
    wind: 14,
    pressure: 1014,
    uv: 5.6,
  });

  const forecast = [
    { day: 'Today', icon: '⛅', temp: '22° / 15°' },
    { day: 'Tomorrow', icon: '☀️', temp: '24° / 16°' },
    { day: 'Thu', icon: '🌧️', temp: '19° / 14°' },
    { day: 'Fri', icon: '⛅', temp: '21° / 15°' },
  ];

  const news = [
    {
      id: '1',
      title: 'Satellite Constellation Deploys High-Altitude Radar Sensors',
      source: 'AeroMet Chronicle',
      time: '1h ago',
    },
    {
      id: '2',
      title: 'Micro-Architecture Upgrades Boost Low-Power Remote Nodes',
      source: 'TechSphere Daily',
      time: '3h ago',
    },
    {
      id: '3',
      title: 'Atmospheric Stabilization Confirmed in Equatorial Corridors',
      source: 'HydroGeo Journal',
      time: '5h ago',
    },
  ];

  const handleSearchSubmit = () => {
    const q = searchQuery.trim();
    if (!q) return;

    if (
      q.toLowerCase() === 'help' ||
      q === '?' ||
      q.toLowerCase() === 'manual' ||
      q.toLowerCase() === 'guide'
    ) {
      setSearchQuery('');
      setHelpVisible(true);
      return;
    }

    // Normal search updates the weather city
    setWeather((prev) => ({
      ...prev,
      city: q,
      temp: 24,
    }));
    setSearchQuery('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoIcon}>🌤️</Text>
          <Text style={styles.logoText}>SkyPulse</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Secret Help Key */}
          <TouchableOpacity
            style={styles.helpBadge}
            onPress={() => setHelpVisible(true)}
          >
            <Text style={styles.helpBadgeText}>[?] Help</Text>
          </TouchableOpacity>

          {/* Secret Sensor Probe */}
          <TouchableOpacity
            style={styles.searchBtn}
            onPress={() => {
              if (isAuthenticated) {
                setSearchModalOpen(true);
              } else {
                navigation.navigate('Auth');
              }
            }}
          >
            <Text style={{ fontSize: 16 }}>📡</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Real Omnibar Search Input */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search cities, radar, or news..."
            placeholderTextColor="#5c5c72"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchSubmitBtn} onPress={handleSearchSubmit}>
            <Text style={{ fontSize: 14 }}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Main Weather Card */}
        <View style={styles.weatherCard}>
          <Text style={styles.locationText}>📍 {weather.city}</Text>
          <View style={styles.tempRow}>
            <Text style={styles.tempText}>{weather.temp}°</Text>
            <Text style={styles.conditionIcon}>⛅</Text>
          </View>
          <Text style={styles.conditionText}>{weather.condition}</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>HUMIDITY</Text>
              <Text style={styles.detailValue}>{weather.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>WIND</Text>
              <Text style={styles.detailValue}>{weather.wind} km/h</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>BAROMETER</Text>
              <Text style={styles.detailValue}>{weather.pressure} hPa</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>UV INDEX</Text>
              <Text style={styles.detailValue}>{weather.uv}</Text>
            </View>
          </View>
        </View>

        {/* 4-Day Forecast */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ATMOSPHERIC FORECAST</Text>
          <View style={styles.forecastRow}>
            {forecast.map((f, i) => (
              <View key={i} style={styles.forecastItem}>
                <Text style={styles.forecastDay}>{f.day}</Text>
                <Text style={styles.forecastIcon}>{f.icon}</Text>
                <Text style={styles.forecastTemp}>{f.temp}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Breaking News Feed */}
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>SATELLITE INTELLIGENCE WIRE</Text>
          {news.map((item) => (
            <View key={item.id} style={styles.newsItem}>
              <Text style={styles.newsSource}>{item.source} · {item.time}</Text>
              <Text style={styles.newsTitle}>{item.title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Secret Help Manual Modal */}
      <HelpManualModal visible={helpVisible} onClose={() => setHelpVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 20,
  },
  logoText: {
    color: '#00d4ff',
    fontSize: 18,
    fontWeight: '800',
  },
  helpBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  helpBadgeText: {
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  searchBarContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  searchBarInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
    paddingVertical: 10,
  },
  searchSubmitBtn: {
    padding: 6,
  },
  weatherCard: {
    backgroundColor: 'rgba(20, 20, 45, 0.7)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.2)',
    marginBottom: 16,
  },
  locationText: {
    color: '#9898b0',
    fontSize: 13,
  },
  tempRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  tempText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
  },
  conditionIcon: {
    fontSize: 42,
  },
  conditionText: {
    color: '#9898b0',
    fontSize: 14,
    marginBottom: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    color: '#5c5c72',
    fontSize: 9,
    fontWeight: '700',
  },
  detailValue: {
    color: '#f0f0f8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    backgroundColor: 'rgba(20, 20, 45, 0.65)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  sectionTitle: {
    color: '#9898b0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  forecastItem: {
    alignItems: 'center',
  },
  forecastDay: {
    color: '#9898b0',
    fontSize: 11,
  },
  forecastIcon: {
    fontSize: 22,
    marginVertical: 4,
  },
  forecastTemp: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  newsItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  newsSource: {
    color: '#00d4ff',
    fontSize: 10,
    fontWeight: '600',
  },
  newsTitle: {
    color: '#f0f0f8',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 18,
  },
});
