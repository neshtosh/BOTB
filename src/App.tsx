import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Music from './pages/Music';
import Videos from './pages/Videos';
import Events from './pages/Events';
import About from './pages/About';
import { VideoPlayerProvider } from './context/VideoPlayerContext';
import VideoPlayer from './components/videos/VideoPlayer';
import { MusicPlayerProvider } from './context/MusicPlayerContext';
import MusicPlayer from './components/music/MusicPlayer';

function App() {
  return (
    <MusicPlayerProvider>
      <VideoPlayerProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="music" element={<Music />} />
              <Route path="videos" element={<Videos />} />
              <Route path="events" element={<Events />} />
              <Route path="about" element={<About />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <VideoPlayer />
          <MusicPlayer />
        </BrowserRouter>
      </VideoPlayerProvider>
    </MusicPlayerProvider>
  );
}

export default App;