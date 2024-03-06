import { useCallback, useContext, useState } from "react";
import "./panel.css";
import { EditorContext, TreeNodesContext } from "../editor";
import { isNumeric } from "../utils";
import { Node, TreeNode } from "./node";
import { relayout } from "../layoutUtils";
import _ from "lodash";
import { NumericInput } from "./inputModes";
import { changeNodeName } from "./panelUtils";

export type TextPanelData = {
  content?: string;
  customName: boolean;
};

export type TextPanelProps = {
  data: Node<TextPanelData>;
  name: string;
};

enum TextChangeTarget {
  x,
  y,
  content,
}

export function TextPanel({ data, name }: TextPanelProps) {
  const { editor, setEditor } = useContext(EditorContext);
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const [nodeName, setNodeName] = useState(data.name);

  const changeName = (evt: any) => {
    setNodeName(evt.target.value);
    setTreeNodes(
      changeNodeName(treeNodes, data.id, evt.target.value)
        .map((treeNode: TreeNode<any>) => {
          if (treeNode.recordId === data.id) {
            return {
              ...treeNode,
              data: { ...treeNode.data, customName: true },
            };
          }
          return treeNode;
        })
    );
  };

  const onChange = useCallback((evt: any, target: TextChangeTarget) => {
    console.log(evt);

    let updatedData = { ...data };
    let updatedValues: any = {
      id: data.id,
      type: "geo",
      props: {},
    };
    switch (target) {
      case TextChangeTarget.content:
        if (evt.target.value === "") {
          console.log("can't update content with empty string");
        }
        updatedValues.props.text = evt.target.value;
        updatedData.data.content = evt.target.value;
        break;
      case TextChangeTarget.x:
        if (!isNumeric(evt.target.value)) {
          console.log("can't update x with non-numeric value");
          return;
        }
        updatedValues.x = +evt.target.value as number;
        updatedData.bbox.x = +evt.target.value as number;
        break;
      case TextChangeTarget.y:
        if (!isNumeric(evt.target.value)) {
          console.log("can't update y with non-numeric value");
          return;
        }
        updatedValues.y = +evt.target.value as number;
        updatedData.bbox.y = +evt.target.value as number;
        break;
    }
    const index = _.findIndex(
      treeNodes,
      (node: any) => node.recordId === data.id
    );
    const { updatedNodes, positionsToUpdate } = relayout(
      treeNodes.map((treeNode: any) => {
        if (treeNode.recordId !== data.id) return treeNode;
        return { ...treeNode, data: updatedData };
      }),
      index
    );
    setTreeNodes(updatedNodes);
    editor.updateShapes([updatedValues]).updateShapes(positionsToUpdate);
  }, []);

  return (
    <div className="panel">
      <h2 className="header">Text</h2>
      <div className="properties">
        <div>
          <label htmlFor="name">name: </label>
          <input id="name" onChange={changeName} value={name ?? ""} size={5} />
        </div>
        <NumericInput
          label="x"
          value={data.bbox.x}
          onChange={(evt) => onChange(evt, TextChangeTarget.x)}
        />
        <NumericInput
          label="y"
          value={data.bbox.y}
          onChange={(evt) => onChange(evt, TextChangeTarget.y)}
        />
        <div>
          <label htmlFor="c">content: </label>
          {data.data.content !== undefined ? (
            <textarea
              id="c"
              name="text"
              onChange={(evt) => onChange(evt, TextChangeTarget.content)}
              className="nodrag"
              value={data.data.content}
            />
          ) : (
            <em>computed</em>
          )}
        </div>
      </div>
    </div>
  );
}
