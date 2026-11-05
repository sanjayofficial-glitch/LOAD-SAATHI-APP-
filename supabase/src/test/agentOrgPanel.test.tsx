import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import AgentOrgPanel from '@/pages/admin/command-center/AgentOrgPanel';
import { beginDishaRun, completeDishaRun, resetDishaRun } from '@/lib/dishaRunStore';
import type { DishaBlock, DishaViewState } from '@/lib/dishaRequest';

/**
 * The AI Agents view must stay an honest STATIC illustration:
 *
 * - every LS-01 … LS-14 node, cluster, edge and badge from the source chart;
 * - no SMIL/CSS animation and no spinner inside the SVG (agents must never
 *   look like they are running — there is no agent-run telemetry in this repo);
 * - the HTML status card is the only live surface, driven by the real store:
 *   idle → running → done (verbatim trace heading) / error;
 * - a "Disha is off" note only when the feature flag is off.
 */

function makeBlock(overrides: Partial<DishaBlock> = {}): DishaBlock {
  return {
    status: 'completed',
    intent: 'route_search',
    missing: [],
    rows: [
      {
        origin: 'Patna',
        destination: 'Ranchi',
        departure_date: '2026-11-01',
        capacity_tonnes: 10,
        price_per_tonne: 1400,
      },
    ],
    explanation: 'The marketplace returned rows on the Patna to Ranchi route.',
    explanationSource: 'deterministic',
    provider: 'none',
    checkedAt: '2026-10-25T10:00:00.000Z',
    trace: [
      { step: 'shipment_analyst', status: 'completed', summary: 'Extracted 1 filter.', durationMs: 12 },
      { step: 'matching_specialist', status: 'completed', summary: 'Returned 1 row(s).', durationMs: 34 },
      { step: 'disha_coordinator', status: 'completed', summary: 'Explained 1 row(s).', durationMs: 56 },
    ],
    ...overrides,
  };
}

function okView(block: DishaBlock): DishaViewState {
  return { kind: 'ok', block };
}

beforeEach(() => {
  resetDishaRun();
});

afterEach(() => {
  // Wrap the teardown so the mounted panel is updated inside act(), not after it.
  act(() => {
    resetDishaRun();
  });
});

// ---------------------------------------------------------------------------
// Static chart fidelity
// ---------------------------------------------------------------------------

describe('AgentOrgPanel — static org chart', () => {
  it('renders all 14 agents (LS-01 … LS-14) and both cluster labels', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);
    const svg = screen.getByTestId('agent-org-svg');
    const text = svg.textContent ?? '';

    for (let i = 1; i <= 14; i += 1) {
      expect(text).toContain(`LS-${String(i).padStart(2, '0')} `);
    }
    expect(text).toContain('AI_Agents');
    expect(text).toContain('Human Teams');
    expect(text).toContain('Founder / CEO');
  });

  it('marks each agent with its backing Edge Function badge', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);

    expect(screen.getAllByText('no function')).toHaveLength(9);
    expect(screen.getByText('price-predict · demand-forecast')).toBeInTheDocument();
    expect(screen.getByText('match-ml')).toBeInTheDocument();
    expect(screen.getByText('fraud-detect')).toBeInTheDocument();
    expect(screen.getByText('credit-score · credit-insights')).toBeInTheDocument();
    expect(screen.getByText('this dashboard')).toBeInTheDocument();
  });

  it('renders all 22 edges, each with a tooltip title', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);
    const svg = screen.getByTestId('agent-org-svg');
    const paths = svg.querySelectorAll('g.edgePaths > path');

    expect(paths).toHaveLength(22);
    paths.forEach((path) => {
      const title = path.querySelector('title');
      expect(title).toBeTruthy();
      expect((title?.textContent ?? '').length).toBeGreaterThan(0);
    });

    // Edge 1 is unlabeled in the source chart — we say so instead of inventing a word.
    const firstPath = svg.querySelector('g.edgePaths > path');
    expect(firstPath?.querySelector('title')?.textContent).toBe(
      'Founder / CEO → LS-13 Founder Command Center (no label in source chart)',
    );
    // Edge labels are rendered inline at their original positions.
    expect(svg.textContent ?? '').toContain('Corridor expansion decisions');
    expect(svg.textContent ?? '').toContain('Supervises');
    expect(svg.querySelector('marker#agent-org-pointEnd')).toBeTruthy();
  });

  it('contains no SMIL animation and no spinner inside the SVG', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);
    const svg = screen.getByTestId('agent-org-svg');

    expect(svg.querySelector('animate, animateMotion, animateTransform, set, discard')).toBeNull();
    expect(svg.querySelector('.animate-spin')).toBeNull();
    // Source ids from mermaid must not leak into this document.
    expect(svg.querySelector('[id^="mermaid-svg"]')).toBeNull();
  });

  it('renders label markup as HTML inside foreignObject', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);
    const svg = screen.getByTestId('agent-org-svg');
    const divs = svg.querySelectorAll('foreignObject div');

    expect(divs.length).toBeGreaterThan(0);
    expect(svg.querySelector('foreignObject div')?.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
  });

  it('states up front that the chart is static, not a live view', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);
    const panel = screen.getByTestId('agent-org-panel');

    expect(panel.textContent).toContain('it does not show agents running in real time');
    expect(panel.textContent).toContain('means none exists in this repo');
  });
});

