import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";
import MobileTabBar, { type MobileTabItem } from "./MobileTabBar";
import { Home, Search, PlusCircle } from "lucide-react";
import { LanguageProvider } from "@/i18n/LanguageContext";

function renderNav(ui: ReactElement, initialEntry = "/shipper/dashboard") {
  return render(
    <LanguageProvider>
      <MemoryRouter initialEntries={[initialEntry]}>{ui}</MemoryRouter>
    </LanguageProvider>
  );
}

const tabs: MobileTabItem[] = [
  { label: "Home", path: "/shipper/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Find Trucks", path: "/browse-trucks", icon: <Search className="h-5 w-5" /> },
];

const centerAction: MobileTabItem = {
  label: "Post Load",
  path: "/shipper/post-shipment",
  icon: <PlusCircle className="h-6 w-6" />,
};

/**
 * Fake VisualViewport that can be shrunk after render, firing the registered
 * listeners — mirrors a real keyboard opening/closing.
 */
function makeVv(initialHeight = 600) {
  let height = initialHeight;
  const listeners: Array<() => void> = [];
  const vv = {
    get height() {
      return height;
    },
    width: 375,
    scale: 1,
    addEventListener: (_type: string, fn: () => void) => listeners.push(fn),
    removeEventListener: vi.fn(),
    setHeight: (h: number) => {
      height = h;
      listeners.forEach((fn) => fn());
    },
  };
  return vv;
}

describe("MobileTabBar (island nav)", () => {
  const coarsePointer = () => {
    // The island's keyboard hook gates on coarse-pointer devices; jsdom lacks matchMedia.
    Object.defineProperty(window, "matchMedia", {
      value: vi.fn().mockReturnValue({ matches: true }),
      configurable: true,
    });
  };

  afterEach(() => {
    // @ts-expect-error reset the mocks between tests
    delete window.visualViewport;
    // @ts-expect-error reset the matchMedia stub between tests
    delete window.matchMedia;
  });

  it("renders the island pill with role-agnostic nav semantics", () => {
    renderNav(<MobileTabBar tabs={tabs} menuItems={tabs} centerAction={centerAction} accent="blue" />);

    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(nav).toBeInTheDocument();

    // Island morphology: centered, max-width, floating at the bottom.
    const wrapper = nav.parentElement!;
    expect(wrapper.className).toContain("left-1/2");
    expect(wrapper.className).toContain("-translate-x-1/2");
    expect(wrapper.className).toContain("w-[min(calc(100%-1.25rem),420px)]");
    expect(wrapper.className).toContain("bottom-[calc(0.5rem+env(safe-area-inset-bottom,0px))]");
    expect(wrapper.className).toContain("md:hidden");
    expect(nav.className).toContain("rounded-[2rem]");
  });

  it("marks the active destination with aria-current=page", () => {
    renderNav(<MobileTabBar tabs={tabs} menuItems={tabs} centerAction={centerAction} accent="blue" />);

    const home = screen.getByRole("link", { name: "Home" });
    expect(home).toHaveAttribute("aria-current", "page");

    const find = screen.getByRole("link", { name: "Find Trucks" });
    expect(find).not.toHaveAttribute("aria-current");
  });

  it("does not mark a nested detail route as the tab destination", () => {
    renderNav(
      <MobileTabBar tabs={tabs} menuItems={tabs} centerAction={centerAction} accent="blue" />,
      "/shipper/shipments/abc"
    );

    const home = screen.getByRole("link", { name: "Home" });
    expect(home).not.toHaveAttribute("aria-current");
  });

  it("hides the island while the on-screen keyboard is open", () => {
    coarsePointer();
    const vv = makeVv(600);
    window.visualViewport = vv as unknown as VisualViewport;

    renderNav(<MobileTabBar tabs={tabs} menuItems={tabs} centerAction={centerAction} accent="blue" />);

    const wrapper = screen.getByRole("navigation", { name: "Mobile navigation" }).parentElement!;
    expect(wrapper.className).not.toContain("invisible");

    act(() => vv.setHeight(400));
    expect(wrapper.className).toContain("pointer-events-none");
    expect(wrapper.className).toContain("opacity-0");
    expect(wrapper.className).toContain("invisible");
  });

  it("stays visible when the viewport has not meaningfully shrunk", () => {
    coarsePointer();
    const vv = makeVv(600);
    window.visualViewport = vv as unknown as VisualViewport;

    renderNav(<MobileTabBar tabs={tabs} menuItems={tabs} centerAction={centerAction} accent="blue" />);

    const wrapper = screen.getByRole("navigation", { name: "Mobile navigation" }).parentElement!;
    act(() => vv.setHeight(560));
    expect(wrapper.className).not.toContain("opacity-0");
  });
});
