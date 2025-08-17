"use client";
import React from "react";
import { ImageResource } from "../entity/ImageResource";
import { ResourcePanel } from "./ResourcePanel";

export const ImageResourcesPanel = () => {
  return (
    <ResourcePanel resourceType="image">
      {(data, refreshResources) => (
        <div>
          {data.map((image, index) => (
            <ImageResource 
              key={image.id} 
              image={image} 
              index={index} 
              onDelete={refreshResources}
            />
          ))}
        </div>
      )}
    </ResourcePanel>
  );
};
