"use client";

import { memo } from "react";

import { useAgentStore } from "../store/agentStore";
import { getCombinedState } from "../store/agentSelectors";

import CallTimer from "./CallTimer";

interface AgentRowProps {
    agentId: string;
    onSelect: (agentId: string) => void;
}

function AgentRow({ agentId, onSelect }: AgentRowProps) {
    const agent = useAgentStore((state) => state.agents[agentId]);

    if (!agent) {
        return null;
    }

    const isOnCall = agent.deviceStatus === "Answered" && agent.callStartedAt;

    return (
        <tr
            onClick={() => onSelect(agent.agentId)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(agent.agentId);
                }
            }}
            tabIndex={0}
            className="cursor-pointer whitespace-nowrap hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            <td className="border border-gray-300 px-3 py-2">{agent.name}</td>

            <td className="border border-gray-300 px-3 py-2">{agent.extension}</td>

            <td className="border border-gray-300 px-3 py-2">{agent.queues.join(", ")}</td>

            <td className="border border-gray-300 px-3 py-2">{agent.site}</td>

            <td className="border border-gray-300 px-3 py-2">{agent.deviceStatus}</td>

            <td className="border border-gray-300 px-3 py-2">{agent.agentStatus}</td>

            <td className="border border-gray-300 px-3 py-2">
                <div className="flex items-center gap-2">
                    <span>{getCombinedState(agent)}</span>

                    {isOnCall && <CallTimer startedAt={agent.callStartedAt!} />}
                </div>
            </td>
        </tr>
    );
}

export default memo(AgentRow);
