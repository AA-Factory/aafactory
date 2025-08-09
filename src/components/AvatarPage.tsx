'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HiChevronDown, HiChevronUp, HiUpload, HiDownload, HiSave, HiTrash, HiExclamationCircle, HiArrowLeft } from 'react-icons/hi';
import { validateField, validateFile, avatarSchema } from '@/utils/validation';
import { generateFakeFormData } from '@/utils/fakeData';
interface AvatarPageProps {
  editMode?: boolean;
  avatarId?: string;
}

const AvatarPage: React.FC<AvatarPageProps> = ({ editMode = false, avatarId }) => {

  //use fake data
  const [formData, setFormData] = useState(generateFakeFormData());

  const [expandedSections, setExpandedSections] = useState({
    avatarInfos: true,
    voiceSettings: true
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [encodedImage, setEncodedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAvatarId, setSavedAvatarId] = useState(null);

  // Validation states
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  // Validate form on data changes
  useEffect(() => {
    const errors = {};
    let hasErrors = false;

    Object.keys(avatarSchema).forEach(fieldName => {
      if (touched[fieldName] || formData[fieldName]) {
        const validation = validateField(fieldName, formData[fieldName]);
        if (!validation.isValid) {
          errors[fieldName] = validation.error;
          hasErrors = true;
        }
      }
    });

    setFieldErrors(errors);
    setIsFormValid(!hasErrors && Object.values(formData).every(value => value && value.trim()));
  }, [formData, touched]);

  // Auto-load avatar in edit mode
  useEffect(() => {
    if (editMode && avatarId && avatarId !== savedAvatarId) {
      handleLoadAvatar(avatarId);
    }
  }, [editMode, avatarId]);

  // Auto-save avatarId when in edit mode
  useEffect(() => {
    if (editMode && avatarId) {
      setSavedAvatarId(avatarId);
    }
  }, [editMode, avatarId]);

  // Handle back navigation
  const handleBackToAvatars = () => {
    window.location.href = '/avatars';
  };

  // Handle field blur for validation
  const handleFieldBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

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

  // Save avatar data to database (with optional file upload)
  const saveAvatarToDatabase = async (avatarData, file = null, fileName = null) => {
    let response;

    if (file) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('name', avatarData.name);
      formData.append('personality', avatarData.personality);
      formData.append('backgroundKnowledge', avatarData.backgroundKnowledge);
      formData.append('voiceModel', avatarData.voiceModel);
      formData.append('hasEncodedData', avatarData.hasEncodedData?.toString() || 'false');
      formData.append('file', file);
      formData.append('fileName', fileName);

      response = await fetch('/api/avatars', {
        method: 'POST',
        body: formData,
      });
    } else {
      // Use JSON for data-only
      response = await fetch('/api/avatars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(avatarData),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.validationErrors) {
        // Handle server-side validation errors
        setFieldErrors(errorData.validationErrors);
        throw new Error('Please fix the validation errors');
      }
      throw new Error(errorData.error || 'Failed to save avatar');
    }

    return await response.json();
  };

  // Update existing avatar
  const updateAvatarInDatabase = async (avatarId, avatarData) => {
    const response = await fetch(`/api/avatars/${avatarId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(avatarData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.validationErrors) {
        // Handle server-side validation errors
        setFieldErrors(errorData.validationErrors);
        throw new Error('Please fix the validation errors');
      }
      throw new Error(errorData.error || 'Failed to update avatar');
    }

    return await response.json();
  };

  // Get avatar by ID
  const getAvatarById = async (avatarId) => {
    const response = await fetch(`/api/avatars/${avatarId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch avatar');
    }

    return await response.json();
  };

  // Delete avatar by ID (automatically handles file cleanup)
  const deleteAvatarById = async (avatarId) => {
    const response = await fetch(`/api/avatars/${avatarId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete avatar');
    }

    return await response.json();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear server errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleImageUpload = async (file) => {
    // Validate file first
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      setError(fileValidation.error);
      return;
    }

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

    if (!isFormValid) {
      setError('Please fix all validation errors before saving');
      // Mark all fields as touched to show errors
      setTouched(Object.keys(avatarSchema).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    try {
      setError('');
      setIsSaving(true);
      setSaveStatus('Encoding avatar data into image...');

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const dataToEncode = JSON.stringify(formData);
      const encodedImageData = encodeDataInImage(imageData, dataToEncode);

      ctx.putImageData(encodedImageData, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });

      // Save avatar with encoded image in one call
      setSaveStatus('Saving avatar and uploading encoded image...');
      const fileName = `${formData.name || 'avatar'}-encoded.png`;

      const avatarData = {
        ...formData,
        hasEncodedData: true
      };

      let saveResult;
      if (savedAvatarId) {
        // For updates, we need to handle file upload separately since PUT doesn't support FormData easily
        // You might want to create a separate endpoint for file updates or modify the PUT endpoint
        saveResult = await updateAvatarInDatabase(savedAvatarId, avatarData);
      } else {
        saveResult = await saveAvatarToDatabase(avatarData, blob, fileName);
        setSavedAvatarId(saveResult.id);
      }

      // Create download URL for immediate download
      const url = URL.createObjectURL(blob);
      setEncodedImage(url);

      setSaveStatus('Avatar successfully saved with encoded image!');

    } catch (err) {
      setError('Failed to save avatar: ' + err.message);
      setSaveStatus('');
    } finally {
      setIsSaving(false);
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

  const handleSaveOnly = async () => {
    if (!isFormValid) {
      setError('Please fix all validation errors before saving');
      // Mark all fields as touched to show errors
      setTouched(Object.keys(avatarSchema).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    try {
      setError('');
      setIsSaving(true);
      setSaveStatus('Saving avatar data...');

      let avatarData = { ...formData };
      let file = null;
      let fileName = null;

      // If there's a selected image but no encoded image, include the original image
      if (selectedImage && !encodedImage) {
        setSaveStatus('Preparing to save with original image...');
        const canvas = canvasRef.current;
        const blob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/png');
        });

        file = blob;
        fileName = `${formData.name || 'avatar'}-original.png`;
        avatarData.hasEncodedData = false;
      }

      let saveResult;
      if (savedAvatarId) {
        // Update existing avatar
        saveResult = await updateAvatarInDatabase(savedAvatarId, avatarData);
        setSaveStatus('Avatar data successfully updated!');
      } else {
        // Create new avatar
        saveResult = await saveAvatarToDatabase(avatarData, file, fileName);
        setSavedAvatarId(saveResult.id);
        setSaveStatus('Avatar successfully saved!');
      }

    } catch (err) {
      setError('Failed to save avatar: ' + err.message);
      setSaveStatus('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadAvatar = async (avatarId) => {
    try {
      setError('');
      setSaveStatus('Loading avatar...');

      const result = await getAvatarById(avatarId);
      const avatar = result.avatar;

      // Update form data
      setFormData({
        name: avatar.name || '',
        personality: avatar.personality || '',
        backgroundKnowledge: avatar.backgroundKnowledge || '',
        voiceModel: avatar.voiceModel || 'elevenlabs'
      });

      // Clear validation states
      setFieldErrors({});
      setTouched({});

      // If avatar has an image, load it
      if (avatar.src) {
        setSelectedImage(avatar.src);
        // You might want to load the image to canvas here as well
      }

      setSavedAvatarId(avatarId);
      setSaveStatus('Avatar loaded successfully!');

    } catch (err) {
      setError('Failed to load avatar: ' + err.message);
      setSaveStatus('');
    }
  };

  const handleDeleteAvatar = async () => {
    if (!savedAvatarId) return;

    if (!confirm('Are you sure you want to delete this avatar?')) return;

    try {
      setError('');
      setSaveStatus('Deleting avatar...');

      // Delete avatar (automatically handles file cleanup)
      await deleteAvatarById(savedAvatarId);

      // Reset form
      setFormData({
        name: '',
        personality: '',
        backgroundKnowledge: '',
        voiceModel: 'elevenlabs'
      });
      setSelectedImage(null);
      setEncodedImage(null);
      setSavedAvatarId(null);
      setFieldErrors({});
      setTouched({});

      setSaveStatus('Avatar and associated files deleted successfully!');

    } catch (err) {
      setError('Failed to delete avatar: ' + err.message);
      setSaveStatus('');
    }
  };

  // Render field with validation
  const renderField = (fieldName, component) => {
    const hasError = fieldErrors[fieldName] && touched[fieldName];
    const schema = avatarSchema[fieldName];

    return (
      <div>
        {component}
        {hasError && (
          <div className="mt-1 flex items-center space-x-1 text-red-600">
            <HiExclamationCircle className="h-4 w-4" />
            <span className="text-sm">{fieldErrors[fieldName]}</span>
          </div>
        )}
        {schema && (
          <div className="mt-1 text-xs text-gray-500">
            {schema.minLength && schema.maxLength &&
              `${schema.minLength}-${schema.maxLength} characters`}
            {schema.required && <span className="text-red-500"> *</span>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            {/* Back Button */}
            <button
              onClick={handleBackToAvatars}
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mb-6"
            >
              <HiArrowLeft className="w-4 h-4" />
              <span>Back to Avatars</span>
            </button>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {editMode ? 'Edit Avatar' : 'Avatar Creator'}
            </h1>
            <p className="text-gray-600">
              {editMode
                ? 'Update your avatar details and settings'
                : 'Create and save your avatar with steganography encoding'
              }
            </p>
            {editMode && savedAvatarId && (
              <p className="text-sm text-blue-600 mt-2">
                Editing Avatar ID: {savedAvatarId}
              </p>
            )}
          </div>

          {/* Status and Error Messages */}
          {saveStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">{saveStatus}</p>
              {savedAvatarId && (
                <p className="text-sm text-blue-600 mt-1">Avatar ID: {savedAvatarId}</p>
              )}
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
                {renderField('name', (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Enter the name of your avatar</p>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur('name')}
                      className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${fieldErrors.name && touched.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter the name of your avatar"
                    />
                  </div>
                ))}

                {/* Personality Field */}
                {renderField('personality', (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Personality <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Enter the personality of your avatar</p>
                    <textarea
                      name="personality"
                      value={formData.personality}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur('personality')}
                      rows={3}
                      className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none ${fieldErrors.personality && touched.personality ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter the personality of your avatar"
                    />
                  </div>
                ))}

                {/* Background Knowledge Field */}
                {renderField('backgroundKnowledge', (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Knowledge <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Enter the background knowledge of your avatar</p>
                    <textarea
                      name="backgroundKnowledge"
                      value={formData.backgroundKnowledge}
                      onChange={handleInputChange}
                      onBlur={() => handleFieldBlur('backgroundKnowledge')}
                      rows={4}
                      className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 resize-none ${fieldErrors.backgroundKnowledge && touched.backgroundKnowledge ? 'border-red-300' : 'border-gray-300'
                        }`}
                      placeholder="Enter the background knowledge of your avatar"
                    />
                  </div>
                ))}

                {/* Avatar Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Avatar Image
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${isDragging
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
                {renderField('voiceModel', (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voice Model <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Select the voice model you want to use</p>
                    <div className="relative">
                      <select
                        name="voiceModel"
                        value={formData.voiceModel}
                        onChange={handleInputChange}
                        onBlur={() => handleFieldBlur('voiceModel')}
                        className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 appearance-none cursor-pointer ${fieldErrors.voiceModel && touched.voiceModel ? 'border-red-300' : 'border-gray-300'
                          }`}
                      >
                        <option value="elevenlabs">elevenlabs</option>
                        <option value="openai">OpenAI</option>
                        <option value="azure">Azure</option>
                        <option value="google">Google</option>
                      </select>
                      <HiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Load Avatar Section - Only show in create mode */}
            {!editMode && !savedAvatarId && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-medium mb-4">Load Existing Avatar</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter Avatar ID"
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const avatarId = e.target.value.trim();
                        if (avatarId) {
                          handleLoadAvatar(avatarId);
                          e.target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      const avatarId = input.value.trim();
                      if (avatarId) {
                        handleLoadAvatar(avatarId);
                        input.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Load
                  </button>
                </div>
              </div>
            )}

            {/* Save Only Button */}
            <button
              onClick={handleSaveOnly}
              disabled={isSaving || !isFormValid}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <HiSave className="h-5 w-5" />
              <span>{isSaving ? 'Saving...' : savedAvatarId ? 'Update Avatar Data' : 'Save Avatar Data Only'}</span>
            </button>

            {/* Save and Encode Button */}
            <button
              onClick={handleSaveAndEncode}
              disabled={!selectedImage || isSaving || !isFormValid}
              className="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg transition-colors font-medium"
            >
              {isSaving ? 'Processing...' : savedAvatarId ? 'Update & Encode to Image + Upload' : 'Save & Encode to Image + Upload'}
            </button>

            {/* Validation Status */}
            {!isFormValid && Object.keys(fieldErrors).length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <HiExclamationCircle className="h-5 w-5 text-yellow-600" />
                  <p className="text-yellow-800 text-sm font-medium">Please fix validation errors before saving</p>
                </div>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  {Object.entries(fieldErrors).map(([field, error]) => (
                    <li key={field}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

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

            {/* Delete Button */}
            {savedAvatarId && (
              <button
                onClick={handleDeleteAvatar}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <HiTrash className="h-5 w-5" />
                <span>Delete Avatar</span>
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