"use client";

import { useEffect, useMemo, useRef, useCallback } from "react";
import { useGesture } from "@use-gesture/react";
import "./DomeGallery.css";

export interface ImageItem {
  src: string;
  alt: string;
  slug?: string;
  price?: number;
}

interface DomeGalleryProps {
  images?: ImageItem[];
  fit?: number;
  fitBasis?: "auto" | "min" | "max" | "width" | "height";
  minRadius?: number;
  maxRadius?: number;
  padFactor?: number;
  overlayBlurColor?: string;
  maxVerticalRotationDeg?: number;
  dragSensitivity?: number;
  enlargeTransitionMs?: number;
  segments?: number;
  dragDampening?: number;
  openedImageWidth?: string;
  openedImageHeight?: string;
  imageBorderRadius?: string;
  openedImageBorderRadius?: string;
  grayscale?: boolean;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  onItemClick?: (item: ImageItem, index: number) => void;
}

const DEFAULTS = {
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35,
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const normalizeAngle = (d: number) => ((d % 360) + 360) % 360;
const wrapAngleSigned = (deg: number) => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};
const getDataNumber = (el: HTMLElement, name: string, fallback: number): number => {
  const attr = (el as HTMLElement & { dataset: DOMStringMap }).dataset[name] ?? el.getAttribute(`data-${name}`);
  const n = attr == null ? NaN : parseFloat(attr);
  return Number.isFinite(n) ? n : fallback;
};

interface TileCoord {
  x: number;
  y: number;
  sizeX: number;
  sizeY: number;
}
interface TileItem extends TileCoord {
  src: string;
  alt: string;
  slug?: string;
  price?: number;
  index: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildItems(pool: ImageItem[], seg: number): TileItem[] {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs  = [-3, -1, 1, 3, 5];

  const coords: TileCoord[] = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;
  if (pool.length === 0) {
    return coords.map((c, i) => ({ ...c, src: "", alt: "", index: i }));
  }

  // Fill slots with repeatedly shuffled pool → fully random distribution
  const usedImages: ImageItem[] = [];
  while (usedImages.length < totalSlots) {
    usedImages.push(...shuffle(pool));
  }
  usedImages.length = totalSlots;

  return coords.map((c, i) => ({
    ...c,
    src:   usedImages[i].src,
    alt:   usedImages[i].alt,
    slug:  usedImages[i].slug,
    price: usedImages[i].price,
    index: pool.findIndex(p => p.src === usedImages[i].src),
  }));
}

function computeItemBaseRotation(offsetX: number, offsetY: number, sizeX: number, sizeY: number, segments: number) {
  const unit = 360 / segments / 2;
  const rotateY = unit * (offsetX + (sizeX - 1) / 2);
  const rotateX = unit * (offsetY - (sizeY - 1) / 2);
  return { rotateX, rotateY };
}

export default function DomeGallery({
  images = [],
  fit = 0.8,
  fitBasis = "auto",
  minRadius = 650,
  maxRadius = Infinity,
  padFactor = 0.25,
  overlayBlurColor = "#1A1008",
  maxVerticalRotationDeg = DEFAULTS.maxVerticalRotationDeg,
  dragSensitivity = DEFAULTS.dragSensitivity,
  enlargeTransitionMs = DEFAULTS.enlargeTransitionMs,
  segments = DEFAULTS.segments,
  dragDampening = 2,
  openedImageWidth = "250px",
  openedImageHeight = "350px",
  imageBorderRadius = "16px",
  openedImageBorderRadius = "24px",
  grayscale = false,
  autoRotate = true,
  autoRotateSpeed = 0.12,
  onItemClick,
}: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const focusedElRef = useRef<HTMLElement | null>(null);
  const originalTilePositionRef = useRef<DOMRect | null>(null);

  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef<number | null>(null);
  const autoRotateRAF = useRef<number | null>(null);
  const openingRef = useRef(false);
  const openStartedAtRef = useRef(0);
  const lastDragEndAt = useRef(0);

  const scrollLockedRef = useRef(false);
  const lockScroll = useCallback(() => {
    if (scrollLockedRef.current) return;
    scrollLockedRef.current = true;
    document.body.classList.add("dg-scroll-lock");
  }, []);
  const unlockScroll = useCallback(() => {
    if (!scrollLockedRef.current) return;
    if (rootRef.current?.getAttribute("data-enlarging") === "true") return;
    scrollLockedRef.current = false;
    document.body.classList.remove("dg-scroll-lock");
  }, []);

  const items = useMemo(() => buildItems(images, segments), [images, segments]);

  const applyTransform = (xDeg: number, yDeg: number) => {
    const el = sphereRef.current;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  };

  const lockedRadiusRef = useRef<number | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width);
      const h = Math.max(1, cr.height);
      const minDim = Math.min(w, h);
      const maxDim = Math.max(w, h);
      const aspect = w / h;
      let basis: number;
      switch (fitBasis) {
        case "min":   basis = minDim; break;
        case "max":   basis = maxDim; break;
        case "width": basis = w; break;
        case "height":basis = h; break;
        default:      basis = aspect >= 1.3 ? w : minDim;
      }
      let radius = basis * fit;
      const heightGuard = h * 1.35;
      radius = Math.min(radius, heightGuard);
      radius = clamp(radius, minRadius, maxRadius === Infinity ? Number.MAX_SAFE_INTEGER : maxRadius);
      lockedRadiusRef.current = Math.round(radius);

