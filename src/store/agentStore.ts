import { create } from "zustand";
import { Agent, AgentEvent, AgentRuntime, ConnectionStatus } from "./agentTypes";

interface AgentStore {
    agents: Record<string, AgentRuntime>;
    connectionStatus: ConnectionStatus;

    initializeAgents: (agents: Agent[]) => void;
    processEvent: (event: AgentEvent) => void;
    setConnectionStatus: (status: ConnectionStatus) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
    agents: {},
    connectionStatus: "connecting",

    initializeAgents: (agents) => {
        const agentsById: Record<string, AgentRuntime> = {};

        agents.forEach((agent) => {
            agentsById[agent.agentId] = {
                ...agent,
                latestSequence: agent.snapshotSeq,
            };
        });

        set({
            agents: agentsById,
        });
    },

    processEvent: (event) => {
        set((state) => {
            const agent = state.agents[event.agentId];

            if (!agent) {
                return state;
            }

            // Ignore stale, duplicate or pre-snapshot events
            if (event.sequence <= agent.latestSequence) {
                return state;
            }

            const updatedAgent: AgentRuntime = {
                ...agent,
                latestSequence: event.sequence,
            };

            if (event.stream === "device") {
                updatedAgent.deviceStatus = event.status as AgentRuntime["deviceStatus"];

                if (event.callId !== undefined) {
                    updatedAgent.currentCallId = event.callId;
                }
            }

            if (event.stream === "agent") {
                updatedAgent.agentStatus = event.status as AgentRuntime["agentStatus"];
            }

            return {
                agents: {
                    ...state.agents,
                    [event.agentId]: updatedAgent,
                },
            };
        });
    },

    setConnectionStatus: (status) => {
        set({
            connectionStatus: status,
        });
    },
}));
