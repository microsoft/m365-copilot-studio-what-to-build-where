# Source guidance for platform-selection questions

Source: additional guidance supplied by the user on 13 October 2026.
The text below is preserved with Markdown headings and paragraph spacing.
It remains draft guidance, including unresolved claims and references to
appendices in the wider document. The site's concise question descriptions
are maintained separately in `src/data/guidance.ts`.

## What job does the agent need to do?

Jobs range from simple Q&A to complex tasks, and most agents do one of five. Pick the main job for each use case first. If a use case covers several, start with the job that carries the most risk or reaches the most people. Appendix F collects the watch-outs for each job.

### Answer questions from your content

This is the most common job. People ask questions in plain language and get answers from documents, sites, or other knowledge sources, with citations they can check. Think HR policy questions like how parental leave works, or a project assistant that knows the specs and plans.

Start with Agent Builder when the answers live in supported Microsoft 365 knowledge sources, such as SharePoint sites, files, email, meetings, and chats. Setup is quick and needs no code, and people can share the agent with individuals, teams, or the whole organization, subject to the admin controls you set. For HR policy questions, an agent grounded on the HR policy site is often all you need, as long as someone owns that content and keeps it current.

Agent Builder leaves most design choices to the person who builds the agent, and it has limited ALM options and limited runtime telemetry for makers. Choose Copilot Studio instead when answers must start a workflow or update a record, or when many people depend on the agent and you need governed releases and analytics. Start a new agent on the GitHub Copilot harness, or keep building on the Standard harness if you're extending an existing Standard Q&A agent.

### Guide people through a process

Here the agent walks someone through a task and adapts to their situation. An onboarding guide that helps managers set up a new hire is one example. IT incident intake that collects the details and logs a ServiceNow ticket is another.

If the agent only needs to guide, not act, start with Agent Builder. Describe the process in plain language and ground it on approved documents, such as the onboarding checklist and related policies. The instructions make or break this kind of agent, so make sure whoever builds it spells out the purpose, the audience, the steps, and what to do when it doesn't know the answer.

Choose Copilot Studio when the process has to log tickets or update records, or when many people need it with test environments and controlled releases. For a new agent, use the GitHub Copilot harness, where a workflow can mix pre-authored and agentic steps. If you're extending an existing Standard agent, topics and branching control the dialogue, and generative orchestration works alongside deterministic workflow steps. If you'd rather build the integration in code, a pro-code agent built with Microsoft 365 Agents Toolkit can create the ticket through an API or MCP action.

The same applies to a well-defined Q&A or service conversation, including one with customers on a website. Build a new one on the GitHub Copilot harness, and keep in mind that it doesn't currently support handover to live human agents. If you're extending an existing Standard agent that hands over to live agents, keep building it on the Standard harness.

### Take action across business systems

Some agents need to do more than answer. They create tickets, update CRM records, or start approvals. Request and approval workflows with Dynamics 365 or ServiceNow fit here, as do employee assistants that need developer-owned integrations.

Decide first how you'll build the integrations. For an employee-facing Microsoft 365 assistant with integrations built and deployed in code, use a pro-code agent built with Microsoft 365 Agents Toolkit. It keeps native Microsoft 365 grounding and governance, reads and writes business data through API and MCP integrations, and keeps the agent definition in source control. Your developers own the integrations, authentication, testing, and deployment, and any pre-authored, deterministic workflow needs code or an external workflow service.

If the process needs pre-authored workflow steps, or you want to build it in a low-code tool, use Copilot Studio. For new agents, use the GitHub Copilot harness: a workflow can mix pre-authored steps that follow fixed rules with reasoning, multistep tool use, and document processing. If you're extending an existing Standard agent, connectors and agent flows do the work there, and topics keep the conversation consistent. Agent Builder isn't the right fit for this job, because writing to business systems needs another authoring route.

### Handle complex business tasks and documents

This agent works through a complex business task that mixes pre-authored steps with reasoning, tool use, and document processing, and each case can take a different path. Investigating invoice discrepancies and preparing an approval pack is one example. Contract review against standard terms is another.

Start with the GitHub Copilot harness in Copilot Studio. It uses reasoning models and iterative planning, processes large documents, creates files, and reuses skills and tools. You can deliver the work as a conversation, a workflow, or both, and a workflow can mix pre-authored and agentic steps. It also brings enterprise-grade governance, telemetry, and ALM. It can call Researcher or Analyst too, say to check an unfamiliar clause in a contract.

For straightforward Q&A, a lighter-weight option is usually a better fit, such as Agent Builder, or the Standard harness if you're extending an existing Standard agent. Before you commit, check that the GitHub Copilot harness supports the publishing channels you need, and note that it doesn't currently support handover to live human agents. Budget for a higher cost per request, and test with real cases, exceptions included.

