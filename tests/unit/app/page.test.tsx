import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Next.js Image pulls in build-time machinery that does not run under Vitest;
// stub it as a plain <img>.
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: stubbing next/image for unit tests
    <img src={src} alt={alt} />
  ),
}));

import Home from "@/app/page";

describe("Home page", () => {
  it("renders the getting started heading", () => {
    render(<Home />);
    expect(
      screen.getByText("To get started, edit the page.tsx file."),
    ).toBeInTheDocument();
  });

  it("links to the Next.js docs", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name: "Documentation" })).toHaveAttribute(
      "href",
      expect.stringContaining("nextjs.org/docs"),
    );
  });
});
