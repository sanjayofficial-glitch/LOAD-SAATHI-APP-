import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ReactElement } from "react";

// Never send test events to the real analytics pipeline (PostHog/Vercel).
vi.mock("@/utils/analytics", () => ({
  trackToolCompleted: vi.fn(),
  trackEvent: vi.fn(),
}));

import ShipmentBriefBuilder from "@/pages/public/tools/ShipmentBriefBuilder";
import WaitingTimeCostCalculator from "@/pages/public/tools/WaitingTimeCostCalculator";
import FreightQuoteComparison from "@/pages/public/tools/FreightQuoteComparison";
import CargoVolumePlanner from "@/pages/public/tools/CargoVolumePlanner";
import LoadSecuringChecklist from "@/pages/public/tools/LoadSecuringChecklist";
import TollFuelCalculator from "@/pages/public/tools/TollFuelCalculator";

function renderPage(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

async function openSelectAndPick(trigger: HTMLElement, optionName: RegExp) {
  fireEvent.click(trigger);
  const option = await screen.findByRole("option", { name: optionName });
  fireEvent.click(option);
}

function at<T>(list: ArrayLike<T>, index: number): T {
  const el = list[index];
  if (el === undefined) throw new Error(`missing element at index ${index}`);
  return el;
}

beforeEach(() => {
  // Radix Select primitives expect these in jsdom.
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  window.HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
});

describe("ShipmentBriefBuilder", () => {
  it("generates a copyable shipment brief from entered details", async () => {
    renderPage(<ShipmentBriefBuilder />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Rourkela, Odisha"), { target: { value: "Rourkela" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Kolkata, West Bengal"), { target: { value: "Kolkata" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 1200"), { target: { value: "800" } });

    await openSelectAndPick(at(screen.getAllByRole("combobox"), 0), /FMCG/);

    fireEvent.click(screen.getByRole("button", { name: /Generate Shipment Brief/ }));

    expect(screen.getByText(/SHIPMENT BRIEF \/ FREIGHT REQUEST/)).toBeInTheDocument();
    const brief = screen.getByText(/SHIPMENT BRIEF \/ FREIGHT REQUEST/);
    expect(brief).toHaveTextContent("Pickup: Rourkela");
    expect(brief).toHaveTextContent("Drop-off: Kolkata");
    expect(brief).toHaveTextContent("Cargo type: FMCG");
    expect(brief).toHaveTextContent("Total weight: 800 kg");
    expect(screen.getByRole("button", { name: /Copy Brief/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Download .txt/ })).toBeInTheDocument();
  });

  it("blocks generation without pickup, drop and weight", () => {
    renderPage(<ShipmentBriefBuilder />);
    const button = screen.getByRole("button", { name: /Generate Shipment Brief/ });
    expect(button).toBeDisabled();
  });
});

describe("WaitingTimeCostCalculator", () => {
  it("calculates waiting cost with assumptions shown", () => {
    renderPage(<WaitingTimeCostCalculator />);

    fireEvent.change(screen.getByPlaceholderText("e.g. 4"), { target: { value: "4" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 3"), { target: { value: "3" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 5000"), { target: { value: "5000" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. 700"), { target: { value: "700" } });

    fireEvent.click(screen.getByRole("button", { name: /Calculate Waiting Cost/ }));

    // 4h + 3h waiting, 2h free each → 3 billable hours
    // truck ₹5000/day → ₹208.33/h, driver ₹700/day → ₹29.17/h
    expect(screen.getByText(/7 hrs waiting \(3 hrs billable\)/)).toBeInTheDocument();
    expect(screen.getByText("₹712.5")).toBeInTheDocument();
    expect(screen.getByText(/Assumptions used/)).toBeInTheDocument();
    expect(screen.getByText(/Estimate only/)).toBeInTheDocument();
  });

  it("requires at least a wait time", () => {
    renderPage(<WaitingTimeCostCalculator />);
    const button = screen.getByRole("button", { name: /Calculate Waiting Cost/ });
    expect(button).toBeDisabled();
  });
});

describe("FreightQuoteComparison", () => {
  it("compares two quotes on an all-in basis and flags the cheapest", () => {
    const { container } = renderPage(<FreightQuoteComparison />);

    const numbers = container.querySelectorAll<HTMLInputElement>('input[type="number"]');
    // [0] distance, [1] quote1 transit, [2..8] quote1 charges,
    // [9] quote2 transit, [10..16] quote2 charges
    fireEvent.change(at(numbers, 0), { target: { value: "100" } });
    fireEvent.change(at(numbers, 2), { target: { value: "10000" } }); // quote 1 base
    fireEvent.change(at(numbers, 10), { target: { value: "9000" } }); // quote 2 base
    fireEvent.change(at(numbers, 11), { target: { value: "1500" } }); // quote 2 fuel

    fireEvent.click(screen.getByRole("button", { name: /Compare Quotes/ }));

    expect(screen.getByText("₹10,000")).toBeInTheDocument();
    expect(screen.getByText("₹10,500")).toBeInTheDocument();
    expect(screen.getAllByText("Lowest all-in")).toHaveLength(1);
    expect(screen.getByText("₹100/km over 100 km")).toBeInTheDocument();
    expect(screen.getByText("₹105/km over 100 km")).toBeInTheDocument();
  });

  it("needs charge details for two quotes before comparing", () => {
    renderPage(<FreightQuoteComparison />);
    fireEvent.click(screen.getByRole("button", { name: /Compare Quotes/ }));
    expect(screen.getByText(/at least two quotes/i)).toBeInTheDocument();
  });
});

describe("CargoVolumePlanner", () => {
  it("calculates total volume, weight and a space estimate", () => {
    const { container } = renderPage(<CargoVolumePlanner />);

    const numbers = container.querySelectorAll<HTMLInputElement>('input[type="number"]');
    fireEvent.change(at(numbers, 0), { target: { value: "50" } }); // length cm
    fireEvent.change(at(numbers, 1), { target: { value: "40" } }); // width cm
    fireEvent.change(at(numbers, 2), { target: { value: "30" } }); // height cm
    fireEvent.change(at(numbers, 3), { target: { value: "10" } }); // quantity
    fireEvent.change(at(numbers, 4), { target: { value: "25" } }); // kg each

    fireEvent.click(screen.getByRole("button", { name: /Calculate Volume & Space/ }));

    // 0.5 × 0.4 × 0.3 m × 10 = 0.6 cbm ≈ 21 cu ft; 250 kg total
    expect(screen.getByText("0.6")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText(/smallest common vehicle/)).toBeInTheDocument();
    expect(screen.getByText(/Payload Utilization/)).toBeInTheDocument();
  });
});

describe("LoadSecuringChecklist", () => {
  it("builds a checklist by cargo category with progress tracking", async () => {
    renderPage(<LoadSecuringChecklist />);

    await openSelectAndPick(screen.getByRole("combobox"), /Fragile/);
    fireEvent.click(screen.getByRole("button", { name: /Build My Checklist/ }));

    expect(screen.getByText("Packing")).toBeInTheDocument();
    expect(screen.getByText("Loading & Securing")).toBeInTheDocument();
    expect(screen.getByText("Dispatch & Handover")).toBeInTheDocument();
    expect(screen.getByText(/HANDLE WITH CARE/)).toBeInTheDocument();

    const boxes = screen.getAllByRole("checkbox");
    fireEvent.click(at(boxes, boxes.length - 1));
    expect(screen.getByText(/1\/\d+ checked/)).toBeInTheDocument();
  });
});

describe("TollFuelCalculator", () => {
  it("exposes editable diesel price and mileage assumptions", () => {
    renderPage(<TollFuelCalculator />);

    expect(screen.getByDisplayValue("95")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4")).toBeInTheDocument();
    expect(screen.getByText(/enter your local pump price/)).toBeInTheDocument();
    expect(screen.getByText(/set October 2026/)).toBeInTheDocument();
  });
});
