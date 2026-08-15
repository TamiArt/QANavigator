import { useEffect, useState, type WheelEvent } from "react";
import { Eye, Minus, Plus, RotateCcw, X } from "lucide-react";

interface HandbookImage {
  src: string;
  alt: string;
}

interface LightboxProps extends HandbookImage {
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

function Lightbox({ src, alt, onClose }: LightboxProps) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const changeZoom = (delta: number) => {
    setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + delta)));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "+" || event.key === "=") changeZoom(ZOOM_STEP);
      if (event.key === "-") changeZoom(-ZOOM_STEP);
      if (event.key === "0") setZoom(MIN_ZOOM);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    changeZoom(event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Увеличенное изображение: ${alt}`}
      className="fixed inset-0 z-[9999] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 p-3 text-white" onClick={(event) => event.stopPropagation()}>
        <p className="min-w-0 truncate text-sm text-white/80">{alt}</p>
        <div className="flex shrink-0 items-center gap-1 rounded-lg bg-white/10 p-1">
          <button
            type="button"
            aria-label="Уменьшить изображение"
            disabled={zoom === MIN_ZOOM}
            className="rounded-md p-2 hover:bg-white/15 disabled:opacity-30"
            onClick={() => changeZoom(-ZOOM_STEP)}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs tabular-nums">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            aria-label="Увеличить изображение"
            disabled={zoom === MAX_ZOOM}
            className="rounded-md p-2 hover:bg-white/15 disabled:opacity-30"
            onClick={() => changeZoom(ZOOM_STEP)}
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Сбросить масштаб"
            className="rounded-md p-2 hover:bg-white/15"
            onClick={() => setZoom(MIN_ZOOM)}
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button type="button" aria-label="Закрыть изображение" className="rounded-md p-2 hover:bg-white/15" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        className="flex flex-1 items-start justify-center overflow-auto p-4"
        onClick={(event) => event.stopPropagation()}
        onWheel={handleWheel}
      >
        <img
          src={src}
          alt={alt}
          className="rounded-xl object-contain shadow-2xl transition-[width] duration-150"
          style={{
            width: zoom === MIN_ZOOM ? "auto" : `${zoom * 100}%`,
            maxWidth: zoom === MIN_ZOOM ? "100%" : "none",
            maxHeight: zoom === MIN_ZOOM ? "82vh" : "none",
          }}
        />
      </div>
      <p className="pb-3 text-center text-xs text-white/60">Колесо мыши или клавиши +/− — масштаб · 0 — сброс · Esc — закрыть</p>
    </div>
  );
}

export function HandbookImages({ images }: { images: HandbookImage[] }) {
  const [selectedImage, setSelectedImage] = useState<HandbookImage | null>(null);

  return (
    <>
      <div className="mt-4 grid grid-cols-1 gap-3">
        {images.map((image) => (
          <button
            type="button"
            key={image.src}
            className="group relative cursor-zoom-in rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Открыть и увеличить изображение: ${image.alt}`}
            onClick={() => setSelectedImage(image)}
          >
            <img src={image.src} alt={image.alt} loading="lazy" className="max-h-[520px] w-full rounded-lg border border-border object-contain transition-transform duration-200 group-hover:scale-[1.01]" />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg">
              <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Eye className="h-3.5 w-3.5" /> Нажмите для увеличения
              </span>
            </span>
          </button>
        ))}
      </div>
      {selectedImage && <Lightbox {...selectedImage} onClose={() => setSelectedImage(null)} />}
    </>
  );
}
