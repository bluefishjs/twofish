import { useCallback, useContext, useState } from "react";
import "./panel.css";
import { EditorContext, NodesContext, TreeNodesContext } from "../editor";
import {Node} from "./node";
import _ from "lodash";
import { getAlignAxes } from "../layoutUtils";

export type HorizontalAlignment = "left" | "center-horizontal" | "right";
export type VerticalAlignment = "top" | "center-vertical" | "bottom";

export type Alignment = HorizontalAlignment | VerticalAlignment;
export type AlignPanelData = {
  alignment: Alignment;
  x: number;
  y: number;
};

export type AlignPanelProps = {
  data: Node<AlignPanelData>;
};

enum ChangeTarget {
  alignment,
  x,
  y,
}

export function AlignPanel({ data }: AlignPanelProps) {
  const [alignment, setAlignment] = useState(data.data.alignment);
  const { nodes, setNodes } = useContext(NodesContext);
  const {treeNodes, setTreeNodes} = useContext(TreeNodesContext);
  const { editor, setEditor } = useContext(EditorContext);

  const onChange = useCallback(
    (evt: any, changeTarget: ChangeTarget) => {
      let alignmentData: Node<AlignPanelData>;
      switch (changeTarget) {
        case ChangeTarget.alignment:
          setAlignment(evt.target.value);
          alignmentData = { ...data, data: {...data.data, alignment: evt.target.value as Alignment}};
          break;
        case ChangeTarget.x:
          if (x === "") {
            console.log("Can't update empty x");
            return;
          }
          alignmentData = { ...data, data: {...data.data, x: +evt.target.value } };
          break;
        case ChangeTarget.y:
          if (y === "") {
            console.log("Can't update empty y");
            return;
          }
          alignmentData = { ...data, data: {...data.data, y: +evt.target.value} };
          break;
        default:
          alignmentData = { ...data };
          break;
      }
      const updatedShapes: any = [];

      if(!alignmentData.childrenIds) {
        return; // TODO: honestly should just delete the object here?
      }

    //   const childrenNodes = alignmentData.childrenIds.map((id) => _.find(treeNodes, treeNodes.recordId) as any)
    //   // try stacking with bboxes given back to nodes
    //   // TODO: extract out to function
    //   let modifiedNodes = childrenNodes.map((node) => ({
    //     ...node,
    //     data: {
    //       ...node.data,
    //       bbox: {
    //         ...node.data.bbox,
    //         x:
    //           node.data.owned.xOwner === data.id
    //             ? node.data.owned.x
    //             : undefined,
    //         y:
    //           node.data.owned.yOwner === data.id
    //             ? node.data.owned.y
    //             : undefined,
    //       },
    //       owned: {
    //         ...node.data.owned,
    //         x:
    //           node.data.owned.xOwner === data.id
    //             ? undefined
    //             : node.data.owned.x,
    //         y:
    //           node.data.owned.yOwner === data.id
    //             ? undefined
    //             : node.data.owned.y,
    //         xOwner: node.data.owned.xOwner === data.id ? undefined : data.id,
    //         yOwner: node.data.owned.yOwner === data.id ? undefined : data.id,
    //       },
    //     },
    //   }));

    //   let newAxisX: number | undefined = undefined;
    //   let newAxisY: number | undefined = undefined;
    //   let newAlignment: Alignment = alignment;
    //   switch (changeTarget) {
    //     case ChangeTarget.alignment:
    //       const res = getAlignAxes(modifiedNodes, evt.target.value);
    //       if(res === false) 
    //         return;
    //       newAxisX = res.alignX;
    //       newAxisY = res.alignY;
    //       setAlignment(newAlignment);
    //       break;
    //     case ChangeTarget.x:
    //       if (x === "") {
    //         console.log("Can't update empty x");
    //         return;
    //       }
    //       getAlignAxes(modifiedNodes, alignment, x);
    //       break;
    //     case ChangeTarget.y:
    //       if (y === "") {
    //         console.log("Can't update empty y");
    //         return;
    //       }
    //       getAlignAxes(modifiedNodes, alignment, y);
    //       break;
    //     default:
    //       break;
    //   }

    //   if (alignAxes === false) {
    //     console.log(
    //       "[Align] Unable to align as contradictory positions determined"
    //     );
    //     return nodes;
    //   }
    //   let { alignX, alignY } = alignAxes;
      setNodes(nodes.map((node: any) => {
          if (node.id === alignmentData.id) {
            return {
              ...node,
              data: {
                ...alignmentData,
              },
            };
          }
          if (!alignmentData.childrenIds || !alignmentData.childrenIds.includes(node.id)) return node;

          // switch from vertical to horizontal alignment
          if (
            alignmentData.data.x === undefined &&
            (alignmentData.data.alignment === "left" ||
              alignmentData.data.alignment === "center-horizontal" ||
              alignmentData.data.alignment === "right")
          ) {
            // set x value
            return node;
          }
          // switch from horizontal to vertical alignment
          if (
            alignmentData.data.y === undefined &&
            (alignmentData.data.alignment === "top" ||
              alignmentData.data.alignment === "center-vertical" ||
              alignmentData.data.alignment === "bottom")
          ) {
            // set y value
            return node;
          }
          console.log("[Align]", alignmentData);
          let updatedNode: any = {
            id: node.id,
            type: "geo"
          }
          switch (alignmentData.data.alignment) {
            case "left":
              updatedNode.x = alignmentData.data.x;
              break;
            case "center-horizontal":
              updatedNode.x =  (alignmentData.data.x ?? 0) - node.data.bbox.width / 2;
              break;
            case "right":
              updatedNode.x = (alignmentData.data.x ?? 0) - node.data.bbox.width;
              break;
            case "top":
              updatedNode.y = alignmentData.data.y;
              break;
            case "center-vertical":
              updatedNode.y = (alignmentData.data.y ?? 0) - +node.data.bbox.height / 2;
              break;
            case "bottom":
              updatedNode.y = (alignmentData.data.y ?? 0) - +node.data.bbox.height;
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
    </div>
  );
}
