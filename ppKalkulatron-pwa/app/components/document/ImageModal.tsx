import { useEffect, useState } from "react";
import { XIcon } from "~/components/ui/icons";
import { API_URL } from "~/config/constants";
import { ModalShell } from "~/components/ui/ModalShell";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** URL slike - može biti direktan src ili API endpoint (zahtijeva token) */
  src?: string;
  /** Token za autentificirani fetch (kada src je API endpoint) */
  token?: string;
  alt?: string;
  title?: string;
}

export function ImageModal({ isOpen, onClose, src, token, alt = "Image", title }: ImageModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [contentType, setContentType] = useState<"image" | "pdf" | "html">("image");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError(false);
    }
    return () => {
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [isOpen, imageSrc]);

  useEffect(() => {
    if (!isOpen || !src) {
      setImageSrc(null);
      setContentType("image");
      return;
    }
    if (src.startsWith("data:") || src.startsWith("blob:")) {
      setImageSrc(src);
      return;
    }
    if (token) {
      setLoading(true);
      setError(false);
      fetch(`${API_URL}${src}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load image");
          const type = (res.headers.get("content-type") || "").toLowerCase();
          if (type.includes("application/pdf")) {
            setContentType("pdf");
          } else if (type.includes("text/html")) {
            setContentType("html");
          } else {
            setContentType("image");
          }
          return res.blob();
        })
        .then((blob) => {
          setImageSrc(URL.createObjectURL(blob));
        })
        .catch(() => setError(true))
        .finally(() => setLoading(false));
      return () => {};
    }
    setImageSrc(src);
  }, [isOpen, src, token]);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      backdropClassName="bg-black/80 backdrop-blur-sm"
      contentClassName="max-w-[95vw] max-h-[95vh] flex flex-col items-center"
    >
        {title && (
          <h3 className="text-white font-bold text-sm mb-2 text-center">{title}</h3>
        )}
        {loading ? (
          <div className="p-12 rounded-xl bg-white/10 text-white">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto" />
          </div>
        ) : imageSrc && !error ? (
          contentType === "pdf" ? (
            <iframe
              src={imageSrc}
              title={title || "PDF pregled"}
              className="w-[90vw] h-[80vh] rounded-xl bg-white"
              onClick={(e) => e.stopPropagation()}
            />
          ) : contentType === "html" ? (
            <iframe
              src={imageSrc}
              title={title || "HTML pregled"}
              className="w-[90vw] h-[80vh] rounded-xl bg-white"
              sandbox="allow-same-origin"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
          <img
            src={imageSrc}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
            onError={() => setError(true)}
          />
          )
        ) : (
          <div className="max-w-md p-8 rounded-xl bg-white/10 text-white text-center">
            <p className="text-sm font-bold">Sadržaj nije dostupan ili nije učitan.</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Zatvori"
        >
          <XIcon className="h-5 w-5" />
        </button>
    </ModalShell>
  );
}
