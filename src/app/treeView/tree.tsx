import { Tree } from "react-arborist";
import {
  Triangle,
  IconoirProvider,
  NavArrowDown,
  NavArrowRight,
} from "iconoir-react";
import {useContext} from "react";
import {SelectionContext} from "../editor";

type TreeViewProps = {
  data: any[];
};
// Tree view for twofish
export function TreeView({ data }: TreeViewProps) {
  return (
    <IconoirProvider
      iconProps={{
        color: "#000",
        strokeWidth: 2,
        width: "16px",
        height: "16px",
      }}
    >
      <div
        style={{
          width: "15vw",
          height: "100vh",
          background: "#eee",
          padding: 10,
          borderRight:"2px solid black"
        }}
      >
        <h2 style={{fontWeight:600}}>Objects</h2>
        <Tree data={data} width="10vw" padding={10} className="tree-body">
          {TreeNode}
        </Tree>
      </div>
    </IconoirProvider>
  );
}

export function TreeNode({ node, style, dragHandle }: any) {
  /* This node instance can do many things. See the API reference. */
  // console.log(node);
  const { setSelectedTreeNodes, selectedTreeNodes } = useContext(SelectionContext);
  const handleClick = () => {
    if(node.isSelected) {
      setSelectedTreeNodes(selectedTreeNodes.filter((selectedNode: any) => selectedNode && selectedNode.recordId !== node.data.recordId));
      node.deselect();
      return;
    }
    else{
      console.log(node);
      setSelectedTreeNodes([...selectedTreeNodes, node.data]);
      node.select();
      return;
    }
  }

  return (
    <div style={{ ...style, border: "solid black", borderWidth:"0px 0 1px 0"}} ref={dragHandle} className={`tree-node ${node.isSelected ? "selected" : "unselected"}`} onClick={handleClick}>
      {!node.isLeaf ? (
        <button onClick={() => node.toggle()}>
          {node.isOpen ? <NavArrowDown /> : <NavArrowRight />}
        </button>
      ) : (
        <span style={{ width: 16, display: "inline-block" }}></span>
      )}
      {node.isLeaf ? "Δ " : "≡ "}
      {node.data.name}
    </div>
  );
}
