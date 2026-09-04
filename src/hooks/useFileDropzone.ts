"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  DEFAULT_MAX_FILES,
  DEFAULT_MAX_SIZE_BYTES,
  type FileDropzoneProps,
} from "@/components/ui/file-dropzone-types";
import { getDropzoneErrorMessage } from "@/lib/dropzone-errors";

export type UseFileDropzoneOptions = Pick<
  FileDropzoneProps,
  | "onFilesSelected"
  | "accept"
  | "maxSize"
  | "maxFiles"
  | "multiple"
  | "disabled"
>;

export type UseFileDropzoneResult = {
  files: File[];
  error: string | null;
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  isDragActive: boolean;
  handleRemove: (index: number) => void;
};

export function useFileDropzone({
  onFilesSelected,
  accept,
  maxSize = DEFAULT_MAX_SIZE_BYTES,
  maxFiles = DEFAULT_MAX_FILES,
  multiple = true,
  disabled = false,
}: UseFileDropzoneOptions): UseFileDropzoneResult {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = (accepted: File[]) => {
    setError(null);
    const selected = multiple ? accepted : accepted.slice(0, 1);
    setFiles(selected);
    onFilesSelected(selected);
  };

  const handleRemove = (index: number) => {
    const reduced = files.filter((_, i) => i !== index);
    setFiles(reduced);
    onFilesSelected(reduced);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    onDropRejected: (rejections) => {
      setError(getDropzoneErrorMessage(rejections[0]?.errors[0]?.code ?? ""));
    },
    accept,
    maxSize,
    maxFiles,
    multiple,
    disabled,
  });

  return {
    files,
    error,
    getRootProps,
    getInputProps,
    isDragActive,
    handleRemove,
  };
}
