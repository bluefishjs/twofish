import { useCallback, useContext } from "react";
import { Handle, Position } from "reactflow";
import "./textNode.css";
import { EditorContext } from "../editor";
import {isNumeric} from "../utils.ts";

export type TextNodeData = {
  id?: string;
  x?: number;
  y?: number;
  content?: string;
};

export type TextNodeProps = {
  data: TextNodeData;
};

enum TextChangeTarget {
  x,
  y,
  content,
}

export function TextNode({ data }: TextNodeProps) {
  const { editor, setEditor } = useContext(EditorContext);

  const onChange = useCallback((evt: any, target: TextChangeTarget) => {
    console.log(evt);

    switch (target) {
      case TextChangeTarget.x:
        if(!isNumeric(evt.target.value)) {
            console.log("can't update non-numeric value");
            return;
        }
        editor.updateShapes([
          {
            id: data.id,
            type: "geo",
            x: +evt.target.value as number,
          },
        ]);
        break;
      case TextChangeTarget.y:
        if(!isNumeric(evt.target.value)) {
            console.log("can't update non-numeric value");
            return;
        }
        editor.updateShapes([
          {
            id: data.id,
            type: "geo",
            y: +evt.target.value as number,
          },
        ]);
        break;
      case TextChangeTarget.content:
        editor.updateShapes([
          {
            id: data.id,
            type: "geo",
            props: {
              text: evt.target.value,
            },
          },
        ]);
        break;
    }
  }, []);

  return (
    <div className="geo-node">
      <div>
        <b>Text</b>
      </div>
      {/* <Handle type="target" position={Position.Top} /> */}
      <div>
        <label htmlFor="x">x: </label>
        {data.x !== undefined ? (
          <input
            id="x"
            name="text"
            onChange={(evt) => onChange(evt, TextChangeTarget.x)}
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
            onChange={(evt) => onChange(evt, TextChangeTarget.y)}
            className="nodrag"
            value={Math.round(data.y)}
            size={5}
          />
        ) : (
          <em>computed</em>
        )}
        <br />
        <label htmlFor="c">content: </label>
        {data.content !== undefined ? (
          <input
            id="c"
            name="text"
            onChange={(evt) => onChange(evt, TextChangeTarget.content)}
            className="nodrag"
            value={data.content}
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
    </div>
  );
}
