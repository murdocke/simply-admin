"use client";

import type { CSSProperties, PointerEventHandler, ReactElement, ReactNode } from "react";
import { HARMONY_LIVE_TITLE } from "./constants";

type HarmonyLiveSurfaceProps = {
  className: string;
  style?: CSSProperties;
  title?: string;
  dragging?: boolean;
  headerRight?: ReactNode;
  headerClassName?: string;
  headerStyle?: CSSProperties;
  bodyClassName?: string;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onPointerMove?: PointerEventHandler<HTMLDivElement>;
  onPointerUp?: PointerEventHandler<HTMLDivElement>;
  onPointerCancel?: PointerEventHandler<HTMLDivElement>;
  children: ReactNode;
};

export const HarmonyLiveSurface = ({
  className,
  style,
  title = HARMONY_LIVE_TITLE,
  dragging = false,
  headerRight,
  headerClassName,
  headerStyle,
  bodyClassName = "px-4 py-3",
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  children,
}: HarmonyLiveSurfaceProps): ReactElement => {
  return (
    <div className={className} style={style}>
      <div
        className={`flex items-center justify-between gap-2 border-b px-4 py-2 text-[11px] uppercase tracking-[0.22em] ${dragging ? "cursor-grabbing" : ""} ${headerClassName ?? ""}`}
        style={headerStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <span>{title}</span>
        {headerRight}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
};
