"use client";
import React from "react";
import { AudioResource } from "../entity/AudioResource";
import { ResourcePanel } from "./ResourcePanel";

export const AudioResourcesPanel = () => {
  return (
    <ResourcePanel resourceType="audio">
      {(data, refreshResources) => (
        <>
          {data.map((audio, index) => (
            <AudioResource 
              key={audio.id} 
              audio={audio} 
              index={index} 
              onDelete={refreshResources}
            />
          ))}
        </>
      )}
    </ResourcePanel>
  );
};
