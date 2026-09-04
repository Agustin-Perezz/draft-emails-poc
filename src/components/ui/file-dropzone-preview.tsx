"use client";

import { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";
import { FileDropzonePreviewItem } from "./file-dropzone-preview-item";
import type { FileDropzonePreviewProps } from "./file-dropzone-types";

export function FileDropzonePreview({
  files,
  onRemove,
  className,
}: FileDropzonePreviewProps) {
  const previews = useMemo(
    () =>
      files.map((file) =>
        file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      ),
    [files],
  );

  useEffect(() => {
    return () => {
      for (const url of previews) {
        if (url) {
          URL.revokeObjectURL(url);
        }
      }
    };
  }, [previews]);

  return (
    <ul
      data-slot="file-dropzone-preview"
      className={cn("flex flex-col gap-2", className)}
    >
      {files.map((file, index) => (
        <FileDropzonePreviewItem
          key={crypto.randomUUID()}
          file={file}
          previewUrl={previews[index]}
          onRemove={onRemove ? () => onRemove(index) : undefined}
        />
      ))}
    </ul>
  );
}
