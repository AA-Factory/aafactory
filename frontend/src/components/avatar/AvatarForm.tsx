import React, {
  useState,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HiChevronDown, HiChevronUp, HiLightningBolt } from 'react-icons/hi';
import { createAvatarFormSchema, AvatarFormData } from '@/lib/types/avatar';
import { ImageUploadSection } from './ImageUploadSection';
import { AudioUploadSection } from './AudioUploadSection';
import { FormField } from './FormField';
import { getRandomSeed } from '@/utils/fakeData';
import { CATEGORY_OPTIONS } from '@/lib/avatar/constants';
import { Button } from '@/components/ui/Button';

interface AvatarFormProps {
  onSubmit: (data: AvatarFormData) => void;
  defaultValues?: Partial<AvatarFormData>;
  isSubmitting?: boolean;
  existingImageUrl?: string | null;
  existingAudioUrl?: string | null;
  existingAudioFileName?: string | null;
  editMode?: boolean;
  onSaveAndCreateImage?: (data: AvatarFormData) => void;
}

export interface AvatarFormRef {
  reset: (values?: Partial<AvatarFormData>) => void;
  fillWithFakeData: () => void;
}

export const AvatarForm = forwardRef<AvatarFormRef, AvatarFormProps>(
  (
    {
      onSubmit,
      defaultValues,
      isSubmitting = false,
      existingImageUrl,
      existingAudioUrl,
      existingAudioFileName,
      editMode = false,
      onSaveAndCreateImage,
    },
    ref,
  ) => {
    const [expandedSections, setExpandedSections] = useState({
      avatarInfos: true,
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [selectedAudio, setSelectedAudio] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioFileInputRef = useRef<HTMLInputElement>(null);
    const avatarFormSchema = createAvatarFormSchema(editMode);
    const {
      register,
      handleSubmit,
      formState: { errors },
      setValue,
      reset,
    } = useForm<AvatarFormData>({
      resolver: zodResolver(avatarFormSchema),
      defaultValues,
    });

    // Generate fake data function
    const fillWithFakeData = () => {
      const fakeData = {
        name: getRandomSeed('name'),
      };
      reset(fakeData);
      setSelectedImage(null); // Clear any existing image
      setSelectedAudio(null); // Clear any existing audio
    };

    // Expose reset and fillWithFakeData functions to parent component
    useImperativeHandle(
      ref,
      () => ({
        reset: (values?: Partial<AvatarFormData>) => {
          reset(values || defaultValues);
          if (!values?.image) {
            setSelectedImage(null);
          }
          if (!values?.trainingAudio) {
            setSelectedAudio(null);
          }
        },
        fillWithFakeData,
      }),
      [reset, defaultValues, fillWithFakeData],
    );

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
      setExpandedSections((prev) => ({
        ...prev,
        [section]: !prev[section],
      }));
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

    const handleAudioFileInputChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleAudioFileSelect(files[0]);
      }
    };

    const handleAudioFileSelect = (file: File) => {
      setValue('trainingAudio', file);
      setSelectedAudio(file);
    };

    const handleSaveAndCreateImage = async () => {
      // Create a placeholder image file
      const response = await fetch('/placeholder-avatar.png');
      const blob = await response.blob();
      const placeholderFile = new File([blob], 'placeholder-avatar.png', {
        type: 'image/png',
      });

      // Set the placeholder image
      setValue('image', placeholderFile);

      // Trigger form submission with the placeholder
      handleSubmit((data) => {
        if (onSaveAndCreateImage) {
          onSaveAndCreateImage(data);
        }
      })();
    };

    const avatarFields = [
      {
        name: 'name' as const,
        label: 'Name',
        placeholder: 'Enter the name of your avatar',
        required: true,
      },
      {
        name: 'description' as const,
        label: 'Description',
        type: 'textarea' as const,
        rows: 2,
        placeholder: 'Brief description of your avatar',
        required: false,
        hidden: true,
      },
      {
        name: 'category' as const,
        label: 'Category',
        type: 'select' as const,
        options: CATEGORY_OPTIONS,
        placeholder: 'Select avatar category',
        required: false,
        hidden: true,
      },
      {
        name: 'personality' as const,
        label: 'Personality',
        type: 'textarea' as const,
        rows: 2,
        placeholder:
          "Describe your avatar's personality traits and characteristics",
        required: true,
        hidden: true,
      },
      {
        name: 'backgroundKnowledge' as const,
        label: 'Background Knowledge',
        type: 'textarea' as const,
        rows: 3,
        placeholder:
          'Enter the background knowledge and expertise of your avatar',
        required: true,
        hidden: true,
      },
    ];

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Information Section */}
        <Section
          title="Avatar Information"
          expanded={expandedSections.avatarInfos}
          onToggle={() => toggleSection('avatarInfos')}
        >
          {avatarFields.map((field) => (
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
              options={field.options}
              hidden={field.hidden}
            />
          ))}

          <ImageUploadSection
            register={register}
            selectedImage={selectedImage}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileInputChange}
            error={errors.image?.message}
            existingImageUrl={existingImageUrl}
            fileSelect={handleFileSelect}
          />

          <AudioUploadSection
            register={register}
            selectedAudio={selectedAudio}
            fileInputRef={audioFileInputRef}
            onFileSelect={handleAudioFileInputChange}
            error={errors.trainingAudio?.message}
            existingAudioUrl={existingAudioUrl}
            existingAudioFileName={existingAudioFileName}
            fileSelect={handleAudioFileSelect}
          />
        </Section>

        {/* Submit Button */}
        <div className="flex justify-between items-center pt-4">
          {/* Development Mode: Fake Data Button */}
          {process.env.NODE_ENV === 'development' && !editMode && (
            <Button type="button" variant="yellow" onClick={fillWithFakeData}>
              <HiLightningBolt className="h-4 w-4" />
              <span>Fill with Fake Data</span>
            </Button>
          )}

          <div className="flex gap-3 ml-auto">
            {!editMode && onSaveAndCreateImage && (
              <Button
                type="button"
                onClick={handleSaveAndCreateImage}
                disabled={isSubmitting}
                variant="green"
              >
                {isSubmitting ? 'Saving...' : 'Save & Create Image'}
              </Button>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              variant="info"
              className={`${editMode && !onSaveAndCreateImage ? 'w-full' : ''}`}
            >
              {isSubmitting
                ? editMode
                  ? 'Updating Avatar...'
                  : 'Creating Avatar...'
                : editMode
                  ? 'Update Avatar'
                  : 'Create Avatar'}
            </Button>
          </div>
        </div>
      </form>
    );
  },
);

AvatarForm.displayName = 'AvatarForm';

interface SectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  title,
  expanded,
  onToggle,
  children,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
    >
      <span className="text-base font-medium text-gray-900 dark:text-gray-100">
        {title}
      </span>
      {expanded ? (
        <HiChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      ) : (
        <HiChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      )}
    </button>
    {expanded && <div className="px-4 pb-4">{children}</div>}
  </div>
);
