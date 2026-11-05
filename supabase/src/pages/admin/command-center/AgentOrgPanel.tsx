import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { useDishaRunStore } from '@/lib/dishaRunStore';
import { isDishaUiEnabled } from '@/lib/dishaRequest';
import type { DishaBlockStatus, DishaStepName } from '@/lib/dishaRequest';

/**
 * AI Agents view — a STATIC, illustrative rebuild of the LoadSaathi org chart
 * (LS-01 … LS-14) as rendered in deepseek_mermaid_20260414_82566a.svg.
 *
 * Honesty rules baked into this component (do not "improve" them away):
 *
 * - The diagram never animates and never lights up individual agents. There
 *   is no agent-run telemetry in this repo, so no node may be drawn as "working".
 * - The only live-looking element is the Disha request status card, which
 *   shows "Disha request in progress" only while the real client-side
 *   coordinator reports a request in flight (same tab, in-memory store), and
 *   after completion the real per-step trace returned by `agent-router` under
 *   the heading "Completed request trace — shown after completion, not live."
 * - The spinner lives in that HTML status card only — never inside the SVG.
 *
 * Geometry (rects, edge `d` paths, label boxes, clusters) is copied from the
 * source SVG; the original stylesheet's animation rules (`@keyframes dash`,
 * `edge-animation-*`) are deliberately stripped. Edge labels are rendered
 * inline at their original positions. Badges under each agent name show the
 * backing Supabase Edge Function ("no function" = none exists in this repo).
 */

// ---------------------------------------------------------------------------
// Static org-chart data (extracted verbatim from the source SVG)
// ---------------------------------------------------------------------------

const VIEWBOX = '-37.28828125 -37.28828125 5651.6263671875 820.3421875';

const FONT_STACK = '"trebuchet ms",verdana,arial,sans-serif';

const EDGE_BG = 'rgba(232, 232, 232, 0.5)';
const EDGE_TEXT_BG = 'rgba(232, 232, 232, 0.8)';

type NodeMode = 'single' | 'wrap' | 'founder';

interface OrgNode {
  id: string;
  cx: number;
  cy: number;
  /** rect size (label container) */
  w: number;
  h: number;
  /** foreignObject size */
  fw: number;
  fh: number;
  mode: NodeMode;
  lines: string[];
  /** Backend badge; human/team nodes have none. */
  badge?: string;
}

