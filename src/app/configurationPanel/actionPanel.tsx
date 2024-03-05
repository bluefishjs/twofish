import { useContext } from "react";

type ActionPanelProps = {
  selectedTreeNodes: string[];
};

export function ActionPanel(props: ActionPanelProps) {
  const selectedTreeNodes = props.selectedTreeNodes;

  return (
    <div className="panel">
      <div>More than 1 object selected</div>
      <div className="actions">
        <button>Align Shapes</button>
        <button>Stack Shapes</button>
      </div>
    </div>
  );
}
