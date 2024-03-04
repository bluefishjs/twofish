import { useCallback, useContext, useState } from "react";
import "./panel.css";
import { EditorContext, TreeNodesContext } from "../editor";
import { Node } from "./node";
import _ from "lodash";
import { relayout } from "../layoutUtils";
import { NumericInput } from "./inputModes";

export type GeoPanelData = {
  shapeName: string;
};

export type GeoPanelProps = {
  data: Node<GeoPanelData>;
  name: string;
};

export function GeoPanel({ data, name }: GeoPanelProps) {
  const { editor, setEditor } = useContext(EditorContext);

  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const [nodeName, setNodeName] = useState(name);

  const updatedData = { ...data };

  const changeName = (evt: any) => {
    setNodeName(evt.target.value);
    setTreeNodes(
      treeNodes.map((treeNode: any) => {
        if (treeNode.recordId !== data.id) {
          if (treeNode.children && treeNode.data.childrenIds.includes(data.id))
            return {
              ...treeNode,
              children: treeNode.children.map((child) =>
                child.recordId === data.id
                  ? { ...child, name: evt.target.value }
                  : child
              ),
            };
          return treeNode;
        }
        return {
          ...treeNode,
          name: evt.target.value,
        };
      })
    );
  };

  const onChange = useCallback((evt: any) => {
    let updatedValues: any = {
      id: data.id,
      type: "geo",
      props: {},
    };

    const targetId = evt.target.id;
    const targetValue = evt.target.value;
    if (targetId === "width") {
      updatedValues.props = { w: +targetValue as number };
      updatedData.bbox.width = +targetValue as number;
    } else if (targetId === "height") {
      updatedValues.props = { h: +targetValue as number };
      updatedData.bbox.height = +targetValue as number;
    } else if (targetId === "x") {
      updatedValues = { ...updatedValues, x: +targetValue as number };
      updatedData.bbox.x = +targetValue as number;
    } else if (targetId === "y") {
      updatedValues = { ...updatedValues, y: +targetValue as number };

      updatedData.bbox.y = +targetValue as number;
    } else {
      return;
    }

    if (evt.target.value === "") {
      console.log("[Rect] Can't make empty string ");
      return;
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
    setEditor((editor: any) =>
      editor?.updateShapes([updatedValues]).updateShapes(positionsToUpdate)
    );
  }, []);

  return (
    <div className="panel">
      <h2 className="header">{data.data.shapeName}</h2>
      <div className="properties">
        <div>
          <label htmlFor="name">name: </label>
          <input id="name" onChange={changeName} value={name ?? ""} size={5} />
        </div>
        <NumericInput label={"x"} value={data.bbox.x} onChange={onChange} />
        <NumericInput label={"y"} value={data.bbox.y} onChange={onChange} />
        <NumericInput
          label={"width"}
          value={data.bbox.width}
          onChange={onChange}
        />
        <NumericInput
          label={"height"}
          value={data.bbox.height}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
