import { useCallback, useContext, useState } from "react";
import "./panel.css";
import { EditorContext, TreeNodesContext } from "../editor";
import { Node } from "./node";
import _ from "lodash";
import { relayout } from "../layoutUtils";

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
    if (targetId === "w") {
      updatedValues.props = { w: +targetValue as number };
      updatedData.bbox.width = +targetValue as number;
    } else if (targetId === "h") {
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
        <div>
          <label htmlFor="x">x: </label>
          {data.bbox.x && data.owned.x === undefined ? (
            <input
              id="x"
              onChange={onChange}
              type="number"
              value={Math.round(data.bbox.x)}
              size={5}
            />
          ) : (
            <em>computed</em>
          )}
        </div>
        <div>
          <label htmlFor="y">y: </label>
          {data.bbox.y && data.owned.y === undefined ? (
            <input
              id="y"
              type="number"
              onChange={onChange}
              value={Math.round(data.bbox.y)}
              size={5}
            />
          ) : (
            <em>computed</em>
          )}
        </div>

        <div>
          <label htmlFor="w">width: </label>
          {data.bbox.width !== undefined ? (
            <input
              id="w"
              type="number"
              onChange={onChange}
              value={Math.round(data.bbox.width)}
              size={5}
            />
          ) : (
            <em>computed</em>
          )}
        </div>
        <div>
          <label htmlFor="h">height: </label>
          {data.bbox.height !== undefined ? (
            <input
              id="h"
              onChange={onChange}
              type="number"
              value={Math.round(data.bbox.height)}
              size={5}
            />
          ) : (
            <em>computed</em>
          )}
        </div>
      </div>
    </div>
  );
}
