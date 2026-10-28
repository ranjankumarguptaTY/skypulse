import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';

export const HelpManualModal = ({ visible, onClose }) => {
  const [tab, setTab] = useState('summary');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 22 }}>📖</Text>
              <View>
                <Text style={styles.title}>SkyPulse Protocol Manual</Text>
                <Text style={styles.subtitle}>Undercover User &amp; Handshake Guide</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'summary' && styles.tabItemActive]}
              onPress={() => setTab('summary')}
            >
              <Text style={[styles.tabText, tab === 'summary' && styles.tabTextActive]}>
                Summary
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'register' && styles.tabItemActive]}
              onPress={() => setTab('register')}
            >
              <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'adduser' && styles.tabItemActive]}
              onPress={() => setTab('adduser')}
            >
              <Text style={[styles.tabText, tab === 'adduser' && styles.tabTextActive]}>
                Add User
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'chat' && styles.tabItemActive]}
              onPress={() => setTab('chat')}
            >
              <Text style={[styles.tabText, tab === 'chat' && styles.tabTextActive]}>
                Chat &amp; Mask
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            {tab === 'summary' && (
              <View>
                <View style={styles.highlightBox}>
                  <Text style={styles.highlightTitle}>🎭 Undercover Disguise</Text>
                  <Text style={styles.highlightBody}>
                    SkyPulse looks and behaves like a weather &amp; satellite news app. All messages live
                    exclusively in your phone&apos;s local storage. The server never retains chat logs.
                  </Text>
                </View>

                <Text style={styles.stepTitle}>1. Register Your Station</Text>
                <Text style={styles.stepBody}>
                  Pick a Station ID (username), password, and define a secret 4–8 digit PIN required for others to pair with you.
                </Text>

                <Text style={styles.stepTitle}>2. Add Users via Search</Text>
                <Text style={styles.stepBody}>
                  Search their Station ID in the search bar. When prompted, input their secret PIN and assign a custom local alias.
                </Text>

                <Text style={styles.stepTitle}>3. Dual-Mode Chatting</Text>
                <Text style={styles.stepBody}>
                  Toggle between regular chat bubbles and Observation Telemetry Mode ([LOG 11:04 AM] TX: ...).
                </Text>
              </View>
            )}

            {tab === 'register' && (
              <View>
                <Text style={styles.sectionHeader}>How to Register</Text>
                <Text style={styles.bullet}>• Open Radar screen and tap &quot;Access Station&quot;.</Text>
                <Text style={styles.bullet}>• Select &quot;Deploy New Station&quot;.</Text>
                <Text style={styles.bullet}>• Enter your Station ID (unique call-sign across network).</Text>
                <Text style={styles.bullet}>• Create your Master Password.</Text>
                <Text style={styles.bullet}>• Create your Station Security PIN (share this PIN ONLY with trusted contacts who wish to add you).</Text>
                <Text style={styles.bullet}>• Tap Deploy Station Node to finish.</Text>
              </View>
            )}

            {tab === 'adduser' && (
              <View>
                <Text style={styles.sectionHeader}>How to Add a Contact</Text>
                <Text style={styles.bullet}>• In the search bar, type the Station ID of the user you want to chat with.</Text>
                <Text style={styles.bullet}>• Tap &quot;Probe Station Relay&quot;.</Text>
                <Text style={styles.bullet}>• Enter the contact&apos;s secret Station Access PIN.</Text>
                <Text style={styles.bullet}>• Assign a Local Alias (only visible to you).</Text>
                <Text style={styles.bullet}>• Tap &quot;Establish Uplink&quot; to begin chatting immediately.</Text>
              </View>
            )}

            {tab === 'chat' && (
              <View>
                <Text style={styles.sectionHeader}>Secret Chat &amp; Camouflage</Text>
                <Text style={styles.bullet}>• Telemetry Mode: Tap 📊 LOGS in the chat header to disguise messages as scientific logs.</Text>
                <Text style={styles.bullet}>• 5-Day Auto-Purge: Shared files are automatically deleted 5 days after download.</Text>
                <Text style={styles.bullet}>• Disguised Notifications: Incoming messages appear on your lockscreen as weather warnings.</Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtnBottom} onPress={onClose}>
            <Text style={styles.closeBtnBottomText}>Close Manual</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#0d0d1f',
    borderRadius: 20,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#f0f0f8',
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: '#9898b0',
    fontSize: 11,
  },
  closeBtn: {
    color: '#9898b0',
    fontSize: 18,
    padding: 6,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  tabItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00d4ff',
  },
  tabText: {
    color: '#9898b0',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#00d4ff',
    fontWeight: '700',
  },
  content: {
    paddingVertical: 8,
  },
  highlightBox: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderColor: 'rgba(0, 212, 255, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  highlightTitle: {
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: '700',
  },
  highlightBody: {
    color: '#9898b0',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  stepTitle: {
    color: '#f0f0f8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
  },
  stepBody: {
    color: '#9898b0',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeader: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  bullet: {
    color: '#f0f0f8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  closeBtnBottom: {
    backgroundColor: '#00d4ff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  closeBtnBottomText: {
    color: '#06060f',
    fontSize: 13,
    fontWeight: '700',
  },
});
