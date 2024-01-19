import { EditorContext, NodesContext, SelectionContext } from "../editor";
import { useContext } from "react";
import { RectNode } from "../nodes/rectNode";
import { GeoPanel } from "./geoPanel";
import { StackPanel } from "./stackPanel";
import { TextPanel } from "./textPanel";

export function Panel() {
  const { selectedTreeNodes } = useContext(SelectionContext);
  let selectedRecordId = selectedTreeNodes[0] !== undefined ? selectedTreeNodes[0].recordId : undefined;
  let configInfo = <></>;
  if(selectedTreeNodes.length === 1) {
    if(selectedTreeNodes[0] !== undefined) {
      switch(selectedTreeNodes[0].name) {
        case "Stack":
          configInfo = <StackPanel {...selectedTreeNodes[0]}/>
          break;
        case "Rect":
          configInfo = <GeoPanel {...selectedTreeNodes[0]}/>
          break;
        case "Ellipse":
          configInfo = <GeoPanel {...selectedTreeNodes[0]}/>
          break;
        case "Text":
          configInfo = <TextPanel {...selectedTreeNodes[0]}/>
          break;
        default:
          configInfo = <h2>{selectedTreeNodes[0].name} </h2>
          break;
      }
    }
   
  }
  return selectedTreeNodes.length > 0 && selectedRecordId !== undefined ? (
    selectedTreeNodes.length > 1 ? <div>More than 1 object selected</div> :
    <div><div>{selectedRecordId} selected</div>
    {configInfo}</div>
  ) : (
    <div>No nodes selected</div>
  );
}
