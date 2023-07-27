import { useCallback, useState } from "react";
import { Handle, Position } from "reactflow";
import "./alignNode.css";

export type AlignNodeData = {
  alignment: "left" | "H" | "right" | "top" | "V" | "bottom";
};

export type AlignNodeProps = {
  data: AlignNodeData;
};

export function AlignNode({ data }: AlignNodeProps) {
  const [alignment, setAlignment] = useState(data.alignment);

  const onChange = useCallback((evt: any) => {
    setAlignment(evt.target.value);
  }, []);

  return (
    <div className="align-node">
      <div>
        <b>Align</b>
      </div>
      <Handle type="target" position={Position.Top} />
      <div>
        <select
          name="alignment"
          id="alignment"
          onChange={onChange}
          value={alignment}
        >
          <option value="left">left</option>
          <option value="center-horizontal">centerH</option>
          <option value="right">right</option>
          <option value="top">top</option>
          <option value="center-vertical">centerV</option>
          <option value="bottom">bottom</option>
        </select>
      </div>
      <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
}
