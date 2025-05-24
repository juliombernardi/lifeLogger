# lifeLogger
Takes snapshots of user daily life with camera and record user conversations for upload to a database and subsequent analysis


1. Overview
A mobile web application (“Mobile Data Logger”) for Android smartphones that continuously records filtered audio, time-stamped photos, and motion/location data, and lets users browse their sessions afterward.

2. Platform & Environment
Frontend: Progressive Web App (works in mobile Chrome/Safari on Android)

Backend: HTTPS-secured REST API

Database: PostgreSQL (for metadata) + filesystem or object storage for binary files

3. Permissions
On first launch (and as needed thereafter), request these OS permissions:

Microphone (audio capture)

Front camera (photo capture)

Geolocation (GPS)

Motion sensors (accelerometer + gyroscope)

4. “Record” Tab
4.1 UI
Single toggle button

Record ▶️ → when tapped, requests any missing permissions and begins capture

Stop ⏹ → when tapped, stops all capture streams and returns to “Record” state

4.2 Audio Capture
Continuously capture from MediaStreamAudioSource

Perform real-time Voice Activity Detection (VAD)

If speech detected: buffer into current chunk

If silence: drop buffered audio until next speech onset

When user taps Stop (or after each chunk boundary), encode buffered speech as MP3

Filename: ISO date-time to the second (e.g. 2025-05-24T14-30-05.mp3)

Upload: POST to /api/upload/audio

4.3 Photo Capture
Every 1 second grab one frame from front-camera video stream

Target ~0.5 MB per image (adjust resolution + JPEG quality)

Group photos into batches (e.g. per minute or fixed count) and compress into ZIP or archive

Upload: POST to /api/upload/photos

4.4 Sensor Capture
GPS: navigator.geolocation.watchPosition() sampling at X Hz

Accelerometer & Gyroscope: DeviceMotionEvent sampling at X Hz

Buffer timestamped readings and periodically POST to /api/upload/sensors as JSON

5. Data Transmission & Storage
All uploads over HTTPS

Backend stores:

Audio files: in /uploads/audio + record metadata (startTime, duration, filename) in PostgreSQL

Photo batches: in /uploads/photos + batch index in PostgreSQL

Sensor logs: raw JSON payloads + associated time ranges in PostgreSQL

6. “View” Tab
6.1 Layout
Two‐column layout:

Left (main): infinite vertical scroll of time‐sections

Right: a slim, draggable date scroller (like Amazon Photos) for fast jumps

6.2 Time‐Section (for a fixed interval, e.g. 1 minute)
Photo Thumbnails

Horizontal row of captured images for that interval

Audio Chunks

List items showing chunk start-time (e.g. “14:30:05”)

Each with controls ► ❚❚ ⏪ ⏩

“Transcript” button opens a modal/popup with speech-to-text results

GPS Map

Embedded map (e.g. Leaflet or Google Maps) plotting that interval’s GPS track

Motion Graph

Time-series chart of X/Y/Z accelerometer + gyroscope values

When the user scrolls, the next interval’s section loads on demand.

7. Server API Endpoints (examples)
POST /api/upload/audio

POST /api/upload/photos

POST /api/upload/sensors

GET /api/recordings?start=…&end=… → returns pagination of intervals with URLs/metadata for audio/photo/sensor data

GET /api/transcript/:audioId → returns speech-to-text JSON

8. Tech Stack & Libraries
Frontend: React (or Vue) + TypeScript + Web Audio API + MediaDevices + Geolocation + DeviceMotionEvent

Speech Detection: WebRTC VAD or TensorFlow.js VAD model

Charts: Recharts or a lightweight charting library

Maps: Leaflet.js or Google Maps SDK

Backend: Node.js + Express + Multer (for uploads) + ffmpeg (for MP3 encoding)

Database: PostgreSQL + an ORM (TypeORM, Prisma)

9. Additional Considerations
HTTPS only: required for camera/mic/geo access

Offline resilience: buffer data locally (IndexedDB) if connection is lost, then sync on reconnect

Storage quotas: configurable server-side; warn user if approaching limits

Privacy & Security:

Encrypt transport (TLS)

Consider at-rest encryption for sensitive data

Provide user with data-deletion controls
