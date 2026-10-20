import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { useSwipeDismiss } from "@/hooks/useSwipeDismiss";
import { cn } from "@/lib/utils";

/**
 * Channels a close callback from the `<Sheet>` root (which owns
 * `open`/`onOpenChange`) down to `SheetContent`, so the opt-in swipe handle
 * can dismiss the sheet through Radix's normal close path — `onOpenChange(false)`
 * fires and the exit animation runs. Defaults to a no-op (`SheetClose` /
 * escape-key closes use Radix's own path and never need this channel).
 */
const SheetCloseCtx = React.createContext<() => void>(() => {});

const Sheet = ({
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof SheetPrimitive.Root>) => {
  const close = React.useCallback(() => onOpenChange?.(false), [onOpenChange]);
  return (
    <SheetCloseCtx.Provider value={close}>
      <SheetPrimitive.Root onOpenChange={onOpenChange} {...props} />
    </SheetCloseCtx.Provider>
  );
};

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 will-change-[opacity]",
      className,
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  // Enter decelerates over 300ms (ease-ios); exit is quicker (200ms) so the
  // surface gets out of the way. `will-change` is scoped to the animation only
  // via the data-state, never left on permanently.
  "fixed z-50 gap-4 bg-background p-6 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-200 data-[state=open]:duration-300 ease-ios will-change-[transform]",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 rounded-b-2xl border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 rounded-t-2xl border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 rounded-r-2xl border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 rounded-l-2xl border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  },
);

interface SheetContentProps
  extends
    React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** Render a grab handle and enable drag-to-dismiss (bottom sheets). */
  swipeToDismiss?: boolean;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, swipeToDismiss, ...props }, forwardedRef) => {
  const close = React.useContext(SheetCloseCtx);
  const dismiss = React.useCallback(() => close(), [close]);

  const { ref: dragRef, handlers } = useSwipeDismiss({
    direction: "down",
    onDismiss: dismiss,
    threshold: 0.3,
  });
  const { onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = handlers;

  // The grab handle is the only gesture-start area; drags/scrolls starting in
  // the sheet body never activate the hook (its own active/started guards make
  // move/up no-ops), so content scrolling is never hijacked.
  const handleRef = React.useRef<HTMLDivElement | null>(null);
  const hasHandle = swipeToDismiss && side === "bottom";

  // The hook needs its ref on the element whose transform animates (the
  // content); it also captures the pointer there on pointerdown, which is
  // why the gesture handlers live on the content (capture retargets
  // move/up/cancel to the capture element, not back down to the handle).
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      if (typeof forwardedRef === "function") {
        forwardedRef(node);
      } else if (forwardedRef) {
        forwardedRef.current = node;
      }
      dragRef.current = node;
    },
    [dragRef, forwardedRef],
  );

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={setRefs}
        className={cn(sheetVariants({ side }), className)}
        {...props}
        onPointerDown={(event) => {
          // Gate the gesture to the grab strip: nothing in the body starts a drag.
          if (handleRef.current?.contains(event.target as Node)) onPointerDown(event);
          props.onPointerDown?.(event);
        }}
        onPointerMove={(event) => {
          onPointerMove(event);
          props.onPointerMove?.(event);
        }}
        onPointerUp={(event) => {
          onPointerUp(event);
          props.onPointerUp?.(event);
        }}
        onPointerCancel={(event) => {
          onPointerCancel();
          props.onPointerCancel?.(event);
        }}
      >
        {swipeToDismiss && side === "bottom" ? (
          <div
            ref={handleRef}
            aria-hidden="true"
            {...handlers}
            className="press absolute left-0 right-0 top-0 z-10 flex h-8 cursor-grab touch-none items-center justify-center"
          >
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>
        ) : null}
        {children}
        <SheetPrimitive.Close
          className={cn(
            "press absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full opacity-70 ring-offset-background transition-opacity hover:bg-secondary hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none",
            // Keep the close button above (clickable over) the grab strip.
            hasHandle && "z-20",
          )}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
};
