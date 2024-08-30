import React, { useEffect, useState } from 'react';
import './home.css';
import 'animate.css/animate.min.css';
import { useNavigate } from 'react-router-dom';

function Home() {

    const navigate = useNavigate(); // Initialize useNavigate

    const navigateToUpload = () => {
        navigate('/upload'); // Navigate to Upload component
    };

    const navigateToChat = () => {
        navigate('/chat'); // Navigate to Chat component
    };

    const [westOverlayOpen, setWestOverlayOpen] = useState(false);
    const [eastOverlayOpen, setEastOverlayOpen] = useState(false);

    useEffect(() => {
        if (westOverlayOpen) {
            const westOverlay = document.getElementById('west-overlay');
            const westContent = document.getElementById('west-overlay-content');

            westOverlay.classList.add('animated', 'fadeInLeft', 'open');
            westOverlay.addEventListener('animationend', () => {
                westOverlay.classList.remove('animated', 'fadeInLeft');
            }, { once: true });

            westContent.classList.add('animated', 'flipInY');
            westContent.addEventListener('animationend', () => {
                westContent.classList.remove('animated', 'flipInY');
            }, { once: true });
        }
    }, [westOverlayOpen]);

    useEffect(() => {
        if (eastOverlayOpen) {
            const eastOverlay = document.getElementById('east-overlay');
            const eastContent = document.getElementById('east-overlay-content');

            eastOverlay.classList.add('animated', 'fadeInRight', 'open');
            eastOverlay.addEventListener('animationend', () => {
                eastOverlay.classList.remove('animated', 'fadeInRight');
            }, { once: true });

            eastContent.classList.add('animated', 'flipInY');
            eastContent.addEventListener('animationend', () => {
                eastContent.classList.remove('animated', 'flipInY');
            }, { once: true });
        }
    }, [eastOverlayOpen]);

    const closeWestOverlay = () => {
        const westOverlay = document.getElementById('west-overlay');
        westOverlay.classList.add('animated', 'flipOutY');
        westOverlay.addEventListener('animationend', () => {
            westOverlay.classList.remove('animated', 'flipOutY', 'open');
            setWestOverlayOpen(false);
        }, { once: true });
    };

    const closeEastOverlay = () => {
        const eastOverlay = document.getElementById('east-overlay');
        eastOverlay.classList.add('animated', 'flipOutY');
        eastOverlay.addEventListener('animationend', () => {
            eastOverlay.classList.remove('animated', 'flipOutY', 'open');
            setEastOverlayOpen(false);
        }, { once: true });
    };

    return (
        <div className="grid">
            <div id="west" className="column effect-hover" onClick={navigateToUpload}>
                <div className="content">
                    <i className="fa fa-venus" aria-hidden="true"></i>
                    <h2>Upload <span>Data</span></h2>
                    <h3>Upload Documents</h3>
                    <p>Click</p>
                </div>
            </div>
            <div id="east" className="column effect-hover" onClick={navigateToChat}>
                <div className="content">
                    <i className="fa fa-mars" aria-hidden="true"></i>
                    <h2>Wanna<span>Chat</span></h2> 
                    <h3>Chat with Documents</h3>
                    <p>Click</p>
                </div>
            </div>
            {westOverlayOpen && (
                <div id="west-overlay" className="overlay">
                    <div id="west-overlay-content" className="product-content">
                        <span className="close-icon" onClick={closeWestOverlay}>×</span>
                        {/* Add your west overlay content here */}
                    </div>
                </div>
            )}
            {eastOverlayOpen && (
                <div id="east-overlay" className="overlay">
                    <div id="east-overlay-content" className="product-content">
                        <span className="close-icon" onClick={closeEastOverlay}>×</span>
                        {/* Add your east overlay content here */}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;
