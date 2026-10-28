import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSocket } from '../services/socket';
import {
  getContacts,
  saveContact,
  deleteContact,
  getMessages,
  saveMessage,
  clearMessages,
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

  const reloadContacts = useCallback(async () => {
    try {
      const list = await getContacts();
      setContacts(list || []);
    } catch (err) {
      console.warn('Failed to load contacts:', err);
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

  useEffect(() => {
    let active = true;
    const fetchChatMessages = async () => {
      if (!activeContact) {
        setMessages([]);
        return;
      }
      const msgs = await getMessages(activeContact.stationId);
      if (active) setMessages(msgs || []);
    };
    fetchChatMessages();
    return () => {
      active = false;
    };
  }, [activeContact]);

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

      if (activeContact?.stationId === partnerId) {
        setMessages((prev) => [...prev, storedMsg]);
      }

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
          const newContact = {
            stationId: partnerId,
            alias: partnerId,
            lastMessage: msg.type === 'file' ? '📎 Attachment' : msg.encryptedPayload,
            lastMessageTime: storedMsg.timestamp,
            unreadCount: 1,
          };
          saveContact(newContact);
          return [newContact, ...prev];
        }
      });
    };

    socket.on('new-message', handleNewMessage);
    socket.on('user-typing', ({ fromStation }) => {
      setTypingMap((prev) => ({ ...prev, [fromStation]: true }));
    });
    socket.on('user-stop-typing', ({ fromStation }) => {
      setTypingMap((prev) => ({ ...prev, [fromStation]: false }));
    });

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [isAuthenticated, user?.stationId, activeContact]);

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

  const subscribeStation = async ({ stationId, pin, alias, notificationMask }) => {
    await api.post('/stations/lookup', { stationId });
    await api.post('/stations/verify-pin', { stationId, pin });

    const mask = notificationMask?.trim() || alias?.trim() || 'Severe Weather Warning';

    const newContact = {
      stationId: stationId.toLowerCase(),
      alias: alias || stationId,
      notificationMask: mask,
      lastMessage: 'Station connected',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    };

    await saveContact(newContact);
    try {
      await api.post('/stations/contact-mask', {
        contactStationId: stationId.toLowerCase(),
        mask,
      });
    } catch {}

    setContacts((prev) => {
      const filtered = prev.filter((c) => c.stationId !== newContact.stationId);
      return [newContact, ...filtered];
    });
    setActiveContact(newContact);
    return newContact;
  };

  const removeContact = async (stationId) => {
    try {
      await api.post('/stations/contact-mask', {
        contactStationId: stationId.toLowerCase(),
        mask: '',
      });
    } catch {}
    await deleteContact(stationId);
    setContacts((prev) => prev.filter((c) => c.stationId !== stationId));
    if (activeContact?.stationId === stationId) {
      setActiveContact(null);
      setMessages([]);
    }
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
        removeContact,
        typingMap,
        searchModalOpen,
        setSearchModalOpen,
        reloadContacts,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
};
