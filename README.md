# 🌤️ SkyPulse — Secret Chat App Disguised as Weather & News Hub

> **SkyPulse** is on the surface a meteorological telemetry and global intelligence news web and mobile application. Under the hood, it is a privacy-first, end-to-end encrypted chat application where message history never lives on the server, contacts are protected by secret security PINs, and incoming notifications appear as weather warnings or breaking news headlines.

---

## 📑 Table of Contents

- [🎭 The Disguise Strategy](#-the-disguise-strategy)
- [✨ Key Features](#-key-features)
- [🏗️ Architecture & Privacy Design](#️-architecture--privacy-design)
- [🚀 Quick Start Guide](#-quick-start-guide)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Web Application Setup](#2-web-application-setup)
  - [3. Native Mobile App Setup (iOS & Android)](#3-native-mobile-app-setup-ios--android)
- [📖 How to Use the Application](#-how-to-use-the-application)
  - [Step 1: Deploy Your Weather Station (Registration)](#step-1-deploy-your-weather-station-registration)
  - [Step 2: Sign In (Accessing Your Station)](#step-2-sign-in-accessing-your-station)
  - [Step 3: Pair a Secret Contact (Sensor Network Scanner)](#step-3-pair-a-secret-contact-sensor-network-scanner)
  - [Step 4: Secret Chatting (Station Feed)](#step-4-secret-chatting-station-feed)
  - [Step 5: Sharing Files & 5-Day Auto-Expiry](#step-5-sharing-files--5-day-auto-expiry)
  - [Step 6: Google Keep-Style Notes Board](#step-6-google-keep-style-notes-board)
  - [Step 7: Configuring Disguised Push Notifications](#step-7-configuring-disguised-push-notifications)
  - [Step 8: Device Privacy & Wiping Local Cache](#step-8-device-privacy--wiping-local-cache)
- [⚙️ Environment Variables Reference](#️-environment-variables-reference)
- [📁 Project Structure](#-project-structure)

---

## 🎭 The Disguise Strategy

To anyone looking at your screen, browsing history, or lockscreen notifications, **SkyPulse looks 100% like a personal meteorological and global wire hub**.

| Public Appearance (Disguised) | True Privacy Purpose |
| :--- | :--- |
| **App Title** | `SkyPulse — Weather & News Hub` |
| **User Registration** | Register with **Mobile Number** & Master Password; required before home screen access |
| **Session Lifetime** | Persistent 180-day token authentication (maintained for months) |
| **Adding a Contact** | Add by **Registered Mobile Number**; verifies contact is already registered |
| **Per-Chat Security PIN** | You set a private PIN per chat; only you can open this chat |
| **Notification Disguise Name** | Receiver configures what unique fake name/title appears on their lockscreen when that contact messages them |
| **Instant Unlocking** | Once added, simply search the user, enter your PIN, and chat opens |
| **Chat Screen** | `Station Telemetry Monitor` with dual mode: **Chat Bubbles** or **Raw Observation Logs** (`[LOG 14:32:01] LOCAL_TX: ...`) |
| **Search Omnibar** | Genuinely searches global weather forecasts & news articles; typing `help` opens the secret user manual; typing a mobile number unlocks or adds chat |
| **Secret Help Key** | Discreet `[?] Help` badge that opens the complete registration, pairing, and chat manual |
| **File Attachments** | `Data Attachment / Telemetry Packet` (auto-deletes after 5 days) |
| **Notes Section** | `Field Observations & Memos` (Google Keep-style) |

---

## ✨ Key Features

- **Mandatory Mobile Gateway**: Registration and login by mobile number are required before entering the application. All pages and features remain locked until authenticated.
- **Months-Long Persistent Session**: Long-lived 180-day JWT tokens stored locally ensure you don't have to keep logging in.
- **Registered User Verification**: Only users who have already registered with their mobile number can be added or chatted with.
- **Per-Chat Security PIN**: When you add a contact, **you set a private PIN for that specific chat**. Nobody else using your device can open or read that chat without entering your PIN.
- **Receiver-Controlled Notification Masking**: As the receiver, you configure what unique disguise name/title appears on your lockscreen notifications for each contact (e.g. your custom alias or fake weather alert). The sender has no control over what appears on your device.
- **Zero-Friction Re-Entry**: Once a contact is added, you never need to add them again. Just search their mobile number or alias, enter your PIN, and the chat screen opens immediately.
- **Local-First Zero-Knowledge Storage**: Chat messages are stored **exclusively on the user's device** using `IndexedDB` (Web) and `AsyncStorage` (Mobile). The server **never** stores permanent chat logs.
- **5-Day Expiring File Sharing**: Files uploaded through Cloudinary are tracked. Once downloaded by the recipient, a 5-day countdown begins, after which an automated cron scheduler purges the file from Cloudinary and the database.
- **Google Keep-Style Field Notes**: Built-in memo manager with an 8-color palette, title expansion, pinning to top, archiving, and editing modals.
- **Live Weather & News APIs with Realistic Fallbacks**: Connects to OpenWeatherMap and GNews when API keys are provided. When keys are empty, realistic telemetry and breaking satellite intelligence feeds simulate a fully active system.

---

## 🏗️ Architecture & Privacy Design

```mermaid
graph TB
    subgraph Client ["Client Devices (Local-First Storage)"]
        WEB["Web Browser (React + Vite + IndexedDB)"]
        MOBILE["Mobile App (React Native Expo + AsyncStorage)"]
    end

    subgraph Backend ["Node.js Express + Socket.io Server"]
        API["REST API (Auth, Lookup, Verify, Files, Notes)"]
        WS["WebSocket (Real-Time Relay & Read Receipts)"]
        CRON["Daily Cron (5-Day File Expiration Cleaner)"]
    end

    subgraph External ["Cloud Infrastructure"]
        DB["MongoDB Atlas (Users, Temporary Pending Messages, File Trackers)"]
        CLOUD["Cloudinary (Encrypted Media Uploads)"]
        FCM["Firebase Cloud Messaging (Disguised Push Alerts)"]
        WEATHER["OpenWeatherMap / Fallback Simulation"]
        NEWS["GNews API / Satellite Intelligence Wire"]
    end

    WEB <-->|WebSocket & REST| Backend
    MOBILE <-->|WebSocket & REST| Backend
    API <--> DB
    WS <--> DB
    CRON <--> DB
    CRON <--> CLOUD
    API <--> CLOUD
    API <--> FCM
    WEB -.-> WEATHER
    WEB -.-> NEWS
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB Atlas](https://www.mongodb.com/atlas) connection string (Free tier)
- [Cloudinary](https://cloudinary.com/) account (Free tier)
- [Firebase Admin SDK](https://firebase.google.com/) project (Free tier)

---

### 1. Backend Setup

1. Open PowerShell / Terminal and navigate to the backend:
   ```bash
   cd d:\projects\skypulse\backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your `.env` file (open `backend/.env`):
   ```env
   PORT=3000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   JWT_SECRET=your_super_secret_jwt_key_here

   # MongoDB Atlas URI
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/skypulse?retryWrites=true&w=majority

   # Cloudinary (for file sharing)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Firebase Admin SDK (for push notifications)
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

   # Weather & News APIs (Optional - realistic simulated feeds work automatically)
   OPENWEATHER_API_KEY=
   GNEWS_API_KEY=
   ```
4. Start the backend service:
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:3000`.

---

### 2. Web Application Setup

1. In a new terminal window:
   ```bash
   cd d:\projects\skypulse\web
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser at:
   ```
   http://localhost:5173/
   ```

---

### 3. Native Mobile App Setup (iOS & Android)

1. In a new terminal window:
   ```bash
   cd d:\projects\skypulse\mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Expo:
   ```bash
   npx expo start
   ```
4. Scan the QR code using the **Expo Go** app on your iOS or Android device, or press `a` for Android emulator or `i` for iOS simulator.

---

## 📖 How to Use the Application

### Step 1: Register with Mobile Number (Mandatory First Step)

1. Open the app at `http://localhost:5173/`. Unauthenticated visitors are automatically directed to the **Station Access Portal**.
2. Click **"Register New Mobile Account"**.
3. Fill in your credentials:
   - **Registered Mobile Number**: Your unique identity across the network (e.g. `+1 555 123 4567` or `9876543210`).
   - **Master Access Password**: Protects your account (min 6 characters).
   - *(Optional)* **Station Call-Sign / Alias**: An optional friendly node tag.
4. Click **"Register & Deploy Station"**.
5. Your session is issued a secure 180-day token (maintained for months) and you are immediately taken to the **SkyPulse Home Screen** to access all features.

---

### Step 2: Sign In (Accessing Your Station)

1. Open SkyPulse. If logged out, you will see the **Station Access Portal**.
2. Enter your **Registered Mobile Number** and **Master Password**.
3. Click **"Sign In to SkyPulse"**. Your session persists for months.

---

### Step 3: Add a Registered User & Set Your Per-Chat Security PIN

To chat with another person, **they must already be registered on SkyPulse with their mobile number**:

1. Click the **🔍 Search Bar** in the header or click **"+ Add"** in the Station Feed.
2. Enter the person's **registered mobile number**.
3. SkyPulse queries the server to verify the user has registered.
4. Once verified, configure the chat:
   - **Per-Chat Security PIN**: **You choose a 4–8 digit PIN** to protect this specific conversation. Only you know this PIN!
   - **Custom Secret Alias**: Assign a private display name (e.g. `Alex`, `Work Partner`).
   - **Notification Mask**: Choose what fake alert title appears on your lockscreen when they message you (e.g. `Severe Weather Warning`).
5. Click **"Save & Open Chat"**. The conversation is initialized in your local database.

---

### Step 4: Accessing Any Chat Later (Search &rarr; PIN &rarr; Done!)

Once a contact is added, **you never need to add them again**:
1. Simply search for their mobile number or alias in the search bar, OR click them in the Station Feed sidebar.
2. A prompt asks: *"Enter Security PIN for [Contact]"*.
3. Type the PIN you set for that chat.
4. **Done!** The chat screen unlocks and opens immediately. Nobody else can open that chat without your per-chat PIN.

---

### Step 4: Secret Chatting (Station Feed)

1. Click **"📡 Station Feed"** in the top navbar.
2. In the left sidebar, click on any subscribed station to open the conversation.
3. **Toggle Chat Modes**:
   - Click the **"💬 Chat Mode" / "📊 Telemetry Mode"** toggle in the top-right corner of the chat header.
   - In **Telemetry Mode**, all incoming and outgoing messages are disguised as timestamped scientific readings:
     ```
     [11:04 AM] LOCAL_TX: The package has arrived.
     [11:05 AM] REMOTE_RX: Confirmed. Standing by for next report.
     ```
4. **Real-Time Indicators**:
   - Online/Offline status dots.
   - Typing indicators ("Transmitting data...").
   - Unread count badges in the sidebar.

---

### Step 5: Sharing Files & 5-Day Auto-Expiry

1. In any open conversation, click the **📎 Paperclip** icon next to the input box.
2. Select any document, PDF, image, or archive.
3. The file is uploaded through the server to Cloudinary and sent as a data packet.
4. When your peer clicks **"📥 Download Packet"**, the server records the first download timestamp and starts a **5-day expiration timer**.
5. After 5 days from first download, the backend cron scheduler automatically deletes the file from Cloudinary and deletes the record from the database.

---

### Step 6: Google Keep-Style Notes Board

1. Click **"📝 Notes"** in the top navbar.
2. **Create a Note**:
   - Click into the *"Take a note or field memo..."* box at the top.
   - It expands with Title, Body, Pin toggle, and an 8-color palette selector.
   - Pick a color (e.g. Emerald, Deep Navy, Amethyst, Slate, Amber) and click **"Save Note"**.
3. **Organize Notes**:
   - Click the **📌 Pin** icon to pin critical notes to the top section.
   - Click the **📥 Archive** icon to hide completed notes (switch between "Active Notes" and "Archive" views anytime).
   - Click any note card to open the **full modal editor**.

---

### Step 7: Configuring Disguised Push Notifications

1. Click the **⚙️ Settings** icon in the navbar.
2. Under **Disguised Notification Mask**:
   - **Broadcast Disguise Channel**: Choose what template lockscreen alerts should use:
     - `☁️ Weather Alerts & Severe Radar`
     - `📰 Breaking Global News Wire`
     - `🛰️ SkyPulse Satellite Telemetry`
   - **Alert Sender Name**: Change what sender name displays (e.g. `SkyPulse Weather Service`).
3. Click **"Apply Disguise Profile"**.
4. When a contact sends you a message while you are offline, your phone or browser receives a notification that looks like:
   > **SkyPulse Weather Service**  
   > *☁️ Weather Alert: Partly cloudy with 65% humidity expected in your area.*
5. Tapping the notification opens the SkyPulse weather homepage, NOT the secret chat.

---

### Step 8: Device Privacy & Wiping Local Cache

1. In **Settings** (`/settings`), you can update:
   - **Peer Access Code (PIN)**: Change the PIN required by others to pair with your station.
   - **Master Access Password**: Change your station sign-in password.
2. **Emergency Purge**:
   - Under **Device Data Privacy**, click **"Purge Local Data"**.
   - This instantly deletes all local IndexedDB/AsyncStorage messages, contacts, and caches on that device.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `3000` |
| `NODE_ENV` | Runtime environment | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `JWT_SECRET` | Secret key for signing auth tokens | Any secure 32+ char string |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier | Your cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Your API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Your API secret |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | Your project ID |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin private key | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin client email | Service account email |
| `OPENWEATHER_API_KEY` | *(Optional)* OpenWeatherMap key | Leave blank for built-in simulation |
| `GNEWS_API_KEY` | *(Optional)* GNews API key | Leave blank for built-in simulation |

---

## 📁 Project Structure

```
d:\projects\skypulse\
├── README.md                      # This documentation
├── backend\                       # Express + Socket.io Server
│   ├── src\
│   │   ├── config\                # DB, Cloudinary & Firebase configs
│   │   │   ├── db.js
│   │   │   ├── cloudinary.js
│   │   │   └── firebase.js
│   │   ├── middleware\            # JWT auth middleware
│   │   │   └── auth.js
│   │   ├── models\                # Mongoose schemas
│   │   │   ├── User.js            # Station ID, hashed password & PIN
│   │   │   ├── PendingMessage.js  # Temporary undelivered messages
│   │   │   ├── File.js            # Tracked files with 5-day expiration
│   │   │   └── Note.js            # Google Keep-style notes
│   │   ├── routes\                # REST API routes
│   │   │   ├── auth.js            # Register, login, credentials
│   │   │   ├── stations.js        # Lookup & PIN verification
│   │   │   ├── files.js           # Upload & download tracking
│   │   │   ├── notes.js           # Notes CRUD
│   │   │   └── notifications.js   # FCM token registration
│   │   ├── schedulers\            # node-cron 5-day file cleaner
│   │   │   └── fileCleanup.js
│   │   ├── services\              # Push notification disguiser
│   │   │   └── pushNotification.js
│   │   ├── socket\                # Socket.io messaging handlers
│   │   │   └── index.js
│   │   └── server.js              # Server entry point
│   ├── .env                       # Backend environment variables
│   └── package.json
│
├── web\                           # React + Vite Frontend
│   ├── src\
│   │   ├── components\
│   │   │   ├── Navbar.jsx         # App header, secret search button, mobile nav
│   │   │   ├── SecretSearchModal.jsx # Disguised station scanner & PIN verifier
│   │   │   └── NoteModal.jsx      # Google Keep-style note editor modal
│   │   ├── context\
│   │   │   ├── AuthContext.jsx    # User session & socket lifecycle
│   │   │   └── ChatContext.jsx    # Local IndexedDB chat state & messaging
│   │   ├── pages\
│   │   │   ├── LandingPage.jsx    # Weather widgets, forecast, news wire
│   │   │   ├── AuthPage.jsx       # Station deployment & login portal
│   │   │   ├── DashboardPage.jsx  # Station telemetry control room
│   │   │   ├── NotesPage.jsx      # Keep-style field notes board
│   │   │   ├── StationFeedPage.jsx# Secret chat with dual view modes
│   │   │   └── SettingsPage.jsx   # Notification masking & security settings
│   │   ├── services\
│   │   │   ├── api.js             # Fetch wrapper with auth headers
│   │   │   ├── socket.js          # Socket.io client
│   │   │   ├── storage.js         # IndexedDB client-side chat database
│   │   │   └── weatherNews.js     # Weather & news fetching with simulation
│   │   ├── index.css              # Custom styling & dark aesthetic
│   │   ├── App.jsx                # Router & Provider wrapper
│   │   └── main.jsx
│   ├── vite.config.js             # Vite config with backend proxy
│   └── package.json
│
└── mobile\                        # React Native + Expo Native App
    ├── src\
    │   ├── components\
    │   │   └── SecretSearchModal.js
    │   ├── context\
    │   │   ├── AuthContext.js
    │   │   └── ChatContext.js
    │   ├── screens\
    │   │   ├── WeatherScreen.js   # Disguised weather & news landing
    │   │   ├── AuthScreen.js      # Station access portal
    │   │   ├── FeedScreen.js      # Secret chat screen with dual modes
    │   │   ├── NotesScreen.js     # Mobile Google Keep-style notes
    │   │   └── SettingsScreen.js  # Disguise mask & PIN management
    │   └── services\
    │       ├── api.js
    │       ├── socket.js
    │       └── storage.js         # AsyncStorage local-first database
    ├── assets\
    │   └── icon.svg
    ├── App.js                     # Tab & Stack navigation root
    ├── app.json                   # Expo disguised app configuration
    └── package.json
```

---

## 🔒 Security Summary

1. **Zero Permanent Messages on Server**: All delivered messages reside in the user's browser IndexedDB or phone AsyncStorage.
2. **Double Gatekeeper Pairing**: Knowing an ID is not enough; pairing strictly enforces a hashed PIN handshake.
3. **Autonomous File Purging**: Shared files are automatically expunged after 5 days from first download.
4. **Stealth Alerts**: Phone notifications appear as harmless weather advisories with zero chat content.
