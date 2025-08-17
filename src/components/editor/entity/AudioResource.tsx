"use client";
import React from "react";
import { StoreContext } from "@/store";
import { formatTimeToMinSec } from "@/utils";
import { observer } from "mobx-react";
import { MdAdd } from "react-icons/md";
import { ResourceData } from "@/hooks/useResourceAPI";

export type AudioResourceProps = {
  audio: ResourceData;
  index: number;
  onDelete: () => void;
};

export const AudioResource = observer(
  ({ audio, index, onDelete }: AudioResourceProps) => {
    const store = React.useContext(StoreContext);
    const ref = React.useRef<HTMLAudioElement>(null);
    const [formatedAudioLength, setFormatedAudioLength] =
      React.useState("00:00");

    return (
      <div className="rounded-lg overflow-hidden items-center bg-slate-800 m-[15px] flex flex-col relative min-h-[100px]">
        <div className="bg-[rgba(0,0,0,.25)] text-white py-1 absolute text-base top-2 right-2">
          {formatedAudioLength}
        </div>
        <button
          className="hover:bg-[#00a0f5] bg-[rgba(0,0,0,.25)] rounded-sm z-10 text-white font-bold py-1 absolute text-lg bottom-2 right-2"
          onClick={() => store.addAudio(index, audio.id)}
        >
          <MdAdd size="25" />
        </button>
        <button
          className="hover:bg-red-500 bg-[rgba(0,0,0,.25)] rounded-sm z-10 text-white font-bold py-1 absolute text-lg top-2 left-2"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
              const response = await fetch(`/api/audio/${audio.id}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                onDelete();
                console.log('✅ Audio deleted:', audio.id);
              } else {
                console.error('❌ Failed to delete audio');
                window.alert('Failed to delete audio');
              }
            } catch (error) {
              console.error('❌ Delete error:', error);
              window.alert('Error deleting audio');
            }
          }}
        >
          X
        </button>
        <audio
          onLoadedData={() => {
            const audioLength = ref.current?.duration ?? 0;
            setFormatedAudioLength(formatTimeToMinSec(audioLength));
          }}
          ref={ref}
          className="max-h-[100px] max-w-[150px] min-h-[50px] min-w-[100px]"
          // controls
          src={audio.src}
          id={audio.id}
          controls
        />
      </div>
    );
  }
);
