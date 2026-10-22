import avatarPlaceholder from '../assets/avatar-placeholder.svg';
import reneeHeadshot from '../assets/headshots/renee_groux.jpg';
import lindsayHeadshot from '../assets/headshots/lindsay_endersby.jpg';
import theaHeadshot from '../assets/headshots/thea_rainford.jpeg';
import kaitlinHeadshot from '../assets/headshots/kaitlin_shuvera.jpeg';

const Comedians = () => {
    return (
        <div className="page comedians about-page">
            <section className="hero" style={{ padding: '80px 0' }}>
                <div className="container">
                    <h1>Our <span className="accent-text">Team</span></h1>
                    <h2>Rooted in Joy & Celebrating Alternative Voices</h2>
                    <p className="about-intro-text">
                        Fever Dream Comedy is a comedy partnership between Lindsay Endersby and Renee Groux. Born in Kitchener-Waterloo in 2022, Fever Dream Comedy is dedicated to bringing audiences a comedy experience rooted in joy that celebrates alternative voices. We blend top acts with niche underdogs to break down the barriers between women comedy performers and the audiences who seek them. Our talented comedians deliver smart, unique, and unforgettable shows that bring women together as a community.
                    </p>
                </div>
            </section>

            <section className="founders-section" id="founders">
                <div className="container">
                    <h2 className="founders-title">The Producers</h2>

                    <div className="founders-grid">
                        <div className="founder-card" id="founder-renee">
                            <div className="founder-img-wrapper">
                                <img src={reneeHeadshot} alt="Renee Groux Headshot" className="founder-headshot" />
                            </div>
                            <h3 className="founder-name">Renee Groux</h3>
                            <div className="founder-socials">
                                <a href="https://www.instagram.com/reneegroux/" target="_blank" rel="noopener noreferrer" className="founder-social-link" title="Renee Groux Instagram">
                                    Instagram ↗
                                </a>
                                <a href="https://www.youtube.com/@ReneeGroux" target="_blank" rel="noopener noreferrer" className="founder-social-link" title="Renee Groux YouTube">
                                    YouTube ↗
                                </a>
                            </div>
                            <p className="founder-bio">
                                Renee Groux is a stand-up comedian from Kitchener-Waterloo with 10 years of performing experience. A smart and skilled storyteller, Renee will serve up side-splitting insights on love, work, parenting, and more. She has appeared on Don't Tell Comedy, Guelph Comedy Festival, and the 2022 Edinburgh Fringe Festival. She is the co-producer and host of Fever Dream Comedy, running Kitchener's longest-running all-women showcase, Girl Night. Her debut comedy album, "We're Not Friends" can be heard on SiriusXM - watch the full special on Youtube.
                            </p>
                        </div>

                        <div className="founder-card" id="founder-lindsay">
                            <div className="founder-img-wrapper">
                                <img src={lindsayHeadshot} alt="Lindsay Endersby Headshot" className="founder-headshot" />
                            </div>
                            <h3 className="founder-name">Lindsay Endersby</h3>
                            <div className="founder-socials">
                                <a href="https://www.instagram.com/lindsayendersby/" target="_blank" rel="noopener noreferrer" className="founder-social-link" title="Lindsay Endersby Instagram">
                                    Instagram ↗
                                </a>
                            </div>
                            <p className="founder-bio">
                                Lindsay Endersby is a stand-up comedian who has spent 8 years performing hilarious stand-up and producing transformative comedy experiences. Sharp, sardonic, witty, and lovable, Lindsay’s comedy pulls no punches and cuts to the bone. As seen on Don’t Tell Comedy, Toronto’s legendary Comedy Bar and Levity Comedy Club. She is the co-producer and host of Fever Dream Comedy, running Kitchener's longest-running all-women showcase, Girl Night.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="performers-section" id="performers">
                <div className="container">
                    <h2 className="founders-title" style={{ marginTop: '40px' }}>Featured Performers</h2>

                    <div className="performers-grid">
                        {[
                            {
                                name: "Thea Rainford",
                                handle: "@thea.rain4d",
                                image: theaHeadshot,
                                bio: "Thea Rainford is a Toronto-based comedian who has performed across Canada and the United States. She has appeared at NXNE, The Nubian Comedy Revue and a range of emerging comedian showcases. She performs regularly in clubs and independently produced shows across the GTA and Southern Ontario and can be heard on Counterfeit Sounds Legit Volume 003.",
                                links: [
                                    { label: "Instagram", href: "https://www.instagram.com/thea.rain4d/" },
                                    { label: "TikTok", href: "https://www.tiktok.com/@thea.the.kid" }
                                ]
                            },
                            {
                                name: "Kaitlin Shuvera",
                                handle: "",
                                image: kaitlinHeadshot,
                                bio: "Kaitlin Shuvera has been displaying her dry wit and unique perspective on comedy stages across the country since REDACTED. She can be heard on CBC Radio’s LOL and The Debaters. She has appeared at the Halifax Pop explosion where she performed with Mark Little and opened for Eric Andre and has also opened for Debra Digiovanni. She was a finalist in the 2025 Sorry Comedy Festival Next Best Comic Competition and opened for Sophie Buddle and Allie Macofsky. She recently listened to Red Wine Supernova by Chappell Roan 27 times in a row.",
                                links: []
                            }
                        ].map((performer, index) => (
                            <div className="performer-card" key={index}>
                                <div className="performer-img-wrapper">
                                    <img src={performer.image || avatarPlaceholder} alt={`${performer.name} headshot`} className="performer-headshot" />
                                </div>
                                <h4 className="performer-name">{performer.name}</h4>
                                {performer.handle ? <p className="performer-handle">{performer.handle}</p> : null}
                                <p className="performer-bio">{performer.bio}</p>
                                {performer.links.length > 0 ? (
                                    <div className="founder-socials">
                                        {performer.links.map((link) => (
                                            <a
                                                key={link.label}
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="founder-social-link"
                                            >
                                                {link.label} ↗
                                            </a>
                                        ))}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Comedians;
