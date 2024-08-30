import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Botlogo from './bot.avif';
import Userlogo from './user.png';
import './chatbot.css';
import axios from 'axios';

function Chatbot() {
  const [message, setMessage] = useState('');
  const [model, setModel] = useState('tinyllama');
  const [chat, setChat] = useState([
    { message: 'Hi, welcome to ProChat! Go ahead and send me a message. 😄', isUser: false }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [key, setKey] = useState('');
  const [isKeyValid, setIsKeyValid] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [showModal, setShowModal] = useState(true);

  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  const verifyKey = async () => {
    try {
      setKeyError('');
      const response = await axios.post('http://192.168.13.85:8000/api/verify-key/', { key });
      if (response.data.valid) {
        setIsKeyValid(true);
        setShowModal(false);
        setKeyError('');
      } else {
        setKeyError('Your key does not match. Please enter the key again or go back.');
      }
    } catch (error) {
      console.error('Error verifying key:', error);
      setKeyError('An error occurred while verifying the key. Please try again.');
    }
  };

  const goBack = () => {
    window.history.back();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === '' || isSending) return;

    setIsSending(true);
    setChat((prevChat) => [...prevChat, { message, isUser: true }]);
    setChat((prevChat) => [...prevChat, { message:"...", isUser: false }]);

    if (socketRef.current) {
      socketRef.current.send(JSON.stringify({ message, key, model }));
    }

    // Check if the message contains '/end' to activate send button

    setMessage('');
  };

  useEffect(() => {
    socketRef.current = new WebSocket('ws://192.168.13.85:8000/ws/chatbot/');
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setChat((prevChat) => {
        if (prevChat[prevChat.length - 1].message=='...') {
          return [...prevChat.slice(0, prevChat.length - 1), { message: data.message, isUser: false}]
        } else {
          return [...prevChat.slice(0, prevChat.length - 1), { message: `${prevChat[prevChat.length - 1].message}${data.message}`, isUser: false}]
        }
      });
      setIsSending(false); // Set isSending to false when the response is received
      scrollToBottom();
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsSending(false); // Set isSending to false in case of error
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const handlemodelChange = (event) => {
    setModel(event.target.value);
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section>
      {showModal ? (
        <div className="modal">
          <div className="modal-content">
            <h2>Enter Organization Key</h2>
            <input
              type="text"
              className="key-input"
              placeholder="Enter your organization key..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <label>
              Select The Model
              <select className="select-input" value={model} onChange={handlemodelChange}>
                <option value="tinyllama">Tiny Llama</option>
                <option value="llama2">Llama 2</option>
                <option value="llama3">Llama 3</option>
                <option value="phi3:medium">Phi 3</option>
                <option value="mistral:latest">Mistral:latest</option>
              </select>
            </label>
            <div className="modal-buttons">
              <button onClick={goBack} className="modal-button">Go Back</button>
              <button onClick={verifyKey} className="modal-button">Verify Key</button>
            </div>
            {keyError && <p className="key-error">{keyError}</p>}
          </div>
        </div>
      ) : (
        <>
          <Link to="/" className="home-button">Home</Link>
          <div className='msger'>
            <header className="msger-header">
              <div className="msger-header-title">
                <i className="fas fa-comment-alt"></i> ProChat
              </div>
              <div className="msger-header-options">
                <span><i className="fas fa-cog"></i></span>
              </div>
            </header>

            <main className="msger-chat">
              {chat.map((chatMessage, index) => (
                <div key={index} className={`msg ${chatMessage.isUser ? 'right-msg' : 'left-msg'}`}>
                  <div
                    className="msg-img"
                    style={{ backgroundImage: `url(${chatMessage.isUser ? Userlogo : Botlogo})` }}
                  ></div>

                  <div className="msg-bubble">
                    <div className="msg-info">
                      <div className="msg-info-name">{chatMessage.isUser ? 'You' : 'BOT'}</div>
                    </div>

                    <div className="msg-text">
                      {chatMessage.message}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef}></div>
            </main>

            <form className="msger-inputarea" onSubmit={sendMessage}>
              <input
                type="text"
                className="msger-input"
                placeholder="Enter your message..."
                value={message}
                disabled={isSending}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit" className="msger-send-btn" disabled={isSending}>
                {isSending ? '...' : 'Send'}
              </button>
            </form>
          </div>
        </>
      )}
    </section>
  );
}

export default Chatbot;
