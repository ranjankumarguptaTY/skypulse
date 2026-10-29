import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSocket, connectSocket } from '../services/socket';
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
  const [unlockModalTarget, setUnlockModalTarget] = useState(null);
  const [unlockedContacts, setUnlockedContacts] = useState({});

  // Persistent in-app notifications
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('sp_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activeContactRef = useRef(activeContact);
  useEffect(() => {
    activeContactRef.current = activeContact;
  }, [activeContact]);

  const contactsRef = useRef(contacts);
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  // Load contacts from IndexedDB (stealth store for PIN and alias verification)
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
      setUnlockedContacts({});
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
        const cleanId = activeContact.stationId?.trim()?.toLowerCase();
        let msgs = await getMessages(cleanId);
        if ((!msgs || msgs.length === 0) && activeContact.stationId !== cleanId) {
          const fallbackMsgs = await getMessages(activeContact.stationId);
          if (fallbackMsgs?.length) msgs = fallbackMsgs;
        }
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

  // Stable socket message listener — uses activeContactRef so it never misses messages
  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('sp_token');
    const socket = connectSocket(token);
    if (!socket) return;

    const handleNewMessage = async (msg) => {
      const partnerId = msg.fromStation?.trim()?.toLowerCase();
      const myStationId = user?.stationId?.trim()?.toLowerCase();
      if (!partnerId) return;

      const storedMsg = {
        chatId: partnerId,
        fromStation: partnerId,
        toStation: myStationId,
        encryptedPayload: msg.encryptedPayload,
        type: msg.type || 'text',
        fileMetadata: msg.fileMetadata || null,
        timestamp: msg.timestamp || new Date().toISOString(),
        fromSelf: false,
      };

      await saveMessage(storedMsg);

      const currentActive = activeContactRef.current;
      const isCurrentChat =
        currentActive?.stationId?.trim()?.toLowerCase() === partnerId;

      // If receiver currently has this specific chat open, append immediately in real time
      if (isCurrentChat) {
        setMessages((prev) => [...prev, storedMsg]);
        socket.emit('message-read', {
          toStation: partnerId,
          timestamp: storedMsg.timestamp,
        });
      }

      // Identify receiver's custom disguise title for this contact
      const contact = contactsRef.current?.find(
        (c) => c.stationId?.trim()?.toLowerCase() === partnerId
      );
      const notifTitle = contact?.notificationMask || contact?.alias || 'Weather Alert Service';

      // Desktop browser notification if not actively in this chat
      if (!isCurrentChat || (typeof document !== 'undefined' && document.hidden)) {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(notifTitle, {
              body: 'Atmospheric telemetry update received.',
              icon: '/icon.svg',
            });
          } catch {}
        }
      }

      // Record in-app notification for the notification bell dropdown
      const notifItem = {
        id: `${partnerId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        stationId: partnerId,
        title: notifTitle,
        body: 'Atmospheric telemetry broadcast received',
        timestamp: storedMsg.timestamp,
        read: isCurrentChat,
      };

      setNotifications((prev) => {
        const updated = [notifItem, ...prev.filter((n) => n.id !== notifItem.id).slice(0, 49)];
        try {
          localStorage.setItem('sp_notifications', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      // Update contact record in local IndexedDB
      setContacts((prev) => {
        const existing = prev.find(
          (c) => c.stationId?.trim()?.toLowerCase() === partnerId
        );
        if (existing) {
          const updated = {
            ...existing,
            lastMessage: msg.type === 'file' ? '📎 Attachment' : msg.encryptedPayload,
            lastMessageTime: storedMsg.timestamp,
            unreadCount: isCurrentChat ? 0 : (existing.unreadCount || 0) + 1,
          };
          saveContact(updated);
          return prev.map((c) =>
            c.stationId?.trim()?.toLowerCase() === partnerId ? updated : c
          );
        } else {
          // Auto-save discovered contact in stealth local storage
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
      if (Array.isArray(pendingList)) {
        for (const msg of pendingList) {
          await handleNewMessage(msg);
        }
      }
    };

    const handleTyping = ({ fromStation }) => {
      if (fromStation) {
        setTypingMap((prev) => ({ ...prev, [fromStation.toLowerCase()]: true }));
      }
    };

    const handleStopTyping = ({ fromStation }) => {
      if (fromStation) {
        setTypingMap((prev) => ({ ...prev, [fromStation.toLowerCase()]: false }));
      }
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
  }, [isAuthenticated, user?.stationId]);

  // Send message
  const sendMessage = async (text, fileMetadata = null, type = 'text') => {
    if (!activeContact) return;

    const targetStation = activeContact.stationId.trim().toLowerCase();
    const myStation = user.stationId.trim().toLowerCase();

    const payload = {
      toStation: targetStation,
      encryptedPayload: text || '',
      type,
      fileMetadata,
    };

    const localMsg = {
      chatId: targetStation,
      fromStation: myStation,
      toStation: targetStation,
      encryptedPayload: text,
      type,
      fileMetadata,
      timestamp: new Date().toISOString(),
      fromSelf: true,
    };

    await saveMessage(localMsg);
    setMessages((prev) => [...prev, localMsg]);

    let socket = getSocket();
    if (!socket) {
      const token = localStorage.getItem('sp_token');
      socket = connectSocket(token);
    }
    if (socket) {
      socket.emit('send-message', payload);
    }

    const updatedContact = {
      ...activeContact,
      lastMessage: type === 'file' ? '📎 Attachment' : text,
      lastMessageTime: localMsg.timestamp,
    };
    await saveContact(updatedContact);
    setContacts((prev) =>
      prev.map((c) =>
        c.stationId.toLowerCase() === targetStation ? updatedContact : c
      )
    );
  };

  // Add registered contact via mobile number & assign per-chat PIN & notification mask
  const subscribeStation = async ({ phoneNumber, alias, pin, notificationMask }) => {
    const res = await api.post('/stations/lookup', { phoneNumber });

    const mask = notificationMask?.trim() || alias?.trim() || 'Severe Weather Warning';
    const targetStation = res.stationId.trim().toLowerCase();

    const newContact = {
      stationId: targetStation,
      phoneNumber: res.phoneNumber,
      alias: alias.trim() || res.phoneNumber,
      chatPin: pin.trim(),
      notificationMask: mask,
      lastMessage: 'Chat initialized',
      lastMessageTime: new Date().toISOString(),
      unreadCount: 0,
    };

    await saveContact(newContact);

    try {
      await api.post('/stations/contact-mask', {
        contactStationId: targetStation,
        mask,
      });
    } catch (err) {
      console.warn('Failed to sync contact mask to server:', err);
    }

    setContacts((prev) => {
      const filtered = prev.filter(
        (c) => c.stationId.toLowerCase() !== targetStation
      );
      return [newContact, ...filtered];
    });

    setUnlockedContacts((prev) => ({ ...prev, [targetStation]: true }));
    setActiveContact(newContact);
    return newContact;
  };

  // Update notification mask for a contact
  const updateContactMask = async (stationId, newMask) => {
    const cleanStation = stationId.trim().toLowerCase();
    const cleanMask = newMask?.trim() || 'Weather Alert Service';
    setContacts((prev) =>
      prev.map((c) => {
        if (c.stationId.toLowerCase() === cleanStation) {
          const updated = { ...c, notificationMask: cleanMask };
          saveContact(updated);
          return updated;
        }
        return c;
      })
    );
    try {
      await api.post('/stations/contact-mask', {
        contactStationId: cleanStation,
        mask: cleanMask,
      });
    } catch (err) {
      console.warn('Failed to sync contact mask:', err);
    }
  };

  // Unlock chat with per-chat PIN
  const unlockChat = (contact, enteredPin) => {
    const targetStation = contact.stationId.trim().toLowerCase();
    if (!contact.chatPin || contact.chatPin === enteredPin.trim()) {
      setUnlockedContacts((prev) => ({ ...prev, [targetStation]: true }));
      setActiveContact(contact);
      setUnlockModalTarget(null);
      return true;
    }
    return false;
  };

  // Close and lock the active chat session
  const closeActiveChat = () => {
    if (activeContact) {
      const targetStation = activeContact.stationId.trim().toLowerCase();
      setUnlockedContacts((prev) => {
        const next = { ...prev };
        delete next[targetStation];
        return next;
      });
    }
    setActiveContact(null);
    setMessages([]);
  };

  // Delete contact and its messages
  const removeContact = async (stationId) => {
    const cleanStation = stationId.trim().toLowerCase();
    try {
      await api.post('/stations/contact-mask', {
        contactStationId: cleanStation,
        mask: '',
      });
    } catch {}

    await deleteContact(cleanStation);
    await clearLocalMessages(cleanStation);
    setContacts((prev) =>
      prev.filter((c) => c.stationId.toLowerCase() !== cleanStation)
    );
    if (activeContact?.stationId.toLowerCase() === cleanStation) {
      setActiveContact(null);
      setMessages([]);
    }
  };

  // Clear messages only
  const clearChat = async (stationId) => {
    const cleanStation = stationId.trim().toLowerCase();
    await clearLocalMessages(cleanStation);
    if (activeContact?.stationId.toLowerCase() === cleanStation) {
      setMessages([]);
    }
  };

  const emitTyping = (isTyping) => {
    const socket = getSocket();
    if (!socket || !activeContact) return;
    socket.emit(isTyping ? 'typing' : 'stop-typing', {
      toStation: activeContact.stationId.trim().toLowerCase(),
    });
  };

  // Notification management
  const markNotificationAsRead = (id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem('sp_notifications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    try {
      localStorage.removeItem('sp_notifications');
    } catch {}
  };

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  return (
    <ChatContext.Provider
      value={{
        contacts,
        activeContact,
        setActiveContact,
        closeActiveChat,
        messages,
        sendMessage,
        subscribeStation,
        unlockChat,
        unlockedContacts,
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
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        clearAllNotifications,
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
