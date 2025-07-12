'use client';
import React, { useState, useRef, useCallback } from 'react';
import { HiChevronDown, HiChevronUp, HiUpload, HiDownload } from 'react-icons/hi';

const AvatarPage = () => {
  const [formData, setFormData] = useState({
    name: 'yolandine_three',
    personality: 'A sexy old man',
    backgroundKnowledge: 'the history of space',
    voiceModel: 'elevenlabs'
  });

  const [expandedSections, setExpandedSections] = useState({
    avatarInfos: true,
    voiceSettings: true
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [encodedImage, setEncodedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Encode text data into image using LSB steganography
  const encodeDataInImage = (imageData, text) => {
    const data = imageData.data;
    const textBinary = text.split('').map(char => 
      char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('') + '1111111111111110'; // End marker
    
    let textIndex = 0;
    
    for (let i = 0; i < data.length && textIndex < textBinary.length; i += 4) {
      // Modify LSB of red channel
      if (textIndex < textBinary.length) {
        data[i] = (data[i] & 0xFE) | parseInt(textBinary[textIndex]);
        textIndex++;
      }
    }
    
    return imageData;
  };

  // Decode text data from image
  const decodeDataFromImage = (imageData) => {
    const data = imageData.data;
    let binaryString = '';
    
    for (let i = 0; i < data.length; i += 4) {
      binaryString += (data[i] & 1).toString();
    }
    
    // Find end marker
    const endMarker = '1111111111111110';
    const endIndex = binaryString.indexOf(endMarker);
    
    if (endIndex === -1) return null;
    
    const textBinary = binaryString.substring(0, endIndex);
    let text = '';
    
    for (let i = 0; i < textBinary.length; i += 8) {
      const byte = textBinary.substr(i, 8);
      if (byte.length === 8) {
        text += String.fromCharCode(parseInt(byte, 2));
      }
    }
    
    return text;
  };

  // Load and display image on canvas
  const loadImageToCanvas = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleImageUpload = async (file) => {
    if (file && file.type.startsWith('image/')) {
      try {
        setError('');
        setSaveStatus('Processing image...');
        
        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
        
        // Try to decode form data from the image
        const imageData = await loadImageToCanvas(file);
        const decodedText = decodeDataFromImage(imageData);
        
        if (decodedText) {
          try {
            const decodedData = JSON.parse(decodedText);
            setFormData(decodedData);
            setSaveStatus('Form data successfully decoded from image!');
          } catch {
            setSaveStatus('Image loaded but no valid form data found');
          }
        } else {
          setSaveStatus('Image loaded - ready for encoding');
        }
      } catch (err) {
        setError('Failed to process image: ' + err.message);
        setSaveStatus('');
      }
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSaveAndEncode = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    if (!Object.values(formData).some(value => value.trim())) {
      setError('Please fill in at least one form field');
      return;
    }

    try {
      setError('');
      setSaveStatus('Encoding avatar data into image...');
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const dataToEncode = JSON.stringify(formData);
      const encodedImageData = encodeDataInImage(imageData, dataToEncode);
      
      ctx.putImageData(encodedImageData, 0, 0);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setEncodedImage(url);
        setSaveStatus('Avatar data successfully encoded into image!');
      }, 'image/png');
      
    } catch (err) {
      setError('Failed to encode data: ' + err.message);
      setSaveStatus('');
    }
  };

  const handleDownload = () => {
    if (encodedImage) {
      const a = document.createElement('a');
      a.href = encodedImage;
      a.download = `${formData.name || 'avatar'}-encoded.png`;
      a.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* Status and Error Messages */}
          {saveStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">{saveStatus}</p>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Avatar Infos Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => toggleSection('avatarInfos')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg font-medium">Avatar Infos</span>
              {expandedSections.avatarInfos ? (
                <HiChevronUp className="h-5 w-5" />
              ) : (
                <HiChevronDown className="h-5 w-5" />
              )}
            </button>
            
            {expandedSections.avatarInfos && (
              <div className="px-6 pb-6 space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Enter the name of your avatar</p>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    placeholder="Enter the name of your avatar"
                  />
                </div>
                
                {/* Personality Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personality
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Enter the personality of your avatar</p>
                  <textarea
                    name="personality"
                    value={formData.personality}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none"
                    placeholder="Enter the personality of your avatar"
                  />
                </div>
                
                {/* Background Knowledge Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background Knowledge
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Enter the background knowledge of your avatar</p>
                  <textarea
                    name="backgroundKnowledge"
                    value={formData.backgroundKnowledge}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none"
                    placeholder="Enter the background knowledge of your avatar"
                  />
                </div>
                
                {/* Avatar Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Avatar Image
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                      isDragging 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedImage ? (
                      <div className="space-y-4">
                        <img 
                          src={selectedImage} 
                          alt="Avatar" 
                          className="mx-auto h-32 w-32 object-cover rounded-lg"
                        />
                        <p className="text-gray-600">Click to change image or drop new image to decode data</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <HiUpload className="mx-auto h-12 w-12 text-gray-400" />
                        <div>
                          <p className="text-lg text-gray-600 mb-1">Drop Image Here</p>
                          <p className="text-sm text-gray-500">or</p>
                          <p className="text-sm text-blue-600 font-medium">Click to Upload</p>
                        </div>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Voice Settings Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <button
              onClick={() => toggleSection('voiceSettings')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <span className="text-lg font-medium">Voice Settings</span>
              {expandedSections.voiceSettings ? (
                <HiChevronUp className="h-5 w-5" />
              ) : (
                <HiChevronDown className="h-5 w-5" />
              )}
            </button>
            
            {expandedSections.voiceSettings && (
              <div className="px-6 pb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Model
                  </label>
                  <p className="text-xs text-gray-500 mb-2">Select the voice model you want to use</p>
                  <div className="relative">
                    <select
                      name="voiceModel"
                      value={formData.voiceModel}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 appearance-none cursor-pointer"
                    >
                      <option value="elevenlabs">elevenlabs</option>
                      <option value="openai">OpenAI</option>
                      <option value="azure">Azure</option>
                      <option value="google">Google</option>
                    </select>
                    <HiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Save and Encode Button */}
            <button
              onClick={handleSaveAndEncode}
              disabled={!selectedImage}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-colors font-medium"
            >
              Save Avatar Infos & Encode to Image
            </button>

            {/* Download Button */}
            {encodedImage && (
              <button
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <HiDownload className="h-5 w-5" />
                <span>Download Encoded Image</span>
              </button>
            )}
          </div>

          {/* Canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default AvatarPage;