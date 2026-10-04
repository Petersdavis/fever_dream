import { useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import {
    collection,
    query,
    orderBy,
    getDocs,
    doc,
    deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function Admin() {
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // Login Form State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    // Admin Dashboard State
    const [activeTab, setActiveTab] = useState('inquiries'); // 'inquiries' | 'subscribers'
    const [inquiries, setInquiries] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [dataError, setDataError] = useState('');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setAuthLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const fetchAdminData = async () => {
        setDataLoading(true);
        setDataError('');
        try {
            // Fetch Inquiries
            const inqSnap = await getDocs(
                query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'))
            );
            const inqList = inqSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setInquiries(inqList);

            // Fetch Subscribers
            const subSnap = await getDocs(
                query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc'))
            );
            const subList = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setSubscribers(subList);
        } catch (err) {
            console.error('Error fetching admin data:', err);
            setDataError(err.message || 'Failed to load records. Ensure your user account is authorized.');
        } finally {
            setDataLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchAdminData();
        }
    }, [user]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoggingIn(true);
        setLoginError('');
        try {
            await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
        } catch (err) {
            console.error('Login error:', err);
            setLoginError('Authentication failed: ' + (err.code || err.message));
        } finally {
            setLoggingIn(false);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    const handleDeleteInquiry = async (id) => {
        if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
        try {
            await deleteDoc(doc(db, 'inquiries', id));
            setInquiries((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    const handleDeleteSubscriber = async (id) => {
        if (!window.confirm('Are you sure you want to delete this subscriber?')) return;
        try {
            await deleteDoc(doc(db, 'subscribers', id));
            setSubscribers((prev) => prev.filter((item) => item.id !== id));
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    const formatDate = (val) => {
        if (!val) return '—';
        if (val.toDate && typeof val.toDate === 'function') {
            return val.toDate().toLocaleString();
        }
        if (val.seconds) {
            return new Date(val.seconds * 1000).toLocaleString();
        }
        return String(val);
    };

    if (authLoading) {
        return (
            <div className="page admin-page">
                <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
                    <p style={{ color: 'var(--text-dim)' }}>Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Gate: Unauthenticated Login View
    if (!user) {
        return (
            <div className="page admin-page">
                <div className="container" style={{ maxWidth: '440px', padding: '60px 20px' }}>
                    <div style={{
                        background: 'var(--surface-color)',
                        padding: '40px',
                        borderRadius: '20px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🔒</span>
                            <h2 style={{ fontFamily: 'var(--font-logo)', margin: 0, fontSize: '1.6rem' }}>Admin Access</h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '6px' }}>
                                Sign in with your approved Firebase credentials
                            </p>
                        </div>

                        {loginError && (
                            <div style={{
                                background: 'rgba(255, 107, 107, 0.15)',
                                border: '1px solid #ff6b6b',
                                color: '#ff6b6b',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                marginBottom: '20px'
                            }}>
                                {loginError}
                            </div>
                        )}

                        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    placeholder="admin@feverdreamcomedy.ca"
                                    className="booking-form-input"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                                    Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="booking-form-input"
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loggingIn}
                                className="btn btn-primary"
                                style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}
                            >
                                {loggingIn ? 'Authenticating...' : 'Sign In'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Authenticated Admin Dashboard
    return (
        <div className="page admin-page">
            <div className="container" style={{ padding: '40px 20px 80px' }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}>
                    <div>
                        <span className="eyebrow">Fever Dream Command Center</span>
                        <h1 style={{ fontFamily: 'var(--font-logo)', margin: '4px 0 0', fontSize: '2rem' }}>
                            Admin Dashboard
                        </h1>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                            Logged in as: <strong style={{ color: 'var(--accent-color)' }}>{user.email}</strong>
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            type="button"
                            onClick={fetchAdminData}
                            className="btn btn-secondary"
                            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                        >
                            ↻ Refresh
                        </button>
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="btn btn-secondary"
                            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '28px'
                }}>
                    <button
                        type="button"
                        onClick={() => setActiveTab('inquiries')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'inquiries' ? '2px solid var(--accent-color)' : '2px solid transparent',
                            color: activeTab === 'inquiries' ? 'var(--accent-color)' : 'var(--text-dim)',
                            padding: '12px 20px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        📩 Inquiries & Bookings
                        <span style={{
                            background: activeTab === 'inquiries' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.1)',
                            color: activeTab === 'inquiries' ? 'var(--bg-dark)' : 'var(--text-color)',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                        }}>
                            {inquiries.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('subscribers')}
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === 'subscribers' ? '2px solid var(--accent-color)' : '2px solid transparent',
                            color: activeTab === 'subscribers' ? 'var(--accent-color)' : 'var(--text-dim)',
                            padding: '12px 20px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        📬 Newsletter Subscribers
                        <span style={{
                            background: activeTab === 'subscribers' ? 'var(--accent-color)' : 'rgba(255, 255, 255, 0.1)',
                            color: activeTab === 'subscribers' ? 'var(--bg-dark)' : 'var(--text-color)',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                        }}>
                            {subscribers.length}
                        </span>
                    </button>
                </div>

                {dataError && (
                    <div style={{
                        background: 'rgba(255, 107, 107, 0.15)',
                        border: '1px solid #ff6b6b',
                        color: '#ff6b6b',
                        padding: '12px 18px',
                        borderRadius: '10px',
                        marginBottom: '20px'
                    }}>
                        {dataError}
                    </div>
                )}

                {dataLoading ? (
                    <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '40px 0' }}>Loading records...</p>
                ) : activeTab === 'inquiries' ? (
                    /* Inquiries Tab */
                    inquiries.length === 0 ? (
                        <div style={{
                            background: 'var(--surface-color)',
                            padding: '60px 20px',
                            borderRadius: '16px',
                            textAlign: 'center',
                            color: 'var(--text-dim)'
                        }}>
                            <p style={{ fontSize: '1.1rem' }}>No inquiries submitted yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {inquiries.map((inq) => (
                                <div
                                    key={inq.id}
                                    style={{
                                        background: 'var(--surface-color)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '14px',
                                        padding: '24px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-color)' }}>{inq.name}</h3>
                                            <a
                                                href={`mailto:${inq.email}`}
                                                style={{ color: 'var(--accent-color)', fontSize: '0.9rem', textDecoration: 'none' }}
                                            >
                                                {inq.email}
                                            </a>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                                {formatDate(inq.createdAt)}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteInquiry(inq.id)}
                                                style={{
                                                    background: 'transparent',
                                                    border: '1px solid rgba(255, 107, 107, 0.4)',
                                                    color: '#ff6b6b',
                                                    borderRadius: '6px',
                                                    padding: '4px 10px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>

                                    {(inq.eventType || inq.eventDate) && (
                                        <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
                                            {inq.eventType && <span><strong>Event Type:</strong> {inq.eventType}</span>}
                                            {inq.eventDate && <span><strong>Target Date:</strong> {inq.eventDate}</span>}
                                        </div>
                                    )}

                                    {inq.message && (
                                        <p style={{
                                            background: 'rgba(0, 0, 0, 0.25)',
                                            padding: '14px',
                                            borderRadius: '8px',
                                            margin: 0,
                                            fontSize: '0.9rem',
                                            lineHeight: 1.5,
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {inq.message}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    /* Subscribers Tab */
                    subscribers.length === 0 ? (
                        <div style={{
                            background: 'var(--surface-color)',
                            padding: '60px 20px',
                            borderRadius: '16px',
                            textAlign: 'center',
                            color: 'var(--text-dim)'
                        }}>
                            <p style={{ fontSize: '1.1rem' }}>No subscribers yet.</p>
                        </div>
                    ) : (
                        <div style={{
                            background: 'var(--surface-color)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '14px',
                            overflowX: 'auto'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--accent-color)' }}>
                                        <th style={{ padding: '16px 20px' }}>Email</th>
                                        <th style={{ padding: '16px 20px' }}>Subscribed On</th>
                                        <th style={{ padding: '16px 20px' }}>Location Consent</th>
                                        <th style={{ padding: '16px 20px' }}>Coordinates</th>
                                        <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscribers.map((sub) => (
                                        <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            <td style={{ padding: '14px 20px', fontWeight: 600 }}>{sub.email}</td>
                                            <td style={{ padding: '14px 20px', color: 'var(--text-dim)' }}>{formatDate(sub.subscribedAt)}</td>
                                            <td style={{ padding: '14px 20px' }}>
                                                {sub.locationConsent ? (
                                                    <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>✓ Shared</span>
                                                ) : (
                                                    <span style={{ color: 'var(--text-dim)' }}>Skipped</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '14px 20px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                                {sub.location?.lat && sub.location?.lng
                                                    ? `${sub.location.lat.toFixed(4)}, ${sub.location.lng.toFixed(4)} (±${Math.round(sub.location.accuracy || 0)}m)`
                                                    : '—'}
                                            </td>
                                            <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSubscriber(sub.id)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid rgba(255, 107, 107, 0.4)',
                                                        color: '#ff6b6b',
                                                        borderRadius: '6px',
                                                        padding: '4px 10px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
