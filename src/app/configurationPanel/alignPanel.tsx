import { useCallback, useContext, useState } from "react";
import "./panel.css";
import { EditorContext, NodesContext, TreeNodesContext } from "../editor";
import { Node } from "./node";
import _ from "lodash";
import { getAlignAxes, getAlignLayout } from "../layoutUtils";

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
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const { editor, setEditor } = useContext(EditorContext);

  const onChange = useCallback(
    (evt: any, changeTarget: ChangeTarget) => {
      let alignmentData = {
        id: data.id,
        alignment: data.data.alignment,
        alignX: data.data.x,
        alignY: data.data.y,
      };
      switch (changeTarget) {
        case ChangeTarget.alignment:
          alignmentData = {
            ...alignmentData,
            alignment: evt.target.value as Alignment,
          };
          break;
        case ChangeTarget.x:
          if (x === "") {
            console.log("Can't update empty x");
            return;
          }
          alignmentData = {
            ...alignmentData,
            alignX: +evt.target.value as number,
          };
          break;
        case ChangeTarget.y:
          if (y === "") {
            console.log("Can't update empty y");
            return;
          }
          alignmentData = {
            ...alignmentData,
            alignY: +evt.target.value as number,
          };
          break;
        default:
          break;
      }

      if (!data.childrenIds) {
        return; // TODO: honestly should just delete the object here?
      }

      const childrenData = treeNodes
        .filter((node: any) => data.childrenIds?.includes(node.recordId))
        .map((node: any) => node.data);

      const { alignable, updatedPositions, updatedNodeData, alignX, alignY } =
        getAlignLayout(
          childrenData,
          alignmentData.alignment,
          data.id
          // alignmentData.alignX,
          // alignmentData.alignY
        );

      if (!alignable) {
        alert("Was not able to change alignment");
        return;
      }
      setTreeNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === data.id)
            return {
              ...node,
              data: {
                ...node.data,
                data: {
                alignment: alignmentData.alignment,
                x: alignX,
                y: alignY,
              }},
            };
          if (!data.childrenIds?.includes(node.id)) {
            return node;
          }
          return {
            ...node,
            data: _.find(updatedNodeData, (data) => data.id === node.id),
          };
        })
      );
      // data.data.alignment = alignmentData.alignment;
      setAlignment(alignmentData.alignment);
      // should never reach second case? But will have to test
      // data.data.x = alignX ?? 0;
      // data.data.y = alignY ?? 0;
      setEditor((editor as any).updateShapes(updatedPositions));
    },
    [
      data.id,
      data.data,
      data.childrenIds,
      treeNodes,
      alignment,
      setTreeNodes,
      setEditor,
      editor,
    ]
  );

  return (
    <div className="panel">
      <h2 className="header">Align</h2>
      <div className="properties">
        <div>
          <label htmlFor="alignment">alignment: </label>
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
          {data.data.x !== undefined ? (
            <>
              <label htmlFor="x">x: </label>
              <input
                id="x"
                type="number"
                onChange={(evt) => onChange(evt, ChangeTarget.x)}
                className="nodrag"
                value={Math.round(data.data.x)}
                size={5}
              />
              <br />
            </>
          ) : (
            <></>
          )}
        </div>
        <div>
          {data.data.y !== undefined ? (
            <>
              <label htmlFor="y">y: </label>
              <input
                id="y"
                type="number"
                onChange={(evt) => onChange(evt, ChangeTarget.y)}
                className="nodrag"
                value={Math.round(data.data.y)}
                size={5}
              />
              <br />
            </>
          ) : (
            <></>
          )}
        </div>
      </div>
    </div>
  );
}