### Get complex cross-app work done

Sometimes an employee needs a complex task done across email, calendar, Teams, files, and Office documents, and wants a finished result rather than an answer. Think of preparing a customer meeting briefing from emails and files, creating the supporting documents, and arranging follow-up meetings.

Point people to Cowork in Microsoft 365 Copilot. It's a ready-made assistant, so there's no agent to build. It uses agentic reasoning, multistep tool use, and Microsoft 365 work context, creates and edits documents, and runs scheduled and event-driven tasks. Your platform team extends and standardizes it through centrally managed plugins and skills, and Microsoft 365 governance applies. People should still check what it produces before they send it or rely on it.

This job is the clearest case of deciding who guides the work. With Cowork, users direct the work and skills and plugins guide how it runs, but there are no native pre-authored workflows and no maker-authored agent definition. When you need to design the end-to-end process and behavior, build a dedicated agent or workflow in Copilot Studio instead. The section Who should guide the behavior? covers this choice.

### Which Copilot Studio harness fits the job?

When a job points to Copilot Studio, match the harness to the work. Microsoft focuses major new capability and model investment on the newer harnesses, but the Standard harness remains supported and maintained. For new agents, evaluate the GitHub Copilot harness first. Choose the Standard harness when you specifically need topic-based, rule-driven dialogue, or to maintain an existing agent.

- The GitHub Copilot harness for new agents, including complex business tasks that combine pre-authored steps with reasoning, tool use, and document processing
- The Standard harness to maintain or extend existing agents, or where topic-based, rule-driven dialogue is specifically required

## Three more questions to answer

Once you know the job, these three questions usually settle the choice.

### Who should guide the behavior: the user or the organization?

Some experiences let the user direct the work. Others need the organization to define exactly how the agent behaves. This choice is less about capabilities than about control.

Cowork can still take action in business systems. For example, with a plugin to your CRM, someone can ask it to scan last month's email and submit new opportunities. It brings that work together with people's everyday productivity, but the user guides it, within the plugins and skills your organization manages centrally.

Choose an organization-guided agent in Copilot Studio when the organization must define the path. An HR assistant is a typical example: sensitive topics must follow a specific designed path, and requests may need to be checked or redacted for personal data before processing. For a new agent, use the GitHub Copilot harness.

### Where will people use the agent?

Start with who the users are. If they're employees working in Microsoft 365 Copilot, Teams, or Outlook, every platform in this guidance works. Agent Builder needs no code, Copilot Studio is low-code, and Microsoft 365 Agents Toolkit is for developers. Agent Builder and Microsoft 365 Agents Toolkit run on Microsoft 365 Copilot's orchestration and models, so they inherit Microsoft 365 security and compliance and need no extra hosting.

For deeper Teams work, such as group conversations, events, and notifications, use Copilot Studio.

Customers and other external users narrow things quickly, because Agent Builder and Microsoft 365 Agents Toolkit can't serve them. For a new customer-facing conversation on a website, start with the GitHub Copilot harness in Copilot Studio [Confirm voice support in the GitHub Copilot harness]. It doesn't support handover to a live human agent today. If you're extending an existing Standard agent that relies on live-agent handover or voice with speech and DTMF input, keep building on the Standard harness.

If the agent has to run in your own website or custom client, the GitHub Copilot harness in Copilot Studio can be embedded there. If you need your own models or orchestration, use Microsoft 365 Agents SDK, including when you want to extend a Copilot Studio solution with your own orchestration layer. Appendix A profiles the other pro-code options that remain under review.

Need several channels? Copilot Studio publishes one agent to Teams, Microsoft 365 Copilot, websites, and other channels from one place. On the GitHub Copilot harness, check support for each channel you need before you commit.

### Does the agent need to act on its own?

Most agents wait for someone to ask. Some need to watch for events, send notifications, or run long work in the background, and only some options can do that.

Agent Builder and Microsoft 365 Agents Toolkit respond only when someone prompts them. Pick one of them only if that will stay true for the life of the agent.

If the work has to run on a trigger, an event, or a schedule, decide who should design that behavior. Cowork runs scheduled and event-driven tasks that people direct for their own work. When the organization needs to design and own the behavior, use Copilot Studio. For long-running tasks, the GitHub Copilot harness breaks a goal into steps and recovers when a step fails.

An agent that acts on its own needs guardrails. Limit what it can do, log its actions, require approval for high-impact steps, and keep a way to stop it. Name a business owner and a technical owner who review what it does. The GitHub Copilot harness adds enterprise-grade governance, telemetry, and production monitoring.
