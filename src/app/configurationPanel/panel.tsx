import { SelectionContext, TreeNodesContext } from "../editor";
import { useContext } from "react";
import { GeoPanel } from "./geoPanel";
import { StackPanel } from "./stackPanel";
import { TextPanel } from "./textPanel";
import _ from "lodash";
import { AlignPanel } from "./alignPanel";
import { Component } from "./node";
import { BackgroundPanel } from "./backgroundPanel";
import { ArrowPanel } from "./arrowPanel";
import { LinePanel } from "./linePanel";
import { ActionPanel } from "./actionPanel";
import { DistributePanel } from "./distributePanel";
import { GroupPanel } from "./groupPanel";

export function Panel() {
  const { selectedTreeNodes } = useContext(SelectionContext);
  const { treeNodes } = useContext(TreeNodesContext);
  let selectedRecordId =
    selectedTreeNodes[0] !== undefined ? selectedTreeNodes[0] : undefined;
  const selectedRecord = _.find(
    treeNodes,
    (node) => node.recordId === selectedRecordId
  );
  let configInfo = <></>;
  if (selectedTreeNodes.length === 1) {
    if (selectedRecord !== undefined) {
      switch (selectedRecord.type) {
        case Component.Stack:
          configInfo = <StackPanel {...selectedRecord} />;
          break;
        case Component.Align:
          configInfo = <AlignPanel {...selectedRecord} />;
          break;
        case Component.Distribute:
          configInfo = <DistributePanel {...selectedRecord} />;
          break;
        case Component.Rect:
          configInfo = <GeoPanel {...selectedRecord} />;
          break;
        case Component.Ellipse:
          configInfo = <GeoPanel {...selectedRecord} />;
          break;
        case Component.Line:
          configInfo = <LinePanel {...selectedRecord} />;
          break;
        case Component.Text:
          configInfo = <TextPanel {...selectedRecord} />;
          break;
        case Component.Background:
          configInfo = <BackgroundPanel {...selectedRecord} />;
          break;
        case Component.Group:
          configInfo = <GroupPanel {...selectedRecord} />;
          break;
        case Component.Arrow:
          configInfo = <ArrowPanel {...selectedRecord} />;
          break;
        default:
          configInfo = <h2>{selectedRecord.name} </h2>;
          break;
      }
    }
  }
  return selectedTreeNodes.length > 0 && selectedRecordId !== undefined ? (
    selectedTreeNodes.length > 1 ? (
      <ActionPanel selectedTreeNodes={selectedTreeNodes} />
    ) : (
      // <div>More than 1 object selected</div>
      <div>
        <div>{selectedRecordId} selected</div>
        {configInfo}
      </div>
    )
  ) : (
    <div>No nodes selected</div>
  );
}
