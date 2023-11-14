import { useCallback, useContext, useState } from "react";
import { Handle, Position } from "reactflow";
import "./alignNode.css";
import { EditorContext, NodesContext } from "../editor";

export type HorizontalAlignment = "left" | "center-horizontal" | "right";
export type VerticalAlignment = "top" | "center-vertical" | "bottom";

export type Alignment = HorizontalAlignment | VerticalAlignment;
export type AlignNodeData = {
  id?: string;
  alignment: Alignment;
  childrenIds: string[];
  // Alignment should either define just x position, just y position, or both
  x?: number;
  y?: number;
};

export type AlignNodeProps = {
  data: AlignNodeData;
};

enum ChangeTarget {
  alignment,
  x,
  y,
}

export function AlignNode({ data }: AlignNodeProps) {
  const [alignment, setAlignment] = useState(data.alignment);
  const { nodes, setNodes } = useContext(NodesContext);
  const { editor, setEditor } = useContext(EditorContext);

  const onChange = useCallback(
    (evt: any, changeTarget: ChangeTarget) => {
      let alignmentData: AlignNodeData;
      switch (changeTarget) {
        case ChangeTarget.alignment:
          setAlignment(evt.target.value);
          alignmentData = { ...data, alignment: evt.target.value };
          break;
        case ChangeTarget.x:
          if (x === "") {
            console.log("Can't update empty x");
            return;
          }
          alignmentData = { ...data, x: +evt.target.value };
          break;
        case ChangeTarget.y:
          if (y === "") {
            console.log("Can't update empty y");
            return;
          }
          alignmentData = { ...data, y: +evt.target.value };
          break;
        default:
          alignmentData = { ...data };
          break;
      }
      const updatedShapes: any = [];

      setNodes(nodes.map((node: any) => {
          if (node.id === alignmentData.id) {
            return {
              ...node,
              data: {
                ...alignmentData,
              },
            };
          }
          if (!alignmentData.childrenIds.includes(node.id)) return node;

          // switch from vertical to horizontal alignment
          if (
            alignmentData.x === undefined &&
            (alignmentData.alignment === "left" ||
              alignmentData.alignment === "center-horizontal" ||
              alignmentData.alignment === "right")
          ) {
            // set x value
            return node;
          }
          // switch from horizontal to vertical alignment
          if (
            alignmentData.y === undefined &&
            (alignmentData.alignment === "top" ||
              alignmentData.alignment === "center-vertical" ||
              alignmentData.alignment === "bottom")
          ) {
            // set y value
            return node;
          }
          console.log("[Align]", alignmentData);
          let updatedNode: any = {
            id: node.id,
            type: "geo"
          }
          switch (alignmentData.alignment) {
            case "left":
              updatedNode.x = alignmentData.x;
              break;
            case "center-horizontal":
              updatedNode.x =  (alignmentData.x ?? 0) - node.data.width / 2;
              break;
            case "right":
              updatedNode.x = (alignmentData.x ?? 0) - node.data.width;
              break;
            case "top":
              updatedNode.y = alignmentData.y;
              break;
            case "center-vertical":
              updatedNode.y = (alignmentData.y ?? 0) - +node.data.height / 2;
              break;
            case "bottom":
              updatedNode.y = (alignmentData.y ?? 0) - +node.data.height;
              break;
          }

          updatedShapes.push(updatedNode);
          return node;
        })
      );
      setEditor((editor as any).updateShapes([...updatedShapes]));
    },
    [editor, setEditor, nodes, setNodes, data]
  );

  return (
    <div className="align-node">
      <div>
        <b>Align</b>
      </div>
      <Handle type="target" position={Position.Top} />
      <div>
        <select
          name="alignment"
          id="alignment"
          onChange={(evt) => onChange(evt, ChangeTarget.alignment)}
          value={alignment}
        >
          <option value="left">left</option>
          <option value="center-horizontal">centerH</option>
          <option value="right">right</option>
          <option value="top">top</option>
          <option value="center-vertical">centerV</option>
          <option value="bottom">bottom</option>
        </select>
      </div>
      <div>
        {data.x !== undefined ? (
          <>
            <label htmlFor="x">x: </label>
            <input
              id="x"
              name="text"
              onChange={(evt) => onChange(evt, ChangeTarget.x)}
              className="nodrag"
              value={Math.round(data.x)}
              size={5}
            />
            <br />
          </>
        ) : (
          <></>
        )}
        {data.y !== undefined ? (
          <>
            <label htmlFor="y">y: </label>
            <input
              id="y"
              name="text"
              onChange={(evt) => onChange(evt, ChangeTarget.y)}
              className="nodrag"
              value={Math.round(data.y)}
              size={5}
            />
            <br />
          </>
        ) : (
          <></>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
}
