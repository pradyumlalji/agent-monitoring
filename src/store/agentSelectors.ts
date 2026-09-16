import type { AgentRuntime } from "./agentTypes";

export function getCombinedState(agent: AgentRuntime): string {
    if (agent.agentStatus === "LoggedOut") {
        return "Logged Out";
    }

    if (agent.deviceStatus === "Unregistered") {
        return "Unavailable";
    }

    if (agent.deviceStatus === "Ringing") {
        return "Ringing";
    }

    if (agent.deviceStatus === "Answered") {
        return "On Call";
    }

    if (agent.deviceStatus === "OnHold") {
        return "On Hold";
    }

    if (agent.agentStatus === "OnBreak") {
        return "On Break";
    }

    if (agent.agentStatus === "AfterCallWork") {
        return "After Call Work";
    }

    return "Available";
}
