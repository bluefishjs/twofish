import { useCallback, useContext, useState } from "react";
import { Handle, Position } from "reactflow";
import "./stackNode.css";
import { Alignment } from "./alignNode";
import { EditorContext, NodesContext } from "../editor";

export type StackNodeData = {
  id: string;
  direction: "horizontal" | "vertical";
  childrenIds: string[];
  alignment: Alignment;
  x: number | undefined;
  y: number | undefined;
  minX: number | undefined;
  minY: number | undefined;
};

export type StackNodeProps = {
  data: StackNodeData;
};

enum StackChangeTarget {
  direction,
  alignment,
  x,
  y,
}

export function StackNode({ data }: StackNodeProps) {
  const [direction, setDirection] = useState(data.direction);
  const [alignment, setAlignment] = useState(data.alignment);
  const { nodes, setNodes } = useContext(NodesContext);
  const { editor, setEditor } = useContext(EditorContext);

  const onChange = useCallback((evt: any, target: StackChangeTarget) => {
    console.log(evt, target);
    
    const updatedDirection = target === StackChangeTarget.direction ? evt.target.value : direction;
    // TODO: add in interactive spacing change

    if (target === StackChangeTarget.direction) {
      // set default spacing
      const spacing = 30;
      let newNodes;

      let orderedNodes: any[] = data.childrenIds.map((selectedId: any) => nodes.filter((node : any) => node.id === selectedId)[0]); // TODO: figure out a better way to do this :") this is pretty bad
      let pivotNode: any = orderedNodes[0];
      let offset = evt.target.value === "vertical" ? data.minY : data.minX;
      // calculate new positions
      orderedNodes = orderedNodes.map((node: any, i: number) => {
        if (evt.target.value === "vertical") {
          if(i === 0) {
            return {
              ...node,
              data: {
                ...node.data,
                x: data.minX,
                y: data.minY
              }
            }
          }
          offset += orderedNodes[i - 1].data.height + spacing;
          
          return {
            ...node,
            data: {
              ...node.data,
              x:
                (data.minX ?? 0) +
                pivotNode.data.width / 2 -
                node.data.width / 2,
              y: offset,
            },
          };
        } else {
          if(i === 0) {
            return {
              ...node,
              data: {
                ...node.data,
                x: offset,
                y: data.minY
              }
            }
          }
          offset += orderedNodes[i - 1].data.width + spacing;
          return {
            ...node,
            data: {
              ...node.data,
              x: offset,
              y:
                (data.minY ?? 0) +
                pivotNode.data.height / 2 -
                node.data.height / 2,
            },
          };
        }
      });

      newNodes = nodes.map((node: any) => {
        if(node.id === data.id) {
          return {...node,
          data: {
            ...node.data,
            direction: evt.target.value
          }}
        }

        const position = data.childrenIds.indexOf(node.id);
        if (position === -1) {
          return node;
        }
        const alteredNode = orderedNodes[position];
        return {
          ...alteredNode,
          data: {
            ...alteredNode.data,
            x: evt.target.value === "horizontal" ? undefined: alteredNode.data.x,
            y: evt.target.value === "horizontal" ? alteredNode.data.y : undefined
          }
          }; 
      });

      setEditor(editor.updateShapes(orderedNodes.map((node: any) => ({id: node.id, type: "geo", x: node.data.x, y: node.data.y}))));
      setDirection(updatedDirection);
      setNodes(newNodes);
    }
  }, [data.childrenIds, data.id, data.minX, data.minY, direction, editor, nodes, setEditor, setNodes]);

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
