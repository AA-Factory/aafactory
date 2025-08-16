import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HiExclamationCircle, HiChevronDown, HiChevronUp, HiLightningBolt } from 'react-icons/hi';
import { avatarFormSchema, AvatarFormData, voiceModelOptions } from '@/utils/avatarValidation';
import { ImageUploadSection } from './ImageUploadSection';
import { generateFakeFormData } from '@/utils/fakeData';

interface AvatarFormProps {
  onSubmit: (data: AvatarFormData) => void;
  defaultValues?: Partial<AvatarFormData>;
  isSubmitting?: boolean;
  existingImageUrl?: string | null;
  editMode?: boolean;
}

export interface AvatarFormRef {
  reset: (values?: Partial<AvatarFormData>) => void;
  fillWithFakeData: () => void;
}

interface FormFieldProps {
  name: keyof AvatarFormData;
  label: string;
  type?: 'text' | 'textarea' | 'select';
  rows?: number;
  placeholder?: string;
  register: any;
  error?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  rows,
  placeholder,
  register,
  error,
  options,
  required = false
}) => {
  const baseClasses =
    'w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 text-sm';
  const errorClasses = error
    ? 'border-red-300 dark:border-red-600'
    : 'border-gray-300 dark:border-gray-600';

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 dark:text-red-400"> *</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          {...register(name)}
          rows={rows}
          placeholder={placeholder}
          className={`${baseClasses} resize-none placeholder-gray-500 dark:placeholder-gray-400 ${errorClasses}`}
        />
      ) : type === 'select' && options ? (
        <div className="relative">
          <select
            {...register(name)}
            className={`${baseClasses} appearance-none cursor-pointer ${errorClasses}`}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <HiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
        </div>
      ) : (
        <input
          type="text"
          {...register(name)}
          placeholder={placeholder}
          className={`${baseClasses} placeholder-gray-500 dark:placeholder-gray-400 ${errorClasses}`}
        />
      )}

      {error && (
        <div className="mt-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
          <HiExclamationCircle className="h-3 w-3" />
          <span className="text-xs">{error}</span>
        </div>
      )}
    </div>
  );
};

export const AvatarForm = forwardRef<AvatarFormRef, AvatarFormProps>(({ onSubmit, defaultValues, isSubmitting = false, existingImageUrl, editMode = false }, ref) => {
  const [expandedSections, setExpandedSections] = useState({
    avatarInfos: true,
    voiceSettings: true,
  });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<AvatarFormData>({
    resolver: zodResolver(avatarFormSchema),
    defaultValues,
  });

  // Generate fake data function
  const fillWithFakeData = () => {
    const fakeData = generateFakeFormData();
    reset(fakeData);
    setSelectedImage(null); // Clear any existing image
  };

  // Expose reset and fillWithFakeData functions to parent component
  useImperativeHandle(ref, () => ({
    reset: (values?: Partial<AvatarFormData>) => {
      reset(values || defaultValues);
      if (!values?.image) {
        setSelectedImage(null);
      }
    },
    fillWithFakeData
  }), [reset, defaultValues, fillWithFakeData]);

  // Reset form when defaultValues change
  useEffect(() => {
    if (defaultValues && Object.keys(defaultValues).length > 0) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  // Set existing image when provided
  useEffect(() => {
    if (existingImageUrl && existingImageUrl !== '/placeholder-avatar.png') {
      setSelectedImage(existingImageUrl);
    }
  }, [existingImageUrl]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    setValue('image', file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const avatarFields = [
    {
      name: 'name' as const,
      label: 'Name',
      placeholder: 'Enter the name of your avatar',
      required: true,
    },
    {
      name: 'personality' as const,
      label: 'Personality',
      type: 'textarea' as const,
      rows: 2,
      placeholder: 'Describe your avatar\'s personality traits and characteristics',
      required: true,
    },
    {
      name: 'backgroundKnowledge' as const,
      label: 'Background Knowledge',
      type: 'textarea' as const,
      rows: 3,
      placeholder: 'Enter the background knowledge and expertise of your avatar',
      required: true,
    },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar Infos Section */}
      <Section
        title="Avatar Information"
        expanded={expandedSections.avatarInfos}
        onToggle={() => toggleSection('avatarInfos')}
      >
        {avatarFields.map(field => (
          <FormField
            key={field.name}
            name={field.name}
            label={field.label}
            type={field.type}
            rows={field.rows}
            placeholder={field.placeholder}
            register={register}
            error={errors[field.name]?.message}
            required={field.required}
          />
        ))}

        <ImageUploadSection
          selectedImage={selectedImage}
          isDragging={isDragging}
          fileInputRef={fileInputRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileSelect={handleFileInputChange}
          error={errors.image?.message}
          existingImageUrl={existingImageUrl}
        />
      </Section>

      {/* Voice Settings Section */}
      <Section
        title="Voice Settings"
        expanded={expandedSections.voiceSettings}
        onToggle={() => toggleSection('voiceSettings')}
      >
        <FormField
          name="voiceModel"
          label="Voice Model"
          type="select"
          options={voiceModelOptions as any}
          register={register}
          error={errors.voiceModel?.message}
          required={true}
        />
      </Section>

      {/* Submit Button */}
      <div className="flex justify-between items-center pt-4">
        {/* Development Mode: Fake Data Button */}
        {process.env.NODE_ENV === 'development' && (
          <button
            type="button"
            onClick={fillWithFakeData}
            className="inline-flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <HiLightningBolt className="h-4 w-4" />
            <span>Fill with Fake Data</span>
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-block bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors ml-auto"
        >
          {isSubmitting
            ? (editMode ? 'Updating Avatar...' : 'Creating Avatar...')
            : (editMode ? 'Update Avatar' : 'Create Avatar')
          }
        </button>
      </div>
    </form>
  );
});

AvatarForm.displayName = 'AvatarForm';

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
