import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

const audioStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join('uploads', 'audio');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join('uploads', 'photos');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const audioUpload = multer({ storage: audioStorage });
const photoUpload = multer({ storage: photoStorage });

app.post('/api/upload/audio', audioUpload.single('audio'), (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/upload/photos', photoUpload.array('photos'), (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/upload/sensors', (req, res) => {
  const dir = path.join('uploads', 'sensors');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(req.body, null, 2));
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
