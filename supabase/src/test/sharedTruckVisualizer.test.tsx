import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

/**
 * Make the truck's movement instantaneous in tests: the imperative `animate()`
 * is stubbed to jump the MotionValue and fire `onComplete` synchronously.
 * The exported `animate` is the imperative API only — `motion` components use
 * their own internal animation path — so this stub does not affect rendering.
 */
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
  return {
    ...actual,
    animate: (target: unknown, to: unknown, options?: { onComplete?: () => void }) => {
      const mv = target as { set?: (v: unknown) => void };
      if (mv && typeof mv.set === "function") {
        mv.set(to);
        options?.onComplete?.();
        return { stop: () => {}, then: () => Promise.resolve() };
      }
      return (actual.animate as (...a: unknown[]) => unknown)(target, to, options);
    },
  };
});

import {
  CAPACITY_T,
  DEPOT,
  DEST,
  FULL_TRUCK_RATE,
  LOADS,
  LOAD_BY_ID,
  pointAt,
  progressFor,
  shareAmount,
  sharePct,
} from "@/features/home/components/truck/routeData";
import { SharedTruckVisualizer } from "@/features/home/components/truck/SharedTruckVisualizer";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SharedTruckVisualizer — cost model", () => {
  it("charges each shipper only for the space it fills, plus a small handling margin", () => {
    // Load A = 1.2T of a 3.6T truck -> 33% + 2pt handling = 35%.
    expect(sharePct("A")).toBe(35);
    expect(shareAmount("A")).toBe(8400); // 35% of ₹24,000
    expect(sharePct("B")).toBe(24); // 0.8T -> 22% + 2
    expect(shareAmount("B")).toBe(5760); // 24% of ₹24,000
    expect(sharePct("C")).toBe(30); // 1.0T -> 28% + 2
    expect(shareAmount("C")).toBe(7200); // 30% of ₹24,000
  });

  it("never lets the summed shares exceed the full-truck rate", () => {
    const total = LOADS.reduce((sum, l) => sum + shareAmount(l.id), 0);
    expect(total).toBeLessThanOrEqual(FULL_TRUCK_RATE);
  });

  it("keeps the declared load weights within the truck capacity", () => {
    const totalT = LOADS.reduce((sum, l) => sum + l.weight, 0);
    expect(totalT).toBeLessThanOrEqual(CAPACITY_T);
  });
});

describe("SharedTruckVisualizer — route geometry", () => {
  it("maps every pickup stop onto a real point on the route", () => {
    for (const load of LOADS) {
      const t = progressFor(load.road.x, load.road.y);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThanOrEqual(1);
      const p = pointAt(t);
      expect(Math.abs(p.x - load.road.x)).toBeLessThan(80);
      expect(Math.abs(p.y - load.road.y)).toBeLessThan(80);
    }
  });

  it("orders the pickups along the route from depot toward the destination", () => {
    const stops = LOADS.map((l) => progressFor(l.road.x, l.road.y));
    expect(stops[0]).toBeLessThan(stops[1]!);
    expect(stops[1]).toBeLessThan(stops[2]!);
    expect(progressFor(DEPOT.x, DEPOT.y)).toBeLessThan(stops[0]!);
    expect(progressFor(DEST.x, DEST.y)).toBeGreaterThan(stops[2]!);
  });
});

describe("SharedTruckVisualizer — component", () => {
  it("renders the mechanism with an accessible map, status line and cost anchor", () => {
    render(<SharedTruckVisualizer />);

    expect(screen.getByRole("heading", { name: /shared truck visualizer/i })).toBeInTheDocument();

    const map = screen.getByRole("img", { name: /route map from pune depot to mumbai hub/i });
    expect(map).toBeInTheDocument();

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/driver is waiting at the pune depot/i);

    // The anchor (full-truck rate) is present before any interaction — DK-02.
    expect(
      screen.getByText(new RegExp(`Full truck · ₹${FULL_TRUCK_RATE.toLocaleString("en-IN")}`)),
    ).toBeInTheDocument();

    for (const load of LOADS) {
      expect(screen.getByRole("button", { name: new RegExp(load.name, "i") })).toBeInTheDocument();
    }
  });

  it("shows the cost split as empty until a load is actually on board", () => {
    render(<SharedTruckVisualizer />);
    expect(screen.getAllByText("not on board")).toHaveLength(3);
    expect(screen.getAllByText("—")).toHaveLength(3);
  });

  it("reveals the saving and the personal anchor once a load is picked up", async () => {
    render(<SharedTruckVisualizer />);

    const chipA = screen.getByRole("button", { name: /Load A/i });
    expect(chipA).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(chipA);

    // Visible feedback on the control itself (NM-02).
    expect(screen.getByRole("button", { name: /Load A/i })).toHaveAttribute("aria-pressed", "true");

    // The peak moment: the badge states what THIS shipper pays.
    await waitFor(() =>
      expect(screen.getByText(/you pay only 35% of the full-truck rate/i)).toBeInTheDocument(),
    );

    // Cost split now shows the real rupee amount for Load A.
    expect(screen.getByText("₹8,400")).toBeInTheDocument();
    expect(screen.getByText(/35% of truck rate/i)).toBeInTheDocument();

    // The fill meter reflects 1.2T of 3.6T.
    const meter = screen.getByRole("progressbar", { name: /container space filled/i });
    await waitFor(() => expect(meter).toHaveAttribute("aria-valuenow", "33"));

    // The live status reports the pick-up.
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/1 of 3 loads picked up/i),
    );
  });

  it("enables dispatch only once a load is on board", async () => {
    render(<SharedTruckVisualizer />);
    const dispatch = screen.getByRole("button", { name: /dispatch truck/i });
    expect(dispatch).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /Load A/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /dispatch truck/i })).toBeEnabled(),
    );
  });

  it("completes the journey: dispatch -> delivered -> play again resets", async () => {
    render(<SharedTruckVisualizer />);

    fireEvent.click(screen.getByRole("button", { name: /Load A/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /dispatch truck/i })).toBeEnabled(),
    );

    fireEvent.click(screen.getByRole("button", { name: /dispatch truck/i }));

    // End state carries the peak number, not a generic "thank you" (LX-05).
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/delivered at mumbai hub/i),
    );
    await waitFor(() =>
      expect(screen.getByText(/delivered — you paid ₹8,400, not ₹24,000/i)).toBeInTheDocument(),
    );

    const playAgain = screen.getByRole("button", { name: /play again/i });
    expect(playAgain).toBeInTheDocument();

    // Reset returns the simulation to its opening state.
    fireEvent.click(playAgain);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/driver is waiting at the pune depot/i),
    );
    expect(screen.getByRole("button", { name: /Load A/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("exposes the fill meter as a progressbar with an accessible value", () => {
    render(<SharedTruckVisualizer />);
    const meter = screen.getByRole("progressbar", { name: /container space filled/i });
    expect(meter).toHaveAttribute("aria-valuenow", "0");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
  });

  it("labels Load A as the visitor's own shipment so the anchor is personal", () => {
    expect(LOAD_BY_ID.A.you).toBe(true);
    expect(LOAD_BY_ID.B.you).toBeUndefined();
    expect(LOAD_BY_ID.C.you).toBeUndefined();
  });
});
