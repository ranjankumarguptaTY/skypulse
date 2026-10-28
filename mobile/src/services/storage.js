import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_KEY = 'skypulse_mobile_contacts';
const MSG_KEY_PREFIX = 'skypulse_msg_';

/* ── Contacts ── */
export const getContacts = async () => {
  try {
    const raw = await AsyncStorage.getItem(CONTACTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveContact = async (contact) => {
  try {
    const list = await getContacts();
    const filtered = list.filter((c) => c.stationId !== contact.stationId);
    const updated = [contact, ...filtered];
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save contact:', err);
  }
};

export const deleteContact = async (stationId) => {
  try {
    const list = await getContacts();
    const updated = list.filter((c) => c.stationId !== stationId);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(updated));
    await AsyncStorage.removeItem(`${MSG_KEY_PREFIX}${stationId}`);
    return updated;
  } catch (err) {
    console.error('Failed to delete contact:', err);
  }
};

/* ── Messages ── */
export const getMessages = async (chatId) => {
  try {
    const raw = await AsyncStorage.getItem(`${MSG_KEY_PREFIX}${chatId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMessage = async (msg) => {
  try {
    const list = await getMessages(msg.chatId);
    const updated = [...list, msg];
    await AsyncStorage.setItem(`${MSG_KEY_PREFIX}${msg.chatId}`, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save message:', err);
  }
};

export const clearMessages = async (chatId) => {
  try {
    await AsyncStorage.removeItem(`${MSG_KEY_PREFIX}${chatId}`);
  } catch (err) {
    console.error('Failed to clear messages:', err);
  }
};

export const clearAllData = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const spKeys = keys.filter((k) => k.startsWith('skypulse_'));
    await AsyncStorage.multiRemove(spKeys);
  } catch (err) {
    console.error('Failed to purge data:', err);
  }
};
