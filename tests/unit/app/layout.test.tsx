import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// next/font runs Next.js build-time machinery that does not execute under
// Vitest; stub it to return the variable class hooks the layout uses.
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans", style: {} }),
  Geist_Mono: () => ({ variable: "--font-geist-mono", style: {} }),
}));

import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  it("renders children inside the html shell", () => {
    render(
      <RootLayout>
        <div>child content</div>
      </RootLayout>,
    );
    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
