import React, { useState } from 'react';
import { HiExclamationCircle, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { avatarSchema } from '@/utils/validation';
import { ImageUploadSection } from './ImageUploadSection';

interface AvatarFormProps {
  formData: { [key: string]: string };
  fieldErrors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (fieldName: string) => void;
  selectedImage: string | null;
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface FormFieldProps {
  fieldName: keyof typeof avatarSchema;
  label: string;
  type?: 'text' | 'textarea' | 'select';
  rows?: number;
  placeholder?: string;
  formData: AvatarFormProps['formData'];
  fieldErrors: AvatarFormProps['fieldErrors'];
  touched: AvatarFormProps['touched'];
  onChange: AvatarFormProps['onChange'];
  onBlur: AvatarFormProps['onBlur'];
  options?: { value: string; label: string }[];
}

const FormField: React.FC<FormFieldProps> = ({
  fieldName,
  label,
  type = 'text',
  rows,
  placeholder,
  formData,
  fieldErrors,
  touched,
  onChange,
  onBlur,
  options
}) => {
  const hasError = fieldErrors[fieldName] && touched[fieldName];
  const schema = avatarSchema[fieldName];

  const baseClasses =
    'w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 text-sm';
  const errorClasses = hasError
    ? 'border-red-300 dark:border-red-600'
    : 'border-gray-300 dark:border-gray-600';

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {schema?.required && <span className="text-red-500 dark:text-red-400"> *</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          name={fieldName}
          value={formData[fieldName] || ''}
          onChange={onChange}
          onBlur={() => onBlur(fieldName)}
          rows={rows}
          placeholder={placeholder}
          className={`${baseClasses} resize-none placeholder-gray-500 dark:placeholder-gray-400 ${errorClasses}`}
        />
      ) : type === 'select' && options ? (
        <div className="relative">
          <select
            name={fieldName}
            value={formData[fieldName] || ''}
            onChange={onChange}
            onBlur={() => onBlur(fieldName)}
            className={`${baseClasses} appearance-none cursor-pointer ${errorClasses}`}
          >
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <HiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        </div>
      ) : (
        <input
          type="text"
          name={fieldName}
          value={formData[fieldName] || ''}
          onChange={onChange}
          onBlur={() => onBlur(fieldName)}
          placeholder={placeholder}
          className={`${baseClasses} placeholder-gray-500 dark:placeholder-gray-400 ${errorClasses}`}
        />
      )}

      {hasError && (
        <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
          <HiExclamationCircle className="h-3 w-3" />
          <span className="text-xs">{fieldErrors[fieldName]}</span>
        </div>
      )}

      {schema && (schema.minLength || schema.maxLength) && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {schema.minLength && schema.maxLength && `${schema.minLength}-${schema.maxLength} characters`}
        </div>
      )}
    </div>
  );
};

export const AvatarForm: React.FC<AvatarFormProps> = props => {
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

  const avatarFields: FormFieldProps[] = [
    {
      fieldName: 'name',
      label: 'Name',
      placeholder: 'Enter the name of your avatar',
      formData: props.formData,
      fieldErrors: props.fieldErrors,
      touched: props.touched,
      onChange: props.onChange,
      onBlur: props.onBlur,
    },
    {
      fieldName: 'personality',
      label: 'Personality',
      type: 'textarea',
      rows: 2,
      placeholder: 'Enter the personality of your avatar',
      formData: props.formData,
      fieldErrors: props.fieldErrors,
      touched: props.touched,
      onChange: props.onChange,
      onBlur: props.onBlur,
    },
    {
      fieldName: 'backgroundKnowledge',
      label: 'Background Knowledge',
      type: 'textarea',
      rows: 3,
      placeholder: 'Enter the background knowledge of your avatar',
      formData: props.formData,
      fieldErrors: props.fieldErrors,
      touched: props.touched,
      onChange: props.onChange,
      onBlur: props.onBlur,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Avatar Infos Section */}
      <Section
        title="Avatar Infos"
        expanded={expandedSections.avatarInfos}
        onToggle={() => toggleSection('avatarInfos')}
      >
        {avatarFields.map(field => (
          <FormField key={field.fieldName} {...field} />
        ))}

        <ImageUploadSection
          selectedImage={props.selectedImage}
          isDragging={props.isDragging}
          fileInputRef={props.fileInputRef}
          onDragOver={props.handleDragOver}
          onDragLeave={props.handleDragLeave}
          onDrop={props.handleDrop}
          onFileSelect={props.handleFileSelect}
        />
      </Section>

      {/* Voice Settings Section */}
      <Section
        title="Voice Settings"
        expanded={expandedSections.voiceSettings}
        onToggle={() => toggleSection('voiceSettings')}
      >
        <FormField
          fieldName="voiceModel"
          label="Voice Model"
          type="select"
          options={[
            { value: 'elevenlabs', label: 'elevenlabs' },
            { value: 'openai', label: 'OpenAI' },
            { value: 'azure', label: 'Azure' },
            { value: 'google', label: 'Google' },
          ]}
          formData={props.formData}
          fieldErrors={props.fieldErrors}
          touched={props.touched}
          onChange={props.onChange}
          onBlur={props.onBlur}
        />
      </Section>
    </div>
  );
};

interface SectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, expanded, onToggle, children }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
    >
      <span className="text-base font-medium text-gray-900 dark:text-gray-100">{title}</span>
      {expanded ? (
        <HiChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      ) : (
        <HiChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      )}
    </button>
    {expanded && <div className="px-4 pb-4">{children}</div>}
  </div>
);
