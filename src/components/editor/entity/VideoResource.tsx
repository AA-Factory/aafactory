"use client";
import React from "react";
import { StoreContext } from "@/store";
import { formatTimeToMinSec } from "@/utils";
import { observer } from "mobx-react";
import { MdAdd } from "react-icons/md";
import { ResourceData } from "@/hooks/useResourceAPI";

type VideoResourceProps = {
  video: ResourceData;
  index: number;
  onDelete: () => void;
};

export const VideoResource = observer(
  ({ video, index, onDelete }: VideoResourceProps) => {
    const store = React.useContext(StoreContext);
    const ref = React.useRef<HTMLVideoElement>(null);
    const [formatedVideoLength, setFormatedVideoLength] =
      React.useState("00:00");

    return (
      <div className="rounded-lg overflow-hidden items-center bg-slate-800 m-[15px] flex flex-col relative">
        <div className="bg-[rgba(0,0,0,.25)] text-white py-1 absolute text-base top-2 right-2">
          {formatedVideoLength}
        </div>
        <button
          className="hover:bg-[#00a0f5] bg-[rgba(0,0,0,.25)] rounded-sm z-10 text-white font-bold py-1 absolute text-lg bottom-2 right-2"
          onClick={() => store.addVideo(index, video.id)}
        >
          <MdAdd size="25" />
        </button>
        <button
          className="hover:bg-red-500 bg-[rgba(0,0,0,.25)] rounded-sm z-10 text-white font-bold py-1 absolute text-lg top-2 left-2"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();

            try {
              const response = await fetch(`/api/video/${video.id}`, {
                method: 'DELETE',
              });

              if (response.ok) {
                onDelete();
                console.log('✅ Video deleted:', video.id);
              } else {
                console.error('❌ Failed to delete video');
                window.alert('Failed to delete video');
              }
            } catch (error) {
              console.error('❌ Delete error:', error);
              window.alert('Error deleting video');
            }
          }}
        >
          X
        </button>
        <video
          onLoadedData={() => {
            const videoLength = ref.current?.duration ?? 0;
            setFormatedVideoLength(formatTimeToMinSec(videoLength));
          }}
          ref={ref}
          className="max-h-[100px] max-w-[150px]"
          src={video.src}
          height={200}
          width={200}
          id={video.id}
          controls
        ></video>
      </div>
    );
  }
);
