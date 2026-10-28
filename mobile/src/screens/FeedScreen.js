import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

export const FeedScreen = () => {
  const { user } = useAuth();
  const {
    contacts,
    activeContact,
    setActiveContact,
    messages,
    sendMessage,
    setSearchModalOpen,
    removeContact,
  } = useChat();

  const [inputMsg, setInputMsg] = useState('');
  const [telemetryMode, setTelemetryMode] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = () => {
    if (!inputMsg.trim() || !activeContact) return;
    sendMessage(inputMsg.trim());
    setInputMsg('');
  };

  /* ── 1. Contact List View (When no contact open) ── */
  if (!activeContact) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Subscribed Sensor Relays</Text>
          <TouchableOpacity
            style={styles.pairBtn}
            onPress={() => setSearchModalOpen(true)}
          >
            <Text style={styles.pairBtnText}>+ Pair</Text>
          </TouchableOpacity>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📡</Text>
            <Text style={styles.emptyTitle}>No Relays Subscribed</Text>
            <Text style={styles.emptyDesc}>
              Use the search tool to pair with a peer weather station using their secret call-sign and PIN.
            </Text>
            <TouchableOpacity
              style={[styles.pairBtn, { paddingHorizontal: 20, marginTop: 16 }]}
              onPress={() => setSearchModalOpen(true)}
            >
              <Text style={styles.pairBtnText}>Pair Remote Station</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.stationId}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => setActiveContact(item)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.alias?.[0]?.toUpperCase() || item.stationId?.[0]?.toUpperCase() || 'S'}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.contactName}>{item.alias || item.stationId}</Text>
                  <Text style={styles.contactLastMsg} numberOfLines={1}>
                    {item.lastMessage || 'Ready for telemetry stream'}
                  </Text>
                </View>

                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  /* ── 2. Active Chat View ── */
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity
            onPress={() => setActiveContact(null)}
            style={{ paddingRight: 12 }}
          >
            <Text style={{ color: '#00d4ff', fontSize: 18 }}>←</Text>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.chatHeaderName}>
              {activeContact.alias || activeContact.stationId}
            </Text>
            <Text style={styles.chatHeaderStatus}>
              Node {activeContact.stationId} · Encrypted
            </Text>
          </View>

          <TouchableOpacity
            style={styles.modeToggle}
            onPress={() => setTelemetryMode(!telemetryMode)}
          >
            <Text style={styles.modeToggleText}>
              {telemetryMode ? '📊 LOGS' : '💬 CHAT'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Message Stream */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => {
            const isSelf = item.fromSelf || item.fromStation === user?.stationId;
            const time = new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });

            if (telemetryMode) {
              return (
                <View style={styles.logRow}>
                  <Text style={styles.logTime}>[{time}] </Text>
                  <Text style={isSelf ? styles.logSelf : styles.logRemote}>
                    {isSelf ? 'TX: ' : 'RX: '}
                  </Text>
                  <Text style={styles.logText}>{item.encryptedPayload}</Text>
                </View>
              );
            }

            return (
              <View
                style={[
                  styles.bubble,
                  isSelf ? styles.bubbleSelf : styles.bubbleRemote,
                ]}
              >
                <Text style={styles.bubbleText}>{item.encryptedPayload}</Text>
                <Text style={styles.bubbleTime}>{time}</Text>
              </View>
            );
          }}
        />

        {/* Input Bar */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.chatInput}
            placeholder="Log observation or transmit entry..."
            placeholderTextColor="#5c5c72"
            value={inputMsg}
            onChangeText={setInputMsg}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSend}
            disabled={!inputMsg.trim()}
          >
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerTitle: {
    color: '#f0f0f8',
    fontSize: 16,
    fontWeight: '700',
  },
  pairBtn: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pairBtnText: {
    color: '#06060f',
    fontSize: 12,
    fontWeight: '700',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 45, 0.6)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 212, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: '700',
  },
  contactName: {
    color: '#f0f0f8',
    fontSize: 14,
    fontWeight: '600',
  },
  contactLastMsg: {
    color: '#9898b0',
    fontSize: 12,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#00d4ff',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: '#06060f',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    color: '#f0f0f8',
    fontSize: 16,
    fontWeight: '700',
  },
  emptyDesc: {
    color: '#9898b0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#0d0d1f',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  chatHeaderName: {
    color: '#f0f0f8',
    fontSize: 15,
    fontWeight: '700',
  },
  chatHeaderStatus: {
    color: '#9898b0',
    fontSize: 11,
  },
  modeToggle: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeToggleText: {
    color: '#00d4ff',
    fontSize: 10,
    fontWeight: '700',
  },
  bubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  bubbleSelf: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 212, 255, 0.2)',
    borderBottomRightRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  bubbleRemote: {
    alignSelf: 'flex-start',
    backgroundColor: '#141428',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  bubbleText: {
    color: '#f0f0f8',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTime: {
    color: '#9898b0',
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  logRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  logTime: {
    color: '#5c5c72',
    fontSize: 11,
  },
  logSelf: {
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: '700',
  },
  logRemote: {
    color: '#7c3aed',
    fontSize: 11,
    fontWeight: '700',
  },
  logText: {
    color: '#f0f0f8',
    fontSize: 11,
    flex: 1,
  },
  inputArea: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#0d0d1f',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  chatInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 13,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00d4ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnText: {
    color: '#06060f',
    fontSize: 16,
    fontWeight: '700',
  },
});