const NODES: OrgNode[] = [
  // Human teams (no badges — these are people, not functions)
  {
    id: 'Founder',
    cx: 1801.5400390625,
    cy: 58.9765625,
    w: 260,
    h: 101.953125,
    fw: 260,
    fh: 71.953125,
    mode: 'founder',
    lines: ['Founder / CEO', 'Human-in-the-loop for', 'strategy, fundraising, policy'],
  },
  { id: 'OpsTeam', cx: 4007.6240234375, cy: 472.84375, w: 219.296875, h: 53.984375, fw: 159.296875, fh: 23.984375, mode: 'single', lines: ['Ops Lead / Dispatcher'] },
  { id: 'SupportTeam', cx: 4293.8935546875, cy: 472.84375, w: 253.2421875, h: 53.984375, fw: 193.2421875, fh: 23.984375, mode: 'single', lines: ['Customer Support + Claims'] },
  { id: 'SalesTeam', cx: 4574.2646484375, cy: 472.84375, w: 207.5, h: 53.984375, fw: 147.5, fh: 23.984375, mode: 'single', lines: ['Sales + Key Accounts'] },
  { id: 'FinanceTeam', cx: 4845.3095703125, cy: 472.84375, w: 234.58984375, h: 53.984375, fw: 174.58984375, fh: 23.984375, mode: 'single', lines: ['Finance / Reconciliation'] },
  { id: 'TrustTeam', cx: 5118.3271484375, cy: 472.84375, w: 211.4453125, h: 53.984375, fw: 151.4453125, fh: 23.984375, mode: 'single', lines: ['Trust / KYC Reviewer'] },
  { id: 'EngTeam', cx: 5404.0498046875, cy: 472.84375, w: 260, h: 77.96875, fw: 200, fh: 47.96875, mode: 'wrap', lines: ['Full-stack Engineer / AI Builder'] },
  // Agents LS-01 … LS-14 (badges = backing Edge Function in supabase/functions/)
  { id: 'A7', cx: 209.9384765625, cy: 673.78125, w: 260, h: 77.96875, fw: 200, fh: 47.96875, mode: 'wrap', lines: ['LS-07 Trip Control Tower Agent'], badge: 'no function' },
  { id: 'A2', cx: 519.9384765625, cy: 673.78125, w: 260, h: 77.96875, fw: 200, fh: 47.96875, mode: 'wrap', lines: ['LS-02 Trucker Onboarding Agent'], badge: 'no function' },
  { id: 'A4', cx: 795.7978515625, cy: 673.78125, w: 191.71875, h: 53.984375, fw: 131.71875, fh: 23.984375, mode: 'single', lines: ['LS-04 Quote Agent'], badge: 'price-predict · demand-forecast' },
  { id: 'A3', cx: 1140.5927734375, cy: 673.78125, w: 260, h: 77.96875, fw: 200, fh: 47.96875, mode: 'wrap', lines: ['LS-03 Address Normalization Agent'], badge: 'no function' },
  { id: 'A6', cx: 1450.5927734375, cy: 673.78125, w: 260, h: 77.96875, fw: 200, fh: 47.96875, mode: 'wrap', lines: ['LS-06 Booking Confirmation Agent'], badge: 'no function' },
  { id: 'A5', cx: 1606.2763671875, cy: 271.90625, w: 235.9765625, h: 53.984375, fw: 175.9765625, fh: 23.984375, mode: 'single', lines: ['LS-05 Matchmaker Agent'], badge: 'match-ml' },
  { id: 'A8', cx: 1756.5498046875, cy: 673.78125, w: 251.9140625, h: 53.984375, fw: 191.9140625, fh: 23.984375, mode: 'single', lines: ['LS-08 Support Triage Agent'], badge: 'no function' },
  { id: 'A12', cx: 1952.2236328125, cy: 271.90625, w: 260, h: 77.96875, fw: 200, fh: 47.96875, mode: 'wrap', lines: ['LS-12 Fraud & Leakage Agent'], badge: 'fraud-detect' },
  { id: 'A11', cx: 2130.7294921875, cy: 673.78125, w: 253.1640625, h: 53.984375, fw: 193.1640625, fh: 23.984375, mode: 'single', lines: ['LS-11 Retention/NPS Agent'], badge: 'no function' },
  { id: 'A13', cx: 2262.2236328125, cy: 271.90625, w: 260, h: 77.96875, fw: 200, fh: 47.96875, mode: 'wrap', lines: ['LS-13 Founder Command Center'], badge: 'this dashboard' },
  { id: 'A10', cx: 2627.0869140625, cy: 673.78125, w: 227.4609375, h: 53.984375, fw: 167.4609375, fh: 23.984375, mode: 'single', lines: ['LS-10 Collections Agent'], badge: 'credit-score · credit-insights' },
  { id: 'A9', cx: 2920.8173828125, cy: 673.78125, w: 260, h: 77.96875, fw: 200, fh: 47.96875, mode: 'wrap', lines: ['LS-09 Invoice & Payout Agent'], badge: 'no function' },
  { id: 'A1', cx: 3226.7353515625, cy: 673.78125, w: 251.8359375, h: 53.984375, fw: 191.8359375, fh: 23.984375, mode: 'single', lines: ['LS-01 Shipper Intake Agent'], badge: 'no function' },
  { id: 'A14', cx: 3705.6904296875, cy: 673.78125, w: 199.27734375, h: 53.984375, fw: 139.27734375, fh: 23.984375, mode: 'single', lines: ['LS-14 HR Ops Agent'], badge: 'no function' },
];

interface ClusterDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  labelX: number;
  labelY: number;
  fw: number;
  fh: number;
  text: string;
}

