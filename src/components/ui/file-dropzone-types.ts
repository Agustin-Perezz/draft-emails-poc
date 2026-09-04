export type FileDropzoneProps = {
  onFilesSelected: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
  showPreview?: boolean;
};

export type FileDropzonePreviewProps = {
  files: File[];
  onRemove?: (index: number) => void;
  className?: string;
};

export const DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const DEFAULT_MAX_FILES = 5;

export enum FileDropzoneError {
  FileTypeInvalid = "file-type-invalid",
  FileSizeExceeded = "file-size-exceeded",
  TooManyFiles = "too-many-files",
}

export const FILE_DROPZONE_ERROR_MESSAGE: Record<FileDropzoneError, string> = {
  [FileDropzoneError.FileTypeInvalid]:
    "Some files were rejected: unsupported type.",
  [FileDropzoneError.FileSizeExceeded]: "Some files were rejected: too large.",
  [FileDropzoneError.TooManyFiles]: "Some files were rejected: too many files.",
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
