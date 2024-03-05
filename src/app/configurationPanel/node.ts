export type BBox = {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
};

export type BBoxWithOwner = BBox & {
  widthOwner?: string;
  heightOwner?: string;
  xOwner?: string;
  yOwner?: string;
};

export enum Component {
  Rect = "Rect",
  Ellipse = "Ellipse",
  Line = "Line",
  Arrow = "Arrow",
  Text = "Text",
  Align = "Align",
  Distribute = "Distribute",
  Stack = "Stack",
  Background = "Background",
  Group = "Group",
  Other = "Other",
}

export const ComponentList = [
  Component.Rect,
  Component.Ellipse,
  Component.Line,
  Component.Arrow,
  Component.Text,
  Component.Align,
  Component.Stack,
  Component.Distribute,
  Component.Background,
  Component.Group,
  Component.Other,
];

export type Node<T> = {
  id: string;
  name?: string;
  type?: Component;
  bbox: BBox;
  owned: BBoxWithOwner;
  childrenIds?: string[];
  parentId?: string;
  instanceSelected?: boolean; // just a placeholder to prototype semi-highlighting nodes that have the same ids are certain selected nodes
  data: T;
};
