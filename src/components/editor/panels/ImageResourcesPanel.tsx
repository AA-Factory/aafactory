"use client";
import React from "react";
import { StoreContext } from "@/store";
import { observer } from "mobx-react";
import { ImageResource } from "../entity/ImageResource";
import { UploadButton } from "../shared/UploadButton";
import { useResourceAPI } from "@/hooks/useResourceAPI";

export const ImageResourcesPanel = observer(() => {
  const store = React.useContext(StoreContext);
  const { data, isLoading, error, uploadResource, refreshResources } = useResourceAPI('image');
  // Load images from database on component mount
  React.useEffect(() => {
    if (data) {
      // Clear existing images if needed, or merge strategically
      store.images = []; // or implement a merge strategy

      data.forEach(image => {
        store.addImageResource({ id: image.id, src: image.src });
      });
      console.log(`✅ Loaded ${data.length} images from database`);
    }
  }, [data, store]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const uploadedResource = await uploadResource(file);

      // Immediately add to store for instant feedback
      store.addImageResource({
        id: uploadedResource.id,
        src: uploadedResource.src
      });

      // Optionally refresh all resources to sync with server
      // await refreshResources();
    } catch (error) {
      console.error('❌ Failed to upload image:', error);
      // Handle error (show toast, etc.)
    }
  };
  return (
    <>
      <div className="text-sm px-[16px] pt-[16px] pb-[8px] font-semibold">
        Images
      </div>
      <UploadButton
        accept="image/*"
        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-center mx-2 py-2 px-4 rounded-sm cursor-pointer"
        onChange={handleFileChange}
      />
      <div >
        {store.images.map((image, index) => {
          return <ImageResource key={image.src} image={image.src} index={index} id={image.id} />;
        })}
      </div>

    </>
  );
});
