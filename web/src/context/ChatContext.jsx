import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSocket } from '../services/socket';
import {
  getContacts,
  saveContact,
  deleteContact,
  getMessages,
  saveMessage,
  clearMessages as clearLocalMessages,
} from '../services/storage';
import { api } from '../services/api';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingMap, setTypingMap] = useState({});
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [unlockModalTarget, setUnlockModalTarget] = useState(null); // Contact currently prompting for PIN

  // Load contacts from IndexedDB
  const reloadContacts = useCallback(async () => {
    try {
      const list = await getContacts();
      setContacts(list || []);
    } catch (err) {
      console.error('Failed to load contacts from IndexedDB:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      reloadContacts();
    } else {
      setContacts([]);
      setActiveContact(null);
      setMessages([]);
    }
  }, [isAuthenticated, reloadContacts]);

  // Load messages whenever activeContact changes
  useEffect(() => {
    let isMounted = true;
    const fetchChatMessages = async () => {
      if (!activeContact) {
        setMessages([]);
        return;
      }
      try {
        const msgs = await getMessages(activeContact.stationId);
        if (isMounted) setMessages(msgs || []);
      } catch (err) {
        console.error('Failed to get messages:', err);
      }
    };

    fetchChatMessages();
    return () => {
      isMounted = false;
    };
  }, [activeContact]);

  // Handle incoming messages & socket events
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !isAuthenticated) return;

    const handleNewMessage = async (msg) => {
      const partnerId = msg.fromStation;
      const storedMsg = {
        chatId: partnerId,
        fromStation: partnerId,
        toStation: user.stationId,
        encryptedPayload: msg.encryptedPayload,
        type: msg.type || 'text',
        fileMetadata: msg.fileMetadata || null,
        timestamp: msg.timestamp || new Date().toISOString(),
        fromSelf: false,
      };

      await saveMessage(storedMsg);

      // If viewing active chat, append immediately
      if (activeContact?.stationId === partnerId) {
        setMessages((prev) => [...prev, storedMsg]);
        socket.emit('message-read', {
          toStation: partnerId,
          timestamp: storedMsg.timestamp,
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        // Receiver-controlled notification: uses the custom disguise name/alias chosen by THIS user for this contact
        const contact = contacts.find((c) => c.stationId === partnerId);
        const notifTitle = contact?.notificationMask || contact?.alias || 'Weather Alert Service';
        try {
          new Notification(notifTitle, {
            body: 'Atmospheric telemetry update received.',
            icon: '/icon.svg',
          });
        } catch {}
      }

      // Update contact preview
      setContacts((prev) => {
        const existing = prev.find((c) => c.stationId === partnerId);
        if (existing) {
          const updated = {
            ...existing,
            lastMessage: msg.type === 'file' ? '📎 Attachment' : msg.encryptedPayload,
            lastMessageTime: storedMsg.timestamp,
            unreadCount:
              activeContact?.stationId === partnerId ? 0 : (existing.unreadCount || 0) + 1,
          };
          saveContact(updated);
          return prev.map((c) => (c.stationId === partnerId ? updated : c));
        } else {
          // Auto-discover contact by stationId
          const newContact = {
            stationId: partnerId,
            phoneNumber: '',
            alias: partnerId,
            chatPin: '',
            notificationMask: 'Weather Alert Service',
            lastMessage: msg.type === 'file' ? '📎 Attachment' : msg.encryptedPayload,
            lastMessageTime: storedMsg.timestamp,
            unreadCount: 1,
          };
          saveContact(newContact);
          return [newContact, ...prev];
        }
      });
    };

    const handlePendingMessages = async (pendingList) => {
      for (const msg of pendingList) {
        await handleNewMessage(msg);
      }
    };

    const handleTyping = ({ fromStation }) => {
      setTypingMap((prev) => ({ ...prev, [fromStation]: true }));
    };

    const handleStopTyping = ({ fromStation }) => {
      setTypingMap((prev) => ({ ...prev, [fromStation]: false }));
    };

    socket.on('new-message', handleNewMessage);
    socket.on('pending-messages', handlePendingMessages);
    socket.on('user-typing', handleTyping);
    socket.on('user-stop-typing', handleStopTyping);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('pending-messages', handlePendingMessages);
      socket.off('user-typing', handleTyping);
      socket.off('user-stop-typing', handleStopTyping);
    };
  }, [isAuthenticated, user?.stationId, activeContact]);

  // Send message
  const sendMessage = async (text, fileMetadata = null, type = 'text') => {
    if (!activeContact) return;

    const payload = {
      toStation: activeContact.stationId,
      encryptedPayload: text || '',
      type,
      fileMetadata,
    };

    const localMsg = {
      chatId: activeContact.stationId,
      fromStation: user.stationId,
      toStation: activeContact.stationId,
      encryptedPayload: text,
      type,
      fileMetadata,
      timestamp: new Date().toISOString(),
      fromSelf: true,
    };

    await saveMessage(localMsg);
    setMessages((prev) => [...prev, localMsg]);

    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('send-message', payload);
    }

    const updatedContact = {
      ...activeContact,
      lastMessage: type === 'file' ? '📎 Attachment' : text,
      lastMessageTime: localMsg.timestamp,
    };
    await saveContact(updatedContact);
    setContacts((prev) =>
      prev.map((c) => (c.stationId === activeContact.stationId ? updatedContact : c))
    );
  };

  // Add registered contact via mobile number & assign per-chat PIN & notification mask
  const subscribeStation = async ({ phoneNumber, alias, pin, notificationMask }) => {
    // 1. Verify target user is registered on SkyPulse
    const res = await api.post('/stations/lookup', { phoneNumber });

    const mask = notificationMask?.trim() || alias?.trim() || 'Severe Weather Warning';

    const newContact = {
      stationId: res.stationId,
      phoneNumber: res.phoneNumber,
      alias: alias.trim() || res.phoneNumber,
      chatPin: pin.trim(), // Per-chat security PIN set by user
      notificationMask: mask,
      lastMessage: 'Chat initialized',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    };

    await saveContact(newContact);

    // Sync receiver-controlled lockscreen mask to server so incoming push notifications use it
    try {
      await api.post('/stations/contact-mask', {
        contactStationId: res.stationId,
        mask,
      });
    } catch (err) {
      console.warn('Failed to sync contact mask to server:', err);
    }

    setContacts((prev) => {
      const filtered = prev.filter((c) => c.stationId !== newContact.stationId);
      return [newContact, ...filtered];
    });
    setActiveContact(newContact);
    return newContact;
  };

  // Update notification mask for a contact
  const updateContactMask = async (stationId, newMask) => {
    const cleanMask = newMask?.trim() || 'Weather Alert Service';
    setContacts((prev) =>
      prev.map((c) => {
        if (c.stationId === stationId) {
          const updated = { ...c, notificationMask: cleanMask };
          saveContact(updated);
          return updated;
        }
        return c;
      })
    );
    try {
      await api.post('/stations/contact-mask', {
        contactStationId: stationId,
        mask: cleanMask,
      });
    } catch (err) {
      console.warn('Failed to sync contact mask:', err);
    }
  };

  // Unlock chat with per-chat PIN
  const unlockChat = (contact, enteredPin) => {
    if (!contact.chatPin || contact.chatPin === enteredPin.trim()) {
      setActiveContact(contact);
      setUnlockModalTarget(null);
      return true;
    }
    return false;
  };

  // Delete contact and its messages
  const removeContact = async (stationId) => {
    try {
      await api.post('/stations/contact-mask', {
        contactStationId: stationId,
        mask: '',
      });
    } catch {}

    await deleteContact(stationId);
    await clearLocalMessages(stationId);
    setContacts((prev) => prev.filter((c) => c.stationId !== stationId));
    if (activeContact?.stationId === stationId) {
      setActiveContact(null);
      setMessages([]);
    }
  };

  // Clear messages only
  const clearChat = async (stationId) => {
    await clearLocalMessages(stationId);
    if (activeContact?.stationId === stationId) {
      setMessages([]);
    }
  };

  const emitTyping = (isTyping) => {
    const socket = getSocket();
    if (!socket || !activeContact) return;
    socket.emit(isTyping ? 'typing' : 'stop-typing', {
      toStation: activeContact.stationId,
    });
  };

  return (
    <ChatContext.Provider
      value={{
        contacts,
        activeContact,
        setActiveContact,
        messages,
        sendMessage,
        subscribeStation,
        unlockChat,
        removeContact,
        clearChat,
        updateContactMask,
        typingMap,
        emitTyping,
        searchModalOpen,
        setSearchModalOpen,
        unlockModalTarget,
        setUnlockModalTarget,
        reloadContacts,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
