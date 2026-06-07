import React, { useCallback, useRef, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { Upload, ImageOff, X, Loader2, Camera } from 'lucide-react';

interface Props {
  /** ID del curso ya creado. Si es null/undefined, la imagen se mostrará como preview local. */
  courseId?: number | null;
  /** URL actual de la imagen (para preview). */
  currentImageUrl?: string | null;
  /** Callback cuando la imagen se sube exitosamente. Recibe la nueva ruta de storage. */
  onUploaded: (path: string, fullUrl: string) => void;
  onPendingFile?: (file: File | null) => void;
}

/**
 * Subida de imagen para curso con drag-and-drop + click para abrir.
 * Sube vía POST /api/v1/admin/courses/{id}/image (multipart).
 * Backend guarda en storage/app/public/courses/images/{slug}-{timestamp}.{ext}
 */
export function CourseImageUploader({ courseId, currentImageUrl, onUploaded, onPendingFile }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync preview cuando cambian las props (por ejemplo al editar otro curso)
  React.useEffect(() => { setPreview(currentImageUrl ?? null); }, [currentImageUrl]);

  const validate = (file: File): string | null => {
    if (!file.type.startsWith('image/')) return 'Solo se permiten archivos de imagen.';
    if (file.size > 5 * 1024 * 1024) return 'La imagen no puede pesar más de 5 MB.';
    const ok = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!ok.includes(file.type)) return 'Formato no soportado. Usa JPG, PNG, WebP o AVIF.';
    return null;
  };

  const upload = useCallback(async (file: File) => {
    setError(null);

    if (!courseId) {
      // No course yet — show local preview only, actual upload will happen after save
      const validationError = validate(file);
      if (validationError) { setError(validationError); return; }

      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);
      onPendingFile?.(file);
      onUploaded('', localUrl);
      return;
    }

    const validationError = validate(file);
    if (validationError) { setError(validationError); return; }

    // Preview optimista local
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await apiClient.post(
        `/api/v1/admin/courses/${courseId}/image`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      // El backend devuelve image_url (URL pública) y path (relativo)
      setPreview(data.image_url);
      onPendingFile?.(null);
      onUploaded(data.path, data.image_url);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'No se pudo subir la imagen.');
      setPreview(currentImageUrl ?? null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  }, [courseId, currentImageUrl, onPendingFile, onUploaded]);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const clear = () => {
    setPreview(null);
    setError(null);
    onPendingFile?.(null);
    onUploaded('', '');
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={handleFile}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative cursor-pointer border-2 border-dashed rounded-xl transition-all overflow-hidden
          ${dragOver ? 'border-secondary bg-secondary/5' : 'border-slate-300 hover:border-secondary hover:bg-slate-50'}
          ${preview ? 'h-44' : 'h-32'}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="bg-white/90 text-slate-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-white"
              >
                <Camera className="w-3.5 h-3.5" /> Cambiar
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clear(); }}
                className="bg-red-500/90 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-red-500"
              >
                <X className="w-3.5 h-3.5" /> Quitar
              </button>
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-white animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 px-4">
            {uploading ? (
              <Loader2 className="w-7 h-7 animate-spin text-secondary" />
            ) : (
              <>
                {dragOver ? (
                  <>
                    <Upload className="w-7 h-7 text-secondary mb-2" />
                    <span className="text-sm font-bold text-secondary">Suelta la imagen aquí</span>
                  </>
                ) : (
                  <>
                    <ImageOff className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium text-center">
                      Arrastra una imagen aquí o <span className="text-secondary font-bold">haz click para abrir</span>
                    </span>
                    <span className="text-[10px] text-slate-300 mt-1">JPG, PNG, WebP, AVIF · máx. 5 MB</span>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

    </div>
  );
}
