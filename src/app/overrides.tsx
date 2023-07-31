import { TLUiEventContextType, TLUiOverrides, useEvents } from "@tldraw/tldraw";

export const overrides: TLUiOverrides = {
  actions: (editor, actions, _helpers) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const trackEvent = useEvents();

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
          editor.alignShapes("left", editor.selectedIds);
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
          editor.alignShapes("center-horizontal", editor.selectedIds);
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
          editor.alignShapes("right", editor.selectedIds);
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
          editor.alignShapes("center-vertical", editor.selectedIds);
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
          editor.alignShapes("top", editor.selectedIds);
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
          editor.alignShapes("bottom", editor.selectedIds);
        },
      },
    };
  },
};
