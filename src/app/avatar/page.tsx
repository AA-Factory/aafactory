'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Download, FileImage, AlertCircle } from 'lucide-react';

const AvatarPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [encodedImage, setEncodedImage] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('');
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

  // Handle form input changes
  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
        
        setOriginalImage(file);
        resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Encode form data into image
  const handleEncode = async () => {
    if (!originalImage) {
      setError('Please select an image first');
      return;
    }

    if (!Object.values(formData).some(value => value.trim())) {
      setError('Please fill in at least one form field');
      return;
    }

    try {
      setError('');
      setStatus('Encoding data into image...');
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      const dataToEncode = JSON.stringify(formData);
      const encodedImageData = encodeDataInImage(imageData, dataToEncode);
      
      ctx.putImageData(encodedImageData, 0, 0);
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setEncodedImage(url);
        setStatus('Data successfully encoded into image!');
      }, 'image/png');
      
    } catch (err) {
      setError('Failed to encode data: ' + err.message);
      setStatus('');
    }
  };

  // Decode data from dropped image
  const handleDecode = async (file) => {
    try {
      setError('');
      setStatus('Decoding data from image...');
      
      const imageData = await loadImageToCanvas(file);
      const decodedText = decodeDataFromImage(imageData);
      
      if (decodedText) {
        try {
          const decodedData = JSON.parse(decodedText);
          setFormData(decodedData);
          setStatus('Form data successfully decoded from image!');
        } catch {
          setStatus('Image loaded but no valid form data found');
        }
      } else {
        setStatus('Image loaded but no encoded data found');
      }
    } catch (err) {
      setError('Failed to process image: ' + err.message);
      setStatus('');
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      handleDecode(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  // Drag and drop handlers
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
      handleFileSelect(files[0]);
    }
  }, []);

  // Download encoded image
  const handleDownload = () => {
    if (encodedImage) {
      const a = document.createElement('a');
      a.href = encodedImage;
      a.download = 'encoded-image.png';
      a.click();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Image Form Data Encoder
        </h1>
        <p className="text-gray-600">
          Encode form data into images or decode data from dropped images
        </p>
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <FileImage className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop an image here to decode form data
        </p>
        <p className="text-gray-500 mb-4">
          or click to select an image for encoding
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Upload className="inline w-4 h-4 mr-2" />
          Select Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />
      </div>

      {/* Status and Error Messages */}
      {status && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">{status}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form Fields */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Form Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your phone"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your address"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any additional notes"
            />
          </div>
        </div>
        
        <button
          onClick={handleEncode}
          disabled={!originalImage}
          className="mt-4 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
        >
          Encode Data into Image
        </button>
      </div>

      {/* Canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Encoded Image Display */}
      {encodedImage && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Encoded Image</h2>
          <div className="flex flex-col items-center">
            <img 
              src={encodedImage} 
              alt="Encoded" 
              className="max-w-full h-auto max-h-96 border rounded-lg shadow-sm mb-4"
            />
            <button
              onClick={handleDownload}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              <Download className="inline w-4 h-4 mr-2" />
              Download Encoded Image
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarPage;