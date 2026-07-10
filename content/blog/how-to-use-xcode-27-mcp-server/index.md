---
date: 2026-07-09T16:22:51+07:00
title: How to use Xcode 27 MCP Server
description: Use the Xcode 27 MCP server with Codex, Claude Code, and other external agents for end-to-end agentic development.
summary: Learn how to enable the Xcode 27 MCP server, connect Codex or Claude Code, use Xcode tools from external agents, and extract Xcode skills for better agentic development.
preview: images/thumbnail.png
thumbnail: images/thumbnail.png
cover:
draft: false
tags: []
categories:
    - Software Development
keywords:
    - xcode
    - xcode27
    - mcp
    - codex
    - claude code
    - gemini
    - agentic development
    - mcp server
    - swift
    - ios
showSummary: true
showComments: false
showWordCount: true
showTableOfContents: true
showTaxonomies: true
showReadingTime: true
showPagination: true
showDate: true
showBreadcrumbs: true
showAuthor: true
fmContentType: default
---

{{< figure src="images/xcode_27.png" alt="Xcode 27" >}}

{{< lead >}}
Xcode 27 is a major step for developers who want to work with AI agents without leaving Apple's development environment. Instead of treating AI as a separate chat window beside the editor, Xcode now brings agentic coding directly into the IDE, with support for tools like Codex and Claude Code built into the development workflow.
{{< /lead >}}

At the time of writing, I am using Xcode 27 beta 3. In this version, agentic development feels much closer to a **first-class Xcode feature**: the agent can understand the project context, help reason about code, and support development tasks from inside Xcode itself.

~~Xcode 27 also introduces an **MCP server**.~~ MCP server support was already available in Xcode 26.3. This is important because MCP is not limited to the built-in Xcode experience. <u>External agents can connect to Xcode from outside the app</u>, inspect project state, and use Xcode as part of a broader agentic development workflow.

In this post, we will discuss the Xcode 27 MCP server in detail: what it is, why it matters, how Codex or Claude Code can connect to it, and how it changes day-to-day iOS and macOS development.

## Xcode 27 built-in agents

Before discussing the MCP server, it is worth understanding the new built-in agentic development feature in Xcode 27. Xcode can now **install coding agents directly inside the IDE**.

{{< figure src="images/xcode_install_agent.png" alt="Install agent in Xcode" caption="Installing an agent from inside Xcode 27." >}}

At the time of writing, Xcode 27 beta 3 supports **Codex**, **Claude Code**, and **Gemini** as installable agents. To use them, you still need a valid account, subscription, or API key for the provider you choose.

The important detail is how Xcode runs these agents. **Xcode downloads the agent binary and places it inside its own sandbox.** Then Xcode controls the agent call, proxies the interaction to that external agent, and parses the output back into the Xcode interface.

{{< alert >}}
Xcode does not use the Codex or Claude Code CLI tool that you already have installed on your machine. The agent binary used by Xcode is downloaded and managed by Xcode itself, inside its own sandbox.
{{< /alert >}}

Xcode 27 also includes **built-in skills** to guide agentic development inside the IDE.

{{< figure src="images/xcode_built_in_skills.png" alt="Xcode built-in skills" caption="Xcode 27's built-in skills for agentic development." >}}

The built-in skills include:

- `accessibility-dynamic-type-specialist`
- `accessibility-voiceover-specialist`
- `adopt-c-bounds-safety`
- `audit-xcode-security-settings`
- `device-interaction`
- `modernize-tests`
- `swiftui-specialist`
- `swiftui-whats-new-27`
- `translation`
- `translation-coordinator`
- `uikit-app-modernization`

These skills help the built-in agent understand specific Apple development tasks, such as SwiftUI work, accessibility, testing modernization, device interaction, translation, UIKit modernization, and security settings.

If you want to go further and extend or customize this built-in agentic experience yourself, Apple has a dedicated guide:

{{< link-preview
  title="Extending and customizing agents"
  description="Expand agent capabilities for your specific needs and application domain."
  image="https://docs.developer.apple.com/tutorials/developer-og.jpg"
  link="https://developer.apple.com/documentation/xcode/extending-and-customizing-agents/"
>}}

Apple also has WWDC sessions that explain this direction in more detail:

{{< link-preview
  title="What's new in Xcode 27"
  description="Discover the latest productivity enhancements in Xcode 27. Accelerate your development workflow through customization, coding agents, and..."
  image="https://devimages-cdn.apple.com/wwdc-services/images/9B2E82C5-4DDF-4B9A-9459-328D8E297696/10781/10781_wide_250x141_2x.jpg"
  link="https://developer.apple.com/videos/play/wwdc2026/258/"
>}}

