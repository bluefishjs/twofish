import { Node } from "./node";
import { useCallback, useContext, useState } from "react";
import "./panel.css";
import { EditorContext, TreeNodesContext } from "../editor";
import { getDistributeLayout, relayout } from "../layoutUtils";
import _ from "lodash";
import { NumericInput } from "./inputModes";
import { changeNodeName } from "./panelUtils";

export type DistributePanelData = {
  direction: "horizontal" | "vertical";
  spacing: number;
};

export type DistributePanelProps = {
  data: Node<DistributePanelData>;
  name: string;
};

enum DistributeChangeTarget {
  direction,
  spacing,
}

export function DistributePanel({ data, name }: DistributePanelProps) {
  const [direction, setDirection] = useState(data.data.direction);
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const { editor, setEditor } = useContext(EditorContext);

  const changeName = (evt: any) => {
    setTreeNodes(
      changeNodeName(treeNodes, data.id, evt.target.value)
    );
  };
  const onChange = useCallback(
    (evt: any, target: DistributeChangeTarget) => {
      const updatedDirection =
        target === DistributeChangeTarget.direction
          ? evt.target.value
          : direction;

      const updatedSpacing: number =
        target === DistributeChangeTarget.spacing
          ? (+evt.target.value as number)
          : data.data.spacing;

      let orderedNodes: any[] = (
        data.childrenIds?.map(
          (selectedId: any) =>
            treeNodes.filter((node: any) => node.recordId === selectedId)[0]
        ) ?? []
      ).map((node) => node.data); // TODO: figure out a better way to do this :") this is pretty bad

      if (!data.id) {
        return;
      }

      const { canPerformOperation, updatedPositions, sortedNodes } =
        getDistributeLayout(
          orderedNodes,
          updatedDirection,
          data.id,
          updatedSpacing,
          true
        );

      if (!canPerformOperation) {
        console.log("[Distribute] can't change distribute");
        alert("[Distribute] Was not able to change distribute positioning");
        return;
      }

      const updatedDistributeNodes = treeNodes.map((node: any) => {
        if (node.id === data.id) {
          return {
            ...node,
            data: {
              ...node.data,
              data: {
                direction: updatedDirection,
                spacing: updatedSpacing,
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
        updatedDistributeNodes,
        (node: any) => node.id === data.id
      );
      const { updatedNodes, positionsToUpdate } = relayout(
        updatedDistributeNodes,
        index
      );
      setEditor(
        editor
          ?.updateShapes(updatedPositions)
          .updateShapes(positionsToUpdate)
          .complete()
      );
      setTreeNodes(updatedNodes);
      setDirection(updatedDirection);
    },
    [
      direction,
      data.data,
      data.childrenIds,
      data.id,
      treeNodes,
      setEditor,
      editor,
      setTreeNodes,
    ]
  );

  return (
    <div className="panel">
      <h2 className="header">Distribute</h2>
      <div className="properties">
        <div>
          <label htmlFor="name">name: </label>
          <input id="name" onChange={changeName} value={name ?? ""} size={5} />
        </div>
        <div>
          <input
            type="radio"
            name="direction"
            value="horizontal"
            onChange={(evt) => onChange(evt, DistributeChangeTarget.direction)}
            checked={direction === "horizontal"}
          />
          <label htmlFor="horizontal">horizontal</label>
          <br />
          <input
            type="radio"
            name="direction"
            value="vertical"
            onChange={(evt) => onChange(evt, DistributeChangeTarget.direction)}
            checked={direction === "vertical"}
          />
          <label htmlFor="vertical">vertical</label>
          <br />
        </div>
        <NumericInput
          label={"spacing"}
          value={data.data.spacing}
          onChange={(evt) => onChange(evt, DistributeChangeTarget.spacing)}
        />

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
      </div>
    </div>
  );
}
