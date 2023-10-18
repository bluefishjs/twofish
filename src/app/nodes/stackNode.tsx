import { useCallback, useState } from "react";
import { Handle, Position } from "reactflow";
import "./stackNode.css";

export type StackNodeData = {
  direction: "horizontal" | "vertical";
};

export type StackNodeProps = {
  data: StackNodeData;
};

export function StackNode({ data }: StackNodeProps) {
  const [direction, setDirection] = useState(data.direction);

  const onChange = useCallback((evt: any) => {
    setDirection(evt.target.value);
  }, []);

  return (
    <div className="stack-node">
      <div>
        <b>Stack</b>
      </div>
      <Handle type="target" position={Position.Top} />
      <div>
        <input
          type="radio"
          name="direction"
          value="horizontal"
          onChange={onChange}
          checked={direction === "horizontal"}
        />
        <label htmlFor="horizontal">horizontal</label>
        <br />
        <input
          type="radio"
          name="direction"
          value="vertical"
          onChange={onChange}
          checked={direction === "vertical"}
        />
        <label htmlFor="vertical">vertical</label>
      </div>
      <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
}
