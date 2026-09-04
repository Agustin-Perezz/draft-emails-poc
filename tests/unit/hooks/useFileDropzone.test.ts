import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const captured: {
  onDrop: (accepted: File[]) => void;
  onDropRejected: (rejections: { errors: { code: string }[] }[]) => void;
}[] = [];

vi.mock("react-dropzone", () => ({
  useDropzone: (opts: {
    onDrop: (accepted: File[]) => void;
    onDropRejected: (rejections: { errors: { code: string }[] }[]) => void;
  }) => {
    captured.push(opts);
    return {
      getRootProps: () => ({}),
      getInputProps: () => ({}),
      isDragActive: false,
    };
  },
}));

import { useFileDropzone } from "@/hooks/useFileDropzone";

function cb() {
  return captured[captured.length - 1];
}

function makeFile(name: string, size = 1024): File {
  return new File([new ArrayBuffer(size)], name, { type: "image/png" });
}

describe("useFileDropzone", () => {
  it("stores accepted files and calls onFilesSelected (multiple)", () => {
    const onFilesSelected = vi.fn();
    const { result } = renderHook(() => useFileDropzone({ onFilesSelected }));

    const accepted = [makeFile("a.png"), makeFile("b.png")];
    act(() => cb().onDrop(accepted));

    expect(result.current.files).toEqual(accepted);
    expect(onFilesSelected).toHaveBeenCalledWith(accepted);
    expect(result.current.error).toBeNull();
  });

  it("keeps only the first file when multiple is false", () => {
    const onFilesSelected = vi.fn();
    const { result } = renderHook(() =>
      useFileDropzone({ onFilesSelected, multiple: false }),
    );

    const accepted = [makeFile("a.png"), makeFile("b.png")];
    act(() => cb().onDrop(accepted));

    expect(result.current.files).toEqual([accepted[0]]);
    expect(onFilesSelected).toHaveBeenCalledWith([accepted[0]]);
  });

  it("removes a file by index and notifies onFilesSelected", () => {
    const onFilesSelected = vi.fn();
    const { result } = renderHook(() => useFileDropzone({ onFilesSelected }));

    const accepted = [makeFile("a.png"), makeFile("b.png"), makeFile("c.png")];
    act(() => cb().onDrop(accepted));
    act(() => result.current.handleRemove(1));

    expect(result.current.files).toEqual([accepted[0], accepted[2]]);
    expect(onFilesSelected).toHaveBeenLastCalledWith([
      accepted[0],
      accepted[2],
    ]);
  });

  it("sets an error message on rejected drop", () => {
    const onFilesSelected = vi.fn();
    const { result } = renderHook(() => useFileDropzone({ onFilesSelected }));

    act(() => cb().onDropRejected([{ errors: [{ code: "file-too-large" }] }]));

    expect(result.current.error).toBe("Some files were rejected: too large.");
    expect(result.current.files).toEqual([]);
  });
});