const CLUSTERS: ClusterDef[] = [
  { id: 'AI_Agents', x: 8, y: 207.921875, w: 3834.9755859375, h: 529.84375, labelX: 1890.46826171875, labelY: 207.921875, fw: 70.0390625, fh: 23.984375, text: 'AI_Agents' },
  { id: 'subGraph0', x: 3862.9755859375, y: 408.859375, w: 1706.07421875, h: 127.96875, labelX: 4666.8330078125, labelY: 408.859375, fw: 98.359375, fh: 23.984375, text: 'Human Teams' },
];

interface EdgeLabelDef {
  /** translate of the edgeLabel group */
  x: number;
  y: number;
  /** translate of the inner label group */
  lx: number;
  ly: number;
  fw: number;
  fh: number;
  mode: 'single' | 'wrap';
  text: string;
}

interface EdgeDef {
  id: string;
  /** Path data copied verbatim from the source SVG. */
  d: string;
  /** <title> tooltip: the edge label, or an explicit fallback for edge 1. */
  title: string;
  label?: EdgeLabelDef;
}

const EDGES: EdgeDef[] = [
  {
    id: 'L_Founder_A13_0',
    d: 'M1931.54,87.184L1986.654,99.143C2041.768,111.102,2151.996,135.02,2207.11,155.143C2262.224,175.266,2262.224,191.594,2262.224,203.258C2262.224,214.922,2262.224,221.922,2262.224,225.422L2262.224,228.922',
    // Unlabeled in the source chart; state the endpoints instead of inventing a word.
    title: 'Founder / CEO → LS-13 Founder Command Center (no label in source chart)',
  },
  {
    id: 'L_Founder_A12_0',
    d: 'M1878.383,109.953L1890.69,118.117C1902.997,126.281,1927.61,142.609,1939.917,158.938C1952.224,175.266,1952.224,191.594,1952.224,203.258C1952.224,214.922,1952.224,221.922,1952.224,225.422L1952.224,228.922',
    title: 'Escalation: policy, large refunds, write-offs',
    label: { x: 1952.2236328125, y: 158.9375, lx: -100, ly: -23.984375, fw: 200, fh: 47.96875, mode: 'wrap', text: 'Escalation: policy, large refunds, write-offs' },
  },
  {
    id: 'L_Founder_A5_0',
    d: 'M1701.962,109.953L1686.015,118.117C1670.067,126.281,1638.172,142.609,1622.224,158.938C1606.276,175.266,1606.276,191.594,1606.276,205.257C1606.276,218.919,1606.276,229.917,1606.276,235.415L1606.276,240.914',
    title: 'Corridor expansion decisions',
    label: { x: 1606.2763671875, y: 158.9375, lx: -100, ly: -23.984375, fw: 200, fh: 47.96875, mode: 'wrap', text: 'Corridor expansion decisions' },
  },
  {
    id: 'L_OpsTeam_A3_0',
    d: 'M4072.225,499.836L4086.98,506.001C4101.736,512.167,4131.247,524.497,3642.642,538.827C3154.037,553.156,2147.315,569.484,1643.954,585.146C1140.593,600.807,1140.593,615.802,1140.593,623.299L1140.593,630.797',
    title: 'Supervises',
    label: { x: 1140.5927734375, y: 585.8125, lx: -37.1875, ly: -11.9921875, fw: 74.375, fh: 23.984375, mode: 'single', text: 'Supervises' },
  },
  {
    id: 'L_OpsTeam_A4_0',
    d: 'M4063.788,499.836L4076.616,506.001C4089.445,512.167,4115.102,524.497,3612.173,538.827C3109.245,553.156,2077.731,569.484,1533.673,587.59C989.615,605.696,933.013,625.58,904.711,635.522L876.41,645.463',
    title: 'Supervises',
    label: { x: 2544.20385, y: 562.10045, lx: -37.1875, ly: -11.9921875, fw: 74.375, fh: 23.984375, mode: 'single', text: 'Supervises' },
  },
  {
    id: 'L_OpsTeam_A5_0',
    d: 'M3897.976,470.015L3502.927,459.822C3107.878,449.63,2317.78,429.244,1922.731,410.888C1527.683,392.531,1527.683,376.203,1536.318,358.373C1544.954,340.544,1562.225,321.213,1570.86,311.547L1579.496,301.881',
    title: 'Supervises',
    label: { x: 1527.6826171875, y: 359.875, lx: -37.1875, ly: -11.9921875, fw: 74.375, fh: 23.984375, mode: 'single', text: 'Supervises' },
  },
  {
    id: 'L_OpsTeam_A7_0',
    d: 'M4028.604,499.836L4033.396,506.001C4038.188,512.167,4047.771,524.497,3494.488,538.827C2941.205,553.156,1825.054,569.484,1206.141,588.374C587.228,607.264,465.553,628.716,404.715,639.442L343.878,650.167',
    title: 'Supervises',
    label: { x: 2219.24528, y: 563.71777, lx: -37.1875, ly: -11.9921875, fw: 74.375, fh: 23.984375, mode: 'single', text: 'Supervises' },
  },
  {
    id: 'L_SupportTeam_A8_0',
    d: 'M4348.813,499.836L4361.357,506.001C4373.902,512.167,4398.99,524.497,3998.128,538.827C3597.266,553.156,2770.453,569.484,2336.036,587.528C1901.618,605.571,1859.597,625.329,1838.587,635.208L1817.576,645.087',
    title: 'Handles escalation',
    label: { x: 3154.14598, y: 561.9071, lx: -67.08984375, ly: -11.9921875, fw: 134.1796875, fh: 23.984375, mode: 'single', text: 'Handles escalation' },
  },
  {
    id: 'L_SalesTeam_A1_0',
    d: 'M4631.436,499.836L4644.494,506.001C4657.553,512.167,4683.67,524.497,4359.537,538.827C4035.404,553.156,3361.021,569.484,3092.201,588.785C2823.382,608.085,2960.126,630.357,3028.497,641.493L3096.869,652.629',
    title: 'Owns enterprise deals',
    label: { x: 3531.765, y: 565.35033, lx: -79.228515625, ly: -11.9921875, fw: 158.45703125, fh: 23.984375, mode: 'single', text: 'Owns enterprise deals' },
  },
  {
    id: 'L_SalesTeam_A11_0',
    d: 'M4595.244,499.836L4600.036,506.001C4604.828,512.167,4614.412,524.497,4232.167,538.827C3849.922,553.156,3075.848,569.484,2669.644,587.506C2263.44,605.528,2225.105,625.244,2205.937,635.102L2186.77,644.96',
    title: 'Reviews churn',
    label: { x: 3419.65927, y: 562.23211, lx: -51.044921875, ly: -11.9921875, fw: 102.08984375, fh: 23.984375, mode: 'single', text: 'Reviews churn' },
  },
  {
    id: 'L_FinanceTeam_A9_0',
    d: 'M4962.604,499.708L4989.617,505.895C5016.63,512.081,5070.655,524.455,4791.998,538.805C4513.342,553.156,3902.004,569.484,3557.009,587.002C3212.014,604.52,3133.361,623.228,3094.035,632.581L3054.709,641.935',
    title: 'Approves payouts',
    label: { x: 4167.55312, y: 562.39186, lx: -62.646484375, ly: -11.9921875, fw: 125.29296875, fh: 23.984375, mode: 'single', text: 'Approves payouts' },
  },
  {
    id: 'L_FinanceTeam_A10_0',
    d: 'M4866.289,499.836L4871.081,506.001C4875.873,512.167,4885.457,524.497,4585.696,538.827C4285.935,553.156,3676.828,569.484,3318.445,588.395C2960.061,607.306,2852.401,628.799,2798.57,639.546L2744.74,650.293',
    title: 'Reviews collections',
    label: { x: 3067.7216796875, y: 585.8125, lx: -69.51171875, ly: -11.9921875, fw: 139.0234375, fh: 23.984375, mode: 'single', text: 'Reviews collections' },
  },
  {
    id: 'L_TrustTeam_A12_0',
    d: 'M5012.604,470.762L4488.594,460.445C3964.584,450.128,2916.563,429.494,2392.552,411.012C1868.542,392.531,1868.542,376.203,1875.849,360.358C1883.155,344.513,1897.769,329.151,1905.076,321.47L1912.382,313.789',
    title: 'Adjudicates fraud',
    label: { x: 1868.5419921875, y: 359.875, lx: -63.671875, ly: -11.9921875, fw: 127.34375, fh: 23.984375, mode: 'single', text: 'Adjudicates fraud' },
  },
  {
    id: 'L_EngTeam_A1_0',
    d: 'M5448.223,511.828L5452.944,515.995C5457.665,520.161,5467.107,528.495,5158.178,540.826C4849.248,553.156,4221.947,569.484,3866.441,587.656C3510.935,605.828,3427.225,625.843,3385.37,635.851L3343.515,645.859',
    title: 'Builds & maintains',
    label: { x: 4423.42146, y: 564.24016, lx: -66.46484375, ly: -11.9921875, fw: 132.9296875, fh: 23.984375, mode: 'single', text: 'Builds & maintains' },
  },
  {
    id: 'L_EngTeam_A14_0',
    d: 'M5274.05,504.914L5252.488,510.233C5230.926,515.552,5187.803,526.19,4882.414,539.673C4577.025,553.156,4009.37,569.484,3755.407,587.6C3501.443,605.716,3561.171,625.62,3591.034,635.572L3620.898,645.524',
    title: 'Builds & maintains',
    label: { x: 4263.39944, y: 562.17744, lx: -66.46484375, ly: -11.9921875, fw: 132.9296875, fh: 23.984375, mode: 'single', text: 'Builds & maintains' },
  },
  {
    id: 'L_A8_SupportTeam_0',
    d: 'M1714.869,646.789L1699.176,636.626C1683.483,626.464,1652.096,606.138,2063.078,587.811C2474.06,569.484,3327.409,553.156,3764.405,539.155C4201.401,525.154,4222.043,513.479,4232.364,507.642L4242.685,501.805',
    title: 'Escalate refund/dispute/abuse',
    label: { x: 2882.22054, y: 561.67456, lx: -100, ly: -23.984375, fw: 200, fh: 47.96875, mode: 'wrap', text: 'Escalate refund/dispute/abuse' },
  },
  {
    id: 'L_A4_OpsTeam_0',
    d: 'M721.255,646.789L693.189,636.626C665.123,626.464,608.991,606.138,1156.287,587.811C1703.583,569.484,2854.307,553.156,3429.892,539.493C4005.477,525.83,4005.923,514.831,4006.145,509.332L4006.368,503.833',
    title: 'Escalate outside price band',
    label: { x: 552.8583984375, y: 585.8125, lx: -98.857421875, ly: -11.9921875, fw: 197.71484375, fh: 23.984375, mode: 'single', text: 'Escalate outside price band' },
  },
  {
    id: 'L_A5_OpsTeam_0',
    d: 'M1630.392,298.898L1639.472,309.061C1648.551,319.224,1666.711,339.549,1675.79,357.876C1684.87,376.203,1684.87,392.531,2053.055,410.838C2421.239,429.144,3157.608,449.429,3525.793,459.571L3893.977,469.713',
    title: 'Escalate no match / low margin',
    label: { x: 1684.8701171875, y: 359.875, lx: -100, ly: -23.984375, fw: 200, fh: 47.96875, mode: 'wrap', text: 'Escalate no match / low margin' },
  },
  {
    id: 'L_A7_OpsTeam_0',
    d: 'M183.598,634.797L178.081,626.633C172.565,618.469,161.533,602.141,790.15,585.813C1418.767,569.484,2687.033,553.156,3325.786,539.343C3964.539,525.53,3973.779,514.231,3978.399,508.582L3983.019,502.932',
    title: 'Escalate ETA breach / route deviation',
    label: { x: 2047.23465, y: 561.39325, lx: -100, ly: -23.984375, fw: 200, fh: 47.96875, mode: 'wrap', text: 'Escalate ETA breach / route deviation' },
  },
  {
    id: 'L_A9_FinanceTeam_0',
    d: 'M2903.632,634.797L2900.033,626.633C2896.434,618.469,2889.236,602.141,3193.595,585.813C3497.954,569.484,4113.871,553.156,4432.377,539.15C4750.884,525.143,4771.98,513.459,4782.528,507.616L4793.077,501.774',
    title: 'Escalate amount mismatch',
    label: { x: 3817.3166, y: 561.01799, lx: -96.171875, ly: -11.9921875, fw: 192.34375, fh: 23.984375, mode: 'single', text: 'Escalate amount mismatch' },
  },
  {
    id: 'L_A12_TrustTeam_0',
    d: 'M2034.498,310.891L2051.728,319.055C2068.958,327.219,2103.418,343.547,2120.648,359.875C2137.878,376.203,2137.878,392.531,2616.333,410.967C3094.787,429.402,4051.696,449.945,4530.151,460.217L5008.605,470.488',
    title: 'Escalate high risk score',
    label: { x: 2137.8779296875, y: 359.875, lx: -83.69140625, ly: -11.9921875, fw: 167.3828125, fh: 23.984375, mode: 'single', text: 'Escalate high risk score' },
  },
  {
    id: 'L_A11_SalesTeam_0',
    d: 'M2130.729,646.789L2130.729,636.626C2130.729,626.464,2130.729,606.138,2516.288,587.811C2901.846,569.484,3672.963,553.156,4070.467,539.121C4467.971,525.086,4491.863,513.343,4503.809,507.472L4515.755,501.6',
    title: 'Escalate low NPS / churn risk',
    label: { x: 3298.84611, y: 561.07804, lx: -100, ly: -23.984375, fw: 200, fh: 47.96875, mode: 'wrap', text: 'Escalate low NPS / churn risk' },
  },
];

