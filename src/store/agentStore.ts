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

                // The snapshot represents the latest known
                // device state at initialization time.
                lastDeviceEventAt: new Date().toISOString(),

                callStartedAt: agent.deviceStatus === "Answered" ? new Date().toISOString() : null,
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

            // sequence is the reliable ordering key.
            //
            // Ignore:
            // - out-of-order events
            // - duplicates
            // - replayed events
            // - events that belong before the snapshot
            if (event.sequence <= agent.latestSequence) {
                return state;
            }

            const updatedAgent: AgentRuntime = {
                ...agent,
                latestSequence: event.sequence,
            };

            // Device stream
            if (event.stream === "device") {
                updatedAgent.deviceStatus = event.status;

                // Track when we last received a device event.
                // receivedAt is supplied by the mock stream.
                updatedAgent.lastDeviceEventAt = event.receivedAt ?? new Date().toISOString();

                // Update current call when the event provides
                // a call ID.
                if (event.callId !== undefined) {
                    updatedAgent.currentCallId = event.callId;
                }

                // New live call.
                //
                // We intentionally use client receive time
                // instead of emittedAt because emittedAt can
                // have clock skew.
                if (event.status === "Answered" && event.callId) {
                    updatedAgent.currentCallId = event.callId;

                    updatedAgent.callStartedAt = new Date().toISOString();
                }

                // Call ended.
                if (event.status === "CallEnded") {
                    updatedAgent.currentCallId = null;
                    updatedAgent.callStartedAt = null;
                }
            }

            // Agent stream
            if (event.stream === "agent") {
                updatedAgent.agentStatus = event.status;
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