// ---------------------------------------------------------------------------
// Disha request status card (the only live surface)
// ---------------------------------------------------------------------------

describe('AgentOrgPanel — Disha request status', () => {
  it('starts idle and explains that nothing was recorded', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);

    const idle = screen.getByTestId('disha-run-idle');
    expect(idle).toHaveTextContent('No Disha request recorded in this session.');
    expect(screen.queryByTestId('disha-run-running')).toBeNull();
    expect(screen.queryByTestId('disha-run-done')).toBeNull();
    expect(screen.queryByTestId('disha-run-error')).toBeNull();
  });

  it('shows the flag-off note only when Disha is disabled', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled={false} />);
    expect(screen.getByTestId('disha-run-idle').textContent).toContain('VITE_DISHA_UI');
  });

  it('omits the flag-off note when Disha is enabled', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);
    expect(screen.getByTestId('disha-run-idle').textContent).not.toContain('VITE_DISHA_UI');
  });

  it('shows "in progress" while a request is running, spinner only in the HTML card', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);
    expect(screen.queryByTestId('disha-run-running')).toBeNull();

    act(() => {
      beginDishaRun(1_000);
    });

    const running = screen.getByTestId('disha-run-running');
    expect(running).toHaveTextContent('Disha request in progress');
    expect(running.querySelector('.animate-spin')).toBeTruthy();
    expect(screen.queryByTestId('disha-run-idle')).toBeNull();
    expect(screen.getByTestId('agent-org-svg').querySelector('.animate-spin')).toBeNull();
  });

  it('shows the completed trace after completion, never as a live feed', () => {
    act(() => {
      completeDishaRun(okView(makeBlock()), 2_000);
    });
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);

    expect(
      screen.getByText('Completed request trace — shown after completion, not live.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Completed · 1 candidate marketplace row returned · checked 2026-10-25T10:00:00.000Z',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('disha-trace-event')).toHaveLength(3);
    expect(screen.getByText('Shipment Analyst')).toBeInTheDocument();
    expect(screen.getByText('Matching Specialist')).toBeInTheDocument();
    expect(screen.getByText('Disha Coordinator')).toBeInTheDocument();
    expect(screen.getByText(/Read-only search/)).toBeInTheDocument();
    expect(screen.queryByTestId('disha-run-running')).toBeNull();
  });

  it('uses plural wording for multiple candidate rows', () => {
    const block = makeBlock({
      rows: [
        { origin: 'Patna', destination: 'Ranchi', departure_date: '2026-11-01', capacity_tonnes: 10 },
        { origin: 'Patna', destination: 'Ranchi', departure_date: '2026-11-02', capacity_tonnes: 12 },
      ],
    });
    act(() => {
      completeDishaRun(okView(block), 2_000);
    });
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);

    expect(
      screen.getByText(
        'Completed · 2 candidate marketplace rows returned · checked 2026-10-25T10:00:00.000Z',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId('disha-trace-event')).toHaveLength(3);
  });

  it('shows a real failure message and states that nothing changed', () => {
    act(() => {
      completeDishaRun({ kind: 'error', message: 'Disha could not reach the marketplace service.' }, 2_000);
    });
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);

    const error = screen.getByTestId('disha-run-error');
    expect(error).toHaveTextContent('Disha could not reach the marketplace service.');
    expect(error).toHaveTextContent('Nothing has been booked or changed.');
    expect(screen.queryByTestId('disha-run-done')).toBeNull();
  });

  it('follows a full idle → running → done cycle without re-rendering the chart', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);
    const svg = screen.getByTestId('agent-org-svg');

    act(() => {
      beginDishaRun(1_000);
    });
    expect(screen.getByTestId('disha-run-running')).toBeInTheDocument();

    act(() => {
      completeDishaRun(okView(makeBlock()), 2_000);
    });
    expect(screen.getByTestId('disha-run-done')).toBeInTheDocument();
    expect(screen.queryByTestId('disha-run-running')).toBeNull();

    // The chart never changed state: same node/edge counts, still no animation.
    expect(svg.querySelectorAll('g.edgePaths > path')).toHaveLength(22);
    expect(svg.querySelectorAll('g.nodes > g.node')).toHaveLength(21);
    expect(svg.querySelector('animate, animateMotion, animateTransform, set, discard')).toBeNull();
  });

  it('returns to idle when the store is reset', () => {
    act(() => {
      completeDishaRun({ kind: 'error', message: 'boom' }, 2_000);
    });
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);
    expect(screen.getByTestId('disha-run-error')).toBeInTheDocument();

    act(() => {
      resetDishaRun();
    });
    expect(screen.getByTestId('disha-run-idle')).toBeInTheDocument();
    expect(screen.queryByTestId('disha-run-error')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Panel chrome
// ---------------------------------------------------------------------------

describe('AgentOrgPanel — chrome', () => {
  it('closes on Escape and ignores other keys', () => {
    const onClose = vi.fn();
    render(<AgentOrgPanel onClose={onClose} dishaEnabled />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'a' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the close button', () => {
    const onClose = vi.fn();
    render(<AgentOrgPanel onClose={onClose} dishaEnabled />);

    fireEvent.click(screen.getByRole('button', { name: 'Close AI Agents' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is exposed as a labelled dialog', () => {
    render(<AgentOrgPanel onClose={vi.fn()} dishaEnabled />);
    expect(screen.getByRole('dialog', { name: 'AI Agents org chart' })).toBeInTheDocument();
  });
});
