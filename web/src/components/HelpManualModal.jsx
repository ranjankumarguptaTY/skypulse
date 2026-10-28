import React, { useState } from 'react';

export const HelpManualModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('quickstart');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 11000 }}>
      <div
        className="modal"
        style={{ maxWidth: '640px', maxHeight: '88vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>📖</span>
            <div>
              <h2 style={{ fontSize: '1.15rem' }}>SkyPulse Protocol Manual</h2>
              <p className="text-xs text-muted">
                Mobile Registration, Per-Chat Security PIN &amp; Undercover Guide
              </p>
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '12px',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'quickstart' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('quickstart')}
          >
            ⚡ Quick Summary
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'register' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('register')}
          >
            1. Mobile Registration
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'adduser' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('adduser')}
          >
            2. Adding by Mobile
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'chat' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setActiveTab('chat')}
          >
            3. Per-Chat PIN &amp; Chat
          </button>
        </div>

        {/* Tab 1: Quick Summary */}
        {activeTab === 'quickstart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
            <div
              style={{
                padding: '14px',
                background: 'var(--accent-dim)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--r-md)',
              }}
            >
              <strong style={{ color: 'var(--accent)' }}>🎭 The Disguise Principle:</strong>
              <p className="text-xs text-secondary mt-8">
                To any onlooker, this application is a live meteorological and satellite news aggregator.
                Registration is required by mobile number before reaching the home screen.
                Persistent token authentication maintains your session for months without logging you out.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="card" style={{ padding: '12px 16px' }}>
                <strong>1️⃣ Register via Mobile Number:</strong>
                <p className="text-xs text-muted mt-8">
                  Sign up with your <strong>Mobile Number</strong> and password. Once logged in, you enter the weather hub and can access all features.
                </p>
              </div>

              <div className="card" style={{ padding: '12px 16px' }}>
                <strong>2️⃣ Only Registered Users Can Be Added:</strong>
                <p className="text-xs text-muted mt-8">
                  To chat with someone, they must also be registered on SkyPulse. You add them by entering their exact registered <strong>Mobile Number</strong>.
                </p>
              </div>

              <div className="card" style={{ padding: '12px 16px' }}>
                <strong>3️⃣ Per-Chat Security PIN (Set by You):</strong>
                <p className="text-xs text-muted mt-8">
                  When adding a contact, <strong>you choose a private security PIN</strong> specifically for this chat.
                  Only you can open this chat with your PIN!
                </p>
              </div>

              <div className="card" style={{ padding: '12px 16px' }}>
                <strong>4️⃣ Search &rarr; Enter PIN &rarr; Done:</strong>
                <p className="text-xs text-muted mt-8">
                  Once added, you never need to add them again. Whenever you want to chat, simply search the user in the search bar or sidebar, enter your PIN, and the chat screen unlocks instantly!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Registration Guide */}
        {activeTab === 'register' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
              How to Register &amp; Login
            </h3>
            <ol style={{ paddingLeft: '20px', lineHeight: 1.8 }}>
              <li>
                When opening the app, you will be on the <strong>Station Access Portal</strong>.
              </li>
              <li>
                Click on <strong>&quot;Register New Mobile Account&quot;</strong>.
              </li>
              <li>
                <strong>Mobile Number:</strong> Enter your mobile number (e.g. <code>+1 555 123 4567</code> or <code>9876543210</code>).
              </li>
              <li>
                <strong>Master Password:</strong> Create a secure password (min 6 characters).
              </li>
              <li>
                Click <strong>&quot;Register &amp; Deploy Station&quot;</strong>.
              </li>
              <li>
                You will be immediately logged in and taken to the SkyPulse Home Screen!
              </li>
            </ol>

            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--r-md)',
              }}
            >
              <strong style={{ color: 'var(--success)', fontSize: '0.85rem' }}>🔒 Session Persistence:</strong>
              <p className="text-xs text-muted mt-8">
                Your login uses secure 180-day token authentication stored on your device. You remain logged in for months without needing to re-authenticate each time.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Adding Users Guide */}
        {activeTab === 'adduser' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
              Adding a Registered Contact by Mobile Number
            </h3>
            <p className="text-xs text-secondary">
              Only people already registered on SkyPulse can be added.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="card" style={{ padding: '12px 16px' }}>
                <strong>Step 1: Check Registration</strong>
                <p className="text-xs text-muted mt-8">
                  Type the person&apos;s registered <strong>Mobile Number</strong> into the header search bar or click <strong>&quot;+ Add&quot;</strong> in the Station Feed.
                  SkyPulse verifies if the user is registered.
                </p>
              </div>

              <div className="card" style={{ padding: '12px 16px' }}>
                <strong>Step 2: Set Your Per-Chat Security PIN</strong>
                <p className="text-xs text-muted mt-8">
                  Enter a secret <strong>4–8 digit PIN</strong> that you choose for this chat.
                  Even if someone accesses your computer or phone, they cannot open this chat without your PIN.
                </p>
              </div>

              <div className="card" style={{ padding: '12px 16px' }}>
                <strong>Step 3: Set Secret Alias &amp; Notification Mask</strong>
                <p className="text-xs text-muted mt-8">
                  - <strong>Alias:</strong> Give them a secret name (e.g. &quot;Alex&quot;, &quot;Work Partner&quot;).<br />
                  - <strong>Notification Mask:</strong> Set what fake title shows on your lockscreen when they message you (e.g. &quot;Severe Weather Warning&quot;).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Chatting & Per-Chat PIN Guide */}
        {activeTab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
              Opening Chats &amp; Ongoing Usage
            </h3>

            <div className="card" style={{ padding: '14px' }}>
              <strong>🔑 No Need to Re-Add — Search, Enter PIN &amp; Done:</strong>
              <p className="text-xs text-muted mt-8">
                Once a contact is added, they remain saved in your local device database.
                To talk to them anytime:
              </p>
              <ul style={{ paddingLeft: '16px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <li>Search their mobile number or alias in the search bar, OR click them in the sidebar.</li>
                <li>Enter the security PIN you assigned to this chat.</li>
                <li><strong>Done!</strong> The chat screen opens immediately.</li>
              </ul>
            </div>

            <div className="card" style={{ padding: '14px' }}>
              <strong>📊 Observation Telemetry Disguise:</strong>
              <p className="text-xs text-muted mt-8">
                Click <strong>&quot;📊 Telemetry Mode&quot;</strong> in the chat header to disguise messages as raw meteorological sensor logs:
              </p>
              <div
                style={{
                  fontFamily: 'monospace',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '10px',
                  borderRadius: '6px',
                  marginTop: '8px',
                  fontSize: '0.8rem',
                }}
              >
                <div>[11:02 AM] <span style={{ color: 'var(--accent)' }}>LOCAL_TX:</span> Documents ready for review.</div>
                <div>[11:03 AM] <span style={{ color: 'var(--accent2)' }}>REMOTE_RX:</span> Confirmed. Telemetry synchronized.</div>
              </div>
            </div>

            <div className="card" style={{ padding: '14px' }}>
              <strong>📎 5-Day Auto-Expiring Files:</strong>
              <p className="text-xs text-muted mt-8">
                Click the 📎 paperclip to share files. Once downloaded, a 5-day expiration timer begins, after which the file is automatically purged from the server and storage.
              </p>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Close Protocol Manual
          </button>
        </div>
      </div>
    </div>
  );
};
