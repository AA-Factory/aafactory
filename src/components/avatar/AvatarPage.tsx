'use client';
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { HiChevronDown, HiChevronUp, HiUpload, HiDownload, HiSave, HiTrash, HiExclamationCircle, HiArrowLeft } from 'react-icons/hi';
import { validateField, validateFile, avatarSchema } from '@/utils/validation';
import { generateFakeFormData } from '@/utils/fakeData';
import DeleteModal from '../DeleteModal';
import { ImageUploadSection } from './ImageUploadSection';
import { useModal } from '@/hooks/useModal';
import { useNotification } from '@/contexts/NotificationContext';

import Link from 'next/link'
import { encodeFormDataIntoImage, decodeFormDataFromImage, loadImageToCanvas, decodeDataFromImage } from '@/utils/steganography';
import { useRouter } from 'next/navigation' // NOT 'next/router'


interface AvatarPageProps {
  editMode?: boolean;
  avatarId?: string;
}
interface TouchedFields {
  [key: string]: boolean;
}

const AvatarPage: React.FC<AvatarPageProps> = ({ editMode = false, avatarId }) => {
  const { showNotification, hideNotification, notification } = useNotification();

  //use fake data
  const [formData, setFormData] = useState<{ [key: string]: string }>(generateFakeFormData());
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState({
    avatarInfos: true,
    voiceSettings: true
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [encodedImage, setEncodedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAvatarId, setSavedAvatarId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Validation states
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const useDeleteConfirmModal = useModal();
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

  const handleFieldBlur = (fieldName: string): void => {
    setTouched((prev: TouchedFields) => ({ ...prev, [fieldName]: true }));
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
      formData.append('fileName', fileName ?? '');

      response = await fetch('/api/avatars/create-avatar', {
        method: 'POST',
        body: formData,
      });
    } else {
      // Use JSON for data-only
      console.log('avatarData --->', avatarData);
      response = await fetch('/api/avatars/create-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch('/api/avatars/update-avatar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: avatarId, ...avatarData }),
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
    const response = await fetch('/api/avatars/get-avatar?id=' + avatarId, {
      method: 'GET'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch avatar');
    }

    return await response.json();
  };

  // Delete avatar by ID (automatically handles file cleanup)
  const deleteAvatarById = async (avatarId) => {
    const response = await fetch('/api/avatars/delete-avatar', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: avatarId })
    })

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
      showNotification(fileValidation.error, 'error');
      return;
    }

    try {
      showNotification('Processing image...', 'info');
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);

      // Try to decode form data from the image
      const imageData = await loadImageToCanvas(file, canvasRef);
      const decodedText = decodeDataFromImage(imageData);

      if (decodedText) {
        try {
          const decodedData = JSON.parse(decodedText);
          setFormData(decodedData);
          showNotification('Form data successfully decoded from image!', 'success');

        } catch {
          showNotification('Image loaded but no valid form data found', 'warning');
        }
      } else {
        showNotification('Image loaded - ready for encoding', 'info');
      }
    } catch (err) {
      showNotification('Failed to process image: ' + err.message, 'error');
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
      showNotification('Please select an image first', 'warning');
      return;
    }
    console.log('✌️selectedImage --->', selectedImage);

    if (!isFormValid) {
      showNotification('Please fix all validation errors before saving', 'warning');
      // Mark all fields as touched to show errors
      setTouched(Object.keys(avatarSchema).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }

    try {

      setIsSaving(true);
      showNotification('Encoding avatar data into image...', 'info');

      const response = await fetch(selectedImage);
      const imageFile = new File([await response.blob()], 'image.png');

      // Encode form data into image - THIS IS THE SIMPLE PART!
      const { blob, downloadUrl } = await encodeFormDataIntoImage(formData, imageFile);

      setEncodedImage(downloadUrl);
      // Save avatar with encoded image in one call
      showNotification('Saving avatar and uploading encoded image...', 'info');
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

      // // Create download URL for immediate download
      // const url = URL.createObjectURL(blob);
      // setEncodedImage(url);

      showNotification('Avatar successfully saved and encoded!', 'success');

    } catch (err) {
      showNotification('Failed to save avatar: ' + err.message, 'error');

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
      showNotification('Please fix all validation errors before saving', 'warning');
      // Mark all fields as touched to show errors
      setTouched(Object.keys(avatarSchema).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      return;
    }
    try {
      setIsSaving(true);
      showNotification('Saving avatar data...', 'info');

      let avatarData = { ...formData };
      let file = null;
      let fileName = null;

      // If there's a selected image but no encoded image, include the original image
      if (selectedImage && !encodedImage) {
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
        showNotification('Avatar data successfully updated!', 'success');
      } else {
        // Create new avatar
        saveResult = await saveAvatarToDatabase(avatarData, file, fileName);
        setSavedAvatarId(saveResult.id);
        showNotification('Avatar successfully saved!', 'success');
      }

    } catch (err) {
      showNotification('Failed to save avatar: ' + err.message, 'error');

    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadAvatar = async (avatarId) => {
    try {

      showNotification('Loading avatar...', 'info');

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
      showNotification('Avatar loaded successfully!', 'success');

    } catch (err) {
      showNotification('Failed to load avatar: ' + err.message, 'error');

    }
  };

  const handleDeleteAvatar = async () => {
    if (!savedAvatarId) return;


    try {

      showNotification('Deleting avatar...', 'info');

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

      showNotification('Avatar and associated files deleted successfully!', 'success');

    } catch (err) {
      showNotification('Failed to delete avatar: ' + err.message, 'error');
    } finally {
      useDeleteConfirmModal.closeModal();
      //navigate back to avatars list
      router.push('/avatars');
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
            <Link
              href="/avatars"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors mb-6"
            >
              <HiArrowLeft className="w-4 h-4" />
              <span>Back to Avatars</span>
            </Link>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {editMode ? 'Edit Avatar' : 'Avatar Creator'}
            </h1>
            <p className="text-gray-600">
              {editMode
                ? 'Update your avatar details and settings'
                : 'Create and save your avatar with steganography encoding'
              }
            </p>

          </div>

          {/* Avatar Infos Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm shit">
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

                <div>

                  {/* Avatar Image Upload */}
                  <ImageUploadSection
                    selectedImage={selectedImage}
                    isDragging={isDragging}
                    fileInputRef={fileInputRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onFileSelect={handleFileSelect}
                  />

                </div>
                {/* Avatar Image Upload */}
                {/* <div>
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
                </div> */}
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
                onClick={() => useDeleteConfirmModal.openModal(savedAvatarId)}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <HiTrash className="h-5 w-5" />
                <span>Delete Avatar</span>
              </button>
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {useDeleteConfirmModal.isOpen && (
            <DeleteModal
              avatars={[{ id: savedAvatarId, name: formData.name || 'Avatar' }]}
              avatarToDeleteId={useDeleteConfirmModal.data}
              isDeleting={isDeleting}
              onCancel={useDeleteConfirmModal.closeModal}
              onConfirm={handleDeleteAvatar}
            />
          )}

          {/* Canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    </div>
  );
};

export default AvatarPage;