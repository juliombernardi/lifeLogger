import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const useSensors = (active: boolean) => {
  useEffect(() => {
    if (!active) return;
    const sensorData: any = { gps: [], motion: [] };
    const geoId = navigator.geolocation.watchPosition(pos => {
      sensorData.gps.push({
        time: Date.now(),
        lat: pos.coords.latitude,
        lon: pos.coords.longitude
      });
    });

    const motionHandler = (e: DeviceMotionEvent) => {
      sensorData.motion.push({
        time: Date.now(),
        ax: e.accelerationIncludingGravity?.x,
        ay: e.accelerationIncludingGravity?.y,
        az: e.accelerationIncludingGravity?.z,
        rotAlpha: e.rotationRate?.alpha,
        rotBeta: e.rotationRate?.beta,
        rotGamma: e.rotationRate?.gamma
      });
    };
    window.addEventListener('devicemotion', motionHandler);

    const interval = setInterval(() => {
      if (sensorData.gps.length || sensorData.motion.length) {
        fetch('/api/upload/sensors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sensorData)
        });
        sensorData.gps = [];
        sensorData.motion = [];
      }
    }, 5000);

    return () => {
      navigator.geolocation.clearWatch(geoId);
      window.removeEventListener('devicemotion', motionHandler);
      clearInterval(interval);
    };
  }, [active]);
};

const App = () => {
  const [recording, setRecording] = useState(false);
  const mediaStream = useRef<MediaStream | null>(null);
  const audioChunks: Blob[] = [];
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const photoInterval = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useSensors(recording);

  const handleToggle = async () => {
    if (recording) {
      mediaRecorder.current?.stop();
      if (photoInterval.current) window.clearInterval(photoInterval.current);
      mediaStream.current?.getTracks().forEach(t => t.stop());
      setRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user' } });
        mediaStream.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const recorder = new MediaRecorder(stream);
        mediaRecorder.current = recorder;
        recorder.ondataavailable = e => audioChunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(audioChunks, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('audio', blob, `${new Date().toISOString()}.webm`);
          fetch('/api/upload/audio', { method: 'POST', body: formData });
        };
        recorder.start();

        capturePhotos();

        setRecording(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const capturePhotos = () => {
    photoInterval.current = window.setInterval(() => {
      if (!mediaStream.current) return;
      const track = mediaStream.current.getVideoTracks()[0];
      const imageCapture = new ImageCapture(track);
      imageCapture.takePhoto().then(blob => {
        const formData = new FormData();
        formData.append('photos', blob, `${Date.now()}.jpg`);
        fetch('/api/upload/photos', { method: 'POST', body: formData });
      }).catch(console.error);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (photoInterval.current) window.clearInterval(photoInterval.current);
      mediaStream.current?.getTracks().forEach(t => t.stop());
    }
  }, []);

  return (
    <div style={{ textAlign: 'center', paddingTop: 40 }}>
      <video ref={videoRef} style={{ display: recording ? 'block' : 'none' }} autoPlay muted />
      <button onClick={handleToggle}>{recording ? 'Stop' : 'Record'}</button>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
