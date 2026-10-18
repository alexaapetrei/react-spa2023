import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Outlet, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PanelRightIcon } from "lucide-react";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "./ui/sidebar";
import { Button } from "./ui/button";
import { TooltipProvider } from "./ui/tooltip";
import { AppSidebarLeft } from "./app-sidebar-left";
import { AppSidebarRight } from "./app-sidebar-right";
import { categoryLabel } from "@/lib/categories";

/** Routes opt in to the right rail by marking themselves in the route tree. */
type ShellStaticData = { questionContext?: boolean };

type LeafParams = { categoria?: string; nr?: string };
type MobileSwipe = {
  side: "left" | "right";
  progress: number;
  settling: boolean;
};

/** Allows horizontal swipes across mobile app content to reveal its available rails. */
function SwipeableAppContent({
  children,
  className,
  enabled,
  canSwipeRight,
  activeSide,
  onOpen,
  onPreview,
  onCancel,
  onEndpointHaptic,
}: {
  children: ReactNode;
  className: string;
  enabled: boolean;
  canSwipeRight: boolean;
  activeSide: "left" | "right" | null;
  onOpen: (side: "left" | "right") => void;
  onPreview: (preview: MobileSwipe | null) => void;
  onCancel: (side: "left" | "right") => void;
  onEndpointHaptic: (endpoint: "open" | "closed") => void;
}) {
  const { isMobile } = useSidebar();
  const swipeStart = useRef<{
    pointerId: number;
    x: number;
    y: number;
    side: "left" | "right" | null;
    closing: boolean;
  } | null>(null);
  const capturedPointer = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !isMobile || event.pointerType !== "touch") return;
    if (activeSide) {
      event.preventDefault();
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
      onPreview({ side: activeSide, progress: 0, settling: true });
      settleTimer.current = window.setTimeout(() => {
        onCancel(activeSide);
        onPreview(null);
        onEndpointHaptic("closed");
        settleTimer.current = null;
      }, 200);
      return;
    }

    swipeStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      side: null,
      closing: false,
    };
    capturedPointer.current = null;
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    if (!start || start.pointerId !== event.pointerId) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (capturedPointer.current === null && Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
      event.currentTarget.setPointerCapture(event.pointerId);
      capturedPointer.current = event.pointerId;
      if (activeSide) {
        const closing = (activeSide === "left" && dx < 0) || (activeSide === "right" && dx > 0);
        if (!closing) return;
        start.side = activeSide;
        start.closing = true;
      } else {
        start.side = dx > 0 ? "left" : "right";
        if (start.side === "right" && !canSwipeRight) {
          start.side = null;
          return;
        }
        onOpen(start.side);
      }
    }
    if (capturedPointer.current === event.pointerId && start.side) {
      const panelWidth =
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 18;
      const travel = start.closing
        ? start.side === "left"
          ? -dx
          : dx
        : start.side === "left"
          ? dx
          : -dx;
      const progress = start.closing
        ? Math.max(0, Math.min(panelWidth - travel, panelWidth))
        : Math.max(0, Math.min(travel, panelWidth));
      onPreview({
        side: start.side,
        progress,
        settling: false,
      });
      if (!start.closing && progress >= panelWidth) onEndpointHaptic("open");
    }
  };

  const finishSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    capturedPointer.current = null;
    if (!start || start.pointerId !== event.pointerId || !start.side) return;

    const dx = event.clientX - start.x;
    const travel = start.closing
      ? start.side === "left"
        ? -dx
        : dx
      : start.side === "left"
        ? dx
        : -dx;
    const panelWidth = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 18;
    const crossedMidpoint = travel > (start.closing ? panelWidth / 2 : window.innerWidth / 2);
    const alreadyFullyExtended = !start.closing && travel >= panelWidth;

    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    onPreview({
      side: start.side,
      progress: start.closing
        ? crossedMidpoint
          ? 0
          : panelWidth
        : crossedMidpoint
          ? panelWidth
          : 0,
      settling: !alreadyFullyExtended,
    });
    settleTimer.current = window.setTimeout(() => {
      if (crossedMidpoint && !start.closing) {
        onPreview({ side: start.side!, progress: panelWidth, settling: false });
        onEndpointHaptic("open");
      } else if (crossedMidpoint) {
        onCancel(start.side!);
        onPreview(null);
        onEndpointHaptic("closed");
      } else {
        if (start.closing) {
          onPreview({ side: start.side!, progress: panelWidth, settling: false });
        } else {
          onCancel(start.side!);
          onPreview(null);
          onEndpointHaptic("closed");
        }
      }
      settleTimer.current = null;
    }, 200);
  };

  const cancelSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStart.current;
    if (start?.pointerId === event.pointerId && start.side) {
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
      const panelWidth =
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 18;
      onPreview({ side: start.side, progress: start.closing ? panelWidth : 0, settling: true });
      settleTimer.current = window.setTimeout(() => {
        if (start.closing) {
          onPreview({ side: start.side!, progress: panelWidth, settling: false });
        } else {
          onCancel(start.side!);
          settleTimer.current = window.setTimeout(() => onPreview(null), 50);
        }
      }, 200);
    }
    if (start?.pointerId === event.pointerId) swipeStart.current = null;
    if (capturedPointer.current === event.pointerId) capturedPointer.current = null;
  };

  return (
    <div
      className={className}
      style={{ touchAction: "pan-y" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishSwipe}
      onPointerCancel={cancelSwipe}
    >
      {children}
    </div>
  );
}

