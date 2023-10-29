import { useCallback } from "react";
import { Handle, Position } from "reactflow";
import "./geoNode.css";

export type RectNodeData = {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onChange?: any;
};

export type RectNodeProps = {
  data: RectNodeData;
};

// const handleStyle = { left: 10 };

export function RectNode({ data }: RectNodeProps) {
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
      console.log("Can't make empty string ");
      return;
    }
    data.onChange(updatedValues);
  }, []);

  return (
    <div className="geo-node">
      <div>
        <b>Rect</b>
      </div>
      {/* <Handle type="target" position={Position.Top} /> */}
      <div>
        <label htmlFor="x">x: </label>
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
          <em>computed</em>
        )}
        <br />
        <label htmlFor="y">y: </label>
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
          <em>computed</em>
        )}
        <br />
        <label htmlFor="w">width: </label>
        {data.width !== undefined ? (
          <input
            id="w"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.width)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <br />
        <label htmlFor="h">height: </label>
        {data.height !== undefined ? (
          <input
            id="h"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.height)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={{
          top: 62,
        }}
      />
      {/* <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={handleStyle}
      /> */}
    </div>
  );
}
