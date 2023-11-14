"use client";

import {
  ArrowShapeUtil,
  Editor as EditorType,
  GeoShapeUtil,
  GroupShapeUtil,
  TLEventMapHandler,
  TLShapeId,
  TLUiEventHandler,
  TextShapeUtil,
  Tldraw,
  uniqueId,
} from "@tldraw/tldraw";
import {} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

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
import { TextNode } from "./nodes/textNode";
import { overrides } from "./overrides";
import { EllipseNode } from "./nodes/ellipseNode";
import { getBBox } from "./utils";
import { node } from "webpack";

export const EditorContext = createContext<any>(undefined);
export const NodesContext = createContext<any>(undefined);
export const EdgesContext = createContext<any>(undefined);

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
      textNode: TextNode,
    }),
    []
  );

  const editorContextValue = useMemo(
    () => ({
      editor,
      setEditor,
    }),
    [editor, setEditor]
  );
  const nodesContextValue = useMemo(
    () => ({
      nodes,
      setNodes,
    }),
    [nodes, setNodes]
  );

  // Types of edges in graph
  enum EdgeTypes {
    Align,
    Stack,
  }

  const [uiEvents, setUiEvents] = useState<string[]>([]);

  const onShapeChange = (items: any) => {
    setEditor((editor) => editor?.updateShapes([items]));
  };

  const handleUiEvent = useCallback<TLUiEventHandler>(
    (name, data) => {
      console.log(name, data);
      setUiEvents((events) => [`${name} ${JSON.stringify(data)}`, ...events]);

      const uid = uniqueId();

      if (name === "align-shapes") {
        setNodes((nodes) => {
          console.log("[UI Event]: Nodes:", nodes);

          setEdges((edges) => {
            console.log("[UI Event]: Edges:", edges);
            return edges.concat(
              (data as any).ids.map((id: string, i: number) => ({
                id: `e${i}-${uid}`,
                target: uid,
                source: id,
                data: {
                  edgeType: EdgeTypes.Align,
                },
              }))
            );
          });

          // Align parameters
          let alignX: number | undefined;
          let alignY: number | undefined;
          let minX: number | undefined;
          let maxX: number | undefined;
          let minY: number | undefined;
          let maxY: number | undefined;
          const operation = (data as any).operation;
          const ids = (data as any).ids;

          const removedPositions = nodes.map((node) => {
            if (!ids.includes(node.id)) return node;

            if (
              operation === "left" ||
              operation === "center-horizontal" ||
              operation === "right"
            ) {
              switch (operation) {
                case "left":
                  alignX =
                    alignX === undefined
                      ? node.data.x
                      : Math.min(alignX, node.data.x);
                  break;
                case "center-horizontal":
                  minX = Math.min(node.data.x, minX ?? node.data.x);
                  maxX = Math.max(
                    node.data.x + (node.data.width ?? 0),
                    maxX ?? 0
                  );
                  alignX = (minX + maxX) / 2;
                  break;
                case "right":
                  alignX =
                    alignX === undefined
                      ? node.data.x
                      : Math.max(alignX, node.data.x);
                  break;
              }
              return {
                ...node,
                data: {
                  ...node.data,
                  x: undefined,
                },
              };
            } else {
              switch (operation) {
                case "top":
                  alignY =
                    alignY === undefined
                      ? node.data.y
                      : Math.min(alignY, node.data.y);
                  break;
                case "center-vertical":
                  minY = Math.min(node.data.y, minY ?? 0);
                  maxY = Math.max(
                    node.data.y + (node.data.height ?? 0),
                    maxY ?? 0
                  );
                  alignX = (minY + maxY) / 2;
                  break;
                case "bottom":
                  alignY =
                    alignY === undefined
                      ? node.data.y
                      : Math.max(alignY, node.data.y);
                  break;
              }
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
              id: uid,
              alignment: (data as any).operation,
              childrenIds: (data as any).ids,
              x: alignX,
              y: alignY,
            },
          });
        });
      } else if (name === "stack-shapes") {
        console.log(data);
        let selectedIds: TLShapeId[] = [];
        const operation = (data as any).operation;
        const alignment =
          operation === "vertical" ? "center-horizontal" : "center-vertical";

        // TODO: How to do alignment:
        // -> First pass to see whether there are any nodes whose positions are already computed in the stack
        // -> If there is more than 1, check that they match specifications and then distribute everything based on that
        //    -> Alignment probably should be different based on how the stack actually aligns
        // -> If there's only 1, use that position as reference
        // -> If no positions set, just center align them
        setEditor((editor) => {
          selectedIds = editor?.selectedIds ?? [];
          return editor?.alignShapes(alignment, selectedIds);
          // TODO: alignment should only happen after we check everything is consistent
        });
        setNodes((nodes) => {
          setEdges((edges) =>
            edges.concat(
              selectedIds.map((id, i) => ({
                id: `e${i}-${uid}`,
                target: uid,
                source: id,
                data: {
                  edgeType: EdgeTypes.Stack,
                },
              }))
            )
          );

          let minX: number | undefined;
          let maxX: number | undefined;
          let minY: number | undefined;
          let maxY: number | undefined;
          let stackX: number | undefined = undefined;
          let stackY: number | undefined = undefined;

          const sortedIds = nodes
            .filter((node: any) => selectedIds.includes(node.id as TLShapeId))
            .sort((a, b) =>
              operation === "horizontal"
                ? a.data.y < b.data.y
                  ? -1
                  : a.data.y > b.data.y
                  ? 1
                  : 0
                : a.data.x < b.data.x
                ? -1
                : a.data.x > b.data.x
                ? 1
                : 0
            )
            .map((node) => node.id);
          console.log("sorted", sortedIds);
          const removedPositions = nodes.map((node) => {
            if (!selectedIds.includes(node.id as TLShapeId)) {
              return node;
            }

            minX = Math.min(node.data.x, minX ?? node.data.x);
            minY = Math.min(node.data.y, minY ?? node.data.y);

            if (alignment === "center-horizontal") {
              maxX = Math.max(node.data.x + (node.data.width ?? 0), maxX ?? 0);
              stackX = (minX + maxX) / 2;
            } else {
              maxY = Math.max(node.data.y + (node.data.height ?? 0), maxY ?? 0);
              stackY = (minY + maxY) / 2;
            }

            return {
              ...node,
              data: {
                ...node.data,
                y: undefined,
              },
            };
          });
          return removedPositions.concat({
            id: uid,
            type: "stackNode",
            position: { x: 400, y: 150 },
            style: {
              width: 100,
            },
            data: {
              id: uid,
              direction: (data as any).operation,
              alignment: alignment,
              x: stackX,
              y: stackY,
              minX: minX,
              minY: minY,
              childrenIds: sortedIds,
            },
          });
        });
      } else if (name === "undo") {
        // TODO: handle undo -> using UI event?
        console.log(data);
      }
    },
    [setEdges, setNodes, EdgeTypes.Align, EdgeTypes.Stack]
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
            } else if (editor.isShapeOfType(record, TextShapeUtil)) {
              setNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  type: "textNode",
                  position: { x: record.x, y: record.y },
                  style: {
                  },
                  data: {
                    id: record.id,
                    x: record.x,
                    y: record.y,
                    content: record.props.text,
                  },
                })
              );
            } else {
              console.log(record);
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

            if (from.type === "geo") {
              setNodes((nodes) => {
                const updatedNodes = nodes.map((node) => {
                  if (node.id === from.id) {
                    // TODO GRACE:
                    // Debounce this?
                    // If moving 2 things and they're both aligned to each other, do we want to update the values?
                    const data = { ...node.data };
                    if (data.x !== undefined && to.x !== from.x) data.x = to.x;
                    if (data.y !== undefined && to.y !== from.y) data.y = to.y;

                    if (
                      data.width !== undefined &&
                      to.props.w !== from.props.w
                    ) data.width = to.props.w;

                    if (
                      data.height !== undefined &&
                      to.props.h !== from.props.h
                    ) data.height = to.props.h;

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
            else if (from.type === "arrow") {
              setNodes((nodes) => {
                const updatedNodes = nodes.map((node) => {
                  if (node.id === from.id) {
                    const data = { ...node.data };
                    if (to.x !== from.x) data.x = to.x;
                    if (to.y !== from.y) data.y = to.y;
                    if (to.props.start !== from.props.start) data.start = to.props.start;
                    if (to.props.end !== from.props.end) data.end = to.props.end;

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
            else if (from.type === "text") {
              setNodes((nodes) => {
                const updatedNodes = nodes.map((node) => {
                  if (node.id === from.id) {
                    const data = { ...node.data };
                    if (to.x !== from.x) data.x = to.x;
                    if (to.y !== from.y) data.y = to.y;
                    if (to.props.text !== from.props.text) data.content = to.props.text;

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
    <EditorContext.Provider value={editorContextValue}>
      <NodesContext.Provider value={nodesContextValue}>
        <EdgesContext.Provider value={{ edges, setEdges }}>
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
        </EdgesContext.Provider>
      </NodesContext.Provider>
    </EditorContext.Provider>
  );
}
