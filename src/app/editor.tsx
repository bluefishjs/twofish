"use client";
import _ from "lodash";
import {
  ArrowShapeUtil,
  Editor as EditorType,
  GeoShapeUtil,
  GroupShapeUtil,
  LineShapeUtil,
  TLEventMapHandler,
  TLShapeId,
  TLUiEventHandler,
  TextShapeUtil,
  Tldraw,
  createShapeId,
  uniqueId,
  useEditor,
} from "@tldraw/tldraw";
import {} from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Component,
  Node,
  TreeNode,
  ComponentList,
} from "./configurationPanel/node";
import { overrides } from "./overrides";
import { getBBox, roundToNearestHundredth } from "./utils";
import { TreeView } from "./treeView/tree";
import { Panel } from "./configurationPanel/panel";
import {
  getAlignLayout,
  getStackLayout,
  getBackgroundLayout,
  relayout,
  getDistributeLayout,
} from "./layoutUtils";

export const EditorContext = createContext<any>(undefined);
export const TreeNodesContext = createContext<any>(undefined);
export const SelectionContext = createContext<any>(undefined);

function SaveButton() {
  const editor = useEditor();
  return (
    <button
      onClick={() => {
        const snapshot = editor.store.getSnapshot();
        const stringified = JSON.stringify(snapshot);
        localStorage.setItem("my-editor-snapshot", stringified);
      }}
    >
      Save Editor State
    </button>
  );
}

function LoadButton() {
  const editor = useEditor();
  return (
    <button
      onClick={() => {
        const stringified = localStorage.getItem("my-editor-snapshot");
        if (stringified === null) {
          alert("No saved editor state found!");
          return;
        }
        const snapshot = JSON.parse(stringified);
        editor.store.loadSnapshot(snapshot);
      }}
    >
      Load Saved Editor State
    </button>
  );
}