{{< link-preview
  title="Xcode, agents, and you"
  description="Learn how you can use coding agents in Xcode in your development process. We'll explore multiple ways of working with agents with tips to..."
  image="https://devimages-cdn.apple.com/wwdc-services/images/9B2E82C5-4DDF-4B9A-9459-328D8E297696/10782/10782_wide_250x141_2x.jpg"
  link="https://developer.apple.com/videos/play/wwdc2026/259/"
>}}

## Enable the Xcode MCP server

Before Codex, Claude Code, or another external agent can access Xcode, you need to **allow external MCP access** inside Xcode.

Open **Xcode 27**, then go to **Settings > Intelligence > Model Context Protocol**. Enable **Allow external agents to use Xcode tools**.

{{< figure src="images/allow_external_agent.png" alt="Allow external agents to use Xcode tools" caption="Enable external agent access to Xcode's MCP server." >}}

After this option is enabled, Xcode can **expose its tools through the MCP server**. External agents can then connect to Xcode and use those tools after you approve the required permission prompts.

## Register the MCP server on external agents

Apple documents the external agent setup in [Giving external agents access to Xcode](https://developer.apple.com/documentation/xcode/giving-external-agents-access-to-xcode). After you enable external agent access in Xcode, the next step is to register Xcode's MCP server in the agent you want to use.

For **Codex**, run:

```bash
codex mcp add xcode -- xcrun mcpbridge
```

For **Claude Code**, run:

```bash
claude mcp add --transport stdio xcode -- xcrun mcpbridge
```

Xcode's MCP server uses **stdio** transport. The command that starts the server is:

```bash
xcrun mcpbridge
```

For other agents, use the same idea: create a stdio MCP server named `xcode`, then configure it to run `xcrun mcpbridge`.

## Start using the MCP server

After the MCP server is registered, restart your external agent so it can load the new MCP configuration. In Codex or Claude Code, you can check the installed MCP servers with `/mcp`.

Before an external agent can communicate with the Xcode MCP server, **you need to start Xcode first**. Open Xcode 27 and load the project or workspace you want the agent to work with.

When the external agent tries to use Xcode tools for the first time, Xcode shows a permission popup. The popup tells you which external agent is requesting access to the MCP server.

{{< figure src="images/allow_mcp_access.png" alt="Allow MCP access" caption="Xcode prompts for permission before an external agent can connect." >}}

If you trust the agent, approve the request. You can also enable **Don't ask again for this agent binary until Xcode restarts** to reduce repeated permission prompts during the same Xcode session.

Once approved, you can see the agent access in Xcode's agent activity view.

{{< figure src="images/agent_activity.png" alt="Agent activity" caption="Xcode's agent activity view shows connected external agents." >}}

## Xcode MCP server capabilities

The Xcode MCP server gives external agents access to **Xcode-specific context and actions**. This is different from a normal coding agent that *only reads files from disk*. Through MCP, the agent can understand the active Xcode workspace, selected scheme, run destination, build state, test state, simulator session, and other data that normally lives inside Xcode.

At a high level, the Xcode MCP server can help with these workflows:

- **Workspace context**: list open Xcode windows, inspect workspace tabs, check the active scheme, and inspect available run destinations.
- **Project files**: browse the Xcode project structure, search files, read the active editor file, create files, update files, move files, and create groups or directories.
- **Builds and diagnostics**: build the current project, read build logs, inspect Issue Navigator diagnostics, and refresh compiler issues for a specific file.
- **Tests**: list tests from the active scheme or test plan, run all tests, or run selected tests.
- **Runtime debugging**: run the app, stop the app, inspect console output, run LLDB debugger commands, and execute focused Swift snippets in project context.
- **SwiftUI previews**: render SwiftUI previews from source files, including preview variants and localization overrides.
- **Simulator and device interaction**: start an interaction session, install and run the app, tap, type, swipe, press device buttons, change orientation, and inspect UI state.
- **Project configuration**: inspect and update target build settings, compiler flags, Info.plist values, and entitlements.
- **Localization**: inspect String Catalog state and prepare or apply translations when the required localization workflow is available.
- **Apple documentation and field data**: search Apple Developer Documentation and inspect available crash or performance diagnostics for connected Apple project data.

This means the external agent can do more than edit Swift files. It can ask Xcode what project is open, choose the right scheme, build the app, inspect the compiler error, update the file, rebuild, run the app, and check the result in the simulator. That makes the workflow closer to real agentic development because the agent can use **Xcode as the source of truth** instead of guessing from the file system alone.

To help an agent use these capabilities correctly instead of guessing, I use a **dedicated Xcode skill** as a guide for my agent. It documents the available MCP capabilities and common workflows, such as discovering the active Xcode workspace, checking schemes and run destinations, building, testing, reading logs, rendering previews, running the app, and interacting with the simulator. You can find it here:

https://github.com/wendyliga/skills/tree/main/skills/xcode

To install it, run:

```bash
npx skills add wendyliga/skills --skill xcode
```

*The MCP server provides the tools, and the skill gives the agent a practical map for using those tools correctly.*

## Usecase

With the Xcode 27 MCP server, **end-to-end development** with agents like Codex or Claude Code becomes possible. The agent is no longer limited to editing files and waiting for you to manually verify the result in Xcode.

This fits well with loop-based engineering workflows, such as `/goal` in Codex or similar goal-oriented workflows in Claude Code. You can give the agent a larger task, such as changing UI behavior or updating app logic, then let it use Xcode MCP tools to complete the full development loop.

For example, you can ask the agent to:

1. Inspect the current project and active scheme.
2. Make the required code changes.
3. Build the app through Xcode.
4. Install and run the app in the simulator.
5. Control the simulator and navigate to the screen affected by the change.
6. Interact with the UI, collect runtime output, and check whether the change works as intended.
7. Iterate on the code if the result is wrong.

This is the important shift: **the agent can verify its own work inside the actual Xcode runtime environment**. For UI changes, it can navigate to the affected screen and inspect the result. For logic changes, it can run the app, check logs, trigger flows, and confirm behavior. The development loop becomes *edit, build, run, inspect, and fix* — all driven through Xcode.

## Extracting internal Xcode skills

To fully utilize the Xcode agentic experience from an external agent, one final step is to extract and use the skills Apple created for Xcode itself.

As mentioned earlier, Xcode 27 includes several built-in skills for agentic development, such as SwiftUI, accessibility, translation, test modernization, device interaction, UIKit modernization, and security settings. These skills are useful because they describe how the agent should approach specific Apple development tasks.

I created a simple skill to extract those internal Xcode skills:

https://github.com/wendyliga/skills/tree/main/skills/extract-xcode-skills

You can install it with:

```bash
npx skills add wendyliga/skills --skill extract-xcode-skills
```

The extracted skills will look like this:

{{< figure src="images/extract_xcode_internal_skills.png" alt="Extract Xcode internal skills" caption="Xcode's internal skills extracted for use by external agents." >}}

After extracting the skills, you can make them available to your external agent workflow. This gives Codex, Claude Code, or another agent more of the same **task-specific guidance** that Xcode's built-in agent uses internally.

## Agentic Xcode vs external agent

Xcode 27 moves Apple's agentic development story much further forward. In Xcode 26, I wrote about the new AI capabilities in [Use Custom Models in the New Xcode 26 Intelligence](https://wendyliga.com/blog/xcode-26-custom-model/). At that time, the experience was still very limited, and Xcode AI development felt very far behind tools like Cursor, Codex, Claude Code, and other agentic coding environments. Xcode had started to expose AI-assisted development, but the workflow was not yet close to a full agentic coding loop.

With Xcode 27, the gap is much thinner. I tried developing fully with Xcode's built-in agentic workflow for a week, and *honestly, it is very usable for daily development*. Having the agent inside Xcode makes sense: it has direct context from the IDE, it understands the project state better, and it fits naturally into the normal Apple development workflow.

However, external agents like Codex and Claude Code still **offer a better overall experience** for my workflow. They give more control over the model, better options for goal-oriented loops such as `/goal`, more flexible automation, remote access, and a broader agent environment outside Xcode.

**The MCP server is what connects these two worlds.** With Xcode 27 MCP and the Xcode skill described earlier, I can use the built-in agentic capabilities of Xcode from an external agent. I still get Xcode context, builds, simulator access, previews, logs, and project state, but I can keep using the external agent workflow that gives me more control.

## Summary

Xcode 27 makes agentic development much more practical than before. The built-in agent experience is now usable for daily development, and Xcode can install agents like Codex, Claude Code, and Gemini directly inside the IDE.

**The bigger change is the Xcode MCP server.** By enabling external agent access and registering `xcrun mcpbridge`, external agents can use Xcode tools from outside the app. They can inspect workspace state, build the project, run tests, read logs, render previews, install the app into the simulator, interact with the UI, and verify changes in a real Xcode runtime workflow.

For my workflow, external agents still provide **more control**: model choice, loop-based engineering, remote access, and broader automation. With Xcode MCP, the Xcode skill, and extracted internal Xcode skills, I can keep that external-agent workflow while still using **Xcode as the source of truth** for Apple development.

---

*Thumbnail background photo by [Bernd 📷 Dittrich](https://unsplash.com/@hdbernd?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) on [Unsplash](https://unsplash.com/photos/a-pixelated-orange-character-with-a-hat-GPPbPWwTHdg?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText), modified for this post's thumbnail.*
