import admin from 'firebase-admin';

/* ──────────────────────────────────────────────────────────
   Disguised notification content pools.
   Nothing here reveals chat activity.
   ────────────────────────────────────────────────────────── */

const WEATHER_POOL = [
  { title: 'Weather Alert', body: 'Partly cloudy with 65 % humidity expected in your area' },
  { title: 'Weather Update', body: 'Temperature dropping to 18 °C tonight — stay warm!' },
  { title: 'SkyPulse Alert', body: 'UV index high today. Remember sunscreen!' },
  { title: 'Weather Advisory', body: 'Light rain expected between 2–5 PM today' },
  { title: 'Daily Forecast', body: 'Clear skies ahead with temperatures around 24 °C' },
  { title: 'Wind Advisory', body: 'Moderate winds expected from the northwest today' },
  { title: 'Humidity Alert', body: 'Relative humidity rising to 80 % this evening' },
  { title: 'Pressure Change', body: 'Barometric pressure dropping — storm possible tomorrow' },
  { title: 'Air Quality', body: 'Air quality index: Good (42). Safe for outdoor activities' },
];

const NEWS_POOL = [
  { title: 'Breaking News', body: 'Markets rally as tech sector shows strong growth' },
  { title: 'Top Story', body: 'New study reveals benefits of morning exercise routines' },
  { title: 'News Alert', body: 'Global summit addresses climate change initiatives' },
  { title: 'Trending', body: 'Space exploration milestone: New discoveries announced' },
  { title: 'Business Update', body: 'Innovation in renewable energy reaches new milestone' },
  { title: 'Science Daily', body: 'Researchers develop breakthrough in materials science' },
  { title: 'World News', body: 'International cooperation agreement signed by 30 nations' },
];

const RANDOM_POOL = [
  { title: 'SkyPulse', body: 'Your daily briefing is ready' },
  { title: 'Data Update', body: 'New weather data available for your region' },
  { title: 'Station Alert', body: 'Atmospheric pressure change detected' },
  { title: 'SkyPulse Sync', body: 'Weather station data synchronised successfully' },
  { title: 'Air Quality', body: 'Air quality index updated for your area' },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getDisguisedContent = (template) => {
  switch (template) {
    case 'news':
      return pick(NEWS_POOL);
    case 'random':
      return pick(RANDOM_POOL);
    case 'weather':
    default:
      return pick(WEATHER_POOL);
  }
};

/**
 * Send a disguised push notification to a recipient.
 * Uses the custom notification mask / alias configured by the RECEIVER for this contact,
 * or falls back to the receiver's global notification display name or default title.
 * The sender never controls what appears on the receiver's device.
 */
export const sendDisguisedNotification = async (user, fromStationId = null) => {
  if (!admin.apps.length || !user.fcmTokens?.length) return;

  const template = user.notificationConfig?.messageTemplate || 'weather';
  const content = getDisguisedContent(template);

  // Check if the receiver configured a unique mask/title for this specific sender
  let title = content.title;
  if (fromStationId && user.contactMasks) {
    const receiverCustomMask = user.contactMasks.get
      ? user.contactMasks.get(fromStationId.toLowerCase())
      : user.contactMasks[fromStationId.toLowerCase()];
    if (receiverCustomMask) {
      title = receiverCustomMask;
    }
  }

  // If no contact-specific mask was set by the receiver, use their global display name
  if (title === content.title && user.notificationConfig?.displayName) {
    title = user.notificationConfig.displayName;
  }

  const invalidTokens = [];

  for (const token of user.fcmTokens) {
    try {
      await admin.messaging().send({
        token,
        notification: { title, body: content.body },
        data: { type: 'weather_update' }, // disguised payload key
        webpush: {
          notification: {
            icon: '/icon-192.png',
            badge: '/badge.png',
            tag: 'skypulse-update',
            renotify: true,
          },
        },
      });
    } catch (error) {
      if (
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(token);
      }
      console.error('Push notification error:', error.message);
    }
  }

  // Prune stale tokens
  if (invalidTokens.length) {
    user.fcmTokens = user.fcmTokens.filter((t) => !invalidTokens.includes(t));
    await user.save();
  }
};
