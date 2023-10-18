import { useCallback } from "react";
import { Handle, Position } from "reactflow";
import "./geoNode.css";

// only handle defined points for now
type Point = {
  x: number;
  y: number; 
};
export type ArrowNodeData = {
  id?: string;
  x?: number;
  y?: number;
  start?: Point;
  end?: Point;
};

export type ArrowNodeProps = {
  data: ArrowNodeData;
};

// const handleStyle = { left: 10 };

export function ArrowNode({ data }: ArrowNodeProps) {
  const onChange = useCallback((evt: any) => {
    console.log(evt);
  }, []);

  return (
    <div className="geo-node">
      <div>
        <b>Arrow</b>
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
        <label htmlFor="start_x">start_x: </label>
        {data.start !== undefined ? (
          <input
            id="start_x"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.start.x)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <label htmlFor="start_y">start_y: </label>
        {data.start !== undefined ? (
          <input
            id="start_y"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.start.y)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <br />
        <label htmlFor="end_x">end_x: </label>
        {data.end !== undefined ? (
          <input
            id="end_x"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.end.x)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <label htmlFor="end_y">end_y: </label>
        {data.end !== undefined ? (
          <input
            id="end_y"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.end.y)}
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