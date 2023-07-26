"use client";

import {
  Editor as EditorType,
  GeoShapeUtil,
  GroupShapeUtil,
  TLEventMapHandler,
  TLUiEventHandler,
  Tldraw,
} from "@tldraw/tldraw";
import {} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useCallback, useEffect, useMemo, useState } from "react";

import ReactFlow, {
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { RectNode } from "./rectNode";

export default function Editor() {
  const [editor, setEditor] = useState<EditorType>();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(() => ({ rectNode: RectNode }), []);

  const [uiEvents, setUiEvents] = useState<string[]>([]);

  const handleUiEvent = useCallback<TLUiEventHandler>((name, data) => {
    setUiEvents((events) => [`${name} ${JSON.stringify(data)}`, ...events]);
  }, []);

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
            logChangeEvent(
              `created shape (${record.type}) ${JSON.stringify(record)}`
            );
            if (editor.isShapeOfType(record, GeoShapeUtil)) {
              if (record.props.geo === "rectangle") {
                setNodes((nodes) =>
                  nodes.concat({
                    id: record.id,
                    type: "rectNode",
                    position: { x: record.x, y: record.y },
                    data: { x: record.x, y: record.y },
                  })
                );
              } else {
                setNodes((nodes) =>
                  nodes.concat({
                    id: record.id,
                    position: { x: record.x, y: record.y },
                    data: { label: record.props.geo },
                  })
                );
              }
            } else if (editor.isShapeOfType(record, GroupShapeUtil)) {
              const position = {
                x: record.x + 30,
                y: record.y - 30,
              };
              setNodes((nodes) => [
                {
                  id: record.id,
                  position,
                  data: { label: record.type },
                  style: {
                    backgroundColor: "rgba(255, 0, 255, 0.2)",
                    height: 150,
                    width: 270,
                  },
                },
                ...nodes,
              ]);

              const childIds = editor
                .getSortedChildIds(record.id)
                .filter((id) => typeof id === "string") as string[];

              setNodes((nodes) =>
                nodes.map((node) => {
                  if (childIds.includes(node.id)) {
                    return {
                      ...node,
                      position: {
                        x: node.position.x - position.x,
                        y: node.position.y - position.y,
                      },
                      parentNode: record.id,
                    };
                  }
                  return node;
                })
              );

              // setEdges((edges) =>
              //   edges.concat(
              //     editor.getSortedChildIds(record.id).map((childId, i) => ({
              //       id: `e${i}-${record.id}`,
              //       source: record.id,
              //       target: childId,
              //     }))
              //   )
              // );
            } else {
              setNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  position: { x: record.x, y: record.y },
                  data: { label: record.type },
                })
              );
            }
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
          // if (from.typeName === "shape" && to.typeName === "shape") {
          //   logChangeEvent(
          //     `updated shape (${from.type}, ${to.type}) ${JSON.stringify(
          //       from
          //     )} ${JSON.stringify(to)}`
          //   );
          // }
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
  }, [editor, setNodes]);

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
          <div style={{ width: "100vw", height: "100vh" }}>
            <ReactFlowProvider>
              <ReactFlow
                nodeTypes={nodeTypes}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
              />
            </ReactFlowProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
