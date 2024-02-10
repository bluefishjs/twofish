import { useCallback, useContext, useState } from "react";
import "./panel.css";
import { Alignment } from "../nodes/alignNode";
import { EditorContext, TreeNodesContext } from "../editor";
import { Node } from "./node";
import { getStackLayout, relayout } from "../layoutUtils";
import _ from "lodash";

export type StackPanelData = {
  direction: "horizontal" | "vertical";
  alignment: Alignment;
  spacing: number;
};

export type StackPanelProps = {
  data: Node<StackPanelData>;
};

enum StackChangeTarget {
  direction,
  alignment,
  spacing,
}

export function StackPanel({ data }: StackPanelProps) {
  const [direction, setDirection] = useState(data.data.direction);
  const [alignment, setAlignment] = useState(data.data.alignment);
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const { editor, setEditor } = useContext(EditorContext);

  const onChange = useCallback(
    (evt: any, target: StackChangeTarget) => {
      const updatedDirection =
        target === StackChangeTarget.direction ? evt.target.value : direction;

      const updatedSpacing: number =
        target === StackChangeTarget.spacing
          ? (+evt.target.value as number)
          : data.data.spacing;
      const updatedAlignment =
        target === StackChangeTarget.alignment ? evt.target.value : alignment;

      let orderedNodes: any[] = (
        data.childrenIds?.map(
          (selectedId: any) =>
            treeNodes.filter((node: any) => node.recordId === selectedId)[0]
        ) ?? []
      ).map((node) => node.data); // TODO: figure out a better way to do this :") this is pretty bad

      if (!data.id) {
        return;
      }

      const {
        stackable,
        updatedPositions,
        sortedNodes,
        spacing,
        stackAlignment,
      } = getStackLayout(
        orderedNodes,
        updatedDirection,
        data.id,
        updatedSpacing,
        true,
        target === StackChangeTarget.direction ? undefined : updatedAlignment // keep alignment only if direction hasn't changed
      );

      if (!stackable) {
        console.log("[stack] can't change stack");
        alert("[Stack] Was not able to change stack positioning");
        return;
      }

      const updatedStackNodes = treeNodes.map((node: any) => {
        if (node.id === data.id) {
          return {
            ...node,
            data: {
              ...node.data,
              data: {
                direction: updatedDirection,
                spacing: updatedSpacing,
                alignment: stackAlignment,
              },
            },
          };
        }

        const position = (data.childrenIds ?? []).indexOf(node.id);
        if (position === -1) {
          return node;
        }

        return {
          ...node,
          data: { ...sortedNodes[position].data },
        };
      });

      const index = _.findIndex(
        updatedStackNodes,
        (node: any) => node.id === data.id
      );
      const { updatedNodes, positionsToUpdate } = relayout(
        updatedStackNodes,
        index
      );
      setEditor(
        editor
          ?.updateShapes(updatedPositions)
          .updateShapes(positionsToUpdate)
          .complete()
      );
      setTreeNodes(updatedNodes);
      if (target === StackChangeTarget.direction) {
        // set default spacing
        setDirection(updatedDirection);
      } else if (target === StackChangeTarget.spacing) {
        data.data.spacing = +evt.target.value as number;
      } else {
        setAlignment(stackAlignment ?? updatedAlignment);
      }
    },
    [direction, data.data, data.childrenIds, data.id, alignment, treeNodes, setEditor, editor, setTreeNodes]
  );

  return (
    <div className="panel">
      <h2 className="header">Stack</h2>
      <div className="properties">
        <div>
          <input
            type="radio"
            name="direction"
            value="horizontal"
            onChange={(evt) => onChange(evt, StackChangeTarget.direction)}
            checked={direction === "horizontal"}
          />
          <label htmlFor="horizontal">horizontal</label>
          <br />
          <input
            type="radio"
            name="direction"
            value="vertical"
            onChange={(evt) => onChange(evt, StackChangeTarget.direction)}
            checked={direction === "vertical"}
          />
          <label htmlFor="vertical">vertical</label>
          <br />
        </div>
        <div>
          <label htmlFor="spacing">Spacing: </label>
          {data.data.spacing !== undefined ? (
            <input
              id="spacing"
              type="number"
              onChange={(evt) => onChange(evt, StackChangeTarget.spacing)}
              // className="nodrag"
              value={Math.round(data.data.spacing)}
              size={4}
            />
          ) : (
            <></>
          )}
        </div>

        {/* {data.y !== undefined ? (
          <input
            id="y"
            name="text"
            onChange={onChange}
            className="nodrag"
            value={Math.round(data.y)}
            size={5}
          />
        ) : (
          <></>
        )} */}
        <div>
          {direction === "horizontal" ? (
            <>
              <label htmlFor="verticalAlignment">Alignment: </label>
              <select
                name="verticalAlignment"
                id="verticalAlignment"
                onChange={(evt) => onChange(evt, StackChangeTarget.alignment)}
                value={alignment}
              >
                <option value="top">top</option>
                <option value="center-vertical">centerV</option>
                <option value="bottom">bottom</option>
              </select>
            </>
          ) : (
            <>
              <label htmlFor="horizontalAlignment">Alignment: </label>
              <select
                name="horizontalAlignment"
                id="horizontalAlignment"
                onChange={(evt) => onChange(evt, StackChangeTarget.alignment)}
                value={alignment}
              >
                <option value="left">left</option>
                <option value="center-horizontal">centerH</option>
                <option value="right">right</option>
              </select>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
