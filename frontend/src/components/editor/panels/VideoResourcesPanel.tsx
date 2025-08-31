"use client";
import React from "react";
import { VideoResource } from "../entity/VideoResource";
import { ResourcePanel } from "./ResourcePanel";

export const VideoResourcesPanel = () => {
  return (
    <ResourcePanel resourceType="video">
      {(data, refreshResources) => (
        <>
          {data.map((video, index) => (
            <VideoResource 
              key={video.id} 
              video={video} 
              index={index} 
              onDelete={refreshResources}
            />
          ))}
        </>
      )}
    </ResourcePanel>
  );
};