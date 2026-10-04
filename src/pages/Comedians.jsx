import avatarPlaceholder from '../assets/avatar-placeholder.svg';

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
                                <img src={avatarPlaceholder} alt="Renee Groux Placeholder Headshot" className="founder-headshot" />
                            </div>
                            <h3 className="founder-name">Renee Groux</h3>
                            <p className="founder-bio">
                                Renee Groux is a stand-up comedian from Kitchener-Waterloo with 10 years of performing experience. A smart and skilled storyteller, Renee will serve up side-splitting insights on love, work, parenting, and more. She has appeared on Don't Tell Comedy, Guelph Comedy Festival, and the 2022 Edinburgh Fringe Festival. She is the co-producer and host of Fever Dream Comedy, running Kitchener's longest-running all-women showcase, Girl Night. Her debut comedy album, "We're Not Friends" can be heard on SiriusXM - watch the full special on Youtube.
                            </p>
                        </div>

                        <div className="founder-card" id="founder-lindsay">
                            <div className="founder-img-wrapper">
                                <img src={avatarPlaceholder} alt="Lindsay Endersby Placeholder Headshot" className="founder-headshot" />
                            </div>
                            <h3 className="founder-name">Lindsay Endersby</h3>
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
                            { name: "Comedian One", handle: "@comedian_one" },
                            { name: "Comedian Two", handle: "@comedian_two" },
                            { name: "Comedian Three", handle: "@comedian_three" },
                            { name: "Comedian Four", handle: "@comedian_four" }
                        ].map((performer, index) => (
                            <a href={`https://instagram.com/${performer.handle.substring(1)}`} target="_blank" rel="noopener noreferrer" className="performer-card" key={index}>
                                <div className="performer-img-wrapper">
                                    <img src={avatarPlaceholder} alt={performer.name} className="performer-headshot" />
                                </div>
                                <h4 className="performer-name">{performer.name}</h4>
                                <p className="performer-handle">{performer.handle}</p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Comedians;
