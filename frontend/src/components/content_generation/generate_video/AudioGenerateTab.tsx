import React from 'react';
import { TbSparkles } from 'react-icons/tb';
import { Avatar } from '@/lib/types/avatar';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { TextArea } from '@/components/ui/TextArea';
import { Label } from '@/components/ui/Label';
import { Select, SelectOption } from '@/components/ui/Select';
interface AudioGenerateTabProps {
  avatar: Avatar | null;
  selectedAudioSource: 'avatar' | 'rick_and_morty' | 'japanese';
  onAudioSourceChange: (
    source: 'avatar' | 'rick_and_morty' | 'japanese',
  ) => void;
  dialog: string;
  onDialogChange: (dialog: string) => void;
  onAudioGeneration: () => void;
  isGenerating: boolean;
}
type AudioSource = 'avatar' | 'rick_and_morty' | 'japanese';
export const AudioGenerateTab: React.FC<AudioGenerateTabProps> = ({
  avatar,
  selectedAudioSource,
  onAudioSourceChange,
  dialog,
  onDialogChange,
  onAudioGeneration,
  isGenerating,
}) => {
  const audioOptions: SelectOption<AudioSource>[] = [
    {
      value: 'avatar',
      label: "Avatar's uploaded audio",
      hidden: !avatar?.trainingAudioPath,
    },
    {
      value: 'rick_and_morty',
      label: 'Rick and Morty (default)',
    },
    {
      value: 'japanese',
      label: 'Japanese Voice',
    },
  ];
  return (
    <>
      <div className="mb-4">
        <Label
          htmlFor="audioSource"
          className="mb-2"
          tooltipText="Choose the voice training audio for speech generation"
        >
          Training Audio Source
        </Label>
        <Select<AudioSource>
          name="audioSource"
          value={selectedAudioSource}
          options={audioOptions}
          onChange={onAudioSourceChange}
        />
      </div>

      <TextArea
        name="dialog"
        value={dialog}
        className="max-w-xs w-full h-24"
        onChange={onDialogChange}
        placeholder="Type the dialog for your video here..."
      />
      <div>
        <div className="flex space-x-2">
          <Button
            variant="primary"
            onClick={onAudioGeneration}
            type="button"
            disabled={isGenerating}
            fullWidth
          >
            {isGenerating ? (
              <>
                <Spinner />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <TbSparkles className="w-3 h-3" />
                <span>Generate Audio</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};
