"use client";

import { FileIcon, X } from "lucide-react";

import { formatFileSize } from "./file-dropzone-types";

export type FileDropzonePreviewItemProps = {
  file: File;
  previewUrl: string | null;
  onRemove?: () => void;
};

export function FileDropzonePreviewItem({
  file,
  previewUrl,
  onRemove,
}: FileDropzonePreviewItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-background p-2">
      {previewUrl ? (
        // biome-ignore lint/performance/noImgElement: blob URLs from user-selected files are not served by Next.js image optimization
        <img
          src={previewUrl}
          alt={file.name}
          className="size-10 rounded object-cover"
        />
      ) : (
        <FileIcon className="size-10 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </li>
  );
}
