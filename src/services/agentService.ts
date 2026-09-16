import {
    connect,
    fetchAgents as fetchAgentsFromMock,
    fetchCalls as fetchCallsFromMock,
} from "../../mock/agentStream";

import type { Agent, AgentEvent, Call, ConnectionStatus } from "../store/agentTypes";

type MockFetchCalls = (options?: { agentId?: string; offset?: number; limit?: number }) => Promise<{
    calls: unknown[];
    offset: number;
    limit: number;
}>;

const fetchCallsMock = fetchCallsFromMock as MockFetchCalls;

export async function fetchAgents(): Promise<Agent[]> {
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetchAgentsFromMock();

            return response.agents as Agent[];
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
    }

    throw new Error("Failed to load agents");
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
    const response = await fetchCallsMock({
        agentId,
        offset,
        limit,
    });

    return {
        calls: response.calls as Call[],
        offset: response.offset,
        limit: response.limit,
    };
}

export function connectAgentStream(
    onEvent: (event: AgentEvent) => void,
    onStatusChange: (status: ConnectionStatus) => void,
) {
    return connect({
        onEvent,
        onStatusChange,
    });
}
