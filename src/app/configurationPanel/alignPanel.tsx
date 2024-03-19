import { useCallback, useContext, useState } from "react";
import "./panel.css";
import { EditorContext, NodesContext, TreeNodesContext } from "../editor";
import { Node } from "./node";
import _ from "lodash";
import { getAlignLayout, horizontalAlignments, relayout } from "../layoutUtils";
import { NumericInput } from "./inputModes";
import { changeNodeName } from "./panelUtils";

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
  name: string;
};

enum ChangeTarget {
  alignment,
  x,
  y,
}

export function AlignPanel({ data, name }: AlignPanelProps) {
  const [alignment, setAlignment] = useState(data.data.alignment);
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const { editor, setEditor } = useContext(EditorContext);
  const [nodeName, setNodeName] = useState(name);

  const changeName = (evt: any) => {
    setNodeName(evt.target.value);
    setTreeNodes(changeNodeName(treeNodes, data.id, evt.target.value));
  };

  const onChange = useCallback(
    (evt: any, changeTarget: ChangeTarget) => {
      let alignmentData: {
        id: string;
        alignment: Alignment;
        alignX: number | undefined;
        alignY: number | undefined;
      } = {
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
            alignX: undefined,
            alignY: undefined,
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

      const {
        canPerformOperation,
        updatedPositions,
        updatedNodeData,
        alignX,
        alignY,
      } = getAlignLayout(
        childrenData,
        alignmentData.alignment,
        data.id,
        alignmentData.alignX,
        alignmentData.alignY
      );
      if (!canPerformOperation) {
        alert("Was not able to change alignment");
        return;
      }
      const updatedAlignNodes = treeNodes.map((node) => {
        if (node.id === data.id)
          return {
            ...node,
            data: {
              ...node.data,
              data: {
                alignment: alignmentData.alignment,
                x: horizontalAlignments.includes(alignment)
                  ? alignX
                  : undefined,
                y: horizontalAlignments.includes(alignment)
                  ? undefined
                  : alignY,
              },
            },
          };
        if (!data.childrenIds?.includes(node.id)) {
          return node;
        }
        return {
          ...node,
          data: _.find(updatedNodeData, (data) => data.id === node.id),
        };
      });
      const index = _.findIndex(
        updatedAlignNodes,
        (node: any) => node.id === data.id
      );
      console.log(updatedPositions);
      const { updatedNodes, positionsToUpdate } = relayout(
        updatedAlignNodes,
        index
      );
      setEditor(
        editor
          ?.updateShapes(updatedPositions)
          .updateShapes(positionsToUpdate)
          .complete()
      );
      setTreeNodes(updatedNodes);
      setAlignment(alignmentData.alignment);
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
          <label htmlFor="name">name: </label>
          <input
            id="name"
            onChange={changeName}
            value={nodeName ?? ""}
            size={5}
          />
        </div>
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
        {data.data.x !== undefined && (
          <NumericInput
            label={"x"}
            value={data.data.x}
            onChange={(evt) => onChange(evt, ChangeTarget.x)}
          />
        )}
        {data.data.y !== undefined && (
          <NumericInput
            label={"y"}
            value={data.data.y}
            onChange={(evt) => onChange(evt, ChangeTarget.y)}
          />
        )}
      </div>
    </div>
  );
}
