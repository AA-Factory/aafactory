import React, { useState } from 'react';
import { HiExclamationCircle, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { avatarSchema } from '@/utils/validation';
import { ImageUploadSection } from './ImageUploadSection';
import { on } from 'events';

interface AvatarFormProps {
  formData: { [key: string]: string };
  fieldErrors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur: (fieldName: string) => void;
  selectedImage: string | null;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const AvatarForm: React.FC<AvatarFormProps> = ({
  formData,
  fieldErrors,
  touched,
  onChange,
  onBlur,
  selectedImage,
  isDragging,
  fileInputRef,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileSelect
}) => {
  const [expandedSections, setExpandedSections] = useState({
    avatarInfos: true,
    voiceSettings: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderField = (
    fieldName: keyof typeof avatarSchema,
    component: React.ReactNode,
  ) => {
    const hasError = fieldErrors[fieldName] && touched[fieldName];
    const schema = avatarSchema[fieldName];

    return (
      <div className="mb-4">
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
                onChange={onChange}
                onBlur={() => onBlur('name')}
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
                onChange={onChange}
                onBlur={() => onBlur('personality')}
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
                onChange={onChange}
                onBlur={() => onBlur('backgroundKnowledge')}
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
        </div>
      )}
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
                    onChange={onChange}
                    onBlur={() => onBlur('voiceModel')}
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
    </div>
  );
}