const BookingForm = () => {
    return (
        <div className="booking-form-container">
            <h2 className="booking-form-title">Send Us an Inquiry</h2>
            <form className="booking-form">
                <div className="booking-form-group">
                    <label htmlFor="booking-name" className="booking-form-label">Your Name</label>
                    <input
                        id="booking-name"
                        type="text"
                        placeholder="Jane Smith"
                        className="booking-form-input"
                    />
                </div>
                <div className="booking-form-group">
                    <label htmlFor="booking-email" className="booking-form-label">Email Address</label>
                    <input
                        id="booking-email"
                        type="email"
                        placeholder="you@example.com"
                        className="booking-form-input"
                    />
                </div>
                <div className="booking-form-group">
                    <label htmlFor="booking-event-type" className="booking-form-label">Event Type</label>
                    <input
                        id="booking-event-type"
                        type="text"
                        placeholder="e.g. Bachelorette Party, Corporate Event…"
                        className="booking-form-input"
                    />
                </div>
                <div className="booking-form-group">
                    <label htmlFor="booking-date" className="booking-form-label">Event Date</label>
                    <input
                        id="booking-date"
                        type="date"
                        className="booking-form-input booking-form-date"
                    />
                </div>
                <div className="booking-form-group">
                    <label htmlFor="booking-message" className="booking-form-label">Tell Us More</label>
                    <textarea
                        id="booking-message"
                        placeholder="Venue details, audience size, any special requests…"
                        rows={4}
                        className="booking-form-input booking-form-textarea"
                    />
                </div>
                <button type="submit" className="btn btn-primary booking-form-submit" id="booking-submit-btn">
                    Send Inquiry
                </button>
            </form>
        </div>
    );
};

export default BookingForm;
