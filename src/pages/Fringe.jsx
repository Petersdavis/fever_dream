import avatarPlaceholder from '../assets/avatar-placeholder.svg';

const Fringe = () => {
    return (
        <div className="page fringe-page">
            <section className="hero" style={{ padding: '80px 0' }}>
                <div className="container">
                    <h1>The Curse of <span className="accent-text">Girl Night</span></h1>
                    <h2>Fever Dream Comedy's Debut Sketch Show at Guelph Fringe Festival!</h2>
                    
                    <div className="fringe-content" style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginTop: '60px', alignItems: 'center' }}>
                        
                        <div className="fringe-poster" style={{ flex: '1', minWidth: '300px', textAlign: 'center' }}>
                            <img 
                                src={avatarPlaceholder} 
                                alt="Show Poster Placeholder" 
                                style={{ width: '100%', maxWidth: '400px', borderRadius: '15px', border: '2px dashed var(--accent-color)', padding: '10px', background: 'rgba(255,255,255,0.1)' }} 
                            />
                            <p style={{ marginTop: '15px', color: 'var(--text-dim)' }}>[Show Poster Placeholder]</p>
                        </div>

                        <div className="fringe-details" style={{ flex: '1', minWidth: '300px', textAlign: 'left' }}>
                            <p className="about-intro-text" style={{ textAlign: 'left', marginBottom: '20px' }}>
                                What would you endure to follow your dreams? Stand-up comedians Lindsay and Renee think it should be easy enough to achieve their dream of running an all-women stand-up comedy show.
                            </p>
                            <p className="about-intro-text" style={{ textAlign: 'left', marginBottom: '20px' }}>
                                Little do they know - they’ve been cursed! Doomed to constant failure, money troubles and illness, the girls have one chance to break the curse forever at the Red Brick Cafe.
                            </p>
                            <p className="about-intro-text" style={{ textAlign: 'left', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                                See Fever Dream Comedy’s debut comedy sketch show at Guelph Fringe Festival!
                            </p>
                            
                            <div style={{ marginTop: '30px' }}>
                                <button className="btn btn-primary">Get Tickets</button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Fringe;
