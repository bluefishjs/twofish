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
import { } from "@tldraw/tldraw";
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
import { getAlignLayout, getStackLayout, getBackgroundLayout } from "./layoutUtils";
import { node } from "webpack";

export const EditorContext = createContext<any>(undefined);
export const NodesContext = createContext<any>(undefined);
export const TreeNodesContext = createContext<any>(undefined);
export const EdgesContext = createContext<any>(undefined);
export const SelectionContext = createContext<any>(undefined);

export default function Editor() {
  const [editor, setEditor] = useState<EditorType>();
  const [selectedNodes, setSelectedNodes] = useState(Array<string>());
  const [selectedTreeNodes, setSelectedTreeNodes] = useState(Array<any>());
  const [selectedTreeRelations, setSelectedTreeRelations] = useState(
    Array<{ recordId: any; childrenIds: any[] }>()
  );
  const [selectedShapeIds, setSelectedShapeIds] = useState(Array<string>());
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [treeNodes, setTreeNodes] = useState(Array<any>());

  const flowNodes = useMemo(
    () =>
      treeNodes.map((treeNode) => ({
        id: treeNode.recordId,
        type: treeNode.nodeType,
        position: treeNode.position,
        data: treeNode.data,
      })),
    [treeNodes]
  );

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

  // Clear all shapes from Twofish
  const clearAll = (evt: any) => {
    setTreeNodes([])
    setSelectedTreeNodes([])
    setSelectedTreeRelations([])
    setEditor((editor) => editor?.deleteShapes(Array.from(editor?.currentPageShapeIds)))
  }

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
      selectedTreeRelations,
      setSelectedTreeRelations,
    }),
    [
      selectedTreeNodes,
      setSelectedTreeNodes,
      selectedTreeRelations,
      setSelectedTreeRelations,
    ]
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
      console.log("[UI EVENT]", name, data);
      setUiEvents((events) => [`${name} ${JSON.stringify(data)}`, ...events]);

      const uid = uniqueId();

      if (name === "align-shapes") {
        setTreeNodes((nodes) => {
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
          const selectedNodeData = nodes
            .filter((node) => ids.includes(node.recordId))
            .map((node) => node.data);
          const {
            alignable,
            alignX,
            alignY,
            updatedPositions,
            updatedNodeData,
          } = getAlignLayout(selectedNodeData, operation, uid);

          if (alignable === false) {
            console.log(
              "[Align] Unable to align as contradictory positions determined"
            );
            alert(
              "[Align] Unable to align as contradictory positions determined"
            );
            return nodes;
          }

          const removedPositions = nodes.map((node) => {
            if (!ids.includes(node.recordId)) return node;

            childrenInfo.push({
              id: uniqueId(),
              recordId: node.recordId,
              name: node.data.name,
              type: node.data.type,
              instanceSelected: false,
            });

            return {
              ...node,
              data: _.find(updatedNodeData, (data) => data.id === node.id),
            };
          });

          setEditor((editor) => editor?.updateShapes(updatedPositions).complete());

          return removedPositions.concat({
            id: uid,
            name: Component.Align,
            type: Component.Align,
            nodeType: "alignNode",

            position: { x: 300, y: 150 },
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
              },
            },
          });
        });
      } else if (name === "stack-shapes") {
        let selectedIds = (data as any).ids;
        const operation = (data as any).operation;

        setTreeNodes((nodes) => {
          let selectedNodes = nodes
            .filter((node) => selectedIds.includes(node.recordId))
            .map((node) => node.data); // selected nodes

          let fixedIds = selectedNodes
            .filter(
              (data) => data.owned.x !== undefined || data.owned.y !== undefined
            )
            .map((data) => data.id);
          const result = getStackLayout(selectedNodes, operation, uid);
          const {
            stackable,
            sortedNodes,
            spacing,
            stackAlignment,
            updatedPositions,
          } = result;

          if (!stackable) {
            console.log("[Stack] Can't stack items");
            alert("[Stack] Can't stack items");
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

          const sortedIds = sortedNodes.map(({ data }) => data.id);
          const childrenInfo: any[] = [];

          const removedPositions = nodes.map((node) => {
            if (!selectedIds.includes(node.recordId as TLShapeId)) {
              return node;
            }

            childrenInfo.push({
              id: uniqueId(),
              recordId: node.id,
              name: node.data.name,
              type: node.data.type,
              instanceSelected: false
            });

            const stackPosition = sortedIds.findIndex(
              (id) => id === node.recordId
            );

            return {
              ...node,
              data: { ...sortedNodes[stackPosition].data },
            };
          });

          setEditor((editor) => editor?.updateShapes(updatedPositions));
          const childrenBBoxes = getBBox(
            sortedNodes.map(({ data }) => ({
              x: data.owned.x,
              y: data.owned.y,
              width: data.bbox.width,
              height: data.bbox.height,
            }))
          );

          return removedPositions.concat({
            id: uid,
            name: Component.Stack,
            type: Component.Stack,
            nodeType: "stackNode",
            position: {
              x: sortedNodes[0].data.owned.x + 5,
              y: sortedNodes[0].data.owned.y + 5,
            },
            children: childrenInfo,
            recordId: uid,
            data: {
              id: uid,
              data: {
                direction: (data as any).operation,
                alignment: stackAlignment,
                spacing: spacing,
              },
              bbox: {
                ...childrenBBoxes,
              },
              childrenIds: sortedIds,
              fixedIds: fixedIds,
            },
          });
        });
      } else if (name === "add-background") {
        // type error exists because custom menu option
        const selectedIds = (data as any).ids;
        setEditor((editor) => {
          setTreeNodes((treeNodes: any) => {
            let selectedNodeData = treeNodes.filter((node: any) =>
              selectedIds.includes(node.id)
            ).map((node) => node.data); // selected nodes

            const id = createShapeId();
            const { backgroundBBox, backgroundPosition } = getBackgroundLayout(selectedNodeData, 10, id);
            editor?.batch(() => {
              editor.createShapes([
                {
                  id: id,
                  type: "geo",
                  x: backgroundPosition.x,
                  y: backgroundPosition.y,
                  props: {
                    geo: "rectangle",
                    w: backgroundPosition.props.w,
                    h: backgroundPosition.props.h,
                  },
                },
              ]);
              editor.reorderShapes("toBack", [id]);
            });

            return treeNodes.concat({
              id: id,
              recordId: id,
              name: Component.Background,
              type: Component.Background,
              nodeType: "backgroundNode",
              position: { x: backgroundPosition.x, y: backgroundPosition.y },
              children: selectedNodeData.map((data) => ({
                id: uniqueId(),
                recordId: data.id,
                name: data.name,
              })),
              data: {
                id: id,
                name: "background",
                bbox: backgroundBBox,
                owned: {},
                childrenIds: selectedNodeData.map((data) => data.id),
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
    [setEdges, EdgeTypes.Align, EdgeTypes.Stack]
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

              setTreeNodes((nodes) => {
                if (
                  name === Component.Rect &&
                  _.find(nodes, (node) => node.recordId === record.id)
                ) {
                  // indicates that this was a background node, so we don't need to add it
                  return nodes;
                }
                return nodes.concat({
                  id: record.id,
                  recordId: record.id,
                  name: shapeName,
                  type: shapeName,
                  nodeType: "geoNode",
                  position: { x: record.x, y: record.y },
                  data: data,
                });
              });
            } else if (editor.isShapeOfType(record, GroupShapeUtil)) {
              const childrenIds = editor
                .getSortedChildIds(record.id)
                .filter((id) => typeof id === "string") as string[];

              setTreeNodes((treeNodes) => {
                let selectedNodes = treeNodes.filter((node: any) =>
                  childrenIds.includes(node.recordId)
                ); // selected nodes
                const childBBoxes = selectedNodes.map((node: any) => ({
                  x: node.data.bbox.x ?? node.data.owned.x,
                  y: node.data.bbox.y ?? node.data.owned.y,
                  width: node.data.bbox.width ?? node.data.owned.width,
                  height: node.data.bbox.height ?? node.data.owned.height,
                }));
                const groupBBox = getBBox(childBBoxes);

                // TODO: in reactFlow, we use parentNode to set group as each element's parent; do that here?
                return treeNodes.concat({
                  id: record.id,
                  recordId: record.id,
                  name: Component.Group,
                  type: Component.Group,
                  nodeType: "groupNode",
                  position: { x: groupBBox, y: groupBBox },
                  children: selectedNodes.map((node) => ({
                    id: uniqueId(),
                    recordId: node.recordId,
                    name: node.name,
                    type: node.type,
                  })),
                  data: {
                    childrenIds: childrenIds,
                    bbox: groupBBox,
                  },
                });
              });
            } else if (editor.isShapeOfType(record, ArrowShapeUtil)) {
              setTreeNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  name: Component.Arrow,
                  type: Component.Arrow,
                  nodeType: "arrowNode",
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
                  type: Component.Text,
                  nodeType: "textNode",
                  position: { x: record.x, y: record.y },
                  data: {
                    ...data,
                    name: Component.Text,
                    bbox: {
                      ...data.bbox,
                      width: record.props.w,
                      height: 16, // height isn't given for text, find out a way to measure
                    },
                    data: {
                      content: record.props.text,
                    },
                  },
                })
              );
            } else {
              console.log(record);
              setTreeNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  name: record.type,
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
              setTreeNodes((nodes) => {
                const updatedNodes = nodes.map((node) => {
                  if (node.recordId === from.id) {
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
              setTreeNodes((nodes) => {
                return nodes.map((node) => {
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
              });
            } else if (from.type === "text") {
              setTreeNodes((nodes) => {
                return nodes.map((node) => {
                  if (node.recordId !== from.id) return node;

                  const data = { ...node.data };
                  if (to.x !== from.x) data.bbox.x = to.x;
                  if (to.y !== from.y) data.bbox.y = to.y;
                  if (to.props.w !== from.props.w) data.bbox.width = to.props.w;
                  if (to.props.text !== from.props.text) {
                    data.data.content = to.props.text;
                    // TODO: make this better -- this is just a bandaid way to get the height of text
                    data.bbox.height =
                      20 * (1 + (to.props.text.match(/\n/g) ?? []).length);
                  }

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
                    if (to.props.text !== from.props.text) {
                      data.data.content = to.props.text;
                      // TODO: make this better -- this is just a bandaid way to get the height of text
                      data.bbox.height =
                        20 * (1 + (to.props.text.match(/\n/g) ?? []).length);
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
          } else if (
            from.typeName === "instance_page_state" &&
            to.typeName === "instance_page_state"
          ) {

            // keep track of selected id's
            if (!_.isEqual(from.selectedIds, to.selectedIds)) {
              // TODO: Come up with a better solution to this. This works okay for now but is not great

              const fromSelection = new Set(from.selectedIds);
              const toSelection = new Set(to.selectedIds);

              const deselected = from.selectedIds.filter(
                (a) => !toSelection.has(a)
              );
              const newlySelected = to.selectedIds.filter(
                (a) => !fromSelection.has(a)
              );


              setSelectedTreeNodes((selectedTreeNodes) => {
                const selectedTreeNodesSet = new Set(selectedTreeNodes);
                const nodesToRemove: any[] = [];
                const nodesToAdd: any[] = [];
                const selectedRelationsToRemove = new Set();
                for (const id of deselected) {
                  if (selectedTreeNodesSet.has(id)) {
                    nodesToRemove.push(id);
                  }
                  for (const relation of selectedTreeRelations) {
                    if (relation.childrenIds.includes(id)) {
                      nodesToRemove.push(relation.recordId);
                      selectedRelationsToRemove.add(relation.recordId);
                    }
                  }
                }
                for (const id of newlySelected) {
                  let shouldAdd = true;
                  if (selectedTreeNodesSet.has(id)) {
                    continue;
                  }
                  for (const relation of selectedTreeRelations) {
                    if (relation.childrenIds.includes(id)) {
                      shouldAdd = false;
                      break;
                    }
                  }
                  if (shouldAdd) {
                    nodesToAdd.push(id);
                  }
                }
                setSelectedTreeRelations(selectedTreeRelations.filter((relation) => !selectedRelationsToRemove.has(relation.recordId)));
                return [
                  ...selectedTreeNodes.filter(
                    (id) => !nodesToRemove.includes(id)
                  ),
                  ...nodesToAdd,
                ];
              });

              // const toIds = to.selectedIds.map((id) => id as string);
              // if (selectedTreeRelations.length === 0)
              //   setSelectedTreeNodes(toIds);
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
  }, [editor, selectedTreeRelations, selectedTreeRelations.length, setEdges, setNodes]);

  return (
    <EditorContext.Provider value={editorContextValue}>
      <NodesContext.Provider value={nodesContextValue}>
        <TreeNodesContext.Provider value={treeNodesContextValue}>
          <EdgesContext.Provider value={{ edges, setEdges }}>
            <SelectionContext.Provider value={selectedTreeContextValue}>
              <div style={{ display: "flex" }} >
                <div className="treeview-container">
                  <button className="clear-button" onClick={clearAll}>Clear All Objects</button>
                  <TreeView data={treeNodes} />
                </div>
                <div className="tldraw-container">
                  <Tldraw
                    autoFocus
                    onUiEvent={handleUiEvent}
                    onMount={setAppToState}
                    overrides={overrides}
                  />
                </div>
                <div className="panel-container"
                >
                  <Panel />
                  {/* <ReactFlowProvider>
                        <ReactFlow
                          nodeTypes={nodeTypes}
                          nodes={flowNodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          onSelectionChange={onSelectionChange}
                        />
                      </ReactFlowProvider> */}
                </div>
              </div>
            </SelectionContext.Provider>
          </EdgesContext.Provider>
        </TreeNodesContext.Provider>
      </NodesContext.Provider>
    </EditorContext.Provider>
  );
}
