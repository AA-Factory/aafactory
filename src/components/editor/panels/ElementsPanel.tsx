"use client";
import React from "react";
import { StoreContext } from "@/store";
import { observer } from "mobx-react";
import { Element } from "../entity/Element";

export const ElementsPanel = observer((_props: {}) => {
  const store = React.useContext(StoreContext);
  return (
    <div className="bg-slate-200 dark:bg-gray-800 h-full overflow-scroll">
      <div className="flex flex-row justify-between border-b border-gray-300 dark:border-gray-600">
        <div className="text-sm px-[16px] py-[7px] font-semibold text-gray-900 dark:text-white">Elements</div>
      </div>
      <div className="flex flex-col">
        {store.editorElements.map((element) => {
          return <Element key={element.id} element={element} />;
        })}
      </div>
    </div>
  );
});
