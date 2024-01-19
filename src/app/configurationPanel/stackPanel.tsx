import { useCallback, useContext, useState } from "react";
import "./panel.css";
import { Alignment } from "../nodes/alignNode";
import { EditorContext, NodesContext, TreeNodesContext } from "../editor";
import { Node } from "./node";
import { getStackLayout } from "../layoutUtils";

export type StackPanelData = {
  direction: "horizontal" | "vertical";
  alignment: Alignment;
  spacing: number;
};

export type StackPanelProps = {
  data: Node<StackPanelData>;
};

enum StackChangeTarget {
  direction,
  alignment,
  x,
  y,
}

export function StackPanel({ data }: StackPanelProps) {
  const [direction, setDirection] = useState(data.data.direction);
  const [alignment, setAlignment] = useState(data.data.alignment);
  const { nodes, setNodes } = useContext(NodesContext);
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const { editor, setEditor } = useContext(EditorContext);

  const onChange = useCallback(
    (evt: any, target: StackChangeTarget) => {
      console.log(evt, target);

      const updatedDirection =
        target === StackChangeTarget.direction ? evt.target.value : direction;
      // TODO: add in interactive spacing change

      if (target === StackChangeTarget.direction) {
        // set default spacing
        const newSpacing = data.data.spacing;
        let newNodes: any;

        let orderedNodes: any[] =
          data.childrenIds?.map(
            (selectedId: any) =>
              nodes.filter((node: any) => node.id === selectedId)[0]
          ) ?? []; // TODO: figure out a better way to do this :") this is pretty bad
        let pivotNode: any = orderedNodes[0];

        // try stacking with bboxes given back to nodes
        let modifiedNodes = orderedNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            bbox: {
              ...node.data.bbox,
              x:
                node.data.owned.xOwner === data.id
                  ? node.data.owned.x
                  : undefined,
              y:
                node.data.owned.yOwner === data.id
                  ? node.data.owned.y
                  : undefined,
            },
            owned: {
              ...node.data.owned,
              x:
                node.data.owned.xOwner === data.id
                  ? undefined
                  : node.data.owned.x,
              y:
                node.data.owned.yOwner === data.id
                  ? undefined
                  : node.data.owned.y,
              xOwner: node.data.owned.xOwner === data.id ? undefined : data.id,
              yOwner: node.data.owned.yOwner === data.id ? undefined : data.id,
            },
          },
        }));

        if (!data.id) {
          return;
        }

        const { stackable, updatedPositions, sortedNodes, spacing, alignment } =
          getStackLayout(modifiedNodes, evt.target.value, data.id, newSpacing, true);

        console.log(updatedPositions);

        if (!stackable) {
          console.log("[stack] can't change stack");
          return;
        }

        newNodes = nodes.map((node: any) => {
          if (node.id === data.id) {
            console.log(node);
            return {
              ...node,
              data: {
                ...node.data,
                direction: evt.target.value,
              },
            };
          }

          const position = (data.childrenIds ?? []).indexOf(node.id);
          if (position === -1) {
            return node;
          }
          const alteredNode = sortedNodes[position].node;
          return alteredNode;
        });

        console.log("New Nodes:", newNodes);
        setDirection(updatedDirection);
        setNodes((nodes: any) => newNodes);
        setTreeNodes((treeNodes: any) => {
          return treeNodes.map((node: any) => {
            if (node.recordId === data.id) {
              console.log(node);
              return {
                ...node,
                data: {
                  ...node.data,
                  direction: evt.target.value,
                },
              };
            }

            const position = (data.childrenIds ?? []).indexOf(node.id);
            if (position === -1) {
              return node;
            }
            const alteredNode = { ...node, ...sortedNodes[position].node };
            return alteredNode;
          });
        });
        setEditor((editor: any) => editor?.updateShapes(updatedPositions));
      }
    },
    [
      direction,
      data.data.spacing,
      data.childrenIds,
      data.id,
      setEditor,
      nodes,
      setNodes,
      treeNodes,
      setTreeNodes,
    ]
  );

  return (
    <div className="panel">
      <h2 className="header">Stack</h2>
      <div className="properties">
        <div>
          <input
            type="radio"
            name="direction"
            value="horizontal"
            onChange={(evt) => onChange(evt, StackChangeTarget.direction)}
            checked={direction === "horizontal"}
          />
          <label htmlFor="horizontal">horizontal</label>
          <br />
          <input
            type="radio"
            name="direction"
            value="vertical"
            onChange={(evt) => onChange(evt, StackChangeTarget.direction)}
            checked={direction === "vertical"}
          />
          <label htmlFor="vertical">vertical</label>
          <br />
        </div>

        {/* <label htmlFor="x">x: </label>
        {data.x !== undefined ? (
          <input
            id="x"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.x)}
            size={5}
          />
        ) : (
          <></>
        )}
        {data.y !== undefined ? (
          <input
            id="y"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.y)}
            size={5}
          />
        ) : (
          <></>
        )} */}
        {/* {direction === "horizontal" ? (
            <><label htmlFor="verticalAlignment">Alignment: </label>
            <select
              name="verticalAlignment"
              id="verticalAlignment"
              onChange={(evt) => onChange(evt, StackChangeTarget.alignment)}
              value={alignment}
            >
              <option value="top">top</option>
              <option value="center-vertical">centerV</option>
              <option value="bottom">bottom</option>
            </select></>
          ) : (
            <><label htmlFor="horizontalAlignment">Alignment: </label>
            <select
              name="horizontalAlignment"
              id="horizontalAlignment"
              onChange={(evt) => onChange(evt, StackChangeTarget.alignment)}
              value={alignment}
            >
              <option value="left">left</option>
              <option value="center-horizontal">centerH</option>
              <option value="right">right</option>
            </select></>
          )} */}
      </div>
    </div>
  );
}
