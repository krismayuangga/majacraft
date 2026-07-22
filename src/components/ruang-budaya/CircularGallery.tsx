/* CircularGallery — Diadaptasi dari the-maja (OGL WebGL)
 * Source: https://github.com/krismayuangga/the-maja
 */
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";
import { useEffect, useRef } from "react";

/* ─── Helpers ─── */
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout>;
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms);
  };
}
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function autoBind(o: any) {
  const proto = Object.getPrototypeOf(o);
  Object.getOwnPropertyNames(proto).forEach(k => {
    if (k !== "constructor" && typeof o[k] === "function") o[k] = o[k].bind(o);
  });
}
function createTextTexture(gl: any, text: string, font = "bold 28px sans-serif", color = "#ffffff") {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  ctx.font = font;
  const m = ctx.measureText(text);
  canvas.width  = Math.ceil(m.width) + 20;
  canvas.height = Math.ceil(parseInt(font) * 1.2) + 20;
  ctx.font = font; ctx.fillStyle = color;
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const tex = new Texture(gl, { generateMipmaps: false });
  tex.image = canvas;
  return { texture: tex, width: canvas.width, height: canvas.height };
}

/* ─── Title ─── */
class Title {
  mesh: any;
  constructor({ gl, plane, renderer, text, textColor = "#C9A84C", font = "bold 24px sans-serif" }: any) {
    autoBind(this);
    const { texture, width, height } = createTextTexture(gl, text, font, textColor);
    const geo  = new Plane(gl);
    const prog = new Program(gl, {
      vertex: `attribute vec3 position;attribute vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragment: `precision highp float;uniform sampler2D tMap;varying vec2 vUv;void main(){vec4 c=texture2D(tMap,vUv);if(c.a<0.1)discard;gl_FragColor=c;}`,
      uniforms: { tMap: { value: texture } }, transparent: true,
    });
    this.mesh = new Mesh(gl, { geometry: geo, program: prog });
    const aspect = width / height;
    const th = plane.scale.y * 0.12;
    this.mesh.scale.set(th * aspect, th, 1);
    this.mesh.position.y = -plane.scale.y * 0.5 - th * 0.5 - 0.05;
    this.mesh.setParent(plane);
    void renderer;
  }
}

/* ─── Media ─── */
class Media {
  extra = 0; geometry: any; gl: any; image: string; index: number; length: number;
  renderer: any; scene: any; screen: any; text: string; viewport: any; bend: number;
  textColor: string; borderRadius: number; font: string; program: any; plane: any;
  title: any; scale = 1; padding = 2; width = 0; widthTotal = 0; x = 0;
  speed = 0; isBefore = false; isAfter = false; originalItem: any;

  constructor({ geometry, gl, image, index, length, renderer, scene, screen, text, viewport, bend, textColor, borderRadius = 0, font, originalItem }: any) {
    this.geometry = geometry; this.gl = gl; this.image = image; this.index = index;
    this.length = length; this.renderer = renderer; this.scene = scene;
    this.screen = screen; this.text = text; this.viewport = viewport; this.bend = bend;
    this.textColor = textColor; this.borderRadius = borderRadius; this.font = font;
    this.originalItem = originalItem;
    this.createShader(); this.createMesh(); this.createTitle(); this.onResize();
  }

  createShader() {
    const tex = new Texture(this.gl, { generateMipmaps: true });
    this.program = new Program(this.gl, {
      depthTest: false, depthWrite: false,
      vertex: `precision highp float;attribute vec3 position;attribute vec2 uv;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;uniform float uTime;uniform float uSpeed;varying vec2 vUv;void main(){vUv=uv;vec3 p=position;p.z=(sin(p.x*4.+uTime)*1.5+cos(p.y*2.+uTime)*1.5)*(0.1+uSpeed*0.5);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,
      fragment: `precision highp float;uniform vec2 uImageSizes;uniform vec2 uPlaneSizes;uniform sampler2D tMap;uniform float uBorderRadius;varying vec2 vUv;float rBoxSDF(vec2 p,vec2 b,float r){vec2 d=abs(p)-b;return length(max(d,vec2(0.)))+min(max(d.x,d.y),0.)-r;}void main(){vec2 ratio=vec2(min((uPlaneSizes.x/uPlaneSizes.y)/(uImageSizes.x/uImageSizes.y),1.),min((uPlaneSizes.y/uPlaneSizes.x)/(uImageSizes.y/uImageSizes.x),1.));vec2 uv=vec2(vUv.x*ratio.x+(1.-ratio.x)*0.5,vUv.y*ratio.y+(1.-ratio.y)*0.5);vec4 color=texture2D(tMap,uv);float d=rBoxSDF(vUv-0.5,vec2(0.5-uBorderRadius),uBorderRadius);float alpha=1.-smoothstep(-0.002,0.002,d);gl_FragColor=vec4(color.rgb,alpha);}`,
      uniforms: { tMap:{value:tex}, uPlaneSizes:{value:[0,0]}, uImageSizes:{value:[0,0]}, uSpeed:{value:0}, uTime:{value:100*Math.random()}, uBorderRadius:{value:this.borderRadius} },
      transparent: true,
    });
    const img = new Image();
    img.crossOrigin = "anonymous"; img.src = this.image;
    img.onload = () => { tex.image = img; this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight]; };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.title = new Title({ gl:this.gl, plane:this.plane, renderer:this.renderer, text:this.text, textColor:this.textColor, font:this.font });
  }

