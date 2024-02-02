import { Tree } from "react-arborist";
import { IconoirProvider, NavArrowDown, NavArrowRight } from "iconoir-react";
import { useContext, useEffect, useRef } from "react";
import {
  SelectionContext,
  TreeNodesContext,
  EditorContext,
} from "../editor";
import { Component } from "../configurationPanel/node";
import _ from "lodash";

type TreeViewProps = {
  data: any[];
};
// Tree view for twofish
export function TreeView({ data }: TreeViewProps) {
  const { treeNodes, setTreeNodes } = useContext(TreeNodesContext);
  const { selectedTreeNodes, selectedTreeRelations, setSelectedTreeNodes } =
    useContext(SelectionContext);
  const treeRef = useRef();

  useEffect(() => {
    const tree = treeRef.current;
    tree?.deselectAll();
    selectedTreeNodes.forEach((selectedId: any) => {
      return tree?.get(selectedId)?.selectMulti()
    });
    selectedTreeRelations.forEach((selectedId: any) => {
      return tree?.get(selectedId)?.selectMulti()
    })
  }, [selectedTreeNodes, selectedTreeRelations]);

  const onDelete = ({ ids }) => {
    const idsToDelete = [];
    for (const id of ids) {
      const node = _.find(treeNodes, (node) => node.id === id);
      // if(node.)
    }
    console.log(ids);
    // TODO: delete on TLDraw side as well
  };
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
          borderRight: "2px solid black",
        }}
      >
        <h2 style={{ fontWeight: 600 }}>Objects</h2>
        <Tree
          data={data}
          width="10vw"
          padding={10}
          className="tree-body"
          onDelete={onDelete}
          ref={treeRef}
        >
          {TreeNode}
        </Tree>
      </div>
    </IconoirProvider>
  );
}

export function TreeNode({ node, style, dragHandle }: any) {
  /* This node instance can do many things. See the API reference. */
  // console.log(node);
  const { setSelectedTreeNodes, selectedTreeNodes, selectedTreeRelations, setSelectedTreeRelations } =
    useContext(SelectionContext);
  const {setEditor} = useContext(EditorContext);

  const handleClick = () => {
    if (node.isSelected) {
      node.deselect();
      const newSelection = selectedTreeNodes.filter((selectedId: any) => selectedId !== node.data.recordId)
      setSelectedTreeNodes(newSelection);
      if(node.children && node.children.length > 0) {
        setSelectedTreeRelations(selectedTreeRelations.filter((selectedId: any) => selectedId !== node.data.recordId))
        setEditor((editor: any) => editor?.deselect(...node.data.data.childrenIds))
        return;
      }
      setEditor((editor: any) => editor?.deselect(node.data.recordId))
      return;
    } else {
      if (
        selectedTreeNodes.includes(node.data.recordId)
      ) {
        node.select();
        return;
      }
      setSelectedTreeNodes([...selectedTreeNodes, node.data.recordId]);
      if(node.children && node.children.length > 0) {
        setSelectedTreeRelations([...selectedTreeRelations, node.data.recordId])
        setEditor((editor: any) => editor?.select(...selectedTreeNodes,...node.data.data.childrenIds))
        return;
      }
      else {
        setEditor((editor: any) => editor?.select(...selectedTreeNodes, node.data.recordId))
      }
      
      node.select();
      return;
    }
  };

  return (
    <div
      style={{ ...style, border: "solid black", borderWidth: "0px 0 1px 0" }}
      ref={dragHandle}
      className={`tree-node ${node.isSelected ? "selected" : "unselected"}`}
      onClick={handleClick}
    >
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
