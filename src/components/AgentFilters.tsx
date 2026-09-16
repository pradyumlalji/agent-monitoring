"use client";

import { useMemo } from "react";
import { useAgentStore } from "../store/agentStore";
import { getCombinedState } from "../store/agentSelectors";

interface AgentFiltersProps {
    search: string;
    state: string;
    queue: string;
    site: string;
    onSearchChange: (value: string) => void;
    onStateChange: (value: string) => void;
    onQueueChange: (value: string) => void;
    onSiteChange: (value: string) => void;
    onReset: () => void;
}

export default function AgentFilters({
    search,
    state,
    queue,
    site,
    onSearchChange,
    onStateChange,
    onQueueChange,
    onSiteChange,
    onReset,
}: AgentFiltersProps) {
    const agents = useAgentStore((state) => state.agents);

    const agentList = Object.values(agents);

    const queues = useMemo(
        () => [...new Set(agentList.flatMap((agent) => agent.queues))].sort(),
        [agentList],
    );

    const sites = useMemo(
        () => [...new Set(agentList.map((agent) => agent.site))].sort(),
        [agentList],
    );

    const states = useMemo(
        () => [...new Set(agentList.map((agent) => getCombinedState(agent)))].sort(),
        [agentList],
    );

    return (
        <div className="flex flex-wrap items-end gap-4 border-b border-gray-200 bg-white p-4">
            {/* Search */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Search</label>

                <input
                    type="text"
                    placeholder="Agent or extension..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
            </div>

            {/* State */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">State</label>

                <select
                    value={state}
                    onChange={(e) => onStateChange(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                    <option value="">All States</option>

                    {states.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
            </div>

            {/* Queue */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Queue</label>

                <select
                    value={queue}
                    onChange={(e) => onQueueChange(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                    <option value="">All Queues</option>

                    {queues.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
            </div>

            {/* Site */}
            <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">Site</label>

                <select
                    value={site}
                    onChange={(e) => onSiteChange(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                    <option value="">All Sites</option>

                    {sites.map((item) => (
                        <option key={item} value={item}>
                            {item}
                        </option>
                    ))}
                </select>
            </div>

            {/* Reset */}
            <button
                type="button"
                onClick={onReset}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
                Clear Filters
            </button>
        </div>
    );
}
