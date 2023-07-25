"use client";

import {
  Editor as EditorType,
  TLEventMapHandler,
  TLUiEventHandler,
  Tldraw,
} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useCallback, useEffect, useState } from "react";

export default function Editor() {
  const [uiEvents, setUiEvents] = useState<string[]>([]);

  const handleUiEvent = useCallback<TLUiEventHandler>((name, data) => {
    setUiEvents((events) => [`${name} ${JSON.stringify(data)}`, ...events]);
  }, []);

  const [editor, setEditor] = useState<EditorType>();

  const setAppToState = useCallback((editor: EditorType) => {
    setEditor(editor);
  }, []);

  const [storeEvents, setStoreEvents] = useState<string[]>([]);

  useEffect(() => {
    if (!editor) return;

    function logChangeEvent(eventName: string) {
      setStoreEvents((events) => [eventName, ...events]);
    }

    // This is the fire hose, it will be called at the end of every transaction
    const handleChangeEvent: TLEventMapHandler<"change"> = (change) => {
      if (change.source === "user") {
        // Added
        for (const record of Object.values(change.changes.added)) {
          if (record.typeName === "shape") {
            logChangeEvent(`created shape (${record.type})`);
          }
        }

        // Updated
        for (const [from, to] of Object.values(change.changes.updated)) {
          if (
            from.typeName === "instance" &&
            to.typeName === "instance" &&
            from.currentPageId !== to.currentPageId
          ) {
            logChangeEvent(
              `changed page (${from.currentPageId}, ${to.currentPageId})`
            );
          }
        }

        // Removed
        for (const record of Object.values(change.changes.removed)) {
          if (record.typeName === "shape") {
            logChangeEvent(`deleted shape (${record.type})`);
          }
        }
      }
    };

    editor.on("change", handleChangeEvent);

    return () => {
      editor.off("change", handleChangeEvent);
    };
  }, [editor]);

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "60vw", height: "100vh" }}>
        <Tldraw autoFocus onUiEvent={handleUiEvent} onMount={setAppToState} />
      </div>
      <div>
        <div
          style={{
            width: "40vw",
            height: "100vh",
            padding: 8,
            background: "#eee",
            border: "none",
            fontFamily: "monospace",
            fontSize: 12,
            borderLeft: "solid 2px #333",
            display: "flex",
            flexDirection: "column-reverse",
            overflow: "auto",
          }}
        >
          <div>
            <b>UI Events</b>
            {uiEvents.map((t, i) => (
              <div key={i}>{t}</div>
            ))}
          </div>
          <div>
            <b>Store Events</b>
            {storeEvents.map((t, i) => (
              <div key={i}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
