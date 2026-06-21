import { motion } from "framer-motion";
import { useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { CameraIcon, UploadIcon } from "../icons";

interface UploadZoneProps {
  onFile: (file: File) => void;
}

/**
 * The sonar drop zone. Radar rings ping outward every few seconds and speed
 * up on hover. Accepts everything the product will handle; the page decides
 * what the pipeline can analyze today.
 */
export function UploadZone({ onFile }: UploadZoneProps) {
  const cameraRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      "image/*": [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".heic"],
      "audio/*": [".mp3", ".wav"],
      "video/*": [".mp4", ".mov"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.35 }}
    >
      <div
        {...getRootProps()}
        className={`radar-zone group relative mx-auto flex h-72 max-w-xl cursor-pointer flex-col items-center justify-center rounded-[2rem] border transition-colors duration-300 sm:h-80 ${
          isDragActive
            ? "radar-fast border-teal-300/70 bg-teal-300/[0.04]"
            : "border-teal-300/25 bg-white/[0.015] hover:radar-fast hover:border-teal-300/50"
        }`}
      >
        <input {...getInputProps()} aria-label="Upload a file to analyze" />
        {/* sonar rings */}
        <span className="radar-ring" />
        <span className="radar-ring" style={{ animationDelay: "1.6s" }} />

        <UploadIcon size={34} className="text-teal-200/70 transition-transform duration-300 group-hover:-translate-y-1" />
        <p className="mt-5 max-w-xs text-center font-display text-lg text-ink/90">
          {isDragActive ? "Release to scan" : "Drop any image, audio, video, or document"}
        </p>
        <p className="mt-2 text-sm text-faint">or click to browse</p>
        <p className="mt-6 px-4 font-mono text-[11px] tracking-[0.12em] text-faint sm:tracking-[0.2em]">
          JPG&ensp;PNG&ensp;WEBP&ensp;MP3&ensp;WAV&ensp;MP4&ensp;MOV&ensp;PDF&ensp;DOCX
        </p>
      </div>

      {/* mobile camera path */}
      <div className="mt-4 text-center sm:hidden">
        <button
          onClick={() => cameraRef.current?.click()}
          className="inline-flex items-center gap-2 text-sm text-teal-200/90"
        >
          <CameraIcon size={18} /> or use your camera
        </button>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </div>
    </motion.div>
  );
}
