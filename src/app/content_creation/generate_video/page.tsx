"use client";
import React, { useState, useRef, useCallback } from 'react';
import { 
  FiUpload, 
  FiPlay, 
  FiPause, 
  FiSettings, 
  FiLayers, 
  FiCamera,
  FiDownload,
  FiPlus,
  FiTrash2,
  FiMove,
  FiRotateCcw,
  FiZoomIn,
  FiClock,
  FiImage,
  FiSliders,
  FiUser
} from 'react-icons/fi';
import { TbSparkles } from 'react-icons/tb';
import { PiFileVideoBold } from 'react-icons/pi';
import { useAvatars } from '@/hooks/useAvatars';
import { Avatar } from '@/types/avatar';

interface SceneLayer {
  id: string;
  type: 'image' | 'text' | 'shape';
  name: string;
  src?: string;
  content?: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  visible: boolean;
}

interface CameraMovement {
  type: 'pan' | 'zoom' | 'rotate' | 'static';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  startScale: number;
  endScale: number;
  duration: number;
}

interface GenerationSettings {
  duration: number;
  fps: number;
  resolution: string;
  seed: number;
}

export default function GenerateVideoPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'format'>('compose');
  const [layers, setLayers] = useState<SceneLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const { data: avatars = [], isLoading, error, refetch } = useAvatars();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cameraMovement, setCameraMovement] = useState<CameraMovement>({
    type: 'static',
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    startScale: 1,
    endScale: 1,
    duration: 5
  });
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    duration: 5,
    fps: 24,
    resolution: '1024x576',
    seed: 42
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detect dark mode changes
  React.useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.body.classList.contains('dark');
      setIsDarkMode(isDark);
    };
    
    checkDarkMode();
    
    // Watch for changes in the body class
    const observer = new MutationObserver(() => {
      checkDarkMode();
    });
    
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);


  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newLayer: SceneLayer = {
          id: Date.now().toString(),
          type: 'image',
          name: file.name,
          src: e.target?.result as string,
          x: 50,
          y: 50,
          scale: 1,
          rotation: 0,
          opacity: 1,
          visible: true
        };
        setLayers(prev => [...prev, newLayer]);
        setSelectedLayer(newLayer.id);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<SceneLayer>) => {
    setLayers(prev => prev.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  }, []);

  const removeLayer = useCallback((id: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== id));
    if (selectedLayer === id) {
      setSelectedLayer(null);
    }
  }, [selectedLayer]);

  const selectedLayerData = layers.find(layer => layer.id === selectedLayer);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/95 dark:to-indigo-900/20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 rounded-lg flex items-center justify-center">
              <PiFileVideoBold className="w-5 h-5 text-white dark:text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Video Scene Builder</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2">
              <TbSparkles className="w-4 h-4 text-white dark:text-white" />
              <span className="text-white dark:text-white">Generate Video</span>
            </button>
            <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
              <FiSettings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <nav className="px-6">
          <div className="flex space-x-8">
            {[
              { id: 'compose', label: 'Compose', icon: FiLayers },
              { id: 'format', label: 'Format', icon: FiSettings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                  activeTab === id 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
          {activeTab === 'compose' && (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Scene Elements</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex flex-col items-center space-y-2"
                >
                  <FiUpload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Upload Image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Scene Prompt</h4>
                <textarea
                  placeholder="Describe the motion and atmosphere you want in your video scene..."
                  className="w-full h-24 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg resize-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                  defaultValue=""
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">0/500 characters</span>
                  <button className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                    Use AI suggestions
                  </button>
                </div>
              </div>

              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">AI Avatars</h4>
                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading avatars...</div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="text-sm text-red-500 dark:text-red-400">Failed to load avatars</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                  {avatars.map((avatar: Avatar) => (
                    <div
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id === selectedAvatar ? null : avatar.id)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                        selectedAvatar === avatar.id 
                          ? 'ring-2 ring-blue-500 dark:ring-blue-400 transform scale-105' 
                          : 'hover:ring-1 hover:ring-gray-400 dark:hover:ring-gray-500'
                      }`}
                    >
                      <img
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        className="w-full h-20 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="text-xs font-medium text-white dark:text-white">{avatar.name}</div>
                        <div className="text-xs text-gray-300 dark:text-gray-300">{avatar.description}</div>
                      </div>
                      {selectedAvatar === avatar.id && (
                        <div className="absolute top-1 right-1">
                          <div className="w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center">
                            <FiUser className="w-3 h-3 text-white dark:text-white" />
                          </div>
                        </div>
                      )}
                      {avatar.category && (
                        <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                          avatar.category === 'realistic' ? 'bg-blue-500/80 dark:bg-blue-400/80 text-white dark:text-white' :
                          avatar.category === 'stylized' ? 'bg-pink-500/80 dark:bg-pink-400/80 text-white dark:text-white' :
                          avatar.category === 'cartoon' ? 'bg-yellow-500/80 dark:bg-yellow-400/80 text-black dark:text-gray-900' :
                          'bg-purple-500/80 dark:bg-purple-400/80 text-white dark:text-white'
                        }`}>
                          <span className="text-current">{avatar.category}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                )}
                {selectedAvatar && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FiUser className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        {avatars.find((a: Avatar) => a.id === selectedAvatar)?.name} selected
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Layers</h4>
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                        selectedLayer === layer.id ? 'bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/50' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FiImage className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{layer.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{layer.type}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}


          {activeTab === 'format' && (
            <div className="p-4 space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Format Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Duration</label>
                  <input
                    type="number"
                    value={generationSettings.duration}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                    min="1"
                    max="60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Resolution</label>
                  <select
                    value={generationSettings.resolution}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, resolution: e.target.value }))}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                  >
                    <option value="512x512">512x512</option>
                    <option value="1024x576">1024x576</option>
                    <option value="1024x1024">1024x1024</option>
                    <option value="1920x1080">1920x1080</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Seed</label>
                  <input
                    type="number"
                    value={generationSettings.seed}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, seed: Number(e.target.value) }))}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-gray-900">
          <div className="flex-1 relative">
            <div className="absolute inset-4 bg-gray-900 dark:bg-black rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ 
                  background: isDarkMode 
                    ? 'radial-gradient(circle, rgb(55 65 81) 0%, rgb(17 24 39) 100%)' 
                    : 'radial-gradient(circle, rgb(229 231 235) 0%, rgb(243 244 246) 100%)'
                }}
              />
              
              {/* Render layers */}
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`absolute transition-all duration-200 ${
                    selectedLayer === layer.id ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
                  }`}
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    transform: `scale(${layer.scale}) rotate(${layer.rotation}deg)`,
                    opacity: layer.opacity,
                    display: layer.visible ? 'block' : 'none'
                  }}
                >
                  {layer.type === 'image' && layer.src && (
                    <img
                      src={layer.src}
                      alt={layer.name}
                      className="max-w-xs max-h-xs object-contain pointer-events-none"
                      draggable={false}
                    />
                  )}
                </div>
              ))}
              
              {layers.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <FiImage className="w-16 h-16 mx-auto mb-4 opacity-50 text-gray-500 dark:text-gray-400" />
                    <p className="text-lg text-gray-500 dark:text-gray-400">Upload an image to start building your scene</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Drag and drop or click to upload</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                {isPlaying ? <FiPause className="w-5 h-5 text-white dark:text-white" /> : <FiPlay className="w-5 h-5 text-white dark:text-white" />}
              </button>
              
              <div className="flex-1">
                <div className="relative">
                  <div className="h-2 bg-gray-300 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-2 bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-100"
                      style={{ width: `${(currentTime / (cameraMovement.duration * 1000)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
                    <span className="text-gray-600 dark:text-gray-400">0:00</span>
                    <span className="text-gray-600 dark:text-gray-400">{Math.floor(cameraMovement.duration / 60)}:{(cameraMovement.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                {Math.floor(currentTime / 1000)}s / {cameraMovement.duration}s
              </div>
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        {selectedLayerData && (
          <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Layer Properties</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={selectedLayerData.name}
                  onChange={(e) => updateLayer(selectedLayerData.id, { name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">X Position</label>
                  <input
                    type="number"
                    value={selectedLayerData.x}
                    onChange={(e) => updateLayer(selectedLayerData.id, { x: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Y Position</label>
                  <input
                    type="number"
                    value={selectedLayerData.y}
                    onChange={(e) => updateLayer(selectedLayerData.id, { y: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Scale ({selectedLayerData.scale.toFixed(1)})</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={selectedLayerData.scale}
                  onChange={(e) => updateLayer(selectedLayerData.id, { scale: Number(e.target.value) })}
                  className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider:bg-blue-600 dark:slider:bg-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Rotation ({selectedLayerData.rotation}°)</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedLayerData.rotation}
                  onChange={(e) => updateLayer(selectedLayerData.id, { rotation: Number(e.target.value) })}
                  className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider:bg-blue-600 dark:slider:bg-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Opacity ({Math.round(selectedLayerData.opacity * 100)}%)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedLayerData.opacity}
                  onChange={(e) => updateLayer(selectedLayerData.id, { opacity: Number(e.target.value) })}
                  className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider:bg-blue-600 dark:slider:bg-blue-400"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedLayerData.visible}
                  onChange={(e) => updateLayer(selectedLayerData.id, { visible: e.target.checked })}
                  className="rounded bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <label className="text-sm text-gray-600 dark:text-gray-400">Visible</label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
