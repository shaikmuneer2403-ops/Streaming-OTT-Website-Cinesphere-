import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  X,
  FastForward,
  Clock,
  Sparkles
} from 'lucide-react';
import { Movie, WatchHistoryItem } from '../types';
import { apiClient } from '../services/api';
import { emitWatchActivity } from '../services/socket';

interface VideoPlayerModalProps {
  movie: Movie | null;
  initialResumeSeconds?: number;
  onClose: () => void;
  onProgressSaved?: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  movie,
  initialResumeSeconds = 0,
  onClose,
  onProgressSaved
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const controlsTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!movie) return;

    // Check if initial resume position exists
    if (initialResumeSeconds > 10) {
      setShowResumeToast(true);
    }

    const video = videoRef.current;
    if (video) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        seekRelative(10);
      } else if (e.key === 'ArrowLeft') {
        seekRelative(-10);
      } else if (e.key === 'f') {
        toggleFullscreen();
      } else if (e.key === 'm') {
        toggleMute();
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movie]);

  // Periodic progress saving & socket broadcast
  useEffect(() => {
    if (!movie) return;

    const interval = setInterval(async () => {
      const video = videoRef.current;
      if (video && video.currentTime > 5 && video.duration > 0) {
        try {
          await apiClient.saveProgress({
            contentId: movie._id,
            progress: video.currentTime,
            duration: video.duration
          });
          if (onProgressSaved) onProgressSaved();

          // Socket broadcast
          const mins = Math.floor(video.currentTime / 60);
          const totalMins = Math.floor(video.duration / 60);
          emitWatchActivity(movie.title, `${mins}m / ${totalMins}m`);
        } catch (e) {
          // ignore background errors
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [movie, onProgressSaved]);

  if (!movie) return null;

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const seekRelative = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    setDuration(video.duration);
    if (initialResumeSeconds > 0 && !showResumeToast) {
      video.currentTime = initialResumeSeconds;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos = (e.clientX - rect.left) / rect.width;
    if (video && video.duration) {
      video.currentTime = clickPos * video.duration;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3500);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none"
    >
      {/* HTML5 Video Element */}
      <video
        ref={videoRef}
        src={movie.videoUrl}
        poster={movie.backdrop || movie.poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Resume from XX:XX Toast */}
      {showResumeToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-[#182032]/95 border border-red-500/80 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-xl flex items-center gap-4 text-white animate-fade-in">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-400 animate-pulse" />
            <span className="text-sm font-semibold">
              Continue from <span className="text-amber-400 font-bold">{formatTime(initialResumeSeconds)}</span>?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = initialResumeSeconds;
                  videoRef.current.play();
                  setIsPlaying(true);
                }
                setShowResumeToast(false);
              }}
              className="px-3.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 rounded-full transition-colors"
            >
              Resume
            </button>
            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                }
                setShowResumeToast(false);
              }}
              className="px-3 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Overlay UI Controls */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/80 flex flex-col justify-between p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
              title="Close player"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">{movie.title}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                <span>{movie.releaseYear}</span>
                <span>•</span>
                <span className="text-red-400 font-bold">4K UHD</span>
                <span>•</span>
                <span>Dolby Atmos</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Skip Intro (+10s) */}
            <button
              onClick={() => seekRelative(10)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-colors"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Skip (+10s)</span>
            </button>
          </div>
        </div>

        {/* Center Play Button (when paused) */}
        {!isPlaying && (
          <div className="self-center">
            <button
              onClick={togglePlay}
              className="w-18 h-18 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 hover:scale-110 active:scale-95 transition-all"
            >
              <Play className="w-8 h-8 fill-white ml-1" />
            </button>
          </div>
        )}

        {/* Bottom Bar */}
        <div className="space-y-3">
          {/* Progress Timeline Scrubber */}
          <div
            onClick={handleSeek}
            className="group relative w-full h-2 bg-white/20 hover:h-3 rounded-full cursor-pointer transition-all duration-150"
          >
            <div
              className="h-full bg-red-600 rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
            </div>
          </div>

          <div className="flex items-center justify-between text-white text-sm">
            {/* Left Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white" />}
              </button>

              <button
                onClick={() => seekRelative(-10)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => seekRelative(10)}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white"
                title="Forward 10 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2 group/vol">
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-18 h-1 bg-white/30 accent-red-600 rounded cursor-pointer"
                />
              </div>

              {/* Timestamp */}
              <span className="text-xs font-mono text-gray-300">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Speed Selector */}
              <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleSpeedChange(speed)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      playbackSpeed === speed
                        ? 'bg-red-600 text-white font-bold'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