// ---------------------------------------------------------------------------
// Label helpers — mirror the source stylesheet (animation rules omitted)
// ---------------------------------------------------------------------------

const BASE_LABEL: CSSProperties = {
  lineHeight: 1.5,
  maxWidth: 200,
  textAlign: 'center',
};

function nodeLabelStyle(mode: NodeMode, fw: number): CSSProperties {
  if (mode === 'single') {
    return { ...BASE_LABEL, display: 'table-cell', whiteSpace: 'nowrap' };
  }
  if (mode === 'wrap') {
    return { ...BASE_LABEL, display: 'table', whiteSpace: 'break-spaces', width: 200 };
  }
  // Founder: three hard-wrapped lines, pre-formatted, widened box so the
  // longest line fits without re-wrapping and stays centred on the node.
  return { ...BASE_LABEL, maxWidth: fw, display: 'table', whiteSpace: 'pre', width: fw };
}

function edgeLabelStyle(mode: 'single' | 'wrap'): CSSProperties {
  const base: CSSProperties = { ...BASE_LABEL, backgroundColor: EDGE_BG };
  return mode === 'single'
    ? { ...base, display: 'table-cell', whiteSpace: 'nowrap' }
    : { ...base, display: 'table', whiteSpace: 'break-spaces', width: 200 };
}

