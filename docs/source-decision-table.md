# Original agent-platform decision table

Source: the table supplied by the user on 10 October 2026 to create this site.
The table and review comments below preserve the original draft, including
incomplete links and unresolved questions. They are separate from the site's
subsequently edited wording and implemented decision rules.

| **Question** | **If your answer is...** | **Consider** | **Why** | **Watch out for** |
| --- | --- | --- | --- | --- |
| **What job does the agent need to do?** | Personal or team productivity over Microsoft 365 content, such as answering questions or guiding people | Agent Builder: enable it securely rather than routing use cases to it | [Quick no-code setup, grounded in supported Microsoft 365 sources[AL1]]() [[MP2]]()<br>See: Where the central team fits for Agent Builder and Cowork | Limited ALM and runtime telemetry; can't write to business systems |
|  | [Log tickets or update records with fixed-rule steps[AL3]]() | Copilot Studio: GitHub Copilot harness for new agents;<br>Standard harness if you're extending an existing Standard agent | Workflows mix fixed-rule steps with agentic ones, and connectors write to business systems. See: Take action across business systems | Standard gets no major new capabilities or frontier reasoning models<br>Higher cost per request; no handover to live human agents; check channel support |
|  | A complex business task with reasoning and documents | Copilot Studio GitHub Copilot harness | Reasoning models, multistep tool use, and document processing | Higher cost per request; no handover to live human agents; check channel support |
|  | [Complex cross-app [AL4]]() work an employee directs | Cowork | Ready-made assistant, so there's no agent to build | No way to design an end-to-end process; limited collaboration, no ALM |
|  | Act in business systems from Microsoft 365 Copilot through your own APIs or MCP servers | Microsoft 365 Agents Toolkit (pro-code) | Native Microsoft 365 grounding, with API and MCP actions and the agent definition in source control. See: Take action across business systems | Your team owns integrations, authentication, testing, and [deployment[MP5]]() |
| **Who should guide the behavior: the user or the organization?** | The user directs the work, within centrally managed plugins and skills | Cowork | The user guides the work, which can still include actions in business systems through plugins. See: Who should guide the behavior? | No designed end-to-end process; review [output[MP6]]() before relying on it |
|  | The organization must design how the agent behaves, including sensitive paths | Copilot Studio (GitHub Copilot harness for new agents) | The organization defines the path, for example for sensitive HR topics. See: Who should guide the behavior? | Higher cost per request; no handover to live human agents; check channel support |
| [**Where will people use the agent?[AL7]**]() | Employees in Microsoft 365 Copilot, Teams, or Outlook | Any of the six | Every platform in this guidance works there. See: Where will people use the agent? |  |
|  | Customers on a website or by voice | Copilot Studio: GitHub Copilot harness for web chat; Standard harness where you need live-agent handover or voice [Confirm voice support in the GitHub Copilot harness] | The GitHub Copilot harness can be embedded into a website; the Standard harness handles live-agent handover and voice |  |
|  | One agent published to several channel[s[AL8]]() [[MP9]]() , such as Teams, Microsoft 365 Copilot, and a website | Copilot Studio | Publishes one agent to many channels from one place | Each channel has its own approval and admin steps; check GitHub Copilot harness channel support |
|  | Y[our own app or webs[AL10]]() [[MP11]]() ite | Website or custom client: Copilot Studio GitHub Copilot harness. | The GitHub Copilot harness can be embedded into a website or your own custom client | No handover to live human agents; check channel [support[MP12]]() |
|  | [Your own models or orchestration[AL13]]() | Microsoft 365 Agents SDK (pro-code) | AI-agnostic: developers plug in the AI services or orchestration libraries they choose, and one agent can serve Teams, Microsoft 365 Copilot, a website, and other channels | You host and secure it; the SDK doesn't provide the AI model or orchestration itself |
|  |  |  |  |  |
| **Does the agent need to act on its own?** | No, it only responds when asked | Agent Builder or Microsoft 365 Agents Toolkit (pro-code) | Both respond only when prompted; pick them only if that stays true | If it later needs to act without a prompt, you'll have to move platforms |
|  | Yes, scheduled or event-driven tasks people direct for their own work | Cowork | Runs scheduled and event-driven tasks | No designed end-to-end process; review output before relying on it<br> |
|  | Yes, and the organization designs and owns the behavior | Copilot Studio | For long-running tasks, the GitHub Copilot harness recovers when a step fails | Cost grows with autonomy; name owners who can review it |

## Original review comments

[[AL1]]()no space for "gotchas"?

[[MP2]]()Added a (currently blank) Watch out for column

[[AL3]]()this doesn't seem right -- "fixed-rules" invoke standard harness...

Also the fixed steps isn't accurate as a criterion for standard, unless it's in the context of driving the conversation flow deterministically. Let's discuss.

[[AL4]]()We already have that as a 1st level critetion, not sure it's helpful to have it twice

[[MP5]]()Need help with this row, not sure if any of this is correct

[[MP6]]()I’ve added this question based on our discussion but might need more refinement on the different options

[[AL7]]()We should also add b2c vs b2e as a criterion

[[AL8]]()not sure what this means

[[MP9]]()Changed to “one agent published to multiple channels”

[[AL10]]()inaccurate -- ghcp can be embbeded into web or your own custom client. We shouldn't bundle those together.

important comment though -- we should add M365 Agents SDK for bring your own model/orchcestration

[[MP11]]()I tried to add this as a new row now but arguably an option I’m not that familiar with. I think it now also doesn’t fit the “Where will people use the agent” question anymore so we may need to modify the questions or move this

[[MP12]]()Unsure if this is correct??

[[AL13]]()this should probably be top level?
