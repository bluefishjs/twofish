import { useCallback, useContext } from "react";
import "./panel.css";
import { EditorContext } from "../editor";
import { isNumeric } from "../utils";
import { Node } from "./node";

export type TextPanelData = {
  content?: string;
};

export type TextPanelProps = {
  data: Node<TextPanelData>;
};

enum TextChangeTarget {
  x,
  y,
  content,
}

export function TextPanel({ data }: TextPanelProps) {
  const { editor, setEditor } = useContext(EditorContext);

  const onChange = useCallback((evt: any, target: TextChangeTarget) => {
    console.log(evt);
    let updatedValues: any = {
      id: data.id,
      type: "geo",
      props: {},
    };
    switch (target) {
      case TextChangeTarget.content:
        if (evt.target.value === "") {
          console.log("can't update content with empty string");
        }
        updatedValues.props.text = evt.target.value;
        break;
      case TextChangeTarget.x:
        if (!isNumeric(evt.target.value)) {
          console.log("can't update x with non-numeric value");
          return;
        }
        updatedValues.x = +evt.target.value as number;
        break;
      case TextChangeTarget.y:
        if (!isNumeric(evt.target.value)) {
          console.log("can't update y with non-numeric value");
          return;
        }
        updatedValues.y = +evt.target.value as number;
        break;
    }
    editor.updateShapes([updatedValues]);
  }, []);

  return (
    <div className="panel">
      <h2 className="header">Text</h2>
      <div className="properties">
        <div>
          <label htmlFor="x">x: </label>
          {data.bbox.x !== undefined ? (
            <input
              id="x"
              name="text"
              onChange={(evt) => onChange(evt, TextChangeTarget.x)}
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
              onChange={(evt) => onChange(evt, TextChangeTarget.y)}
              className="nodrag"
              value={Math.round(data.bbox.y)}
              size={5}
            />
          ) : (
            <em>computed</em>
          )}
        </div>
        <div>
          <label htmlFor="c">content: </label>
          {data.data.content !== undefined ? (
            <input
              id="c"
              name="text"
              onChange={(evt) => onChange(evt, TextChangeTarget.content)}
              className="nodrag"
              value={data.data.content}
            />
          ) : (
            <em>computed</em>
          )}
        </div>
      </div>
    </div>
  );
}
