export function seedDocs() {
  const now = Date.now();
  const hour = 3600000;
  return [
    {
      id: "seed-q4-plan", type: "doc", title: "Q4 Product Plan",
      body: `<h2>Q4 Product Plan</h2><p>Three priorities for the quarter:</p><ul><li>Ship the collaborative editor</li><li>Grow self-serve signups by 20%</li><li>Reduce support response time</li></ul><blockquote>"Focus is saying no to a thousand good ideas." — Team lead</blockquote><p>Review this with the team every Monday at 10:00.</p>`,
      cells: {}, slides: [], starred: true, createdAt: now - 96 * hour, updatedAt: now - 3 * hour,
    },
    {
      id: "seed-budget", type: "sheet", title: "Marketing Budget",
      body: "",
      cells: {
        A1: "Channel", B1: "Spend", C1: "Leads",
        A2: "Search", B2: "2400", C2: "310",
        A3: "Social", B3: "1800", C3: "205",
        A4: "Email", B4: "600", C4: "120",
        A5: "Events", B5: "1500", C5: "85",
        B6: "=SUM(B2:B5)", C6: "=SUM(C2:C5)",
        D2: "=B2/C2",
      },
      slides: [], starred: false, createdAt: now - 50 * hour, updatedAt: now - 8 * hour,
    },
    {
      id: "seed-projects", type: "table", title: "Project Tracker",
      body: JSON.stringify({
        fields: [
          { name: "Task", type: "text" },
          { name: "Owner", type: "text" },
          { name: "Status", type: "status" },
          { name: "Due", type: "date" },
        ],
        rows: [
          ["Editor launch plan", "Eddie", "In progress", "2026-11-30"],
          ["Pricing page copy", "Maya", "Planning", "2026-11-22"],
          ["Onboarding emails", "Eddie", "Planning", "2026-12-05"],
          ["Q1 roadmap draft", "Team", "Planning", "2026-12-15"],
          ["Changelog post", "Maya", "Done", "2026-11-10"],
        ],
      }),
      cells: {}, slides: [], starred: true, createdAt: now - 30 * hour, updatedAt: now - 6 * hour,
    },
    {
      id: "seed-pitch", type: "slides", title: "Investor Pitch",
      body: "",
      cells: {},
      slides: [
        { title: "WorkIT", text: "One workspace for docs, data and decks." },
        { title: "The problem", text: "Teams juggle 4+ disconnected tools for daily work." },
        { title: "Our solution", text: "A unified, fast workspace your whole team already knows how to use." },
        { title: "Traction", text: "40% monthly growth in active workspaces." },
      ],
      starred: false, createdAt: now - 200 * hour, updatedAt: now - 40 * hour,
    },
  ];
}