  update(scroll: any, direction: string) {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x, H = this.viewport.width / 2;
    if (this.bend === 0) { this.plane.position.y = 0; this.plane.rotation.z = 0; }
    else {
      const R = (H*H + this.bend*this.bend)/(2*Math.abs(this.bend));
      const ex = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R*R - ex*ex);
      this.plane.position.y = this.bend > 0 ? -arc : arc;
      this.plane.rotation.z = (this.bend > 0 ? -1 : 1) * Math.sign(x) * Math.asin(ex/R);
    }
    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed * 0.4;
    const po = this.plane.scale.x/2, vo = this.viewport.width/2;
    this.isBefore = this.plane.position.x + po < -vo;
    this.isAfter  = this.plane.position.x - po >  vo;
    if (direction==="right" && this.isBefore) { this.extra -= this.widthTotal; this.isBefore=this.isAfter=false; }
    if (direction==="left"  && this.isAfter)  { this.extra += this.widthTotal; this.isBefore=this.isAfter=false; }
  }

  onResize({ screen, viewport }: any = {}) {
    if (screen) this.screen = screen;
    if (viewport) this.viewport = viewport;
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (650 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width  * (500 * this.scale)) / this.screen.width;
    this.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 1;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

/* ─── GalleryApp ─── */
class GalleryApp {
  container: HTMLElement; scrollSpeed: number;
  scroll: { ease:number; current:number; target:number; last:number; position:number };
  onCheckDebounce: any; renderer: any; gl: any; camera: any; scene: any;
  planeGeometry: any; medias: Media[]; mediasImages: any[];
  screen: {width:number;height:number}; viewport: {width:number;height:number};
  raf: number; isDown: boolean; start: number; autoRotateSpeed: number;
  onItemClick: ((item:any, idx:number)=>void)|undefined; isDragged: boolean; startX: number;
  boundOnResize:()=>void; boundOnWheel:(e:any)=>void; boundOnTouchDown:(e:any)=>void;
  boundOnTouchMove:(e:any)=>void; boundOnTouchUp:(e:any)=>void; boundOnClick:(e:any)=>void;

  constructor(container: HTMLElement, { items, bend=3, textColor="#C9A84C", borderRadius=0.05, font="bold 24px sans-serif", scrollSpeed=2, scrollEase=0.05, autoRotateSpeed=0.3, onItemClick }: any = {}) {
    this.container = container; this.scrollSpeed = scrollSpeed;
    this.scroll = { ease:scrollEase, current:0, target:0, last:0, position:0 };
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.medias = []; this.mediasImages = [];
    this.screen = {width:0,height:0}; this.viewport = {width:0,height:0};
    this.raf = 0; this.isDown = false; this.start = 0; this.autoRotateSpeed = autoRotateSpeed;
    this.onItemClick = onItemClick; this.isDragged = false; this.startX = 0;
    this.boundOnResize   = this.onResize.bind(this);
    this.boundOnWheel    = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp   = this.onTouchUp.bind(this);
    this.boundOnClick     = this.onClick.bind(this);
    this.createRenderer(); this.createCamera(); this.createScene(); this.onResize();
    this.createGeometry(); this.createMedias(items, bend, textColor, borderRadius, font);
    this.update(); this.addEventListeners();
  }

  createRenderer() {
    this.renderer = new Renderer({ alpha:true, antialias:true, dpr:Math.min(window.devicePixelRatio||1,2) });
    this.gl = this.renderer.gl; this.gl.clearColor(0,0,0,0);
    this.container.appendChild(this.gl.canvas);
  }
  createCamera() { this.camera = new Camera(this.gl); this.camera.fov=45; this.camera.position.z=20; }
  createScene()  { this.scene = new Transform(); }
  createGeometry(){ this.planeGeometry = new Plane(this.gl, { heightSegments:50, widthSegments:100 }); }

  createMedias(items:any[], bend:number, textColor:string, borderRadius:number, font:string) {
    const src = items?.length ? items : [];
    this.mediasImages = src.concat(src);
    this.medias = this.mediasImages.map((d,i) => new Media({
      geometry:this.planeGeometry, gl:this.gl, image:d.image, index:i,
      length:this.mediasImages.length, renderer:this.renderer, scene:this.scene,
      screen:this.screen, text:d.text, viewport:this.viewport,
      bend, textColor, borderRadius, font, originalItem:d,
    }));
  }

  onTouchDown(e: MouseEvent|TouchEvent) {
    this.isDown=true; this.isDragged=false; this.scroll.position=this.scroll.current;
    const cx="touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    this.start=cx; this.startX=cx;
  }
  onTouchMove(e: MouseEvent|TouchEvent) {
    if (!this.isDown) return;
    const x="touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    if (Math.abs(x-this.startX)>5) this.isDragged=true;
    this.scroll.target = this.scroll.position + (this.start-x)*(this.scrollSpeed*0.025);
  }
  onTouchUp() { this.isDown=false; this.onCheck(); }
  onClick(_e: MouseEvent) {
    if (this.isDragged||!this.onItemClick) return;
    let ci=0, cd=Infinity;
    if (this.medias) this.medias.forEach((m,i)=>{ const d=Math.abs(m.plane.position.x); if(d<cd){cd=d;ci=i;} });
    const cm=this.medias[ci];
    if (cm?.originalItem) this.onItemClick(cm.originalItem, ci%(this.mediasImages.length/2));
  }
  onWheel(e: WheelEvent) {
    e.stopPropagation();
    const d=e.deltaY||(e as any).wheelDelta;
    this.scroll.target += (d>0?this.scrollSpeed:-this.scrollSpeed)*0.2;
    this.onCheckDebounce();
  }
  onCheck() {
    if (!this.medias?.[0]) return;
    const w=this.medias[0].width, idx=Math.round(Math.abs(this.scroll.target)/w);
    const item=w*idx;
    this.scroll.target=this.scroll.target<0?-item:item;
  }
  onResize() {
    this.screen={width:this.container.clientWidth, height:this.container.clientHeight};
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({aspect:this.screen.width/this.screen.height});
    const fov=(this.camera.fov*Math.PI)/180;
    const h=2*Math.tan(fov/2)*this.camera.position.z;
    this.viewport={width:h*(this.screen.width/this.screen.height), height:h};
    if (this.medias) this.medias.forEach(m=>m.onResize({screen:this.screen, viewport:this.viewport}));
  }
  update() {
    if (!this.isDown && this.autoRotateSpeed) this.scroll.target += this.autoRotateSpeed*0.008;
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const dir = this.scroll.current>this.scroll.last?"right":"left";
    if (this.medias) this.medias.forEach(m=>m.update(this.scroll, dir));
    this.renderer.render({scene:this.scene, camera:this.camera});
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }
  addEventListeners() {
    window.addEventListener("resize", this.boundOnResize);
    this.container.addEventListener("wheel", this.boundOnWheel, {passive:false});
    this.container.addEventListener("mousedown", this.boundOnTouchDown);
    this.container.addEventListener("mousemove", this.boundOnTouchMove);
    this.container.addEventListener("mouseup", this.boundOnTouchUp);
    this.container.addEventListener("click", this.boundOnClick);
    this.container.addEventListener("touchstart", this.boundOnTouchDown);
    this.container.addEventListener("touchmove", this.boundOnTouchMove);
    this.container.addEventListener("touchend", this.boundOnTouchUp);
  }
  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.boundOnResize);
    ["wheel","mousedown","mousemove","mouseup","click","touchstart","touchmove","touchend"].forEach(ev=>{
      const h=(this as any)[`bound${ev.charAt(0).toUpperCase()+ev.slice(1)}`]??this.boundOnTouchDown;
      this.container.removeEventListener(ev, h);
    });
    this.container.removeEventListener("wheel", this.boundOnWheel);
    this.container.removeEventListener("mousedown", this.boundOnTouchDown);
    this.container.removeEventListener("mousemove", this.boundOnTouchMove);
    this.container.removeEventListener("mouseup", this.boundOnTouchUp);
    this.container.removeEventListener("click", this.boundOnClick);
    this.container.removeEventListener("touchstart", this.boundOnTouchDown);
    this.container.removeEventListener("touchmove", this.boundOnTouchMove);
    this.container.removeEventListener("touchend", this.boundOnTouchUp);
    if (this.renderer?.gl?.canvas?.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

/* ─── React Component ─── */
export interface GalleryItem {
  image: string;
  text: string;
  slug?: string;
  price?: number;
}

interface Props {
  items: GalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  autoRotateSpeed?: number;
  onItemClick?: (item: GalleryItem, index: number) => void;
}

export default function CircularGallery({ items, bend=3, textColor="#C9A84C", borderRadius=0.05, font="bold 24px sans-serif", scrollSpeed=2, scrollEase=0.05, autoRotateSpeed=0.35, onItemClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef       = useRef<GalleryApp | null>(null);

  useEffect(() => {
    if (!containerRef.current || !items.length) return;
    const app = new GalleryApp(containerRef.current, { items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase, autoRotateSpeed, onItemClick });
    appRef.current = app;
    return () => { app.destroy(); appRef.current=null; };
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase, autoRotateSpeed, onItemClick]);

  return (
    <div ref={containerRef} style={{ width:"100%", height:"100%", overflow:"hidden", cursor:"grab" }}
      onMouseDown={e=>e.currentTarget.style.cursor="grabbing"}
      onMouseUp={e=>e.currentTarget.style.cursor="grab"}
    />
  );
}
