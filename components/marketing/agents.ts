/**
 * The five stages, in the order they run. Single source of truth for the site
 * so the spine, the product shot and the nav can never drift apart.
 */
export type Agent = {
  n: string;
  name: string;
  role: string;
  body: string;
  output: string;
};

export const AGENTS: Agent[] = [
  {
    n: "01",
    name: "Brainstorm",
    role: "Sharpen",
    body: "Your one line becomes two or three framings, each narrowed to a specific person at a specific moment — not a market category.",
    output: "3 framings",
  },
  {
    n: "02",
    name: "Research",
    role: "Look outward",
    body: "Searches the live web for who already solves this and who is asking for it. The spreadsheet everyone already uses counts as a competitor.",
    output: "4 competitors · 3 demand signals",
  },
  {
    n: "03",
    name: "Market analysis",
    role: "Weigh it",
    body: "Scores demand against crowding, finds the gap the incumbents leave open, and names the risks that would actually decide this.",
    output: "Score · gap · risks",
  },
  {
    n: "04",
    name: "Simulate",
    role: "Pressure-test",
    body: "Puts the idea in front of synthetic users from your target segment before any code exists — what they reach for, what they ignore, where they drop off.",
    output: "Adoption · objections",
  },
  {
    n: "05",
    name: "Build",
    role: "Ship it",
    body: "Generates a working app from the framing that survived, writing real files into a live workspace you can read and run as they land.",
    output: "Working app",
  },
];
