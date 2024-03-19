import { useState, useContext } from "react";
import "./panel.css";
import { TreeNodesContext } from "../editor";
import { Component } from "./node";

type ActionPanelProps = {
  selectedTreeNodes: string[];
};

export function ActionPanel(props: ActionPanelProps) {
  const selectedTreeNodes = props.selectedTreeNodes;
  let [showAlignOptions, setShowAlignOptions] = useState(false);
  let [showDistributeOptions, setShowDistributeOptions] = useState(false);
  let [showStackOptions, setShowStackOptions] = useState(false);
  const { treeNodes } = useContext(TreeNodesContext);
  let alignActionsAllowed = true;
  let distributeActionsAllowed = true;
  let stackActionsAllowed = true;
  for (const node of treeNodes) {
    if (node.children.length === 0) {
      continue;
    }
    const childrenSet = new Set(node.data.childrenIds);
    if (selectedTreeNodes.filter((id) => !childrenSet.has(id)).length > 0) {
      continue;
    }
    switch (node.type) {
      case Component.Stack:
        stackActionsAllowed = false;
        break;
      case Component.Align:
        alignActionsAllowed = false;
        break;
      case Component.Distribute:
        distributeActionsAllowed = false;
        break;
      default:
        continue;
    }
  }
  const handleClick = (action: string) => {};

  return (
    <div className="panel">
      <div>More than 1 object selected</div>
      <div className="actions">
        {alignActionsAllowed && (
          <button
            onClick={() => setShowAlignOptions(!showAlignOptions)}
            className="category-dropdown"
          >
            Align Shapes
          </button>
        )}
        {showAlignOptions && (
          <div className="options">
            <button>Align Left</button>
            <button>Align H</button>
            <button>Align Right</button>
            <button>Align Top</button>
            <button>Align V</button>
            <button>Align Bottom</button>
          </div>
        )}
        {distributeActionsAllowed && (
          <button
            onClick={() => setShowDistributeOptions(!showDistributeOptions)}
            className="category-dropdown"
          >
            Distribute Shapes
          </button>
        )}
        {showDistributeOptions && (
          <div className="options">
            <button>Distribute Vertical</button>
            <button>Distribute Horizontal</button>
          </div>
        )}
        {stackActionsAllowed && (
          <button
            onClick={() => setShowStackOptions(!showStackOptions)}
            className="category-dropdown"
          >
            Stack Shapes
          </button>
        )}
        {showStackOptions && (
          <div className="options">
            <button>Stack Vertical</button>
            <button>Stack Horizontal</button>
          </div>
        )}
      </div>
    </div>
  );
}
