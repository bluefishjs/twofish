import { useCallback } from "react";
import "./panel.css";
import { Node } from "./node";

type LinePanelData = {};

export type LinePanelProps = {
  data: Node<LinePanelData>;
  name: string;
};

// const handleStyle = { left: 10 };

export function LinePanel({ data }: LinePanelProps) {
  console.log(data);
  const onChange = useCallback((evt: any) => {
    console.log(evt);
  }, []);

  return (
    <div className="panel">
      <h2 className="header">Line</h2>
      <div className="properties">
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
        </div>
        <div>
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
        </div>
        <div>
            width: {data.bbox.width} height: {data.bbox.height}
        </div>
      </div>
    </div>
  );
}
