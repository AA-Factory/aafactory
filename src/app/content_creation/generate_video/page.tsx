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

interface AIAvatar {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'realistic' | 'stylized' | 'cartoon' | 'fantasy';
}

export default function GenerateVideoPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'format'>('compose');
  const [layers, setLayers] = useState<SceneLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
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

  const availableAvatars: AIAvatar[] = [
    {
      id: 'avatar-1',
      name: 'Emma',
      description: 'Professional businesswoman',
      thumbnail: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'realistic'
    },
    {
      id: 'avatar-2',
      name: 'Marcus',
      description: 'Creative artist',
      thumbnail: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'realistic'
    },
    {
      id: 'avatar-3',
      name: 'Sophia',
      description: 'Tech entrepreneur',
      thumbnail: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'realistic'
    },
    {
      id: 'avatar-4',
      name: 'Alex',
      description: 'Fitness instructor',
      thumbnail: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'realistic'
    },
    {
      id: 'avatar-5',
      name: 'Luna',
      description: 'Anime character',
      thumbnail: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'stylized'
    },
    {
      id: 'avatar-6',
      name: 'Phoenix',
      description: 'Fantasy warrior',
      thumbnail: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop',
      category: 'fantasy'
    }
  ];

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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <PiFileVideoBold className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">Video Scene Builder</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center space-x-2">
              <TbSparkles className="w-4 h-4" />
              <span>Generate Video</span>
            </button>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <FiSettings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
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
                    ? 'border-purple-500 text-purple-400' 
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="flex h-[calc(100vh-8rem)]">
        {/* Left Sidebar */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {activeTab === 'compose' && (
            <>
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold mb-4">Scene Elements</h3>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition-colors flex flex-col items-center space-y-2"
                >
                  <FiUpload className="w-6 h-6 text-gray-400" />
                  <span className="text-sm text-gray-400">Upload Image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="p-4 border-b border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Scene Prompt</h4>
                <textarea
                  placeholder="Describe the motion and atmosphere you want in your video scene..."
                  className="w-full h-24 p-3 bg-gray-700 border border-gray-600 rounded-lg resize-none text-sm placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors"
                  defaultValue=""
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">0/500 characters</span>
                  <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    Use AI suggestions
                  </button>
                </div>
              </div>

              <div className="p-4 border-b border-gray-700">
                <h4 className="text-sm font-medium text-gray-400 mb-3">AI Avatars</h4>
                <div className="grid grid-cols-2 gap-3">
                  {availableAvatars.map((avatar) => (
                    <div
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar.id === selectedAvatar ? null : avatar.id)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 ${
                        selectedAvatar === avatar.id 
                          ? 'ring-2 ring-purple-500 transform scale-105' 
                          : 'hover:ring-1 hover:ring-gray-500'
                      }`}
                    >
                      <img
                        src={avatar.thumbnail}
                        alt={avatar.name}
                        className="w-full h-20 object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <div className="text-xs font-medium text-white">{avatar.name}</div>
                        <div className="text-xs text-gray-300">{avatar.description}</div>
                      </div>
                      {selectedAvatar === avatar.id && (
                        <div className="absolute top-1 right-1">
                          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                            <FiUser className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                      <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium ${
                        avatar.category === 'realistic' ? 'bg-blue-500/80 text-white' :
                        avatar.category === 'stylized' ? 'bg-pink-500/80 text-white' :
                        avatar.category === 'cartoon' ? 'bg-yellow-500/80 text-black' :
                        'bg-purple-500/80 text-white'
                      }`}>
                        {avatar.category}
                      </div>
                    </div>
                  ))}
                </div>
                {selectedAvatar && (
                  <div className="mt-3 p-2 bg-purple-600/20 border border-purple-500/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <FiUser className="w-4 h-4 text-purple-400" />
                      <span className="text-sm text-purple-300">
                        {availableAvatars.find(a => a.id === selectedAvatar)?.name} selected
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <h4 className="text-sm font-medium text-gray-400 mb-3">Layers</h4>
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                        selectedLayer === layer.id ? 'bg-purple-600/20 border border-purple-500/50' : 'bg-gray-700/50 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <FiImage className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium">{layer.name}</div>
                          <div className="text-xs text-gray-400">{layer.type}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLayer(layer.id);
                        }}
                        className="text-gray-400 hover:text-red-400 transition-colors"
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
              <h3 className="text-lg font-semibold">Format Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Duration</label>
                  <input
                    type="number"
                    value={generationSettings.duration}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, duration: Number(e.target.value) }))}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                    min="1"
                    max="60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Resolution</label>
                  <select
                    value={generationSettings.resolution}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, resolution: e.target.value }))}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  >
                    <option value="512x512">512x512</option>
                    <option value="1024x576">1024x576</option>
                    <option value="1024x1024">1024x1024</option>
                    <option value="1920x1080">1920x1080</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Seed</label>
                  <input
                    type="number"
                    value={generationSettings.seed}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, seed: Number(e.target.value) }))}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          <div className="flex-1 relative">
            <div className="absolute inset-4 bg-black rounded-lg border border-gray-700 overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                style={{ background: 'radial-gradient(circle, #1f2937 0%, #111827 100%)' }}
              />
              
              {/* Render layers */}
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`absolute transition-all duration-200 ${
                    selectedLayer === layer.id ? 'ring-2 ring-purple-500' : ''
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
                  <div className="text-center text-gray-500">
                    <FiImage className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Upload an image to start building your scene</p>
                    <p className="text-sm">Drag and drop or click to upload</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="bg-gray-800 border-t border-gray-700 p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />}
              </button>
              
              <div className="flex-1">
                <div className="relative">
                  <div className="h-2 bg-gray-700 rounded-full">
                    <div 
                      className="h-2 bg-purple-600 rounded-full transition-all duration-100"
                      style={{ width: `${(currentTime / (cameraMovement.duration * 1000)) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0:00</span>
                    <span>{Math.floor(cameraMovement.duration / 60)}:{(cameraMovement.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-400">
                {Math.floor(currentTime / 1000)}s / {cameraMovement.duration}s
              </div>
            </div>
          </div>
        </div>

        {/* Right Properties Panel */}
        {selectedLayerData && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
            <h3 className="text-lg font-semibold mb-4">Layer Properties</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={selectedLayerData.name}
                  onChange={(e) => updateLayer(selectedLayerData.id, { name: e.target.value })}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">X Position</label>
                  <input
                    type="number"
                    value={selectedLayerData.x}
                    onChange={(e) => updateLayer(selectedLayerData.id, { x: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Y Position</label>
                  <input
                    type="number"
                    value={selectedLayerData.y}
                    onChange={(e) => updateLayer(selectedLayerData.id, { y: Number(e.target.value) })}
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Scale ({selectedLayerData.scale.toFixed(1)})</label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={selectedLayerData.scale}
                  onChange={(e) => updateLayer(selectedLayerData.id, { scale: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Rotation ({selectedLayerData.rotation}°)</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={selectedLayerData.rotation}
                  onChange={(e) => updateLayer(selectedLayerData.id, { rotation: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Opacity ({Math.round(selectedLayerData.opacity * 100)}%)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={selectedLayerData.opacity}
                  onChange={(e) => updateLayer(selectedLayerData.id, { opacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedLayerData.visible}
                  onChange={(e) => updateLayer(selectedLayerData.id, { visible: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm text-gray-400">Visible</label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