// ---------------------------------------------------------------------------
// Trace rendering (mirrors DishaAskPanel's trace list)
// ---------------------------------------------------------------------------

const STEP_LABEL: Record<DishaStepName, string> = {
  shipment_analyst: 'Shipment Analyst',
  matching_specialist: 'Matching Specialist',
  disha_coordinator: 'Disha Coordinator',
};

const STATUS_LABEL: Record<DishaBlockStatus, string> = {
  completed: 'Completed',
  failed: 'Failed',
  unavailable: 'No model configured',
  skipped: 'Partly skipped',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AgentOrgPanelProps {
  onClose: () => void;
  /** Defaults to the VITE_DISHA_UI flag; tests may pass it explicitly. */
  dishaEnabled?: boolean;
}

export default function AgentOrgPanel({ onClose, dishaEnabled = isDishaUiEnabled() }: AgentOrgPanelProps) {
  const run = useDishaRunStore();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="absolute inset-0 z-[1100] flex flex-col bg-white"
      role="dialog"
      aria-label="AI Agents org chart"
      data-testid="agent-org-panel"
    >
      {/* Header */}
      <div className="shrink-0 flex items-start justify-between gap-3 border-b border-gray-200 px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-gray-900">AI Agents</h2>
          <p className="text-[11px] text-gray-500">
            Static org chart (LS-01 … LS-14) for reference — it does not show agents running in
            real time. Badges mark the Supabase Edge Function behind each agent; “no function”
            means none exists in this repo.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close AI Agents"
          title="Close (Esc)"
          className="shrink-0 rounded-lg border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Disha request status card — the only "live" element on this page */}
      <div className="shrink-0 px-3 py-2">
        {run.phase === 'idle' && (
          <div
            className="rounded-xl border border-gray-200 bg-white p-3 text-xs"
            data-testid="disha-run-idle"
          >
            <p className="flex items-center gap-1.5 font-medium text-gray-700">
              <Info className="h-3.5 w-3.5 shrink-0 text-gray-400" />
              No Disha request recorded in this session.
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              Requests started in another tab or cleared on reload do not appear here.
            </p>
            {!dishaEnabled && (
              <p className="mt-1 text-[11px] text-gray-500">
                Disha is turned off in this environment (VITE_DISHA_UI is not “true”), so no new
                request can be started right now.
              </p>
            )}
          </div>
        )}

        {run.phase === 'running' && (
          <div
            className="flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs"
            role="status"
            aria-live="polite"
            data-testid="disha-run-running"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" aria-hidden="true" />
            <span className="font-semibold text-blue-800">Disha request in progress</span>
            <span className="text-[11px] text-blue-700/80">
              The chart below stays static — per-step detail appears only after the request
              finishes.
            </span>
          </div>
        )}

        {run.phase === 'done' && run.block && (
          <div
            className="rounded-xl border border-green-200 bg-green-50/50 p-3 text-xs"
            data-testid="disha-run-done"
          >
            <p className="flex items-center gap-1.5 font-semibold text-green-800">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Completed request trace — shown after completion, not live.
            </p>
            <p className="mt-1 text-[11px] text-gray-600">
              {`${STATUS_LABEL[run.block.status]} · ${run.block.rows.length} candidate marketplace ${
                run.block.rows.length === 1 ? 'row' : 'rows'
              } returned · checked ${run.block.checkedAt}`}
            </p>
            <ul className="mt-2 space-y-1.5">
              {run.block.trace.length === 0 && (
                <li className="text-[11px] text-gray-500">No trace events returned.</li>
              )}
              {run.block.trace.map((event, index) => (
                <li
                  key={`${event.step}-${event.status}-${index}`}
                  className="text-[11px]"
                  data-testid="disha-trace-event"
                >
                  <span className="font-medium text-gray-800">
                    {STEP_LABEL[event.step] ?? event.step}
                  </span>
                  <span className="text-gray-500">
                    {' · '}
                    {event.status}
                    {event.durationMs > 0 ? ` · ${event.durationMs}ms` : ''}
                  </span>
                  {event.summary && <p className="text-gray-500">{event.summary}</p>}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-gray-500">
              Read-only search — no bookings, offers or payments were made.
            </p>
          </div>
        )}

        {run.phase === 'error' && (
          <div
            className="rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs"
            role="alert"
            data-testid="disha-run-error"
          >
            <p className="flex items-center gap-1.5 font-medium text-red-700">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {run.message}
            </p>
            <p className="mt-1 text-[11px] text-red-600/80">
              Nothing has been booked or changed.
            </p>
          </div>
        )}
      </div>

      {/* Static chart — fixed size, panned by scrolling */}
      <div className="flex-1 min-h-0 overflow-auto bg-gray-50 p-2">
        <svg
          width={4000}
          height={581}
          viewBox={VIEWBOX}
          role="img"
          aria-label="LoadSaathi AI agents org chart, LS-01 to LS-14, static illustration"
          data-testid="agent-org-svg"
          style={{
            display: 'block',
            fontFamily: FONT_STACK,
            fontSize: 16,
            fill: '#333',
            color: '#333',
          }}
        >
          <defs>
            {/* Renamed from the source's mermaid id so it can never clash. */}
            <marker
              id="agent-org-pointEnd"
              viewBox="0 0 10 10"
              refX={5}
              refY={5}
              markerUnits="userSpaceOnUse"
              markerWidth={8}
              markerHeight={8}
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#333333" stroke="#333333" />
            </marker>
          </defs>

          {/* Clusters */}
          {CLUSTERS.map((cluster) => (
            <g key={cluster.id} className="cluster">
              <rect
                x={cluster.x}
                y={cluster.y}
                width={cluster.w}
                height={cluster.h}
                fill="#ffffde"
                stroke="#aaaa33"
                strokeWidth={1}
              />
              <g transform={`translate(${cluster.labelX}, ${cluster.labelY})`}>
                <foreignObject width={cluster.fw} height={cluster.fh}>
                  <div style={{ ...BASE_LABEL, display: 'table-cell', whiteSpace: 'nowrap' }}>
                    <p style={{ margin: 0 }}>{cluster.text}</p>
                  </div>
                </foreignObject>
              </g>
            </g>
          ))}

          {/* Edges (verbatim path data; no dash/animation styles) */}
          <g className="edgePaths">
            {EDGES.map((edge) => (
              <path
                key={edge.id}
                id={edge.id}
                d={edge.d}
                fill="none"
                stroke="#333333"
                strokeWidth={2}
                markerEnd="url(#agent-org-pointEnd)"
              >
                <title>{edge.title}</title>
              </path>
            ))}
          </g>

          {/* Edge labels, at their original positions */}
          <g className="edgeLabels">
            {EDGES.filter((edge) => edge.label).map((edge) => {
              const label = edge.label;
              if (!label) return null;
              return (
                <g key={`${edge.id}-label`} transform={`translate(${label.x}, ${label.y})`}>
                  <g transform={`translate(${label.lx}, ${label.ly})`}>
                    <foreignObject width={label.fw} height={label.fh}>
                      <div style={edgeLabelStyle(label.mode)}>
                        <span style={{ backgroundColor: EDGE_TEXT_BG }}>
                          <p style={{ margin: 0, backgroundColor: EDGE_TEXT_BG }}>{label.text}</p>
                        </span>
                      </div>
                    </foreignObject>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {NODES.map((node) => {
              const hasBadge = Boolean(node.badge);
              const nameFh = node.fh;
              const labelY = -nameFh / 2 - (hasBadge ? 7.5 : 0);
              const badgeFits = node.badge ? node.badge.length * 5.8 <= node.w - 10 : true;
              return (
                <g key={node.id} className="node" transform={`translate(${node.cx}, ${node.cy})`}>
                  <rect
                    x={-node.w / 2}
                    y={-node.h / 2}
                    width={node.w}
                    height={node.h}
                    fill="#ECECFF"
                    stroke="#9370DB"
                    strokeWidth={1}
                  />
                  <g transform={`translate(${-node.fw / 2}, ${labelY})`}>
                    <foreignObject width={node.fw} height={node.fh}>
                      <div style={nodeLabelStyle(node.mode, node.fw)}>
                        <p style={{ margin: 0 }}>{node.lines.join('\n')}</p>
                      </div>
                    </foreignObject>
                  </g>
                  {node.badge && (
                    <text
                      x={0}
                      y={node.fh / 2 + 3}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#6b7280"
                      {...(badgeFits
                        ? {}
                        : { textLength: node.w - 10, lengthAdjust: 'spacingAndGlyphs' as const })}
                    >
                      {node.badge}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}
