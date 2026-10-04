import { useRef, useState } from 'react';
import { IconCamera, IconX } from './Icons.jsx';

const FORMATS = ['ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'upc_a', 'upc_e', 'qr_code', 'itf'];

export function BarcodeScanButton({ onScan }) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const stopRef = useRef(null);

  async function handleClick() {
    if (!navigator.mediaDevices?.getUserMedia) {
      fileRef.current?.click();
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (err) {
      if (err?.name === 'NotAllowedError') {
        alert('Permiso de cámara denegado.\niPhone: Ajustes > Safari > Cámara → Permitir, luego recargá.');
      } else {
        fileRef.current?.click();
      }
      return;
    }

    const video = videoRef.current;
    video.srcObject = stream;
    try {
      await video.play();
    } catch {
      // iOS rechazó play() — fallback a foto
      stream.getTracks().forEach((t) => t.stop());
      fileRef.current?.click();
      return;
    }

    setOpen(true);

    let cancelled = false;
    stopRef.current = () => {
      cancelled = true;
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    };

    if ('BarcodeDetector' in window) {
      // Nativo: iOS 17+, Android Chrome, macOS Safari 17+
      // No usa canvas — evita el canvas-taint de iOS
      let detector;
      try { detector = new BarcodeDetector({ formats: FORMATS }); }
      catch { detector = new BarcodeDetector(); }

      const loop = async () => {
        if (cancelled) return;
        if (video.videoWidth > 0) {
          try {
            const barcodes = await detector.detect(video);
            if (barcodes.length > 0 && !cancelled) {
              stopRef.current?.();
              setOpen(false);
              onScan(barcodes[0].rawValue);
              return;
            }
          } catch { /* sin código en este frame */ }
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);

    } else {
      // ZXing: Firefox desktop y navegadores sin BarcodeDetector
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const loop = () => {
        if (cancelled) return;
        if (!video.videoWidth) { requestAnimationFrame(loop); return; }
        reader.decodeFromVideoElement(video)
          .then((result) => {
            if (!cancelled) {
              stopRef.current?.();
              setOpen(false);
              onScan(result.getText());
            }
          })
          .catch(() => { if (!cancelled) requestAnimationFrame(loop); });
      };
      requestAnimationFrame(loop);
    }
  }

  function closeScanner() {
    stopRef.current?.();
    stopRef.current = null;
    setOpen(false);
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const url = URL.createObjectURL(file);
      try {
        const result = await new BrowserMultiFormatReader().decodeFromImageUrl(url);
        onScan(result.getText());
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      alert('No se detectó ningún código.\nIntentá con mejor luz y encuadrando bien el código.');
    }
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }} onChange={handleFile} />

      <button type="button" className="scan-camera-btn" onClick={handleClick}
        title="Escanear código con cámara" aria-label="Escanear código con cámara">
        <IconCamera size={17} />
      </button>

      {/* Siempre en el DOM — el video debe existir antes de setOpen(true) para iOS */}
      <div
        className="scanner-overlay"
        aria-hidden={!open}
        onClick={closeScanner}
      >
        <div className="scanner-modal" onClick={(e) => e.stopPropagation()}>
          <div className="scanner-header">
            <span className="scanner-title">Apuntá al código de barras</span>
            <button type="button" className="scanner-close" onClick={closeScanner} aria-label="Cerrar escáner">
              <IconX size={18} />
            </button>
          </div>
          <div className="scanner-viewport">
            <video ref={videoRef} className="scanner-video" autoPlay muted playsInline />
            <div className="scanner-reticle" />
          </div>
          <p className="scanner-hint">Centrá el código en el recuadro — se detecta solo</p>
        </div>
      </div>
    </>
  );
}
