"use client";
import React from "react";
import { UploadButton } from "../shared/UploadButton";
import { useResourceAPI } from "@/hooks/useResourceAPI";
import { RESOURCE_CONFIG, ResourceType } from "@/config/resourceConfig";

interface ResourcePanelProps {
  resourceType: ResourceType;
  children: (data: any[], refreshResources: () => Promise<void>) => React.ReactNode;
}

export const ResourcePanel = ({ resourceType, children }: ResourcePanelProps) => {
  const { data, isLoading, error, uploadResource, refreshResources } = useResourceAPI(resourceType);
  const config = RESOURCE_CONFIG[resourceType];

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await uploadResource(file);
      await refreshResources();
      console.log(`✅ ${config.displayName} uploaded and saved:`, file.name);
    } catch (error) {
      console.error('❌ Upload error:', error);
      window.alert(`Error uploading ${resourceType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="text-sm px-[16px] pt-[16px] pb-[8px]">
        Loading {config.displayName.toLowerCase()}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm px-[16px] pt-[16px] pb-[8px] text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <>
      <div className="text-sm px-[16px] pt-[16px] pb-[8px] font-semibold flex justify-between items-center">
        <span>{config.displayName}</span>
        <span className="text-xs text-gray-500">
          {data?.length || 0} • saved
        </span>
      </div>
      {children(data || [], refreshResources)}
      <UploadButton
        accept={config.acceptString}
        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold text-center mx-2 py-2 px-4 rounded-sm cursor-pointer"
        onChange={handleFileChange}
      />
    </>
  );
};