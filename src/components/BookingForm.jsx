import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const BookingForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [eventType, setEventType] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !email.includes('@')) return;

        setStatus('submitting');
        setErrorMessage('');

        try {
            await addDoc(collection(db, 'inquiries'), {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                eventType: eventType.trim() || null,
                eventDate: eventDate || null,
                message: message.trim() || null,
                createdAt: serverTimestamp(),
                status: 'new',
            });
            setStatus('success');
            setName('');
            setEmail('');
            setEventType('');
            setEventDate('');
            setMessage('');
        } catch (err) {
            console.error('Inquiry submission error:', err);
            setErrorMessage('Unable to send inquiry right now. Please try again or email feverdreamcomedykw@gmail.com directly.');
            setStatus('error');
        }
    };

    return (
        <div className="booking-form-container">
            <h2 className="booking-form-title">Send Us an Inquiry</h2>

            {status === 'success' ? (
                <div className="booking-form-success" style={{ background: 'rgba(0, 191, 165, 0.12)', border: '1px solid var(--accent-color)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
                    <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🎉</span>
                    <h3 style={{ color: 'var(--text-color)', margin: '0 0 8px', fontFamily: 'var(--font-logo)' }}>Inquiry Received!</h3>
                    <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.95rem' }}>
                        Thanks for reaching out! The Fever Dream team will review your details and get back to you shortly.
                    </p>
                    <button
                        type="button"
                        onClick={() => setStatus('idle')}
                        className="btn btn-secondary"
                        style={{ marginTop: '16px' }}
                    >
                        Send Another Inquiry
                    </button>
                </div>
            ) : (
                <form className="booking-form" onSubmit={handleSubmit}>
                    <div className="booking-form-group">
                        <label htmlFor="booking-name" className="booking-form-label">Your Name *</label>
                        <input
                            id="booking-name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jane Smith"
                            className="booking-form-input"
                        />
                    </div>
                    <div className="booking-form-group">
                        <label htmlFor="booking-email" className="booking-form-label">Email Address *</label>
                        <input
                            id="booking-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="booking-form-input"
                        />
                    </div>
                    <div className="booking-form-group">
                        <label htmlFor="booking-event-type" className="booking-form-label">Event Type</label>
                        <input
                            id="booking-event-type"
                            type="text"
                            value={eventType}
                            onChange={(e) => setEventType(e.target.value)}
                            placeholder="e.g. Bachelorette Party, Corporate Event…"
                            className="booking-form-input"
                        />
                    </div>
                    <div className="booking-form-group">
                        <label htmlFor="booking-date" className="booking-form-label">Event Date</label>
                        <input
                            id="booking-date"
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                            className="booking-form-input booking-form-date"
                        />
                    </div>
                    <div className="booking-form-group">
                        <label htmlFor="booking-message" className="booking-form-label">Tell Us More</label>
                        <textarea
                            id="booking-message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Venue details, audience size, any special requests…"
                            rows={4}
                            className="booking-form-input booking-form-textarea"
                        />
                    </div>

                    {status === 'error' && (
                        <p style={{ color: '#ff6b6b', fontSize: '0.85rem', margin: 0 }}>{errorMessage}</p>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="btn btn-primary booking-form-submit"
                        id="booking-submit-btn"
                    >
                        {status === 'submitting' ? 'Sending...' : 'Send Inquiry'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default BookingForm;
