/**
 * The six stages, in the order they run. Single source of truth for the site
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
    body: "Your one line becomes three framings, each aimed at a specific person at a specific moment.",
    output: "3 framings",
  },
  {
    n: "02",
    name: "Research",
    role: "Look outward",
    body: "Searches the live web for who already solves this and who is asking for it.",
    output: "4 competitors · 3 demand signals",
  },
  {
    n: "03",
    name: "Market analysis",
    role: "Weigh it",
    body: "Scores demand against crowding, finds the gap, names the risks that decide it.",
    output: "Score · gap · risks",
  },
  {
    n: "04",
    name: "Simulate",
    role: "Pressure-test",
    body: "Puts the idea in front of synthetic users from your segment before any code exists.",
    output: "Adoption · objections",
  },
  {
    n: "05",
    name: "Build",
    role: "Ship it",
    body: "Generates a working app from the framing that survived, writing real files as they land.",
    output: "Working app",
  },
  {
    n: "06",
    name: "Market",
    role: "Get it seen",
    body: "Turns what the pipeline learned into launch copy and posts, aimed at the people who said yes.",
    output: "Launch copy · social posts",
  },
];

