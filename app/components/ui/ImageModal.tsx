import React, { useEffect, useState } from "react";
import { XIcon } from "~/components/ui/icons";
import { API_URL } from "~/config/constants";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setError(false);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [isOpen]);

  // Fetch slike sa API-ja (zahtijeva auth)
  useEffect(() => {
    if (!isOpen || !src) {
      setImageSrc(null);
      return;
    }
    // Ako je data URL ili blob, koristi direktno
    if (src.startsWith("data:") || src.startsWith("blob:")) {
      setImageSrc(src);
      return;
    }
    // API URL - fetch sa tokenom
    if (token) {
      setLoading(true);
      setError(false);
      fetch(`${API_URL}${src}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load image");
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 max-w-[95vw] max-h-[95vh] flex flex-col items-center">
        {title && (
          <h3 className="text-white font-bold text-sm mb-2 text-center">{title}</h3>
        )}
        {loading ? (
          <div className="p-12 rounded-xl bg-white/10 text-white">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto" />
          </div>
        ) : imageSrc && !error ? (
          <img
            src={imageSrc}
            alt={alt}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl bg-white"
            onClick={(e) => e.stopPropagation()}
            onError={() => setError(true)}
          />
        ) : (
          <div className="max-w-md p-8 rounded-xl bg-white/10 text-white text-center">
            <p className="text-sm font-bold">Slika nije dostupna ili nije učitana.</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Zatvori"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
