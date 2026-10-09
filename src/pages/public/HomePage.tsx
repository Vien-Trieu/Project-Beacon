import abbLogo from "../../assets/ABB_Logo.png";
import "../../styles/home-page.css";

function HomePage() {
    return (
        <main className="home-page">
            <header className="home-header">
                <div className="home-header-content">
                    <img
                    src={abbLogo}
                    alt="ABB"
                    className="home-logo"
                    />
                <div>
                    <p className="home-eyebrow">
                    Project Beacon
                    </p>

                    <h1>Test Report Portal</h1>

                    <p className="home-header-subtitle">
                    Digital access to ABB breaker test documentation
                    </p>
                </div>
            </div>
            </header>

            <section className="home-hero">
                <div className="home-hero-content">
                    <div className="home-hero-text">
                        <p className="home-section-label">
                            Customer Test Reports
                        </p>

                        <h2>
                            Your test report,
                            available when you need it.
                        </h2>

                        <p className="home-hero-description">
                            This website provides direct access to
                            the test report associated with your ABB equipment.
                            Scan the QR Code provided with your equipment
                            to view the corresponding report.
                        </p>
                    </div>

                    <div className="home-qr-card">
                        <div className="home-qr-icon">
                            <span />
                            <span />
                            <span />
                            <span />
                        </div>

                        <h3>Scan Your QR Code</h3>

                        <p>
                            Each QR code links directly to the report
                            associated with that specific device.
                        </p>
                    </div>
                </div>
            </section>

            <section className="home-info">
                <div className="home-info-grid">
                    <article className="home-info-card">
                        <div className="home-info-number">
                            01
                        </div>

                        <h3>Scan</h3>

                        <p>
                            Scan the QR code attached to your equipment
                            using your phone or tablet.
                        </p>
                    </article>

                    <article className="home-info-card">
                        <div className="home-info-number">
                            02
                        </div>

                        <h3>View</h3>

                        <p>
                            Your device-specific test report opens directly in the browser.
                        </p>
                    </article>

                    <article className="home-info-card">
                        <div className="home-info-number">
                            03
                        </div>

                        <h3>Download</h3>

                        <p>
                            View the report online or download the PDF for 
                            your records.
                        </p>
                    </article>
                </div>
            </section>

            <section className="home-note">
                <div className="home-note-content">
                    <div>
                        <h2>Looking for a specific report?</h2>

                        <p>
                            Reports are accessed through the uniqiue QR code 
                            or report link supplied with the equipment.
                        </p>
                    </div>
                </div>
            </section>

           <footer className="home-footer">
            <p>
            ABB Inc. • Project Beacon
            </p>
        </footer>
        </main>
    );
}

export default HomePage;