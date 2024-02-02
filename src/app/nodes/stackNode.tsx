import { useCallback, useContext, useState } from "react";
import { Handle, Position } from "reactflow";
import "./stackNode.css";
import { Alignment } from "./alignNode";
import { EditorContext, NodesContext, TreeNodesContext } from "../editor";
import { Node } from "./node";
import { getStackLayout } from "../layoutUtils";

export type StackNodeData = {
  direction: "horizontal" | "vertical";
  alignment: Alignment;
  spacing: number;
};

export type StackNodeProps = {
  data: Node<StackNodeData>;
};

enum StackChangeTarget {
  direction,
  alignment,
  x,
  y,
}

export function StackNode({ data }: StackNodeProps) {
  const [direction, setDirection] = useState(data.data.direction);
  const [alignment, setAlignment] = useState(data.data.alignment);
  const { nodes, setNodes } = useContext(NodesContext);
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const { editor, setEditor } = useContext(EditorContext);

  const onChange = useCallback(
    (evt: any, target: StackChangeTarget) => {
      const updatedDirection =
        target === StackChangeTarget.direction ? evt.target.value : direction;
      // TODO: add in interactive spacing change

      if (target === StackChangeTarget.direction) {
        // set default spacing
        const newSpacing = data.data.spacing;
        let newNodes: any;

        let orderedNodes: any[] =
          (data.childrenIds?.map(
            (selectedId: any) =>
              nodes.filter((node: any) => node.id === selectedId)[0]
          ) ?? []).map((node) => node.data); // TODO: figure out a better way to do this :") this is pretty bad
        let pivotNode: any = orderedNodes[0];


        if (!data.id) {
          return;
        }

        const { stackable, updatedPositions, sortedNodes, spacing, alignment } =
          getStackLayout(
            orderedNodes,
            evt.target.value,
            data.id,
            newSpacing,
            true
          );

        if (!stackable) {
          console.log("[stack] can't change stack");
          return;
        }

        newNodes = nodes.map((node: any) => {
          if (node.id === data.id) {
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

        const newTreeNodes = treeNodes.map((node: any) => {
          if (node.recordId === data.id) {
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

        setDirection(updatedDirection);
        // setNodes((nodes: any) => newNodes);
        setTreeNodes(newTreeNodes);
        setEditor((editor: any) => editor?.updateShapes(updatedPositions));
      }
    },
    [direction, data.data.spacing, data.childrenIds, data.id, nodes, treeNodes, setTreeNodes, setEditor]
  );

  return (
    <div className="stack-node">
      <div>
        <b>Stack</b>
      </div>
      <Handle type="target" position={Position.Top} />
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
      <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
}