export default function Editor() {
  const [editor, setEditor] = useState<EditorType>();
  const [selectedTreeNodes, setSelectedTreeNodes] = useState(Array<any>());
  const [selectedTreeRelations, setSelectedTreeRelations] = useState(
    Array<{ recordId: any; childrenIds: any[] }>()
  );
  const editorRef = useRef(undefined);

  const [treeNodes, setTreeNodes] = useState(Array<TreeNode<any>>());

  const [counters, setCounters] = useState<any>(
    ComponentList.reduce((prev, component) => ({ ...prev, [component]: 1 }), {})
  );

  // get name for node and increment counter
  const getNodeNameAndIncrement = (nodeType: Component) => {
    const name = `${nodeType}${counters[nodeType]}`;
    setCounters((counters: any) => ({
      ...counters,
      [nodeType]: counters[nodeType] + 1,
    }));
    return name;
  };

  const resetCounters = () => {
    const initialCounters = ComponentList.reduce(
      (prev, component) => ({ ...prev, [component]: 1 }),
      {}
    );
    setCounters(initialCounters);
  };

  // Clear all shapes from Twofish
  const clearAll = (evt: any) => {
    setTreeNodes([]);
    setSelectedTreeNodes([]);
    setSelectedTreeRelations([]);
    resetCounters();

    setEditor((editor) =>
      editor?.deleteShapes(Array.from(editor?.currentPageShapeIds))
    );
  };

  const saveState = () => {
    setEditor((editor) => {
      if (!editor) {
        return editor;
      }
      const snapshot = editor.store.getSnapshot();
      const stringified = JSON.stringify(snapshot);
      localStorage.setItem("my-editor-snapshot", stringified);
      return editor;
    });
  };

  const loadState = () => {
    const stringified = localStorage.getItem("my-editor-snapshot");
    if (stringified === null) {
      alert("No saved editor state found!");
      return;
    }
    const snapshot = JSON.parse(stringified);
    setEditor((editor) => {
      editor?.store.loadSnapshot(snapshot);
      return editor;
    });
  };

  const editorContextValue = useMemo(
    () => ({
      editor,
      setEditor,
    }),
    [editor, setEditor]
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

  const handleKeyDown = (event) => {
    if (event.key === ".") {
      // TODO: Implement selection change
      console.log("selection drill down");
    }
  };

  const [uiEvents, setUiEvents] = useState<string[]>([]);
  const handleUiEvent = useCallback<TLUiEventHandler>(
    (name, data) => {
      console.log("[UI EVENT]", name, data);
      setUiEvents((events) => [`${name} ${JSON.stringify(data)}`, ...events]);

      const uid = uniqueId();

      if (name === "align-shapes") {
        setTreeNodes((nodes) => {
          const operation = (data as any).operation;
          const ids = (data as any).ids;
          const childrenInfo: Array<any> = [];
          const selectedNodeData = nodes
            .filter((node) => ids.includes(node.recordId))
            .map((node) => node.data);

          const {
            canPerformOperation,
            alignX,
            alignY,
            updatedPositions,
            updatedNodeData,
          } = getAlignLayout(selectedNodeData, operation, uid);

          if (canPerformOperation === false) {
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
              name: node.name,
              type: node.type,
              instanceSelected: false,
            });

            return {
              ...node,
              data: _.find(updatedNodeData, (data) => data.id === node.id),
            };
          });

          setEditor((editor) =>
            editor?.updateShapes(updatedPositions).complete()
          );

          return removedPositions.concat({
            id: uid,
            name: getNodeNameAndIncrement(Component.Align),
            type: Component.Align,
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
            canPerformOperation,
            sortedNodes,
            spacing,
            stackAlignment,
            updatedPositions,
          } = result;

          if (!canPerformOperation) {
            console.log("[Stack] Can't stack items");
            alert("[Stack] Can't stack items");
            return nodes;
          }

          const sortedIds = sortedNodes.map(({ data }) => data.id);
          const childrenInfo: any[] = [];

          const removedPositions = nodes.map((node) => {
            if (!selectedIds.includes(node.recordId as TLShapeId)) {
              return node;
            }

            childrenInfo.push({
              id: uniqueId(),
              recordId: node.id,
              name: node.name,
              type: node.type,
              instanceSelected: false,
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
            name: getNodeNameAndIncrement(Component.Stack),
            type: Component.Stack,
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
      } else if (name === "distribute-shapes") {
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
          const result = getDistributeLayout(selectedNodes, operation, uid);
          const {
            canPerformOperation,
            sortedNodes,
            spacing,
            updatedPositions,
          } = result;

          if (!canPerformOperation) {
            console.log("[Distribute] Can't distribute items");
            alert("[Distribute] Can't distribute items");
            return nodes;
          }

          const sortedIds = sortedNodes.map(({ data }) => data.id);
          const childrenInfo: any[] = [];

          const removedPositions = nodes.map((node) => {
            if (!selectedIds.includes(node.recordId as TLShapeId)) {
              return node;
            }

            childrenInfo.push({
              id: uniqueId(),
              recordId: node.id,
              name: node.name,
              type: node.type,
              instanceSelected: false,
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
            name: getNodeNameAndIncrement(Component.Distribute),
            type: Component.Distribute,
            children: childrenInfo,
            recordId: uid,
            data: {
              id: uid,
              data: {
                direction: (data as any).operation,
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
            let selectedNodes = treeNodes.filter((node: any) =>
              selectedIds.includes(node.id)
            );
            let selectedNodeData = selectedNodes.map((node) => node.data); // selected nodes

            const id = createShapeId();
            const { backgroundBBox, backgroundPosition } = getBackgroundLayout(
              selectedNodeData,
              10,
              id
            );
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
              name: getNodeNameAndIncrement(Component.Background),
              type: Component.Background,
              children: selectedNodes.map((node) => ({
                id: uniqueId(),
                recordId: node.recordId,
                name: node.name,
                type: node.type,
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
    [counters]
  );

  const setAppToState = useCallback((editor: EditorType) => {
    setEditor(editor);
  }, []);

  const [storeEvents, setStoreEvents] = useState<string[]>([]);
  const [dragging, setDragging] = useState<boolean>(false);

  useEffect(() => {
    if (!editor) return;

    let dragging = false;

    function logChangeEvent(eventName: string) {
      setStoreEvents((events) => [eventName, ...events]);
    }

    let editingNodes: any[] = [];
    let editingRelations: any[] = [];

    const handleMouseDown = () => {
      // Only deal with breaking relations for singular nodes for now
      if (selectedTreeNodes.length > 1 || selectedTreeNodes.length === 0) {
        return;
      }
      // show highlight area
      editingRelations = treeNodes
        .filter(
          (node) =>
            node.data.childrenIds &&
            node.data.childrenIds.includes(selectedTreeNodes[0])
        )
        .map((node) => node.recordId);

      // if(editorRef.current) {
      //   editorRef.current.dispatchEvent(
      //     new KeyboardEvent("keypress", { key: "Shift" })
      //   );
      // }
      // just do 1 snap point
      editor.setSnapMode(true);
      // setDragging(true);
      dragging = true;
      document.addEventListener("mousemove", handleMouseMove);
    };

    const handleMouseMove = (evt: any) => {
      // model shift / command in doing dragging handling -- so that it snaps to guidepoints

      // something breaks here if we change the width/height of stuff when we don't want that to happen

      if (editingNodes.length === 1 && editingRelations.length > 0) {
        console.log("moving mouse");
        // let selectedNodeId = selectedTreeNodes[0];
        // let currentNodeIndex = _.findIndex(
        //   treeNodes,
        //   (node) => node.recordId === selectedNodeId
        // );
        // let currentNode = treeNodes[currentNodeIndex];
        // let updatedBBox = editingNodes[0];
        // let revertXPosition = false;
        // let revertYPosition = false;
        // if (
        //   updatedBBox.width !== currentNode.data.bbox.width ||
        //   updatedBBox.height !== currentNode.data.bbox.height
        // ) {
        //   return;
        // }
        // if (
        //   currentNode.data.owned.x &&
        //   Math.abs(updatedBBox.x - currentNode.data.owned.x) < 30
        // ) {
        //   // threshold value of 50 for now
        //   revertXPosition = true;
        // }
        // if (
        //   currentNode.data.owned.y &&
        //   Math.abs(updatedBBox.y - currentNode.data.owned.y) < 30
        // ) {
        //   // threshold value of 100 for now
        //   revertYPosition = true;
        // }
        // if (revertXPosition || revertYPosition) {
        //   setEditor(
        //     editor
        //       .updateShapes([
        //         {
        //           id: selectedNodeId,
        //           type: "geo",
        //           x: currentNode.data.bbox.x ?? currentNode.data.owned.x,
        //           y: currentNode.data.bbox.y ?? currentNode.data.owned.y,
        //         },
        //       ])
        //       .complete()
        //   );
        // }
      }
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);

      editor.setSnapMode(false);
      // TODOS TO FINISH BREAKING RELATION IMPLEMENTATION:
      //    - ONLY REMOVE OBJECTS FROM THE ACTUAL RELATIONS THAT SHOULD BE BROKEN (I.E. IF X IS BROKEN AND Y OWNER IS THE SAME, SHOULD LEAVE THAT RELATION OVERALL)
      //    - REMOVE RELATIONS THAT ARE NO LONGER RELEVANT (I.E. AN ALIGN/STACK THAT ONLY HAS 1 OBJECT)
      if (selectedTreeNodes.length > 1 || selectedTreeNodes.length === 0) {
        return;
      }
      if (
        editingRelations.length === 0 ||
        editingNodes.length === 0 ||
        editingNodes[0] === undefined
      ) {
        return;
      }

      const selectedNodeId = selectedTreeNodes[0];
      const updatedBBox = editingNodes[0];
      const currentNodeIndex = _.findIndex(
        treeNodes,
        (node) => node.recordId === selectedNodeId
      );
      const currentNode = treeNodes[currentNodeIndex];
      let revertXPosition = false;
      let revertYPosition = false;

      if (
        currentNode.data.owned.x &&
        Math.abs(updatedBBox.x - currentNode.data.owned.x) < 50
      ) {
        // threshold value of 50 for now
        revertXPosition = true;
      }
      if (
        currentNode.data.owned.y &&
        Math.abs(updatedBBox.y - currentNode.data.owned.y) < 50
      ) {
        // threshold value of 100 for now
        revertYPosition = true;
      }

      if (revertXPosition || revertYPosition) {
        const { updatedNodes, positionsToUpdate } = relayout(
          treeNodes.map((treeNode: any) => {
            if (treeNode.recordId !== selectedNodeId.id) return treeNode;
            return {
              ...currentNode,
              data: {
                ...currentNode.data,
                bbox: {
                  ...currentNode.data.bbox,
                  x: revertXPosition ? undefined : updatedBBox.x,
                  y: revertYPosition ? undefined : updatedBBox.y,
                },
              },
            };
          }),
          currentNodeIndex
        );
        setTreeNodes(updatedNodes);
        setEditor(
          editor
            .updateShapes([
              {
                id: selectedNodeId,
                type: "geo",
                x: currentNode.data.bbox.x ?? currentNode.data.owned.x,
                y: currentNode.data.bbox.y ?? currentNode.data.owned.y,
              },
            ])
            .updateShapes(positionsToUpdate)
            .complete()
        );
      } else {
        // break relations
        const relationsToRemove: string[] = [];
        const { updatedNodes, positionsToUpdate } = relayout(
          treeNodes.map((node) => {
            if (node.recordId === selectedNodeId) {
              return {
                ...currentNode,
                data: {
                  ...currentNode.data,
                  bbox: {
                    ...updatedBBox,
                  },
                  owned: {
                    x: undefined,
                    y: undefined,
                    xOwner: undefined,
                    yOwner: undefined,
                  },
                },
              };
            }
            if (editingRelations.includes(node.recordId)) {
              if (node.data.childrenIds && node.data.childrenIds.length <= 1) {
                relationsToRemove.push(node.recordId); // remove if nothing in the relation anymore
              }
              return {
                ...node,
                children: node.children.filter(
                  (child) => child.recordId !== selectedNodeId
                ),
                data: {
                  ...node.data,
                  childrenIds: (node.data.childrenIds ?? []).filter(
                    (childId) => childId !== selectedNodeId
                  ),
                },
              }; // handle breaking relations here
            }
            return node;
          }),
          currentNodeIndex
        );
        setTreeNodes(
          updatedNodes.filter(
            (node) => !relationsToRemove.includes(node.recordId)
          )
        );
        // setTreeNodes(updatedNodes);
        setEditor(editor.updateShapes(positionsToUpdate).complete());
      }

      // setEditingNodes([]);
      editingNodes = [];
      editingRelations = [];
      setDragging(false);
    };

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
              let type: Component = Component.Other;
              if (record.props.geo === "rectangle") {
                type = Component.Rect;
              } else if (record.props.geo === "ellipse") {
                type = Component.Ellipse;
              }

              data = {
                ...data,
                bbox: {
                  ...data.bbox,
                  width: record.props.w,
                  height: record.props.h,
                },
                data: {
                  shapeName: type,
                },
              };

              setTreeNodes((nodes) => {
                if (
                  type === Component.Rect &&
                  _.find(nodes, (node) => node.recordId === record.id)
                ) {
                  // indicates that this was a background node, so we don't need to add it
                  return nodes;
                }
                return nodes.concat({
                  id: record.id,
                  recordId: record.id,
                  name: getNodeNameAndIncrement(type),
                  type: type,
                  children: [],
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

                return treeNodes.concat({
                  id: record.id,
                  recordId: record.id,
                  name: Component.Group,
                  type: Component.Group,
                  children: selectedNodes.map((node) => ({
                    id: uniqueId(),
                    recordId: node.recordId,
                    name: node.name,
                    type: node.type,
                  })),
                  data: {
                    id: record.id,
                    childrenIds: childrenIds,
                    bbox: groupBBox,
                    owned: {},
                    data: {},
                  },
                });
              });
            } else if (editor.isShapeOfType(record, ArrowShapeUtil)) {
              setTreeNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  recordId: record.id,
                  name: getNodeNameAndIncrement(Component.Arrow),
                  type: Component.Arrow,
                  children: [],
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
                  children: [],
                  data: {
                    ...data,
                    bbox: {
                      ...data.bbox,
                      width: record.props.w,
                      height: editor.getBoundsById(record.id)?.h ?? 34,
                    },
                    data: {
                      content: record.props.text,
                      customName: false,
                    },
                  },
                })
              );
            } else if (editor.isShapeOfType(record, LineShapeUtil)) {
              setTreeNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  recordId: record.id,
                  name: Component.Line,
                  type: Component.Line,
                  children: [],
                  data: {
                    ...data,
                    bbox: {
                      ...data.bbox,
                      width: 0,
                      height: 0,
                    },
                    data: {},
                  },
                })
              );
            } else {
              console.log(record);
              setTreeNodes((nodes) =>
                nodes.concat({
                  id: record.id,
                  recordId: record.id,
                  children: [],
                  name: Component.Other,
                  type: Component.Other,
                  data: data,
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
                    if (selectedTreeNodes.length === 1) {
                      editingNodes = [
                        {
                          x: to.x,
                          y: to.y,
                          width: to.props.w,
                          height: to.props.h,
                        },
                      ];
                    }
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
                      } else data.data.start = to.props.start;
                    }
                    if ("end" in to.props) {
                      if ("boundShapeId" in to.props.end) {
                        const refId = to.props.end.boundShapeId;
                        data.data.end = {
                          ref: refId,
                          ...to.props.end.normalizedAnchor,
                        };
                      } else data.data.end = to.props.end;
                    }

                    const children = [];
                    if ("boundShapeId" in to.props.start) {
                      children.push(
                        _.find(
                          nodes,
                          (node) => node.recordId === data.data.start.ref
                        )
                      );
                    }
                    if ("boundShapeId" in to.props.end) {
                      children.push(
                        _.find(
                          nodes,
                          (node) => node.recordId === data.data.end.ref
                        )
                      );
                    }

                    data.childrenIds = children.map((child) => child.id);
                    return {
                      ...node,
                      children: children,
                      data: data,
                    };
                  }
                  return node;
                });
              });
            } else if (from.type === "line") {
              setTreeNodes((nodes) => {
                return nodes.map((node) => {
                  if (node.id === from.id) {
                    const data = { ...node.data };
                    if (data.bbox.x !== undefined)
                      data.bbox.x = roundToNearestHundredth(
                        to.x +
                          Math.min(
                            to.props.handles.start.x,
                            to.props.handles.end.x
                          )
                      );
                    if (data.bbox.y !== undefined)
                      data.bbox.y = roundToNearestHundredth(
                        to.y +
                          Math.min(
                            to.props.handles.start.y,
                            to.props.handles.end.y
                          )
                      );

                    data.bbox.width = roundToNearestHundredth(
                      Math.abs(
                        to.props.handles.end.x - to.props.handles.start.x
                      )
                    );
                    data.bbox.height = roundToNearestHundredth(
                      Math.abs(
                        to.props.handles.end.y - to.props.handles.start.y
                      )
                    );

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

                  const bounds = editor.getBoundsById(from.id);
                  if (!bounds) return;

                  const data = { ...node.data };
                  if (data.bbox.x) data.bbox.x = to.x;
                  if (data.bbox.y) data.bbox.y = to.y;
                  if (data.bbox.width) data.bbox.width = to.props.w;
                  if (data.bbox.height) data.bbox.height = bounds?.h;
                  const newContent = to.props.text;
                  if (newContent !== from.props.text) {
                    data.data.content = newContent;
                  }

                  return {
                    ...node,
                    name: data.data.customName
                      ? node.name
                      : newContent.length > 10
                      ? newContent.slice(0, 10) + "..."
                      : newContent.slice(0, 10),
                    data: data,
                  };
                });
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
                setSelectedTreeRelations(
                  selectedTreeRelations.filter(
                    (relation) =>
                      !selectedRelationsToRemove.has(relation.recordId)
                  )
                );
                return [
                  ...selectedTreeNodes.filter(
                    (id) => !nodesToRemove.includes(id)
                  ),
                  ...nodesToAdd,
                ];
              });
            }
          }
        }

        // Removed
        for (const record of Object.values(change.changes.removed)) {
          // call relayout
          if (record.typeName === "shape") {
            logChangeEvent(`deleted shape (${record.type})`);
            if (record.type === "group") {
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
          }
        }
      }
    };

    editor.on("change", handleChangeEvent);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);

    return () => {
      editor.off("change", handleChangeEvent);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [editor, selectedTreeRelations, selectedTreeRelations.length]);

  return (
    <EditorContext.Provider value={editorContextValue}>
      <TreeNodesContext.Provider value={treeNodesContextValue}>
        <SelectionContext.Provider value={selectedTreeContextValue}>
          <div style={{ display: "flex" }}>
            <div className="treeview-container">
              <div className="buttons-row">
                <button className="outlined-button" onClick={clearAll}>
                  Clear All Objects
                </button>
                <button className="outlined-button" onClick={saveState}>
                  Save Editor State
                </button>
                <button className="outlined-button" onClick={loadState}>
                  Load Editor State
                </button>
              </div>

              <TreeView data={treeNodes} />
            </div>
            <div
              className="tldraw-container"
              autoFocus
              onKeyDown={handleKeyDown}
            >
              <Tldraw
                ref={editorRef}
                autoFocus
                onUiEvent={handleUiEvent}
                onMount={setAppToState}
                overrides={overrides}
              />
              {/* {selectedShapeBounds && <DraggingBounds bounds={selectedShapeBounds} rotation={0}/>} */}
            </div>
            <div className="panel-container">
              <Panel />
            </div>
          </div>
        </SelectionContext.Provider>
      </TreeNodesContext.Provider>
    </EditorContext.Provider>
  );
}
