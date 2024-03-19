import { useCallback, useContext } from "react";
import "./panel.css";
import { Node } from "./node";
import { TreeNodesContext } from "../editor";
import { changeNodeName } from "./panelUtils";
import { NumericInput } from "./inputModes";

// either attached to a reference or a coordinate
type Point = {
  x?: number;
  y?: number;
  ref?: string; // if ref exists, x and y are normalized values. TODO: Find better way to represent this
};

type ArrowPanelData = {
  start: Point;
  end: Point;
};

export type ArrowPanelProps = {
  data: Node<ArrowPanelData>;
  name: string;
};

// const handleStyle = { left: 10 };

export function ArrowPanel({ data, name }: ArrowPanelProps) {
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);

  const onChange = useCallback((evt: any) => {
    console.log(evt);
  }, []);

  const changeName = (evt: any) => {
    setTreeNodes(changeNodeName(treeNodes, data.id, evt.target.value));
  };

  return (
    <div className="panel">
      <h2 className="header">Arrow</h2>
      <div className="properties">
        <div>
          <label htmlFor="name">name: </label>
          <input id="name" onChange={changeName} value={name ?? ""} size={5} />
        </div>
        <div>
          <NumericInput label={"x"} value={data.bbox.x} onChange={onChange} />
        </div>
        <div>
          <NumericInput label={"y"} value={data.bbox.y} onChange={onChange} />
        </div>
        <div>
          <NumericInput
            label={"start_x"}
            value={data.data.start.x}
            onChange={onChange}
          />
          <NumericInput
            label={"start_y"}
            value={data.data.start.y}
            onChange={onChange}
          />
        </div>
        <div>
          <label htmlFor="start_ref">start_ref: </label>
          {data.data.start.ref !== undefined ? (
            <em>{data.data.start.ref}</em>
          ) : (
            <em>none</em>
          )}
        </div>
        <div>
        <NumericInput
            label={"end_x"}
            value={data.data.end.x}
            onChange={onChange}
          />
          <NumericInput
            label={"end_y"}
            value={data.data.end.y}
            onChange={onChange}
          />
        </div>
        <div>
          <label htmlFor="end_ref">end_ref: </label>
          {data.data.end.ref !== undefined ? (
            <em>{data.data.end.ref}</em>
          ) : (
            <em>none</em>
          )}
        </div>
      </div>
    </div>
  );
}
