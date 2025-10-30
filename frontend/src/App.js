import React from 'react';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import Booking from './components/Booking';
import Footer from './components/Footer';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <Header />
      <Hero />
      <About />
      <Services />
      <HowItWorks />
      <Booking />
      <Footer />
    </div>
  );
}

export default App;