/**
 * The shell: left rail for navigation, content in the middle, right rail for
 * progress — the right one only existing while a question is on screen.
 *
 * The two rails get their own `SidebarProvider`s so collapsing one leaves the
 * other alone; the stock component keeps a single open/collapsed state per
 * provider. The right rail's provider is controlled from here so the header
 * button can reach it without being inside its tree.
 */
export function AppShell() {
  const { t } = useTranslation();
  const [rightOpen, setRightOpen] = useState(true);
  const [leftMobileOpen, setLeftMobileOpen] = useState(false);
  const [rightMobileOpen, setRightMobileOpen] = useState(false);
  const [mobileSwipe, setMobileSwipe] = useState<MobileSwipe | null>(null);
  const lastHapticEndpoint = useRef<"open" | "closed">("closed");
  const vibrateAtEndpoint = (endpoint: "open" | "closed") => {
    if (lastHapticEndpoint.current === endpoint) return;
    lastHapticEndpoint.current = endpoint;
    if (typeof navigator !== "undefined") navigator.vibrate?.(10);
  };
  const mobileSidebarOpen = leftMobileOpen || rightMobileOpen;
  const mobileSidebarWidth =
    Number.parseFloat(getComputedStyle(document.documentElement).fontSize) * 18;
  const mobileSidebarFullyExtended =
    mobileSidebarOpen &&
    (!mobileSwipe || (!mobileSwipe.settling && mobileSwipe.progress >= mobileSidebarWidth));
  const mobileSidebarMoving = mobileSidebarOpen || (mobileSwipe?.progress ?? 0) > 0;

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const scrollY = window.scrollY;
    const { position, top, left, right, width, overflow } = document.body.style;
    Object.assign(document.body.style, {
      position: "fixed",
      top: `-${scrollY}px`,
      left: "0",
      right: "0",
      width: "100%",
      overflow: "hidden",
    });

    return () => {
      Object.assign(document.body.style, { position, top, left, right, width, overflow });
      window.scrollTo(0, scrollY);
    };
  }, [mobileSidebarOpen]);

  const handleLeftMobileChange = (open: boolean) => {
    setLeftMobileOpen(open);
    if (open) setRightMobileOpen(false);
    else setMobileSwipe(null);
  };
  const handleRightMobileChange = (open: boolean) => {
    setRightMobileOpen(open);
    if (open) setLeftMobileOpen(false);
    else setMobileSwipe(null);
  };

  const inQuestionContext = useRouterState({
    select: (state) =>
      state.matches.some(
        (match) => (match.staticData as ShellStaticData | undefined)?.questionContext === true,
      ),
  });

  const headerTitle = useRouterState({
    select: (state) => {
      const { pathname } = state.location;
      const params = (state.matches[state.matches.length - 1]?.params ?? {}) as LeafParams;

      if (pathname.startsWith("/retake/")) {
        return `${categoryLabel(params.categoria ?? "")} · ${t("nav.retake")}`;
      }
      if (pathname.startsWith("/categoria/")) {
        return `${categoryLabel(params.categoria ?? "")} · ${t("common.question")} ${Number(params.nr ?? 0) + 1}`;
      }
      if (pathname.startsWith("/intrebari")) return t("nav.myQuestions");
      if (pathname === "/sets") return t("nav.sets");
      return t("common.home");
    },
  });

  return (
    <TooltipProvider>
      <SidebarProvider
        openMobile={leftMobileOpen}
        onOpenMobileChange={handleLeftMobileChange}
        className="relative min-h-svh w-full overflow-x-clip"
      >
        <AppSidebarLeft />

        <SidebarInset
          onTransitionEnd={(event) => {
            if (event.propertyName !== "transform") return;
            if (mobileSidebarOpen && !mobileSwipe) vibrateAtEndpoint("open");
            else if (!mobileSidebarOpen) vibrateAtEndpoint("closed");
          }}
          style={{
            filter: mobileSidebarFullyExtended ? "blur(2px) grayscale(1)" : "none",
            boxShadow: mobileSidebarMoving ? "0 0 2rem rgb(0 0 0 / 32%)" : "none",
            transform: mobileSwipe
              ? `translateX(${mobileSwipe.side === "left" ? "" : "-"}${mobileSwipe.progress}px)`
              : leftMobileOpen
                ? "translateX(18rem)"
                : rightMobileOpen
                  ? "translateX(-18rem)"
                  : undefined,
            transition: mobileSwipe
              ? mobileSwipe.settling
                ? "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), filter 200ms ease, box-shadow 200ms ease"
                : "transform 0ms, filter 200ms ease, box-shadow 200ms ease"
              : "transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1), filter 200ms ease, box-shadow 200ms ease",
          }}
        >
          <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur">
            <SidebarTrigger className="-ml-1" />
            <h1 className="truncate text-sm font-medium">{headerTitle}</h1>

            {inQuestionContext && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="ml-auto"
                aria-label={t("nav.toggleProgress")}
                title={t("nav.toggleProgress")}
                onClick={() => {
                  if (window.matchMedia("(max-width: 767px)").matches) {
                    handleRightMobileChange(!rightMobileOpen);
                  } else {
                    setRightOpen((open) => !open);
                  }
                }}
              >
                <PanelRightIcon />
              </Button>
            )}
          </header>

          <SwipeableAppContent
            className={
              inQuestionContext ? "min-w-0 flex-1 md:px-4 md:pt-4" : "min-w-0 flex-1 px-4 py-6"
            }
            enabled
            canSwipeRight={inQuestionContext}
            activeSide={leftMobileOpen ? "left" : rightMobileOpen ? "right" : null}
            onOpen={(side) =>
              side === "left" ? handleLeftMobileChange(true) : handleRightMobileChange(true)
            }
            onPreview={setMobileSwipe}
            onEndpointHaptic={vibrateAtEndpoint}
            onCancel={(side) => {
              if (side === "left") setLeftMobileOpen(false);
              else setRightMobileOpen(false);
            }}
          >
            <Outlet />
          </SwipeableAppContent>
        </SidebarInset>

        {inQuestionContext && (
          <SidebarProvider
            open={rightOpen}
            onOpenChange={setRightOpen}
            openMobile={rightMobileOpen}
            onOpenMobileChange={handleRightMobileChange}
            className="w-0 min-h-0 shrink-0 md:w-auto"
          >
            <AppSidebarRight />
          </SidebarProvider>
        )}
      </SidebarProvider>
    </TooltipProvider>
  );
}
