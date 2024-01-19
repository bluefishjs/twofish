import { useCallback, useContext } from "react";
import { Handle, Position } from "reactflow";
import "./geoNode.css";
import { EditorContext } from "../editor";
import {Node} from "./node";

export type GeoNodeData = {
    shapeName: string;
};

export type GeoNodeProps = {
  data: Node<GeoNodeData>;
};

export function GeoNode({ data }: GeoNodeProps) {
  const { editor, setEditor } = useContext(EditorContext);

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
    } else if (targetId === "h") {
      updatedValues.props = { h: +targetValue as number };
    } else if (targetId === "x") {
      updatedValues = { ...updatedValues, x: +targetValue as number };
    } else if (targetId === "y") {
      updatedValues = { ...updatedValues, y: +targetValue as number };
    } else {
      return;
    }

    if (evt.target.value === "") {
      console.log("[Rect] Can't make empty string ");
      return;
    }
    setEditor((editor) => editor?.updateShapes(updatedValues));
  }, []);

  return (
    <div className="geo-node">
      <div>
        <b>{data.data.shapeName}</b>
      </div>
      <Handle type="target" position={Position.Top} />
      <div>
        <label htmlFor="x">x: </label>
        {data.bbox.x !== undefined ? (
          <input
            id="x"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.bbox.x)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <br />
        <label htmlFor="y">y: </label>
        {data.bbox.y !== undefined ? (
          <input
            id="y"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.bbox.y)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <br />
        <label htmlFor="w">width: </label>
        {data.bbox.width !== undefined ? (
          <input
            id="w"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.bbox.width)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <br />
        <label htmlFor="h">height: </label>
        {data.bbox.height !== undefined ? (
          <input
            id="h"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.bbox.height)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
      />
    </div>
  );
}
