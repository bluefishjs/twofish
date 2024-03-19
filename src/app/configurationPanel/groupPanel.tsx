import "./panel.css";
import { Node } from "./node";
import { useContext, useState } from "react";
import { EditorContext, TreeNodesContext } from "../editor";
import { changeNodeName } from "./panelUtils";
import { NumericInput } from "./inputModes";
import { relayout } from "../layoutUtils";
import _ from "lodash";

type GroupPanelData = {};

export type GroupPanelProps = {
  data: Node<GroupPanelData>;
  name: string;
};

enum GroupChangeTarget {
  x,
  y,
}

export const GroupPanel = ({ data, name }: GroupPanelProps) => {
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const { editor, setEditor } = useContext(EditorContext);

  const changeName = (evt: any) => {
    setTreeNodes(
      changeNodeName(treeNodes, data.id, evt.target.value)
    );
  };

  const onChange = (evt: any, changeTarget: GroupChangeTarget) => {
    const targetValue = +(evt.target.value ?? 0);
    const index = _.findIndex(
      treeNodes,
      (node: any) => node.recordId === data.id
    );
    if (changeTarget === GroupChangeTarget.x) {
      const delta = targetValue - (data.bbox.x ?? 0);
      const { updatedNodes, positionsToUpdate } = relayout(
        treeNodes.map((node) => {
          if (data.id === node.recordId) {
            return {
              ...node,
              data: {
                ...node.data,
                bbox: {
                  ...node.data.bbox,
                  x: targetValue,
                },
              },
            };
          }
          if (!data.childrenIds?.includes(node.recordId)) {
            return node;
          }
          return {
            ...node,
            data: {
              ...node.data,
              owned: {
                ...node.data.owned,
                x:
                  node.data.xOwner === data.id
                    ? node.data.owned.x + delta
                    : node.data.owned.x, // only change if the group owns it? Or does that screw things up?
              },
            },
          };
        }),
        index
      );
      setTreeNodes(updatedNodes);
      setEditor(editor.updateShapes([{id: data.id, type: "group", x: targetValue}])); // do we also need to update the indiv shapes? check tldraw logic
      return;
    }
    if (changeTarget === GroupChangeTarget.y) {
      const delta = targetValue - (data.bbox.y ?? 0);
      const { updatedNodes, positionsToUpdate } = relayout(
        treeNodes.map((node) => {
          if (data.id === node.recordId) {
            return {
              ...node,
              data: {
                ...node.data,
                bbox: {
                  ...node.data.bbox,
                  y: targetValue,
                },
              },
            };
          }
          if (!data.childrenIds?.includes(node.recordId)) {
            return node;
          }
          return {
            ...node,
            data: {
              ...node.data,
              owned: {
                ...node.data.owned,
                y:
                  node.data.yOwner === data.id
                    ? node.data.owned.y + delta
                    : node.data.owned.y, // only change if the group owns it? Or does that screw things up?
              },
            },
          };
        }),
        index
      );
      setTreeNodes(updatedNodes);
      setEditor(editor.updateShapes([{id: data.id, type: "group", y: targetValue}])); // do we also need to update the indiv shapes? check tldraw logic
      return;
    }
  };
  return (
    <div className="panel">
      <h2 className="header">Group</h2>
      <div className="properties">
        <div>
          <label htmlFor="name">name: </label>
          <input id="name" onChange={changeName} value={name ?? ""} size={5} />
        </div>
        <NumericInput
          label={"x"}
          value={data.bbox.x}
          onChange={(evt) => onChange(evt, GroupChangeTarget.x)}
        />
        <NumericInput
          label={"y"}
          value={data.bbox.y}
          onChange={(evt) => onChange(evt, GroupChangeTarget.y)}
        />
      </div>
    </div>
  );
};
