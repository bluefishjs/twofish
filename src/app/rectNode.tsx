import { useCallback } from "react";
import { Handle, Position } from "reactflow";
import "./rectNode.css";

export type RectNodeData = {
  x?: number;
  y?: number;
};

export type RectNodeProps = {
  data: RectNodeData;
};

// const handleStyle = { left: 10 };

export function RectNode({ data }: RectNodeProps) {
  const onChange = useCallback((evt: any) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div className="rect-node">
      <div>
        <b>Rect</b>
      </div>
      {/* <Handle type="target" position={Position.Top} /> */}
      <div>
        <label htmlFor="text">x: </label>
        {data.x !== undefined ? (
          <input
            id="text"
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
        <label htmlFor="text">y: </label>
        {data.y !== undefined ? (
          <input
            id="text"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.y)}
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
