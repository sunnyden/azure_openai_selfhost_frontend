---
applyTo: "**"
---

# Feature definition

- MAGI, or Multi-agent Gating Interface, is a decision making system based on multiple LLMs and predefined rules.

# Input

- User may have a content that is pending to get a decision, the content would be kind of action like `I am going to travel to Japan next week.` or would be a content that need to be justified whether it meets certain criteria for next step processing.

- User should specify _exactly_ three agents to perform the decision making. For each agent, user should specify:
    - The name of the agent
    - The model used by the agent
    - Criteria of the agent to make the decision, the criteria would be something that the agent must absolutely follow to generate their decision.

# Processing

- The judgement will be done in 3 rounds, for each round, all agents will generate their decision independently based on following information:
    - The content that is pending to get the decision
    - The criteria set for the agent
    - The decisions made by all agents in previous rounds (if any)
- For the judgement process, each agent will get specified a system prompt which wraps the above information in a well-structured format, and in the system prompt we will define the response format requiring the agent provide their decision (approve/reject) and the reason for the decision.
- After 3 rounds of judgement, the final decision will be made based on the decisions from all agents in all rounds. Each agent's decision will then be finalized with a weight: 0.1, 0.4, 0.5:
    - Decision of Agent A: 1st round decision _ 0.1 + 2nd round decision _ 0.4 + 3rd round decision \* 0.5, if final score >= 0.5 then we consider Agent A's final decision is approve, otherwise reject.
    - same as agent B, C.
- The overall final decision will be made based on the finalized decisions from all agents. If at least two agents approve, then the overall final decision is approve, otherwise reject.

# UI

There will be two pages:

1. First page will allow user to input the content and decision criteria or everyting that we need for Input section.
2. Second page will render the decision making process in realtime, showing the decisions making progress of each round, and finally show the overall final decision along with the finalized decisions from all agents.

# Detailed UI Design of the realtime rendering of decision making progress.

- The page will contain three boxes, the box will be placed in a triangle layout, each box represents an agent.
- Each box will contain:
    - The agent name.
    - Reason / Decision history info
- During inference, each agent box will flash to indicate that the agent is making decision
- After inference, the color of the agent will be either red(reject) or green(approve) or yellow(pending for next round) based on the decision process defined above.
- On right top corner, we will show the overall status: Idle, Judging, Approved, Rejected, Error.
- On the left top corner, we will show the title of the current judgement.
- When user hover on the agent box, we will show the detailed information regarding to the decision making process of the agent, including the decision made in each round, and the reason provided in each round.

# Exception handling

- In case the agent failed when making chat completion, try to do retry for 3 times. If still failed, mark the flow as Failed.

# Coding requirement

- All logics should be implemented in src/ui/page/MagiPage/
- Do not change any existing code except AppRouter.tsx to add the route for the new page if needed.
- Use all existing apis in src/api/ and src/data/context

