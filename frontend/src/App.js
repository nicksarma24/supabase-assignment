import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file upload
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle text input for audio generation
  const handleTextChange = (e) => {
    setText(e.target.value);
  };

  // Upload audio file to backend
  const uploadFile = async () => {
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await axios.post('http://localhost:3001/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
        },
      });

      console.log('File uploaded successfully:', response.data);
      alert(response.data.message);
    } catch (error) {
      if (error.response) {
        // If server responded with a status code other than 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      } else if (error.request) {
        // If no response was received
        console.error('Error request:', error.request);
      } else {
        // Other errors (e.g. setting up the request)
        console.error('Error message:', error.message);
      }

      alert('Failed to upload file');
    }
  };

  // Generate audio from text
  const generateAudio = async () => {
    try {
      const response = await axios.post('http://localhost:3001/generate-audio', { text });
      setGeneratedAudio(response.data.fileUrl);
      alert(response.data.message);
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Failed to generate audio');
    }
  };

  return (
    <div className="App">
      <h1>Audio File Upload and Voice Generation</h1>

      {/* File upload section */}
      <div>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        {file && (
          <div>
            <button onClick={uploadFile} disabled={!file}>Upload Audio</button>
            <div className="upload-status">Upload Progress: {uploadProgress}%</div>
          </div>
        )}
      </div>

      {/* Text-to-speech section */}
      <div>
        <textarea
          placeholder="Type something..."
          value={text}
          onChange={handleTextChange}
        />
        <button onClick={generateAudio} disabled={!text.trim()}>Generate Audio</button>
      </div>

      {/* Audio player for generated audio */}
      {generatedAudio && (
        <div className="audio-player">
          <h2>Generated Audio:</h2>
          <audio controls>
            <source 
              src={generatedAudio} 
              type="audio/mp3" 
            />
          </audio>
        </div>
      )}
    </div>
  );
};

export default App;
