
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import VGBot from '../components/layout/VGBot';

import Hero from '../components/sections/Hero';
import Countdown from '../components/sections/Countdown';
import AboutEvent from '../components/sections/AboutEvent';
import EventDetails from '../components/sections/EventDetails';
import MapSection from '../components/sections/MapSection';

import RegistrationForm from '../components/forms/RegistrationForm';

function Home() {
    return (
        <>
            <Navbar />

            <main>
                <Hero />
                <Countdown />
                <AboutEvent />
                <EventDetails />
                <RegistrationForm />
                <MapSection />
            </main>

            <Footer />

            {/* Asistente virtual de Valle Grande */}
            <VGBot />
        </>
    );
}

export default Home;
