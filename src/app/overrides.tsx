import {
  TLUiEventContextType,
  TLUiOverrides,
  menuGroup,
  menuItem,
  useEvents,
} from "@tldraw/tldraw";

export const overrides: TLUiOverrides = {
  actions: (editor, actions, _helpers) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const trackEvent = useEvents();

    function hasSelectedShapes() {
      return editor.selectedIds.length > 0;
    }

    return {
      ...actions,
      "align-left": {
        ...actions["align-left"],
        onSelect(source) {
          trackEvent("align-shapes", {
            operation: "left",
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("align left");
          // editor.alignShapes("left", editor.selectedIds);
        },
      },
      "align-center-horizontal": {
        ...actions["align-center-horizontal"],
        onSelect(source) {
          trackEvent("align-shapes", {
            operation: "center-horizontal",
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("align center horizontal");
          // editor.alignShapes("center-horizontal", editor.selectedIds);
        },
      },
      "align-right": {
        ...actions["align-right"],
        onSelect(source) {
          trackEvent("align-shapes", {
            operation: "right",
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("align right");
          // editor.alignShapes("right", editor.selectedIds);
        },
      },
      "align-center-vertical": {
        ...actions["align-center-vertical"],
        onSelect(source) {
          trackEvent("align-shapes", {
            operation: "center-vertical",
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("align center vertical");
          // editor.alignShapes("center-vertical", editor.selectedIds);
        },
      },
      "align-top": {
        ...actions["align-top"],
        onSelect(source) {
          trackEvent("align-shapes", {
            operation: "top",
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("align top");
          // editor.alignShapes("top", editor.selectedIds);
        },
      },
      "align-bottom": {
        ...actions["align-bottom"],
        onSelect(source) {
          trackEvent("align-shapes", {
            operation: "bottom",
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("align bottom");
          // editor.alignShapes("bottom", editor.selectedIds);
        },
      },
      "stack-vertical": {
        ...actions["stack-vertical"],
        onSelect(source) {
          if (editor.selectedIds.length === 0) return;
          // if (mustGoBackToSelectToolFirst()) return

          trackEvent("stack-shapes", {
            operation: "vertical",
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("stack-vertical");
          // editor.stackShapes('vertical', editor.selectedIds, 16)
        },
      },
      "stack-horizontal": {
        ...actions["stack-horizontal"],
        onSelect(source) {
          if (!hasSelectedShapes()) return;
          // if (mustGoBackToSelectToolFirst()) return
          trackEvent("stack-shapes", {
            operation: "horizontal",
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("stack-horizontal");
          // editor.stackShapes('horizontal', editor.selectedIds, 16)
        },
      },
      "distribute-vertical": {
        ...actions["distribute-vertical"],
        onSelect(source) {
          if (editor.selectedIds.length === 0) return;
          // if (mustGoBackToSelectToolFirst()) return

          trackEvent("distribute-shapes", {
            operation: "vertical",
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("distribute-vertical");
        },
      },
      "distribute-horizontal": {
        ...actions["distribute-horizontal"],
        onSelect(source) {
          if (!hasSelectedShapes()) return;
          // if (mustGoBackToSelectToolFirst()) return

          trackEvent("distribute-shapes", {
            operation: "horizontal",
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("distribute-horizontal");
          // editor.stackShapes('horizontal', editor.selectedIds, 16)
        },
      },
      "add-background": {
        id: "add-background",
        action: "add-background",
        label: "Add Background",
        readonlyOk: false,
        onSelect(source) {
          console.log("add background");
          trackEvent("add-background", {
            source,
            ids: editor.selectedIds,
          } as any);
          editor.mark("add background");
        },
      },
    };
  },
  contextMenu(
    editor,
    contextMenu,
    { actions, oneSelected, twoSelected, threeSelected }
  ) {
    if (oneSelected) {
      const backgroundMenuItem = menuItem(actions["add-background"]);
      if (
        contextMenu[1].id === "modify" &&
        contextMenu[1].children !== undefined
      )
        contextMenu[1].children = [
          contextMenu[1].children[0],
          backgroundMenuItem,
          ...contextMenu[1].children.splice(1),
        ];
    }
    if (twoSelected && !threeSelected) {
      contextMenu[1].children[0].children = [
        contextMenu[1].children[0].children[0],
        menuGroup(
          "distributes",
          menuItem(actions["distribute-horizontal"]),
          menuItem(actions["distribute-vertical"])
        ),
        ...contextMenu[1].children[0].children.slice(1),
      ];
      const stackMenuGroup = contextMenu[1].children[0].children[2].children;
      stackMenuGroup.push(menuItem(actions["stack-horizontal"]));
      stackMenuGroup.push(menuItem(actions["stack-vertical"]));
    }
    return contextMenu;
  },
  translations: {
    en: {
          'add-background': 'Add Background',
    }
  }
};
