import type { Agent, AgentEvent, Call } from "../store/agentTypes";

import agentsData from "../../mock/agents.json";
import eventsData from "../../mock/events.json";
import callsData from "../../mock/calls.json";

export async function fetchAgents(): Promise<Agent[]> {
    const data = structuredClone(agentsData);

    return data.agents as Agent[];
}

export async function fetchCalls(
    agentId: string,
    offset = 0,
    limit = 20,
): Promise<{
    calls: Call[];
    offset: number;
    limit: number;
}> {
    const calls = callsData.calls
        .filter((call) => call.agentId === agentId)
        .slice(offset, offset + limit);

    return {
        calls: calls as Call[],
        offset,
        limit,
    };
}

export function getEvents(): AgentEvent[] {
    return eventsData as AgentEvent[];
}
