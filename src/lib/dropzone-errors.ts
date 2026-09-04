import {
  FILE_DROPZONE_ERROR_MESSAGE,
  FileDropzoneError,
} from "@/components/ui/file-dropzone-types";

export function mapDropzoneErrorCode(code: string): FileDropzoneError {
  if (code === "file-too-large") {
    return FileDropzoneError.FileSizeExceeded;
  }
  if (code === "too-many-files") {
    return FileDropzoneError.TooManyFiles;
  }
  return FileDropzoneError.FileTypeInvalid;
}

export function getDropzoneErrorMessage(code: string): string {
  return FILE_DROPZONE_ERROR_MESSAGE[mapDropzoneErrorCode(code)];
}
