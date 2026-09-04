"use client";

import { useFileDropzone } from "@/hooks/useFileDropzone";
import { cn } from "@/lib/utils";
import { FileDropzonePreview } from "./file-dropzone-preview";
import { FileDropzoneRegion } from "./file-dropzone-region";
import {
  DEFAULT_MAX_FILES,
  DEFAULT_MAX_SIZE_BYTES,
  type FileDropzoneProps,
} from "./file-dropzone-types";

export function FileDropzone({
  onFilesSelected,
  accept,
  maxSize = DEFAULT_MAX_SIZE_BYTES,
  maxFiles = DEFAULT_MAX_FILES,
  multiple = true,
  disabled = false,
  className,
  label = "Drag files here or click to browse",
  description,
  showPreview = true,
}: FileDropzoneProps) {
  const {
    files,
    error,
    getRootProps,
    getInputProps,
    isDragActive,
    handleRemove,
  } = useFileDropzone({
    onFilesSelected,
    accept,
    maxSize,
    maxFiles,
    multiple,
    disabled,
  });

  return (
    <div
      data-slot="file-dropzone"
      className={cn("flex flex-col gap-3", className)}
    >
      <FileDropzoneRegion
        isDragActive={isDragActive}
        disabled={disabled}
        label={label}
        description={description}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      {showPreview && files.length > 0 && (
        <FileDropzonePreview files={files} onRemove={handleRemove} />
      )}
    </div>
  );
}
