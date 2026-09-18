import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { User } from '../types';
import { apiClient, saveSession, getAuthToken } from '../services/api';
import { registerSocketUser } from '../services/socket';

interface AvatarChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserUpdated: (user: User) => void;
  onShowToast: (msg: string) => void;
}

export const DEFAULT_AVATAR_URL = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

const PRESET_AVATARS = [
  { id: 'default', label: 'Default', url: DEFAULT_AVATAR_URL },
  { id: 'anime-demon', label: 'Demon Hunter', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=200&auto=format&fit=crop&q=80' },
  { id: 'cyberpunk', label: 'Cyber Ronin', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=200&auto=format&fit=crop&q=80' },
  { id: 'cosmic', label: 'Cosmic Pilot', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80' },
  { id: 'neon', label: 'Neon Hacker', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=200&auto=format&fit=crop&q=80' },
  { id: 'bot-1', label: 'Cine Bot', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CineSphere' },
  { id: 'bot-2', label: 'Neo Matrix', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Matrix' },
  { id: 'vip-crown', label: 'Golden VIP', url: 'https://images.unsplash.com/photo-1514533450685-4493e01d1fdc?w=200&auto=format&fit=crop&q=80' },
];

export const AvatarChangeModal: React.FC<AvatarChangeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onShowToast
}) => {
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [previewCroppedUrl, setPreviewCroppedUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState<'upload' | 'presets'>('upload');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropBoxRef = useRef<HTMLDivElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Reset state when opening modal
  useEffect(() => {
    if (isOpen && currentUser) {
      setSelectedImageSrc(null);
      setPreviewCroppedUrl(currentUser.profileImage || DEFAULT_AVATAR_URL);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setErrorMsg(null);
      setActiveTab('upload');
    }
  }, [isOpen, currentUser]);

  // Load uploaded image into Image object
  useEffect(() => {
    if (!selectedImageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = selectedImageSrc;
    img.onload = () => {
      imageObjRef.current = img;
      setZoom(1);
      setPan({ x: 0, y: 0 });
      renderCroppedPreview(img, 1, { x: 0, y: 0 });
    };
    img.onerror = () => {
      setErrorMsg('Failed to read selected image file. Please try another image.');
    };
  }, [selectedImageSrc]);

  // Render square crop preview on canvas
  const renderCroppedPreview = useCallback(
    (img: HTMLImageElement, currentZoom: number, currentPan: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const outputSize = 320;
      canvas.width = outputSize;
      canvas.height = outputSize;

      ctx.clearRect(0, 0, outputSize, outputSize);

      // Determine dimensions for square crop centered with zoom and pan
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;
      const minDimension = Math.min(naturalWidth, naturalHeight);

      // Crop box width/height in source coordinates
      const sourceCropSize = minDimension / currentZoom;

      // Center offset + user pan in source coordinate space
      const maxPanX = (naturalWidth - sourceCropSize) / 2;
      const maxPanY = (naturalHeight - sourceCropSize) / 2;

      const sourceCenterX = naturalWidth / 2 - (currentPan.x / 100) * maxPanX;
      const sourceCenterY = naturalHeight / 2 - (currentPan.y / 100) * maxPanY;

      const sourceX = Math.max(0, Math.min(naturalWidth - sourceCropSize, sourceCenterX - sourceCropSize / 2));
      const sourceY = Math.max(0, Math.min(naturalHeight - sourceCropSize, sourceCenterY - sourceCropSize / 2));

      // Draw cleanly into square 320x320 output
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceCropSize,
        sourceCropSize,
        0,
        0,
        outputSize,
        outputSize
      );

      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setPreviewCroppedUrl(dataUrl);
      } catch (e) {
        console.warn('Canvas export note:', e);
      }
    },
    []
  );

  // Update preview when zoom or pan changes
  const handleZoomChange = (newZoom: number) => {
    const clamped = Math.max(1, Math.min(3, newZoom));
    setZoom(clamped);
    if (imageObjRef.current) {
      renderCroppedPreview(imageObjRef.current, clamped, pan);
    }
  };

  const handlePanUpdate = (newPan: { x: number; y: number }) => {
    setPan(newPan);
    if (imageObjRef.current) {
      renderCroppedPreview(imageObjRef.current, zoom, newPan);
    }
  };

  // Drag to pan image in crop box
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x * 2, y: e.clientY - pan.y * 2 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = (e.clientX - dragStart.x) / 2;
    const deltaY = (e.clientY - dragStart.y) / 2;
    const clampedX = Math.max(-100, Math.min(100, deltaX));
    const clampedY = Math.max(-100, Math.min(100, deltaY));
    handlePanUpdate({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - pan.x * 2, y: touch.clientY - pan.y * 2 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = (touch.clientX - dragStart.x) / 2;
    const deltaY = (touch.clientY - dragStart.y) / 2;
    const clampedX = Math.max(-100, Math.min(100, deltaX));
    const clampedY = Math.max(-100, Math.min(100, deltaY));
    handlePanUpdate({ x: clampedX, y: clampedY });
  };

  // Handle file input
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please select a valid image file (JPG, JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('File size exceeds 8MB. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setSelectedImageSrc(result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to load image file from your device.');
    };
    reader.readAsDataURL(file);
  };

  // Reset / Remove Avatar
  const handleRemoveDP = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const res = await apiClient.updateProfile({ profileImage: DEFAULT_AVATAR_URL });
      const updatedUser = res.user;
      const token = getAuthToken();
      if (token) saveSession(token, updatedUser);
      onUserUpdated(updatedUser);
      registerSocketUser(updatedUser);
      onShowToast('Profile picture removed. Reverted to default avatar.');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove profile picture');
    } finally {
      setIsSaving(false);
    }
  };

  // Save changes
  const handleSave = async () => {
    if (!currentUser) return;
    const finalImage = previewCroppedUrl || selectedImageSrc || currentUser.profileImage;
    if (!finalImage) return;

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.updateProfile({ profileImage: finalImage });
      const updatedUser = res.user;
      const token = getAuthToken();
      if (token) saveSession(token, updatedUser);
      onUserUpdated(updatedUser);
      registerSocketUser(updatedUser);
      onShowToast('Profile picture updated successfully!');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile picture');
    } finally {
      setIsSaving(false);
    }
  };

  // Preset Selection
  const handleSelectPreset = (url: string) => {
    setSelectedImageSrc(null);
    setPreviewCroppedUrl(url);
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0d111a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#111622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Change Profile Picture</h3>
              <p className="text-[11px] text-gray-400">Upload or select a cinema avatar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 sm:mx-6 mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex border-b border-white/10 px-5 sm:px-6 pt-3 bg-[#0d111a]">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'upload' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload & Crop</span>
            {activeTab === 'upload' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 pb-2.5 px-3 text-xs font-bold transition-all relative ${
              activeTab === 'presets' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cinema Avatars</span>
            {activeTab === 'presets' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500 rounded-full" />
            )}
          </button>
        </div>

        {/* Hidden Canvas for High-Res Output */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              {!selectedImageSrc ? (
                /* Upload Drop Zone */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 hover:border-red-500/60 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-red-950/10 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-red-600/20 text-gray-300 group-hover:text-red-400 mx-auto flex items-center justify-center transition-transform group-hover:scale-110 mb-3 border border-white/10">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">Click or drag image to upload</h4>
                  <p className="text-xs text-gray-400 mb-2">Supports JPG, JPEG, PNG, or WebP</p>
                  <span className="inline-block text-[11px] px-3 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10 font-medium">
                    Recommended: Square ratio, max 8MB
                  </span>
                </div>
              ) : (
                /* Interactive Square Cropper */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-300">
                    <span className="font-semibold text-white">Square Crop & Positioning</span>
                    <button
                      type="button"
                      onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                        if (imageObjRef.current) renderCroppedPreview(imageObjRef.current, 1, { x: 0, y: 0 });
                      }}
                      className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Pan</span>
                    </button>
                  </div>

                  {/* Interactive Crop Box */}
                  <div
                    ref={cropBoxRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                    className="relative w-full aspect-square max-h-[260px] mx-auto rounded-2xl overflow-hidden bg-black/90 border border-white/20 select-none cursor-grab active:cursor-grabbing flex items-center justify-center shadow-inner"
                  >
                    {/* Background preview image scaled & panned */}
                    <img
                      src={selectedImageSrc}
                      alt="Crop target"
                      className="max-w-none transition-transform duration-75 pointer-events-none"
                      style={{
                        transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                        maxHeight: '260px',
                        objectFit: 'contain'
                      }}
                    />

                    {/* Circular Mask Guidelines Overlay */}
                    <div className="absolute inset-0 pointer-events-none border-2 border-white/40 rounded-full m-2 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]" />
                    <div className="absolute inset-2 pointer-events-none border border-dashed border-white/30 rounded-xl" />

                    {/* Hint overlay */}
                    <span className="absolute bottom-2 text-[10px] font-semibold text-white/70 bg-black/60 px-2 py-0.5 rounded-full pointer-events-none">
                      Drag to reposition • Scroll to zoom
                    </span>
                  </div>

                  {/* Zoom Slider */}
                  <div className="flex items-center gap-3 bg-[#111622] p-2.5 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => handleZoomChange(zoom - 0.2)}
                      className="p-1 text-gray-400 hover:text-white"
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                      className="flex-1 accent-red-600 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleZoomChange(zoom + 0.2)}
                      className="p-1 text-gray-400 hover:text-white"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] font-mono text-gray-300 w-9 text-right font-bold">
                      {zoom.toFixed(1)}x
                    </span>
                  </div>

                  {/* Change file option */}
                  <div className="flex justify-between items-center pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-red-400 hover:text-red-300 font-semibold underline"
                    >
                      Choose different image
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Presets Grid */
            <div className="space-y-3">
              <p className="text-xs text-gray-400">Choose from curated cinematic icons and characters:</p>
              <div className="grid grid-cols-4 gap-2.5 max-h-[250px] overflow-y-auto pr-1">
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = previewCroppedUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.url)}
                      className={`relative rounded-xl p-2 flex flex-col items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-red-600/20 border-2 border-red-500 shadow-lg shadow-red-600/20 scale-105'
                          : 'bg-white/5 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-12 h-12 rounded-full object-cover border border-white/20"
                      />
                      <span className="text-[10px] font-bold text-gray-300 truncate w-full text-center">
                        {preset.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-Time Dual Size Preview */}
          <div className="bg-[#111622] rounded-xl p-3.5 border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={previewCroppedUrl || DEFAULT_AVATAR_URL}
                alt="Large preview"
                className="w-14 h-14 rounded-full object-cover border-2 border-red-500 shadow-md"
              />
              <img
                src={previewCroppedUrl || DEFAULT_AVATAR_URL}
                alt="Small preview"
                className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-sm"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white block">Preview Appearance</span>
                <span className="text-[11px] text-gray-400 block truncate max-w-[150px]">
                  {currentUser.name}
                </span>
              </div>
            </div>

            {/* Remove / Reset to default button */}
            <button
              type="button"
              onClick={handleRemoveDP}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-red-400 hover:bg-red-950/30 border border-white/10 transition-colors"
              title="Revert to clean default avatar"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Reset DP</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-4 border-t border-white/10 bg-[#111622] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Saving DP...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Profile Picture</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