      const viewerPad = Math.max(8, Math.round(minDim * padFactor));
      root.style.setProperty("--radius", `${lockedRadiusRef.current}px`);
      root.style.setProperty("--viewer-pad", `${viewerPad}px`);
      root.style.setProperty("--overlay-blur-color", overlayBlurColor);
      root.style.setProperty("--tile-radius", imageBorderRadius);
      root.style.setProperty("--enlarge-radius", openedImageBorderRadius);
      root.style.setProperty("--image-filter", grayscale ? "grayscale(1)" : "none");
      applyTransform(rotationRef.current.x, rotationRef.current.y);

      const enlargedOverlay = viewerRef.current?.querySelector<HTMLElement>(".enlarge");
      if (enlargedOverlay && frameRef.current && mainRef.current) {
        const frameR = frameRef.current.getBoundingClientRect();
        const mainR = mainRef.current.getBoundingClientRect();
        if (openedImageWidth && openedImageHeight) {
          const tempDiv = document.createElement("div");
          tempDiv.style.cssText = `position:absolute;width:${openedImageWidth};height:${openedImageHeight};visibility:hidden;`;
          document.body.appendChild(tempDiv);
          const tempRect = tempDiv.getBoundingClientRect();
          document.body.removeChild(tempDiv);
          enlargedOverlay.style.left = `${frameR.left - mainR.left + (frameR.width - tempRect.width) / 2}px`;
          enlargedOverlay.style.top  = `${frameR.top  - mainR.top  + (frameR.height - tempRect.height) / 2}px`;
        } else {
          enlargedOverlay.style.left   = `${frameR.left - mainR.left}px`;
          enlargedOverlay.style.top    = `${frameR.top  - mainR.top}px`;
          enlargedOverlay.style.width  = `${frameR.width}px`;
          enlargedOverlay.style.height = `${frameR.height}px`;
        }
      }
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, [fit, fitBasis, minRadius, maxRadius, padFactor, overlayBlurColor, grayscale, imageBorderRadius, openedImageBorderRadius, openedImageWidth, openedImageHeight]);

  useEffect(() => {
    applyTransform(rotationRef.current.x, rotationRef.current.y);
  }, []);

  // Auto-rotate loop
  useEffect(() => {
    if (!autoRotate) return;
    const tick = () => {
      if (!draggingRef.current && inertiaRAF.current === null && !focusedElRef.current) {
        rotationRef.current.y = wrapAngleSigned(rotationRef.current.y + autoRotateSpeed);
        const el = sphereRef.current;
        if (el) el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${rotationRef.current.x}deg) rotateY(${rotationRef.current.y}deg)`;
      }
      autoRotateRAF.current = requestAnimationFrame(tick);
    };
    autoRotateRAF.current = requestAnimationFrame(tick);
    return () => {
      if (autoRotateRAF.current) cancelAnimationFrame(autoRotateRAF.current);
    };
  }, [autoRotate, autoRotateSpeed]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) {
      cancelAnimationFrame(inertiaRAF.current);
      inertiaRAF.current = null;
    }
  }, []);

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      const MAX_V = 1.4;
      let vX = clamp(vx, -MAX_V, MAX_V) * 80;
      let vY = clamp(vy, -MAX_V, MAX_V) * 80;
      let frames = 0;
      const d = clamp(dragDampening ?? 0.6, 0, 1);
      const frictionMul = 0.94 + 0.055 * d;
      const stopThreshold = 0.015 - 0.01 * d;
      const maxFrames = Math.round(90 + 270 * d);
      const step = () => {
        vX *= frictionMul;
        vY *= frictionMul;
        if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
          inertiaRAF.current = null;
          return;
        }
        if (++frames > maxFrames) {
          inertiaRAF.current = null;
          return;
        }
        const nextX = clamp(rotationRef.current.x - vY / 200, -maxVerticalRotationDeg, maxVerticalRotationDeg);
        const nextY = wrapAngleSigned(rotationRef.current.y + vX / 200);
        rotationRef.current = { x: nextX, y: nextY };
        applyTransform(nextX, nextY);
        inertiaRAF.current = requestAnimationFrame(step);
      };
      stopInertia();
      inertiaRAF.current = requestAnimationFrame(step);
    },
    [dragDampening, maxVerticalRotationDeg, stopInertia]
  );

  useGesture(
    {
      onDragStart: ({ event }) => {
        if (focusedElRef.current) return;
        stopInertia();
        const evt = event as PointerEvent;
        draggingRef.current = true;
        movedRef.current = false;
        startRotRef.current = { ...rotationRef.current };
        startPosRef.current = { x: evt.clientX, y: evt.clientY };
      },
      onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
        if (focusedElRef.current || !draggingRef.current || !startPosRef.current) return;
        const evt = event as PointerEvent;
        const dxTotal = evt.clientX - startPosRef.current.x;
        const dyTotal = evt.clientY - startPosRef.current.y;
        if (!movedRef.current) {
          if (dxTotal * dxTotal + dyTotal * dyTotal > 16) movedRef.current = true;
        }
        const nextX = clamp(startRotRef.current.x - dyTotal / dragSensitivity, -maxVerticalRotationDeg, maxVerticalRotationDeg);
        const nextY = wrapAngleSigned(startRotRef.current.y + dxTotal / dragSensitivity);
        if (rotationRef.current.x !== nextX || rotationRef.current.y !== nextY) {
          rotationRef.current = { x: nextX, y: nextY };
          applyTransform(nextX, nextY);
        }
        if (last) {
          draggingRef.current = false;
          let [vMagX, vMagY] = velocity as [number, number];
          const [dirX, dirY] = direction as [number, number];
          let vx = vMagX * dirX;
          let vy = vMagY * dirY;
          if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
            const [mx, my] = movement as [number, number];
            vx = clamp((mx / dragSensitivity) * 0.02, -1.2, 1.2);
            vy = clamp((my / dragSensitivity) * 0.02, -1.2, 1.2);
          }
          if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
          if (movedRef.current) lastDragEndAt.current = performance.now();
          movedRef.current = false;
        }
      },
    },
    { target: mainRef, eventOptions: { passive: true } }
  );

  useEffect(() => {
    const scrim = scrimRef.current;
    if (!scrim) return;
    const close = () => {
      if (performance.now() - openStartedAtRef.current < 250) return;
      const el = focusedElRef.current;
      if (!el) return;
      const parent = el.parentElement as HTMLElement;
      const overlay = viewerRef.current?.querySelector<HTMLElement>(".enlarge");
      if (!overlay) return;
      const refDiv = parent.querySelector<HTMLElement>(".item__image--reference");
      const originalPos = originalTilePositionRef.current;
      if (!originalPos) {
        overlay.remove();
        refDiv?.remove();
        parent.style.setProperty("--rot-y-delta", "0deg");
        parent.style.setProperty("--rot-x-delta", "0deg");
        el.style.visibility = "";
        el.style.zIndex = "0";
        focusedElRef.current = null;
        rootRef.current?.removeAttribute("data-enlarging");
        openingRef.current = false;
        unlockScroll();
        return;
      }
      const currentRect = overlay.getBoundingClientRect();
      const rootRect = rootRef.current!.getBoundingClientRect();
      const origRel = {
        left: originalPos.left - rootRect.left, top: originalPos.top - rootRect.top,
        width: originalPos.width, height: originalPos.height,
      };
      const overlayRel = {
        left: currentRect.left - rootRect.left, top: currentRect.top - rootRect.top,
        width: currentRect.width, height: currentRect.height,
      };
      const animating = document.createElement("div");
      animating.className = "enlarge-closing";
      animating.style.cssText = `position:absolute;left:${overlayRel.left}px;top:${overlayRel.top}px;width:${overlayRel.width}px;height:${overlayRel.height}px;z-index:9999;border-radius:var(--enlarge-radius,32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;
      const origImg = overlay.querySelector("img");
      if (origImg) {
        const img = origImg.cloneNode() as HTMLImageElement;
        img.style.cssText = "width:100%;height:100%;object-fit:cover;";
        animating.appendChild(img);
      }
      overlay.remove();
      rootRef.current!.appendChild(animating);
      void animating.getBoundingClientRect();
      requestAnimationFrame(() => {
        animating.style.left    = origRel.left + "px";
        animating.style.top     = origRel.top + "px";
        animating.style.width   = origRel.width + "px";
        animating.style.height  = origRel.height + "px";
        animating.style.opacity = "0";
      });
      const cleanup = () => {
        animating.remove();
        originalTilePositionRef.current = null;
        refDiv?.remove();
        parent.style.transition = "none";
        el.style.transition = "none";
        parent.style.setProperty("--rot-y-delta", "0deg");
        parent.style.setProperty("--rot-x-delta", "0deg");
        requestAnimationFrame(() => {
          el.style.visibility = "";
          el.style.opacity = "0";
          el.style.zIndex = "0";
          focusedElRef.current = null;
          rootRef.current?.removeAttribute("data-enlarging");
          requestAnimationFrame(() => {
            parent.style.transition = "";
            el.style.transition = "opacity 300ms ease-out";
            requestAnimationFrame(() => {
              el.style.opacity = "1";
              setTimeout(() => {
                el.style.transition = "";
                el.style.opacity = "";
                openingRef.current = false;
                if (!draggingRef.current && rootRef.current?.getAttribute("data-enlarging") !== "true")
                  document.body.classList.remove("dg-scroll-lock");
              }, 300);
            });
          });
        });
      };
      animating.addEventListener("transitionend", cleanup, { once: true });
    };
    scrim.addEventListener("click", close);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      scrim.removeEventListener("click", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [enlargeTransitionMs, unlockScroll]);

  const openItemFromElement = useCallback(
    (el: HTMLElement, itemData?: ImageItem) => {
      // If external click handler provided, use it instead of built-in enlarge
      if (onItemClick && itemData) {
        const poolIdx = parseInt((el.parentElement as HTMLElement)?.dataset?.poolIndex ?? "0", 10);
        onItemClick(itemData, isNaN(poolIdx) ? 0 : poolIdx);
        return;
      }

      if (openingRef.current) return;
      openingRef.current = true;
      openStartedAtRef.current = performance.now();
      lockScroll();
      const parent = el.parentElement as HTMLElement;
      focusedElRef.current = el;
      el.setAttribute("data-focused", "true");
      const offsetX = getDataNumber(parent, "offsetX", 0);
      const offsetY = getDataNumber(parent, "offsetY", 0);
      const sizeX   = getDataNumber(parent, "sizeX", 2);
      const sizeY   = getDataNumber(parent, "sizeY", 2);
      const parentRot = computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments);
      const parentY = normalizeAngle(parentRot.rotateY);
      const globalY = normalizeAngle(rotationRef.current.y);
      let rotY = -(parentY + globalY) % 360;
      if (rotY < -180) rotY += 360;
      const rotX = -parentRot.rotateX - rotationRef.current.x;
      parent.style.setProperty("--rot-y-delta", `${rotY}deg`);
      parent.style.setProperty("--rot-x-delta", `${rotX}deg`);
      const refDiv = document.createElement("div");
      refDiv.className = "item__image item__image--reference";
      refDiv.style.opacity = "0";
      refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
      parent.appendChild(refDiv);
      void refDiv.offsetHeight;
      const tileR  = refDiv.getBoundingClientRect();
      const mainR  = mainRef.current?.getBoundingClientRect();
      const frameR = frameRef.current?.getBoundingClientRect();
      if (!mainR || !frameR || tileR.width <= 0 || tileR.height <= 0) {
        openingRef.current = false;
        focusedElRef.current = null;
        parent.removeChild(refDiv);
        unlockScroll();
        return;
      }
      originalTilePositionRef.current = { left: tileR.left, top: tileR.top, width: tileR.width, height: tileR.height } as DOMRect;
      el.style.visibility = "hidden";
      el.style.zIndex = "0";
      const overlay = document.createElement("div");
      overlay.className = "enlarge";
      overlay.style.cssText = `position:absolute;left:${frameR.left - mainR.left}px;top:${frameR.top - mainR.top}px;width:${frameR.width}px;height:${frameR.height}px;opacity:0;z-index:30;will-change:transform,opacity;transform-origin:top left;transition:transform ${enlargeTransitionMs}ms ease,opacity ${enlargeTransitionMs}ms ease;`;
      const rawSrc = parent.dataset.src || el.querySelector("img")?.src || "";
      const img = document.createElement("img");
      img.src = rawSrc;
      overlay.appendChild(img);
      viewerRef.current!.appendChild(overlay);
      const tx0 = tileR.left - frameR.left;
      const ty0 = tileR.top  - frameR.top;
      const sx0 = tileR.width  / frameR.width;
      const sy0 = tileR.height / frameR.height;
      const vSx0 = isFinite(sx0) && sx0 > 0 ? sx0 : 1;
      const vSy0 = isFinite(sy0) && sy0 > 0 ? sy0 : 1;
      overlay.style.transform = `translate(${tx0}px,${ty0}px) scale(${vSx0},${vSy0})`;
      setTimeout(() => {
        if (!overlay.parentElement) return;
        overlay.style.opacity = "1";
        overlay.style.transform = "translate(0px,0px) scale(1,1)";
        rootRef.current?.setAttribute("data-enlarging", "true");
      }, 16);
      if (openedImageWidth || openedImageHeight) {
        const onFirstEnd = (ev: TransitionEvent) => {
          if (ev.propertyName !== "transform") return;
          overlay.removeEventListener("transitionend", onFirstEnd);
          const prevTransition = overlay.style.transition;
          overlay.style.transition = "none";
          const tempW = openedImageWidth  || `${frameR.width}px`;
          const tempH = openedImageHeight || `${frameR.height}px`;
          overlay.style.width  = tempW;
          overlay.style.height = tempH;
          const newRect = overlay.getBoundingClientRect();
          overlay.style.width  = frameR.width  + "px";
          overlay.style.height = frameR.height + "px";
          void overlay.offsetWidth;
          overlay.style.transition = `left ${enlargeTransitionMs}ms ease,top ${enlargeTransitionMs}ms ease,width ${enlargeTransitionMs}ms ease,height ${enlargeTransitionMs}ms ease`;
          const cLeft = frameR.left - mainR.left + (frameR.width  - newRect.width)  / 2;
          const cTop  = frameR.top  - mainR.top  + (frameR.height - newRect.height) / 2;
          requestAnimationFrame(() => {
            overlay.style.left   = `${cLeft}px`;
            overlay.style.top    = `${cTop}px`;
            overlay.style.width  = tempW;
            overlay.style.height = tempH;
          });
          overlay.addEventListener("transitionend", () => { overlay.style.transition = prevTransition; }, { once: true });
        };
        overlay.addEventListener("transitionend", onFirstEnd);
      }
    },
    [enlargeTransitionMs, lockScroll, onItemClick, openedImageHeight, openedImageWidth, segments, unlockScroll]
  );

  const onTileClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, itemData: ImageItem) => {
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current && !onItemClick) return;
      openItemFromElement(e.currentTarget, itemData);
    },
    [openItemFromElement, onItemClick]
  );

  const onTilePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, itemData: ImageItem) => {
      if (e.pointerType !== "touch") return;
      if (draggingRef.current) return;
      if (movedRef.current) return;
      if (performance.now() - lastDragEndAt.current < 80) return;
      if (openingRef.current && !onItemClick) return;
      openItemFromElement(e.currentTarget, itemData);
    },
    [openItemFromElement, onItemClick]
  );

  useEffect(() => {
    return () => {
      document.body.classList.remove("dg-scroll-lock");
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="sphere-root"
      style={
        {
          "--segments-x": segments,
          "--segments-y": segments,
          "--overlay-blur-color": overlayBlurColor,
          "--tile-radius": imageBorderRadius,
          "--enlarge-radius": openedImageBorderRadius,
          "--image-filter": grayscale ? "grayscale(1)" : "none",
        } as React.CSSProperties
      }
    >
      <main ref={mainRef} className="sphere-main">
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((it, i) => (
              <div
                key={`${it.x},${it.y},${i}`}
                className="item"
                data-src={it.src}
                data-offset-x={it.x}
                data-offset-y={it.y}
                data-size-x={it.sizeX}
                data-size-y={it.sizeY}
                data-pool-index={it.index}
                style={
                  {
                    "--offset-x": it.x,
                    "--offset-y": it.y,
                    "--item-size-x": it.sizeX,
                    "--item-size-y": it.sizeY,
                  } as React.CSSProperties
                }
              >
                <div
                  className="item__image"
                  role="button"
                  tabIndex={0}
                  aria-label={it.alt || "Open image"}
                  onClick={(e) => onTileClick(e, { src: it.src, alt: it.alt, slug: it.slug, price: it.price })}
                  onPointerUp={(e) => onTilePointerUp(e, { src: it.src, alt: it.alt, slug: it.slug, price: it.price })}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.src} draggable={false} alt={it.alt} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />

        <div className="viewer" ref={viewerRef}>
          <div ref={scrimRef} className="scrim" />
          <div ref={frameRef} className="frame" />
        </div>
      </main>
    </div>
  );
}
