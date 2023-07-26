import { useCallback } from "react";
import { Handle, Position } from "reactflow";
import "./rectNode.css";

export type RectNodeData = {
  x: number;
  y: number;
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
      <Handle type="target" position={Position.Top} />
      <div>
        <label htmlFor="text">x: </label>
        <input
          id="text"
          name="text"
          onChange={onChange}
          className="nodrag"
          value={data.x}
        />
        <br />
        <label htmlFor="text">y: </label>
        <input
          id="text"
          name="text"
          onChange={onChange}
          className="nodrag"
          value={data.y}
        />
      </div>
      {/* <Handle type="source" position={Position.Bottom} id="a" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        style={handleStyle}
      /> */}
    </div>
  );
}
