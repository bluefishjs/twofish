"use client";

import {
  Editor as EditorType,
  GeoShapeUtil,
  GroupShapeUtil,
  TLEventMapHandler,
  TLUiEventHandler,
  Tldraw,
  uniqueId,
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
import { AlignNode } from "./alignNode";
import { StackNode } from "./stackNode";

function getBBox(
  childNodeBBoxes: { x: number; y: number; width: number; height: number }[]
) {
  console.log(childNodeBBoxes);

  const x = Math.min(...childNodeBBoxes.map((b) => b.x));
  const y = Math.min(...childNodeBBoxes.map((b) => b.y));

  const x2 = Math.max(...childNodeBBoxes.map((b) => b.x + b.width));
  const y2 = Math.max(...childNodeBBoxes.map((b) => b.y + b.height));

  console.log({
    x,
    y,
    x2,
    y2,
    width: x2 - x,
    height: y2 - y,
  });

  const childBBox = {
    x,
    y,
    width: x2 - x,
    height: y2 - y,
  };

  return childBBox;
}

export default function Editor() {
  const [editor, setEditor] = useState<EditorType>();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodeTypes = useMemo(
    () => ({ rectNode: RectNode, alignNode: AlignNode, stackNode: StackNode }),
    []
  );

  const [uiEvents, setUiEvents] = useState<string[]>([]);

  const handleUiEvent = useCallback<TLUiEventHandler>(
    (name, data) => {
      setUiEvents((events) => [`${name} ${JSON.stringify(data)}`, ...events]);

      const uid = uniqueId();

      if (name === "align-shapes") {
        setNodes((nodes) => {
          setEdges((edges) =>
            edges.concat([
              {
                id: `e0-${uid}`,
                target: uid,
                source: nodes[0].id,
              },
              {
                id: `e1-${uid}`,
                target: uid,
                source: nodes[1].id,
              },
              {
                id: `e2-${uid}`,
                target: uid,
                source: nodes[2].id,
              },
            ])
          );

          const removedPositions = nodes.map((node, i) => {
            if (i > 2) return node;

            if (
              (data as any).operation === "left" ||
              (data as any).operation === "center-horizontally" ||
              (data as any).operation === "right"
            ) {
              return {
                ...node,
                data: {
                  ...node.data,
                  x: undefined,
                },
              };
            } else {
              return {
                ...node,
                data: {
                  ...node.data,
                  y: undefined,
                },
              };
            }
          });

          return removedPositions.concat({
            id: uid,
            type: "alignNode",
            position: { x: 300, y: 150 },
            style: {
              width: 100,
            },
            data: { alignment: (data as any).operation },
          });
        });
      } else if (name === "stack-shapes") {
        setNodes((nodes) => {
          setEdges((edges) =>
            edges.concat([
              {
                id: `e0-${uid}`,
                target: uid,
                source: nodes[0].id,
              },
              {
                id: `e1-${uid}`,
                target: uid,
                source: nodes[1].id,
              },
              {
                id: `e2-${uid}`,
                target: uid,
                source: nodes[2].id,
              },
            ])
          );

          return nodes.concat({
            id: uid,
            type: "stackNode",
            position: { x: 400, y: 150 },
            style: {
              width: 100,
            },
            data: { direction: (data as any).operation },
          });
        });
      }
    },
    [setEdges, setNodes]
  );

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
                    style: {
                      width: 100,
                      height: 100,
                    },
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
              const childIds = editor
                .getSortedChildIds(record.id)
                .filter((id) => typeof id === "string") as string[];

              setNodes((nodes) => {
                const childNodes = nodes.filter((node) =>
                  childIds.includes(node.id)
                );
                const childNodeBBoxes = childNodes.map((node) => {
                  const { width, height } = node.style as {
                    width: number;
                    height: number;
                  };
                  return {
                    x: node.position.x,
                    y: node.position.y,
                    width,
                    height,
                  };
                });
                const bbox = getBBox(childNodeBBoxes);
                const position = {
                  x: bbox.x - 5,
                  y: bbox.y - 5,
                };

                return [
                  {
                    id: record.id,
                    position,
                    data: { label: record.type },
                    style: {
                      backgroundColor: "rgba(255, 0, 255, 0.2)",
                      width: bbox.width + 10,
                      height: bbox.height + 10,
                    },
                  },
                  ...nodes,
                ];
              });

              setNodes((nodes) =>
                nodes.map((node) => {
                  const parentPosition = nodes.find(
                    (n) => n.id === record.id
                  )!.position;

                  if (childIds.includes(node.id)) {
                    return {
                      ...node,
                      position: {
                        x: node.position.x - parentPosition.x,
                        y: node.position.y - parentPosition.y,
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
          {/* <div>
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
          </div> */}
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
