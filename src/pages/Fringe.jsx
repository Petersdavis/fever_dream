import { Link } from 'react-router-dom';
import bestOfFestWatermark from '../assets/guelph_fringe/2026 BEST OF FEST - White.png';
import bigBuzzWatermark from '../assets/guelph_fringe/2026 BIG BUZZ - White.png';

const FRINGE_POSTER_URL =
  'https://static.wixstatic.com/media/5bbf7f_0cc0f3f9100d4083b6dcbf17e6d4f046~mv2.png/v1/fill/w_581,h_320,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/Love%20So%20Far%20Poster%20-%201200x675_PNG.png';

const Fringe = () => {
    return (
        <div className="page fringe-page">
            <section className="hero" style={{ padding: '80px 0' }}>
                <div className="container">
                    <div style={{ marginBottom: '20px' }}>
                        <span className="eyebrow">Award-Winning Original Production</span>
                    </div>
                    <h1>The Curse of <span className="accent-text">Girl Night</span></h1>
                    <h2>Fever Dream Comedy's Hit Sketch Show</h2>
                    
                    <div className="fringe-content" style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginTop: '40px', alignItems: 'center' }}>
                        
                        <div className="fringe-poster-column" style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <img 
                                src={FRINGE_POSTER_URL} 
                                alt="The Curse of Girl Night Poster" 
                                style={{ width: '100%', maxWidth: '480px', borderRadius: '15px', border: '1px solid rgba(0, 191, 165, 0.4)', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)', display: 'block' }} 
                            />

                            <div className="fringe-awards-showcase">
                                <div className="fringe-laurel-card">
                                    <img 
                                        src={bestOfFestWatermark} 
                                        alt="2026 Best of Fest Winner - Guelph Fringe Festival" 
                                        className="fringe-laurel-img" 
                                    />
                                </div>
                                <div className="fringe-laurel-card">
                                    <img 
                                        src={bigBuzzWatermark} 
                                        alt="2026 Big Buzz Winner - Guelph Fringe Festival" 
                                        className="fringe-laurel-img" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="fringe-details" style={{ flex: '1', minWidth: '300px', textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <p className="about-intro-text" style={{ textAlign: 'left', marginBottom: '16px' }}>
                                What would you endure to follow your dreams? Stand-up comedians Lindsay Endersby and Renee Groux dream that one day their all-women stand-up showcase, <em>Girl Night</em>, will be a roaring success.
                            </p>
                            <p className="about-intro-text" style={{ textAlign: 'left', marginBottom: '16px' }}>
                                Little do they know… they’ve been cursed! Underwater financially and suffering constant mishaps, the duo fights to perform before their sworn enemy cancels <em>Girl Night</em> forever. A hilarious sketch show about friendship, failure, hope, and the nightmarish dream of live comedy.
                            </p>
                            <p className="about-intro-text" style={{ textAlign: 'left', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                                Recognized by audiences and critics alike, taking home both "Best of Fest" and the "Big Buzz" award at the 2026 Guelph Fringe Festival.
                            </p>
                            
                            <div style={{ marginTop: '30px' }}>
                                <Link to="/book" className="btn btn-primary">Book This Show / Inquire</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Fringe;
