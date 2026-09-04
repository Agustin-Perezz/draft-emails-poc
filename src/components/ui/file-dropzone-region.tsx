"use client";

import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type FileDropzoneRegionProps = {
  isDragActive: boolean;
  disabled: boolean;
  label: string;
  description?: string;
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
};

export function FileDropzoneRegion({
  isDragActive,
  disabled,
  label,
  description,
  getRootProps,
  getInputProps,
}: FileDropzoneRegionProps) {
  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/50 p-6 text-center transition-colors",
        isDragActive && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input {...getInputProps()} />
      <Upload className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium">{label}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <Button type="button" variant="outline" size="sm" disabled={disabled}>
        Browse files
      </Button>
    </div>
  );
}
