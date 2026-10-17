import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BankMelliIcon, WebsiteDigikalaIcon } from "farsiui-icons";

describe("icon rendering", () => {
  it("renders WebsiteDigikalaIcon as an svg with accessible title", () => {
    const { container } = render(
      <WebsiteDigikalaIcon
        size={32}
        title="Digikala"
        className="brand-icon"
      />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label")).toBe("Digikala");
    expect(svg?.getAttribute("class")).toBe("brand-icon");
    expect(svg?.getAttribute("height")).toBe("32");
    expect(screen.getByTitle("Digikala")).toBeTruthy();
  });

  it("marks decorative icons with aria-hidden", () => {
    const { container } = render(<BankMelliIcon size={24} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("role")).toBeNull();
  });

  it("uses a square box for size", () => {
    const { container } = render(<WebsiteDigikalaIcon size={30} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("30");
    expect(svg?.getAttribute("height")).toBe("30");
    expect(svg?.getAttribute("preserveAspectRatio")).toBe("xMidYMid meet");
  });

  it("supports mono variant", () => {
    const { container } = render(
      <BankMelliIcon size={24} variant="mono" title="Melli" />,
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });
});
