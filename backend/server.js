import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';

const app = express();
const port = 3001;
app.use(cors());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const resembleApiKey = 'xn9HWk3bPrKOWIYQyOaXqgtt';
const supabaseUrl = 'https://flemapmsndljxnlznecr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsZW1hcG1zbmRsanhubHpuZWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4MzUyNzMsImV4cCI6MjA0NzQxMTI3M30.qiYVu8YqBWlj5xH8f48m3-VelKGKWYI5pRciRAd6Buo';
const supabase = createClient(supabaseUrl, supabaseKey);

app.post('/uploads', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  try {
    const fileName = `audio-files/${Date.now()}_${req.file.originalname}`;
    const { data, error } = await supabase.storage
      .from('audio-files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file to Supabase:', error);
      return res.status(500).json({ message: 'Error uploading file to Supabase', error: error.message });
    }

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

const generateVoiceModel = async (audioUrl) => {
  try {
    const response = await axios.post('https://api.resemble.ai/v1/voices', {
      name: 'Custom Voice',
      samples: [audioUrl],
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

app.post('/generate-speech', async (req, res) => {
  const { text, voiceId } = req.body;
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
