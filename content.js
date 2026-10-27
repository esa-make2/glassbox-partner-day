/* ===========================================================================
   THE GLASS BOX — PRESENTATION CONTENT
   ---------------------------------------------------------------------------
   This is the only file you need to edit to change what's on the walls.
   Save it and reload the browser (Cmd+R). No build step.

   Each topic has:
     eyebrow   small uppercase label above the title
     title     the wall's heading
     lead      one sentence under the heading
     items     cards on the wall: { title, body, tag?, href?, tooltip? }
               tag     = small chip, e.g. "Coming soon"
               href    = makes the whole card a link (opens in a new tab), e.g. href: "https://www.make.com"
               tooltip = one line shown above the card on hover (the card lifts), e.g. tooltip: "GA in Q1"
     links     buttons under the cards: { label, href }
     image     optional: { src: "assets/my-image.png", alt: "…" }
               Leave src empty ("") to show a placeholder frame.

   Topics 1–6 are the inner walls of the box. Topic 7 is shown outside it.
   =========================================================================== */

window.GLASSBOX_CONTENT = {
  intro: {
    eyebrow: "October 2026",
    title: "With Make, your business is a glass box",
    lead: "Trustworthy, controlled AI requires transparency. Let's step in to explore how Make unlocks it.",
    presenter: {
      name: "Eugenio Sarritzu Abreu",
      role: "Presenter",            // shown before the dot
      title: "Value Engineer",
      photo: "assets/presenter.jpg",
    },
  },

  topics: [
    {
      short: "Execution layer",
      eyebrow: "01 — Agents",
      title: "The execution layer for your agents",
      lead: "Make is the execution layer that lets any agent act in real systems, dependably and within limits you set.",
      items: [
        { title: "Make MCP server + skills", body: "Give any MCP-capable agent the power to act, with the same permissions as the person it works for." },
        { title: "MCP toolboxes", body: "Decide in advance what each agent can reach, and nothing outside it. Available with scenarios today, with more capabilities coming soon." },
        { title: "Your client of choice", body: "Claude, ChatGPT, Cursor, Microsoft Copilot, or any agent that speaks MCP." },
      ],
      links: [{ label: "Make MCP server docs", href: "https://developers.make.com/mcp-server" }, { label: "Make skills", href: "https://skills.make.com/" }],
      image: { src: "assets/wall1-execution-layer.svg", alt: "Agents reach your systems through a scoped MCP toolbox in Make" },
    },
    {
      short: "Native AI",
      eyebrow: "02 — Native AI",
      title: "Native AI capabilities",
      lead: "AI that helps you build, AI that runs your processes, and the knowledge to ground it.",
      items: [
        { title: "Maia, a native assistant", body: "Text-to-scenario from scratch, existing scenarios explained, assisted debugging." },
        { title: "Make AI Agents", body: "Agents that reason, act and run inside a visual landscape. Call MCP servers, tools, and chat with it natively or from other tools." },
        { title: "Knowledge layer", body: "Give agents the context they need, from your own sources." },
      ],
      links: [{ label: "Maia by Make", href: "https://www.make.com/maia" }, { label: "Make AI Agents", href: "https://www.make.com/ai-agents" }],
      image: { src: "assets/wall2-maia.svg", alt: "Maia spots an error on module 3 and offers to fix it" },
    },
    {
      short: "Building for others",
      eyebrow: "03 — Building for others",
      title: "Building for others, simplified",
      lead: "Hand over a working scenario without handing around passwords.",
      items: [
        { title: "Credential requests", body: "When building solutions for others, ask them to connect their accounts securely within Make. You never see their secrets." },
        { title: "Create and modify credentials easily", body: "Set up or edit connections right where you manage them, before opening a scenario canvas." },
      ],
      links: [{ label: "Credential requests guide", href: "#" }],
      image: { src: "assets/wall3-credential-requests.svg", alt: "Creating a credential request: choose the app and the modules it covers" },
    },
    {
      short: "Code, on demand",
      eyebrow: "04 — Code",
      title: "Reach for code when you need it",
      lead: "On demand and sandboxed. Visual by default, code when it earns its place.",
      items: [
        { title: "Make Code app", body: "Run JavaScript or Python inside a scenario, in a sandbox." },
        { title: "Make AI Agents that write code", body: "Agents generate and run the code a task needs." },
        { title: "More on this with MakeOS", body: "We'll double down on this 'code-first' idea soon.", tag:"Preview" },
      ],
      links: [{ label: "Make Code app docs", href: "https://apps.make.com/code" }],
      image: { src: "assets/wall4-code.svg", alt: "Code written by the Make Code app or an AI agent runs in a sandbox" },
    },
    {
      short: "The present",
      eyebrow: "05 — The present",
      title: "Quality of life, and more control & governance",
      lead: "Recent releases that make building faster and governing easier.",
      items: [
        { title: "Wait module", body: "Pause a scenario until the moment it should continue.", tag: "Coming soon" },
        { title: "Data pinning", body: "Pin a module's output and keep building without re-running the modules in the path.", tag: "Coming soon" },
        { title: "Custom roles & Private Spaces", body: "Define exactly who can do what. Plus, everyone gets their own private team." },
        { title: "Other Notable Mentions", body: "Locked connections, scenario trash, new outputs panel + search, double-click to edit pills." }
      ],
      links: [{ label: "Release notes", href: "https://help.make.com/release-notes" }],
      image: { src: "assets/wall5-present.svg", alt: "The Wait module, data pinning and custom roles" },
    },
    {
      short: "The future: MakeOS",
      eyebrow: "06 — The future",
      title: "MakeOS",
      lead: "Make is AI automation for specialists. MakeOS is AI adoption for the whole company.",
      items: [
        { title: "Discover", body: "See where AI can help your business, and how what you run affects it." },
        { title: "Build", body: "Everyone gets work done, from a one-off request to a mission-critical process." },
        { title: "Observe", body: "Know who does what, and that your critical processes run reliably." },
        { title: "Govern", body: "Your data stays secure, the business scales, and spend stays under control." },
      ],
      links: [
        { label: "MakeOS waitlist", href: "https://f.make.com/waves2026" },
        { label: "Glass box vision blog post", href: "https://www.make.com/blog/waves26-the-glass-box-for-the-agentic-era" }

      ],
      image: { src: "assets/wall6-makeos.svg", alt: "MakeOS: Discover, Build and Observe form a loop, with Govern across all of it" },
    },
    {
      short: "The glass box",
      eyebrow: "07 — The glass box",
      title: "Bringing it all together, visually",
      lead: "Full auditability and visibility into what happened, and how.",
      items: [
        { title: "Make Grid", body: "The glass box vision: your whole automation landscape on one map." },
        { title: "Global search & Module search", body: "Find any scenario or execution detail. Find any module in the canvas." },
        { title: "Scenario logs", body: "Inspect every run and every bundle." },
        { title: "Audit logs", body: "Who changed what, and when." },
        { title: "MCP toolbox logs", body: "Every agent tool call, traced.", tag: "Coming Soon" },
        { title: "Event subscriptions", body: "Outbound webhooks ping your systems when something needs attention.", tag: "Beta" }
      ],
      links: [],
    },
  ],
};
