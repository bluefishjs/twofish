"use client";

import {
  ArrowShapeUtil,
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
import { ArrowNode } from "./nodes/arrowNode";
import { RectNode } from "./nodes/rectNode";
import { AlignNode } from "./nodes/alignNode";
import { StackNode } from "./nodes/stackNode";
import { overrides } from "./overrides";
import { EllipseNode } from "./nodes/ellipseNode";

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
    () => ({
      rectNode: RectNode,
      alignNode: AlignNode,
      stackNode: StackNode,
      ellipseNode: EllipseNode,
      arrowNode: ArrowNode,
    }),
    []
  );

  const [uiEvents, setUiEvents] = useState<string[]>([]);

  const onShapeChange = (items: any) => {
    console.log(items);
    editor?.updateShapes([items]);
  };

  const onAlignmentChange = (items: any) => {
    console.log(items);
    // editor?.updateShapes([items]);
  };

  const handleUiEvent = useCallback<TLUiEventHandler>(
    (name, data) => {
      setUiEvents((events) => [`${name} ${JSON.stringify(data)}`, ...events]);

      const uid = uniqueId();

      if (name === "align-shapes") {
        setNodes((nodes) => {
          setEdges((edges) =>
            edges.concat(
              (data as any).ids.map((id: string, i: number) => ({
                id: `e${i}-${uid}`,
                target: uid,
                source: id,
              }))
            )
          );

          const removedPositions = nodes.map((node) => {
            if (!(data as any).ids.includes(node.id)) return node;

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
            data: {
              alignment: (data as any).operation,
              childrenIds: (data as any).ids,
              onChange: onAlignmentChange,
            },
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
              const data = {
                id: record.id,
                x: record.x,
                y: record.y,
                width: record.props.w,
                height: record.props.h,
                onChange: onShapeChange,
              };
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
                    data: data,
                  })
                );
              } else if (record.props.geo === "ellipse") {
                setNodes((nodes) =>
                  nodes.concat({
                    id: record.id,
                    type: "ellipseNode",
                    position: { x: record.x, y: record.y },
                    style: {
                      width: 100,
                      height: 100,
                    },
                    data: data,
                  })
                );
              } else {
                console.log(record);
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

              setNodes((nodes) => {
                const parentPosition = nodes.find(
                  (n) => n.id === record.id
                )!.position;
                return nodes.map((node) => {
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
                });
              });

              // setEdges((edges) =>
              //   edges.concat(
              //     editor.getSortedChildIds(record.id).map((childId, i) => ({
              //       id: `e${i}-${record.id}`,
              //       source: record.id,
              //       target: childId,
              //     }))
              //   )
              // );
            } else if (editor.isShapeOfType(record, ArrowShapeUtil)) {
              console.log(record);
              setNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  type: "arrowNode",
                  position: { x: record.x, y: record.y },
                  style: {
                    width: 100,
                    height: 100,
                  },
                  data: {
                    id: record.id,
                    x: record.x,
                    y: record.y,
                    start: record.props.start,
                    end: record.props.end,
                  },
                })
              );
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
          if (from.typeName === "instance" && to.typeName === "instance") {
            if (from.currentPageId !== to.currentPageId) {
              logChangeEvent(
                `changed page (${from.currentPageId}, ${to.currentPageId})`
              );
            }
          }
          if (from.typeName === "shape" && to.typeName === "shape") {
            logChangeEvent(
              `updated shape (${from.type}, ${to.type}) ${JSON.stringify(
                from
              )} ${JSON.stringify(to)}`
            );

            console.log(from, to);
            if (from.type === "ellipse" || from.type === "rect") {
              setNodes((nodes) => {
                const updatedNodes = nodes.map((node) => {
                  if (node.id === from.id) {
                    // TODO GRACE:
                    // Debounce this?
                    // If moving 2 things and they're both aligned to each other, do we want to update the values?
                    const data = { ...node.data };
                    if (to.x !== from.x) {
                      data.x = to.x;
                    }
                    if (to.y !== from.y) {
                      data.y = to.y;
                    }

                    if (to.props.w !== from.props.w) {
                      data.width = to.props.w;
                    }
                    if (to.props.h !== from.props.h) {
                      data.height = to.props.h;
                    }
                    return {
                      ...node,
                      data: data,
                    };
                  }
                  return node;
                });
                return updatedNodes;
              });
            }
            if (from.type === "arrow") {
              setNodes((nodes) => {
                const updatedNodes = nodes.map((node) => {
                  if (node.id === from.id) {
                    const data = { ...node.data };
                    if (to.x !== from.x) {
                      data.x = to.x;
                    }
                    if (to.y !== from.y) {
                      data.y = to.y;
                    }

                    if (to.props.start !== from.props.start) {
                      data.start = to.props.start;
                    }
                    if (to.props.end !== from.props.end) {
                      data.end = to.props.end;
                    }
                    return {
                      ...node,
                      data: data,
                    };
                  }
                  return node;
                });
                return updatedNodes;
              });
            }
          }
          // if (from.typeName === "arrow" && to.typeName === "arrow") {

          // }
        }

        // Removed
        for (const record of Object.values(change.changes.removed)) {
          if (record.typeName === "shape") {
            logChangeEvent(`deleted shape (${record.type})`);
            if (record.type === "group") {
              // filter out parent id if node is a group
              setNodes((nodes) => {
                const parentPosition = nodes.find(
                  (n) => n.id === record.id
                )!.position;

                return nodes.map((node) => {
                  if (node.parentNode === record.id) {
                    return {
                      ...node,
                      position: {
                        x: node.position.x + parentPosition.x,
                        y: node.position.y + parentPosition.y,
                      },
                      parentNode: undefined,
                    };
                  }
                  return node;
                });
              });
            }
            setNodes((nodes) => nodes.filter((node) => node.id !== record.id));
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
        <Tldraw
          autoFocus
          onUiEvent={handleUiEvent}
          onMount={setAppToState}
          overrides={overrides}
        />
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
