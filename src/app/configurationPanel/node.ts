export type BBox = {
    width?: number;
    height?: number;
    x?: number;
    y?: number
}

export type BBoxWithOwner = BBox & {
    widthOwner?: string;
    heightOwner?: string;
    xOwner?: string;
    yOwner?: string;
}


export enum Component {
    Rect="Rect",
    Ellipse="Ellipse",
    Arrow="Arrow",
    Text="Text",
    Align="Align",
    Stack="Stack",
    Background="Background",
    Other="Other"
  };

export type Node<T> = {
    id?: string;
    name?: Component;
    bbox: BBox;
    owned: BBoxWithOwner;
    childrenIds?: string[];
    parentId?: string;
    data: T;
}