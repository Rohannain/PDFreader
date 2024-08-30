import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Import Link for navigation
import './uploadpdf.css'

const UploadPDF = () => {
  const [files, setFiles] = useState([]);
  const [key, setKey] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleFileChange = (event) => {
    setFiles(event.target.files);
  };

  const handleKeyChange = (event) => {
    setKey(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (files.length === 0) {
      setMessage('Please select at least one file.');
      return;
    }

    const formData = new FormData();
    formData.append('key', key);

    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      setIsSending(true);
      setMessage(''); // Clear previous messages

      const response = await axios.post('http://192.168.13.85:8000/api/store-documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      document.getElementById("fileInput").value = "";
      console.log(response)
      setFiles([]);
      setIsSending(false);
      setMessage('Documents stored successfully.'); // Set success message
      setKey(response.data.key); // Set only the key received from the response
    } catch (error) {
      setMessage('Error storing documents.');
      console.error(error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(key)
      .then(() => {
        alert('Key copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy key:', err);
      });
  };

  return (
    <>
      <Link to="/" className="home-button">Home</Link>
      <div className="upload-container">
        <h2>Upload PDF and Key</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="keyInput" disabled={isSending}>Organization Key (Keep it empty if you don't have one):</label>

            <input type="text" id="keyInput" value={key} placeholder='Enter organization key' onChange={handleKeyChange}/>
          </div>
          <div>
            <label htmlFor="fileInput" disabled={isSending}>PDF Files:</label>
            <input type="file" id="fileInput" onChange={handleFileChange} accept=".pdf" multiple required />
          </div>
          <button type="submit" disabled={isSending}>
            {isSending ? 'Please Wait' : 'Upload'}
          </button>
        </form>
        {message && (
          <div className="message-container">
            <p>{message}</p>
            {key && <button onClick={copyToClipboard}>Copy Key</button>}
          </div>
        )}
      </div>
    </>
  );
};

export default UploadPDF;
