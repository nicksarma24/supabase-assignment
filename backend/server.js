import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
//resemble ai: https://f.cluster.resemble.ai/synthesize
const app = express();
const port = 3001;
app.use(cors())
// Set up multer for file upload
const storage = multer.memoryStorage(); // Store the file in memory for direct upload to Supabase
const upload = multer({ storage: storage });

const resembleApiKey = 'xn9HWk3bPrKOWIYQyOaXqgtt';  // Replace this with your actual Resemble AI API key


const supabaseUrl = 'https://flemapmsndljxnlznecr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZW1hcG1zbmRsanhubHpuZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4MzUyNzMsImV4cCI6MjA0NzQxMTI3M30.qiYVu8YqBWlj5xH8f48m3-VelKGKWYI5pRciRAd6Buo'; // Ensure you have the correct service role key
const supabase = createClient(supabaseUrl, supabaseKey);

// Endpoint for uploading files
app.post('/uploads', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Create the filename (using original file name, but can be customized)
    const fileName = `audio-files/${Date.now()}_${req.file.originalname}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from('audio-files')  // Your bucket name
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype, // Ensure correct mime type is set
        upsert: false,  // Don't overwrite files with the same name
      });

    if (error) {
      console.error('Error uploading file to Supabase:', error);
      return res.status(500).json({ message: 'Error uploading file to Supabase', error: error.message });
    }

    // Successfully uploaded, return the file URL
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/audio-files/${data.Key}`;
    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
    });
  } catch (error) {
    console.error('Error processing file upload:', error);
    res.status(500).json({ message: 'Error processing file upload' });
  }
});

// Start the server
// Generate a voice model using Resemble AI
const generateVoiceModel = async (audioUrl) => {
  try {
    const response = await axios.post('https://api.resemble.ai/v1/voices', {
      name: 'Custom Voice',
      samples: [audioUrl], // Audio URL uploaded in Supabase
    }, {
      headers: {
        'Authorization': `Bearer ${resembleApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Voice model created:', response.data);
  } catch (error) {
    console.error('Error generating voice model:', error);
  }
};

// Endpoint for generating speech from text
app.post('/generate-speech', async (req, res) => {
  const { text, voiceId } = req.body; // Pass the voiceId of the generated model

  try {
    const response = await axios.post(`https://api.resemble.ai/v1/projects/${voiceId}/clips`, {
      text: text,
    }, {
      headers: {
        'Authorization': `Bearer ${resembleApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const generatedAudioUrl = response.data.url;
    res.status(200).json({
      message: 'Speech generated successfully',
      audioUrl: generatedAudioUrl,
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ message: 'Error generating speech' });
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

//resemble: xn9HWk3bPrKOWIYQyOaXqgtt

// import express from 'express';
// import { Client } from '@resemble/node';  // Resemble AI client
// import { createClient } from '@supabase/supabase-js';  // Supabase client
// import path from 'path';
// import fs from 'fs';
// import multer from 'multer';

// const app = express();
// app.use(express.json());

// // Initialize Supabase client
// const supabase = createClient(
//   'https://flemapmsndljxnlznecr.supabase.co', // Replace with your Supabase URL
//   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZW1hcG1zbmRsanhubHpuZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4MzUyNzMsImV4cCI6MjA0NzQxMTI3M30.qiYVu8YqBWlj5xH8f48m3-VelKGKWYI5pRciRAd6Buo' // Ensure you have the correct service role key
//                       // Replace with your Supabase anon key
// );

// // Initialize Resemble AI client
// const resembleClient = new Client('xn9HWk3bPrKOWIYQyOaXqgtt'); // Replace with your Resemble API key

// // Set up Multer for file uploads
// const upload = multer({ dest: 'uploads/' });

// // Route to create a voice
// app.post('/create-voice', async (req, res) => {
//   const { name } = req.body;

//   try {
//     // Create voice using Resemble API
//     const voice = await resembleClient.createVoice({ name });
//     res.status(200).json(voice);
//   } catch (error) {
//     console.error('Error creating voice:', error);
//     res.status(500).send('Error creating voice');
//   }
// });

// // Route to generate speech from text and upload audio to Supabase
// app.post('/generate-speech', async (req, res) => {
//   const { text, voiceId } = req.body; // Extract text and voiceId from the request

//   if (!text || !voiceId) {
//     return res.status(400).send('Text and voiceId are required.');
//   }

//   try {
//     // Generate speech using Resemble API
//     const audio = await resembleClient.generateSpeech({
//       voiceId,
//       text
//     });

//     // Save the generated audio file
//     const audioFilePath = path.join(__dirname, 'uploads', 'audio.mp3');
//     fs.writeFileSync(audioFilePath, audio);  // Save audio to file

//     // Upload the audio file to Supabase storage
//     const { data, error } = await supabase.storage
//       .from('audio-files')  // Replace with your storage bucket name
//       .upload('audio.mp3', fs.createReadStream(audioFilePath));

//     if (error) {
//       throw error;
//     }

//     // Remove the local audio file after uploading
//     fs.unlinkSync(audioFilePath);

//     res.status(200).json({
//       message: 'Audio uploaded successfully',
//       fileUrl: `${supabase.storage.from('audio-files').getPublicUrl('audio.mp3').publicURL}`
//     });
//   } catch (error) {
//     console.error('Error generating or uploading audio:', error);
//     res.status(500).send('Error generating or uploading audio');
//   }
// });

// // Route to upload any file to Supabase
// app.post('/upload', upload.single('file'), async (req, res) => {
//   const file = req.file; // The uploaded file
//   if (!file) {
//     return res.status(400).send('No file uploaded.');
//   }

//   try {
//     // Upload the file to Supabase storage
//     const { data, error } = await supabase.storage
//       .from('your-bucket-name')  // Replace with your Supabase storage bucket name
//       .upload(file.originalname, fs.createReadStream(file.path), {
//         cacheControl: '3600', // Optional: Cache control for your files
//         upsert: true, // Set to true if you want to overwrite the file if it already exists
//       });

//     if (error) {
//       throw error;
//     }

//     // Remove the local file after uploading
//     fs.unlinkSync(file.path);

//     res.status(200).json({
//       message: 'File uploaded successfully',
//       fileUrl: `${supabase.storage.from('your-bucket-name').getPublicUrl(file.originalname).publicURL}`,
//     });
//   } catch (error) {
//     console.error('Error uploading file:', error);
//     res.status(500).send('Error uploading file');
//   }
// });

// // Start the server
// const port = 3000;
// app.listen(port, () => {
//   console.log(`Server is running on p