import { useCallback, useContext } from "react";
import "./panel.css";
import { EditorContext } from "../editor";
import { Node } from "./node";

export type GeoPanelData = {
  shapeName: string;
};

export type GeoPanelProps = {
  data: Node<GeoPanelData>;
};

export function GeoPanel({ data }: GeoPanelProps) {
  const { editor, setEditor } = useContext(EditorContext);

  const onChange = useCallback((evt: any) => {
    let updatedValues: any = {
      id: data.id,
      type: "geo",
      props: {},
    };

    const targetId = evt.target.id;
    const targetValue = evt.target.value;
    if (targetId === "w") {
      updatedValues.props = { w: +targetValue as number };
    } else if (targetId === "h") {
      updatedValues.props = { h: +targetValue as number };
    } else if (targetId === "x") {
      updatedValues = { ...updatedValues, x: +targetValue as number };
    } else if (targetId === "y") {
      updatedValues = { ...updatedValues, y: +targetValue as number };
    } else {
      return;
    }

    if (evt.target.value === "") {
      console.log("[Rect] Can't make empty string ");
      return;
    }
    setEditor((editor: any) => editor?.updateShapes([updatedValues]));
  }, []);

  return (
    <div className="panel">
      <h2 className="header">{data.data.shapeName}</h2>
      <div className="properties">
        <div>id: {data.id}</div>
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
          <label htmlFor="w">width: </label>
          {data.bbox.width !== undefined ? (
            <input
              id="w"
              name="text"
              onChange={onChange}
              className="nodrag"
              value={Math.round(data.bbox.width)}
              size={5}
            />
          ) : (
            <em>computed</em>
          )}
        </div>
        <div>
          <label htmlFor="h">height: </label>
          {data.bbox.height !== undefined ? (
            <input
              id="h"
              name="text"
              onChange={onChange}
              className="nodrag"
              value={Math.round(data.bbox.height)}
              size={5}
            />
          ) : (
            <em>computed</em>
          )}
        </div>
      </div>
    </div>
  );
}
