"use client";
import _ from "lodash";
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
  createShapeId,
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
import { AlignNode } from "./nodes/alignNode";
import { GeoNode } from "./nodes/geoNode";
import { StackNode } from "./nodes/stackNode";
import { TextNode } from "./nodes/textNode";
import { Node, Component } from "./nodes/node";
import { overrides } from "./overrides";
import { getBBox } from "./utils";
import { TreeView } from "./treeView/tree";
import { Panel } from "./configurationPanel/panel";
import { getAlignAxes, getStackLayout } from "./layoutUtils";

export const EditorContext = createContext<any>(undefined);
export const NodesContext = createContext<any>(undefined);
export const TreeNodesContext = createContext<any>(undefined);
export const EdgesContext = createContext<any>(undefined);
export const SelectionContext = createContext<any>(undefined);

export default function Editor() {
  const [editor, setEditor] = useState<EditorType>();
  const [selectedNodes, setSelectedNodes] = useState(Array<string>());
  const [selectedTreeNodes, setSelectedTreeNodes] = useState(Array<any>());
  const [selectedShapeIds, setSelectedShapeIds] = useState(Array<string>());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [treeNodes, setTreeNodes] = useState(Array<any>());

  const nodeTypes = useMemo(
    () => ({
      geoNode: GeoNode,
      alignNode: AlignNode,
      stackNode: StackNode,
      arrowNode: ArrowNode,
      textNode: TextNode,
    }),
    []
  );

  const onSelectionChange = (evt: any) => {
    const newSelectedNodes = evt.nodes;
    const selectedShapeIdsSet: Set<string> = new Set<string>();
    for (const node of newSelectedNodes) {
      if (node.type === "alignNode" || node.type === "stackNode") {
        // prevent duplicate values
        (node.data.childrenIds ?? []).forEach((item: string) =>
          selectedShapeIdsSet.add(item)
        );
      } else selectedShapeIdsSet.add(node.id);
    }
    const newSelectedShapeIds = Array.from(selectedShapeIdsSet).toSorted();
    if (_.isEqual(selectedShapeIds, newSelectedShapeIds)) {
      return;
    }
    setSelectedNodes(newSelectedNodes.map((node: any) => node.id));
    setSelectedShapeIds(newSelectedShapeIds);
    setEditor((editor) => {
      return editor?.select(...(newSelectedShapeIds as TLShapeId[]));
    });
  };

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

  const treeNodesContextValue = useMemo(
    () => ({ treeNodes, setTreeNodes }),
    [treeNodes, setTreeNodes]
  );
  const selectedTreeContextValue = useMemo(
    () => ({
      selectedTreeNodes,
      setSelectedTreeNodes,
    }),
    [selectedTreeNodes, setSelectedTreeNodes]
  );

  const memoizedSelectedNodes = useMemo(
    () => ({
      selectedNodes,
      setSelectedNodes,
    }),
    [selectedNodes, setSelectedNodes]
  );

  // Types of edges in graph
  enum EdgeTypes {
    Align,
    Stack,
  }

  const [uiEvents, setUiEvents] = useState<string[]>([]);
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

          const operation = (data as any).operation;
          const ids = (data as any).ids;
          const childrenInfo: Array<any> = [];

          let alignAxes = getAlignAxes(
            nodes.filter((node) => ids.includes(node.id)),
            operation
          );

          if (alignAxes === false) {
            console.log(
              "[Align] Unable to align as contradictory positions determined"
            );
            return nodes;
          }
          let { alignX, alignY } = alignAxes;
          const nodesToUpdate: any[] = [];
          const removedPositions = nodes.map((node) => {
            if (!ids.includes(node.id)) return node;

            childrenInfo.push({
              id: uniqueId(),
              recordId: node.id,
              name: node.data.name,
            });

            const updatedNode = { ...node };

            // TODO: the 0 should never actually be reached, but think of a better way to do this
            if (
              operation === "left" ||
              operation === "center-horizontal" ||
              operation === "right"
            ) {
              updatedNode.data.bbox.x = undefined;
              updatedNode.data.owned.xOwner = uid;
              switch (operation) {
                case "left":
                  updatedNode.data.owned.x = alignX ?? 0;
                  break;
                case "center-horizontal":
                  updatedNode.data.owned.x =
                    (alignX ?? 0) - updatedNode.data.bbox.width / 2;
                  break;
                case "right":
                  updatedNode.data.owned.x =
                    (alignX ?? 0) - updatedNode.data.bbox.width;
                  break;
              }
              nodesToUpdate.push({
                id: updatedNode.id,
                type: "geo",
                x: updatedNode.data.owned.x,
              });
            } else {
              updatedNode.data.bbox.y = undefined;
              updatedNode.data.owned.yOwner = uid;
              switch (operation) {
                case "top":
                  updatedNode.data.owned.y = alignY ?? 0;
                  break;
                case "center-vertical":
                  updatedNode.data.owned.y =
                    (alignY ?? 0) - updatedNode.data.bbox.height / 2;
                  break;
                case "bottom":
                  updatedNode.data.owned.y =
                    (alignY ?? 0) - updatedNode.data.bbox.height;
                  break;
              }
              nodesToUpdate.push({
                id: updatedNode.id,
                type: "geo",
                y: updatedNode.data.owned.y,
              });
            }

            return updatedNode;
          });

          setEditor((editor) => editor?.updateShapes(nodesToUpdate));

          setTreeNodes((nodes) =>
            nodes.concat({
              id: uniqueId(),
              name: Component.Align,
              type: "alignNode",
              children: childrenInfo,
              recordId: uid,
              data: {
                id: uid,
                childrenIds: (data as any).ids, 
                bbox: undefined,
                data: {
                  x: alignX,
                  y: alignY,
                  alignment: (data as any).operation,
                }
              },
            })
          );
          return removedPositions.concat({
            id: uid,
            type: "alignNode",
            position: { x: 300, y: 150 },
            style: {
              width: 100,
            },
            data: {
              id: uid,
              name: Component.Align,
              alignment: (data as any).operation,
              childrenIds: (data as any).ids,
              x: alignX,
              y: alignY,
            },
          });
        });
      } else if (name === "stack-shapes") {
        let selectedIds = (data as any).ids;
        const operation = (data as any).operation;

        // TODO: How to do alignment:
        // -> First pass to see whether there are any nodes whose positions are already computed in the stack
        // -> If there is more than 1, check that they match specifications and then distribute everything based on that
        //    -> Alignment probably should be different based on how the stack actually aligns
        // -> If there's only 1, use that position as reference
        // -> If no positions set, just center align them

        setNodes((nodes) => {
          let selectedNodes = nodes.filter((node) =>
            selectedIds.includes(node.id)
          ); // selected nodes

          let fixedIds = selectedNodes
            .filter(
              (node) =>
                node.data.owned.x !== undefined ||
                node.data.owned.y !== undefined
            )
            .map((node) => node.id);
          const result = getStackLayout(selectedNodes, operation, uid);
          const {
            stackable,
            sortedNodes,
            spacing,
            alignment,
            updatedPositions,
          } = result;

          if (!stackable) {
            console.log("Can't stack items");
            return nodes;
          }

          setEdges((edges) =>
            edges.concat(
              selectedIds.map((id: string, i: any) => ({
                id: `e${i}-${uid}`,
                target: uid,
                source: id,
                data: {
                  edgeType: EdgeTypes.Stack,
                },
              }))
            )
          );

          const sortedIds = sortedNodes.map(({ node }) => node.id);
          const childrenInfo: any[] = [];

          const removedPositions = nodes.map((node) => {
            if (!selectedIds.includes(node.id as TLShapeId)) {
              return node;
            }

            const stackPosition = sortedIds.findIndex((id) => id === node.id);

            return {
              ...node,
              data: { ...sortedNodes[stackPosition].node.data },
            };
          });

          setEditor((editor) => editor?.updateShapes(updatedPositions));
          const childrenBBoxes = getBBox(
            sortedNodes.map((node) => ({
              x: node.node.data.owned.x,
              y: node.node.data.owned.y,
              width: node.node.data.bbox.width,
              height: node.node.data.bbox.height,
            }))
          );
          setTreeNodes((nodes) =>
            nodes
              .map((node) => {
                if (!selectedIds.includes(node.id as TLShapeId)) return node;
                childrenInfo.push({
                  id: uniqueId(),
                  recordId: node.id,
                  name: node.data.name,
                });
                const stackPosition = sortedIds.findIndex(
                  (id) => id === node.id
                );

                return {
                  ...node,
                  data: { ...sortedNodes[stackPosition].node.data },
                };
              })
              .concat({
                id: uid,
                name: Component.Stack,
                type: "stackNode",
                children: childrenInfo,
                recordId: uid,
                data: {
                  id: uid,
                  data: {
                    direction: (data as any).operation,
                    alignment: alignment,
                    spacing: spacing,
                  },
                  bbox: {
                    ...childrenBBoxes,
                  },
                  childrenIds: sortedIds,
                  fixedIds: fixedIds,
                },
              })
          );
          return removedPositions.concat({
            id: uid,
            type: "stackNode",
            position: {
              x: sortedNodes[0].node.data.owned.x + 5,
              y: sortedNodes[0].node.data.owned.y + 5,
            },
            style: {
              width: 100,
            },
            data: {
              id: uid,
              name: Component.Stack,
              data: {
                direction: (data as any).operation,
                alignment: alignment,
                spacing: spacing,
              },
              bbox: {
                ...childrenBBoxes,
              },
              childrenIds: sortedIds,
            },
          });
        });
      } else if (name === "add-background") {
        // type error exists because custom menu option
        console.log("add background called");

        const selectedIds = (data as any).ids;
        setEditor((editor) => {
          setTreeNodes((treeNodes: any) => {
            let selectedNodes = treeNodes.filter((node: any) =>
              selectedIds.includes(node.id)
            ); // selected nodes
            const childBBoxes = selectedNodes.map((node: any) => ({
              x: node.data.bbox.x ?? node.data.owned.x,
              y: node.data.bbox.y ?? node.data.owned.y,
              width: node.data.bbox.width ?? node.data.owned.width,
              height: node.data.bbox.height ?? node.data.owned.height,
            }));
            const groupBBox = getBBox(childBBoxes);
            console.log(
              "[Background] Calculated BBoxes: ",
              childBBoxes,
              groupBBox
            );
            const backgroundBBox = {
              x: groupBBox.x - 10,
              y: groupBBox.y - 10,
              width: groupBBox.width + 20,
              height: groupBBox.height + 20,
            };
            const id = createShapeId();
            editor?.batch(() => {
              editor.createShapes([
                {
                  id: id,
                  type: "geo",
                  x: backgroundBBox.x,
                  y: backgroundBBox.y,
                  props: {
                    geo: "rectangle",
                    w: backgroundBBox.width,
                    h: backgroundBBox.height,
                  },
                },
              ]);
              editor.reorderShapes("toBack", [id]);
            });
            setNodes((nodes) =>
              nodes.concat({
                id: id,
                type: "geoNode",
                position: { x: backgroundBBox.x, y: backgroundBBox.y },
                data: {
                  id: id,
                  name: "background",
                  bbox: { ...backgroundBBox },
                  owned: {},
                  childrenIds: selectedNodes.map((node: any) => node.id),
                  data: {
                    padding: 10,
                  },
                },
              })
            );
            return treeNodes.concat({
              id: id,
              recordId: id,
              name: "background",
              type: "backgroundNode",
              children: selectedNodes.map((node) => ({
                id: uniqueId(),
                recordId: node.id,
                name: node.data.name,
              })),
              data: {
                id: id,
                name: "background",
                bbox: {
                  ...backgroundBBox,
                },
                owned: {},
                childrenIds: selectedNodes.map((node) => node.id),
                data: {
                  padding: 10,
                },
              },
            });
          });
          return editor;
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
            let data: Node<any> = {
              id: record.id,
              bbox: {
                x: record.x,
                y: record.y,
              },
              owned: {},
              data: {},
            };
            if (editor.isShapeOfType(record, GeoShapeUtil)) {
              // TODO: Extract this into a mapping from shape to corresponding name
              let shapeName: string = record.props.geo[0]
                .toUpperCase()
                .concat(record.props.geo.slice(1));
              let name: Component = Component.Other;
              if (record.props.geo === "rectangle") {
                shapeName = "Rect";
                name = Component.Rect;
              } else if (record.props.geo === "ellipse") {
                name = Component.Ellipse;
              }
              data = {
                ...data,
                name: name,
                bbox: {
                  ...data.bbox,
                  width: record.props.w,
                  height: record.props.h,
                },
                data: {
                  shapeName: shapeName,
                },
              };

              setTreeNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  recordId: record.id,
                  name: shapeName,
                  type: "geoNode",
                  data: data,
                })
              );

              setNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  type: "geoNode",
                  position: { x: record.x, y: record.y },
                  style: {
                    width: 100,
                  },
                  data: data,
                })
              );
            } else if (editor.isShapeOfType(record, GroupShapeUtil)) {
              const childrenIds = editor
                .getSortedChildIds(record.id)
                .filter((id) => typeof id === "string") as string[];

              setNodes((nodes) => {
                const childNodes = nodes.filter((node) =>
                  childrenIds.includes(node.id)
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
                    data: {
                      ...data,
                      label: record.type,
                      childrenIds: childrenIds,
                    },
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
                  if (childrenIds.includes(node.id)) {
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
              setNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  type: "arrowNode",
                  position: { x: record.x, y: record.y },
                  data: {
                    ...data,
                    data: {
                      start: record.props.start,
                      end: record.props.end,
                    },
                  },
                })
              );
            } else if (editor.isShapeOfType(record, TextShapeUtil)) {
              setTreeNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  recordId: record.id,
                  name: Component.Text,
                  type: "textNode",
                  data: {
                    ...data,
                    name: Component.Text,
                    bbox: {
                      ...data.bbox,
                      width: record.props.w,
                      height: 0, // height isn't given for text, find out a way to measure
                    },
                    data: {
                      content: record.props.text,
                    },
                  },
                })
              );
              setNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  type: "textNode",
                  position: { x: record.x, y: record.y },
                  style: {},
                  data: {
                    ...data,
                    name: Component.Text,
                    bbox: {
                      ...data.bbox,
                      width: record.props.w,
                      height: 0, // height isn't given for text, find out a way to measure
                    },
                    data: {
                      content: record.props.text,
                    },
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
                    if (data.bbox.x !== undefined && to.x !== from.x)
                      data.bbox.x = to.x;
                    if (data.bbox.y !== undefined && to.y !== from.y)
                      data.bbox.y = to.y;

                    if (
                      data.bbox.width !== undefined &&
                      to.props.w !== from.props.w
                    )
                      data.bbox.width = to.props.w;

                    if (
                      data.bbox.height !== undefined &&
                      to.props.h !== from.props.h
                    )
                      data.bbox.height = to.props.h;

                    return {
                      ...node,
                      data: data,
                    };
                  }
                  return node;
                });
                return updatedNodes;
              });
            } else if (from.type === "arrow") {
              setNodes((nodes) => {
                const updatedNodes = nodes.map((node) => {
                  if (node.id === from.id) {
                    const data = { ...node.data };
                    if (to.x !== from.x) data.bbox.x = to.x;
                    if (to.y !== from.y) data.bbox.y = to.y;
                    if ("start" in to.props) {
                      if ("boundShapeId" in to.props.start) {
                        const refId = to.props.start.boundShapeId;
                        data.data.start = {
                          ref: refId,
                          ...to.props.start.normalizedAnchor,
                        };
                        // TODO: Instead of just concatting, check if another start node is already in there
                        setEdges((edges) =>
                          edges.concat({
                            id: `e${node.id}-${refId}-start`,
                            target: node.id,
                            source: refId,
                            data: {
                              start: true,
                            },
                          })
                        );
                      } else data.data.start = to.props.start;
                    }
                    if ("end" in to.props) {
                      if ("boundShapeId" in to.props.end) {
                        const refId = to.props.end.boundShapeId;
                        data.data.end = {
                          ref: refId,
                          ...to.props.end.normalizedAnchor,
                        };
                        setEdges((edges) =>
                          edges.concat({
                            id: `e${node.id}-${refId}-end`,
                            target: node.id,
                            source: refId,
                            data: {
                              start: false,
                            },
                          })
                        );
                      } else data.data.end = to.props.end;
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
            } else if (from.type === "text") {
              setTreeNodes((nodes) => {
                return nodes.map((node) => {
                  if (node.recordId !== from.id) return node;

                  const data = { ...node.data };
                  if (to.x !== from.x) data.bbox.x = to.x;
                  if (to.y !== from.y) data.bbox.y = to.y;
                  if (to.props.w !== from.props.w) data.bbox.width = to.props.w;
                  if (to.props.text !== from.props.text)
                    data.data.content = to.props.text;
                  return {
                    ...node,
                    data: data,
                  };
                });
              });
              setNodes((nodes) => {
                const updatedNodes = nodes.map((node) => {
                  if (node.id === from.id) {
                    const data = { ...node.data };
                    if (to.x !== from.x) data.bbox.x = to.x;
                    if (to.y !== from.y) data.bbox.y = to.y;
                    if (to.props.w !== from.props.w)
                      data.bbox.width = to.props.w;
                    if (to.props.text !== from.props.text)
                      data.data.content = to.props.text;
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
          } else if (
            from.typeName === "instance_page_state" &&
            to.typeName === "instance_page_state"
          ) {
            // keep track of selected id's
            if (!_.isEqual(from.selectedIds, to.selectedIds)) {
              // TODO: Come up with a better solution to this. This works okay for now but is not great
              const toIds = to.selectedIds.map((id) => id as string);

              setTreeNodes((treeNodes: any) => {
                const newSelection = toIds.map(
                  (id) =>
                    treeNodes.filter((node: any) => node.recordId === id)[0]
                );
                setSelectedTreeNodes(newSelection);
                return treeNodes;
              });

              setNodes((nodes) =>
                nodes.map((node) => {
                  if (
                    toIds.length === 0 ||
                    (node.type !== "alignNode" &&
                      node.type !== "stackNode" &&
                      !toIds.includes(node.id))
                  ) {
                    return { ...node, selected: false };
                  }
                  if (toIds.includes(node.id)) {
                    return { ...node, selected: true };
                  }
                  if (memoizedSelectedNodes.selectedNodes.includes(node.id)) {
                    return { ...node, selected: true };
                  }
                  return { ...node, selected: false };
                })
              );
            }
          }
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
            setTreeNodes((nodes) =>
              nodes
                .map((node) => ({
                  ...node,
                  children: (node.children ?? []).filter(
                    (child: any) => child.recordId !== record.id
                  ),
                }))
                .filter((node: any) => node.recordId !== record.id)
            );
            setNodes((nodes) => nodes.filter((node) => node.id !== record.id));
            setEdges((edges) =>
              edges.filter(
                (edge) => edge.target !== record.id && edge.source !== record.id
              )
            );
          }
        }
      }
    };

    editor.on("change", handleChangeEvent);

    return () => {
      editor.off("change", handleChangeEvent);
    };
  }, [editor, memoizedSelectedNodes.selectedNodes, setEdges, setNodes]);

  return (
    <EditorContext.Provider value={editorContextValue}>
      <NodesContext.Provider value={nodesContextValue}>
        <TreeNodesContext.Provider value={treeNodesContextValue}>
          <EdgesContext.Provider value={{ edges, setEdges }}>
            <SelectionContext.Provider value={selectedTreeContextValue}>
              <div style={{ display: "flex" }}>
                <TreeView data={treeNodes} />
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
                      width: "25vw",
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
                    <div style={{ width: "100vw", height: "100vh" }}>
                      <Panel />
                      {/* <ReactFlowProvider>
                      <ReactFlow
                        nodeTypes={nodeTypes}
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onSelectionChange={onSelectionChange}
                      />
                    </ReactFlowProvider> */}
                    </div>
                  </div>
                </div>
              </div>
            </SelectionContext.Provider>
          </EdgesContext.Provider>
        </TreeNodesContext.Provider>
      </NodesContext.Provider>
    </EditorContext.Provider>
  );
}
