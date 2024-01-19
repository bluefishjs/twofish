import { useCallback } from "react";
import { Handle, Position } from "reactflow";
import "./geoNode.css";
import {Node} from "./node";

// either attached to a reference or a coordinate
type Point = {
  x?: number;
  y?: number;
  ref?: string; // if ref exists, x and y are normalized values. TODO: Find better way to represent this
};

type ArrowNodeData = {
  start: Point;
  end: Point;
}

export type ArrowNodeProps = {
  data: Node<ArrowNodeData>;
};

// const handleStyle = { left: 10 };

export function ArrowNode({ data }: ArrowNodeProps) {
  console.log(data);
  const onChange = useCallback((evt: any) => {
    console.log(evt);
  }, []);

  return (
    <div className="geo-node">
      <div>
        <b>Arrow</b>
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
        <label htmlFor="start_x">start_x: </label>
        {data.data.start.x !== undefined ? (
          <input
            id="start_x"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.data.start.x)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <label htmlFor="start_y">start_y: </label>
        {data.data.start.y !== undefined ? (
          <input
            id="start_y"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.data.start.y)} // TODO: This should be changed into the ref's x * normalized value if ref exists
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <br />
        <label htmlFor="start_ref">start_ref: </label>
        {data.data.start.ref !== undefined ? (
          <em>{data.data.start.ref}</em>
        ) : (
          <em>none</em>
        )}
        <br />
        <label htmlFor="end_x">end_x: </label>
        {data.data.end.x !== undefined ? (
          <input
            id="end_x"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.data.end.x)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <label htmlFor="end_y">end_y: </label>
        {data.data.end.y !== undefined ? (
          <input
            id="end_y"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.data.end.y)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <br/>
        <label htmlFor="end_ref">end_ref: </label>
        {data.data.end.ref !== undefined ? (
          <em>{data.data.end.ref}</em>
        ) : (
          <em>none</em>
        )}
        <br />
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
