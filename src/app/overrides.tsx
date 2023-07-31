import { TLUiEventContextType, TLUiOverrides, useEvents } from "@tldraw/tldraw";

export const overrides: TLUiOverrides = {
  actions: (editor, actions, helpers) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const trackEvent = useEvents();
    return {
      ...actions,
      "align-left": {
        id: "align-left",
        label: "action.align-left",
        kbd: "?A",
        icon: "align-left",
        readonlyOk: false,
        onSelect(source) {
          trackEvent("align-shapes", {
            operation: "left",
            source,
            ids: editor.selectedIds, // pushing this into the event even though it's technically not in the type
          } as any);
          editor.mark("align left");
          editor.alignShapes("left", editor.selectedIds);
        },
      },
    };
  },
};
