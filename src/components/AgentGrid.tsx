"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { useAgentStore } from "../store/agentStore";
import { getCombinedState } from "../store/agentSelectors";
import AgentFilters from "./AgentFilters";

type SortKey = "name" | "extension" | "queue" | "site" | "device" | "agentState" | "combinedState";

type SortDirection = "asc" | "desc";

export default function AgentGrid() {
    const agents = useAgentStore((state) => state.agents);
    const agentList = Object.values(agents);

    const searchParams = useSearchParams();
    const router = useRouter();

    // Filters from URL
    const search = searchParams.get("search") || "";
    const state = searchParams.get("state") || "";
    const queue = searchParams.get("queue") || "";
    const site = searchParams.get("site") || "";

    // Sorting from URL
    const sortKey = (searchParams.get("sort") || "name") as SortKey;
    const sortDirection = (searchParams.get("direction") || "asc") as SortDirection;

    // Update URL
    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }

        router.push(`?${params.toString()}`);
    };

    // Clear filters
    const resetFilters = () => {
        const params = new URLSearchParams(searchParams.toString());

        params.delete("search");
        params.delete("state");
        params.delete("queue");
        params.delete("site");

        router.push(`?${params.toString()}`);
    };

    // Sorting
    const handleSort = (key: SortKey) => {
        const params = new URLSearchParams(searchParams.toString());

        if (sortKey === key) {
            params.set("direction", sortDirection === "asc" ? "desc" : "asc");
        } else {
            params.set("sort", key);
            params.set("direction", "asc");
        }

        router.push(`?${params.toString()}`);
    };

    const filteredAgents = useMemo(() => {
        const filtered = agentList.filter((agent) => {
            const matchesSearch =
                agent.name.toLowerCase().includes(search.toLowerCase()) ||
                agent.extension.toLowerCase().includes(search.toLowerCase());

            const matchesState = !state || getCombinedState(agent) === state;

            const matchesQueue = !queue || agent.queues.includes(queue);

            const matchesSite = !site || agent.site === site;

            return matchesSearch && matchesState && matchesQueue && matchesSite;
        });

        return [...filtered].sort((a, b) => {
            let valueA = "";
            let valueB = "";

            switch (sortKey) {
                case "name":
                    valueA = a.name;
                    valueB = b.name;
                    break;

                case "extension":
                    valueA = a.extension;
                    valueB = b.extension;
                    break;

                case "queue":
                    valueA = a.queues.join(", ");
                    valueB = b.queues.join(", ");
                    break;

                case "site":
                    valueA = a.site;
                    valueB = b.site;
                    break;

                case "device":
                    valueA = a.deviceStatus;
                    valueB = b.deviceStatus;
                    break;

                case "agentState":
                    valueA = a.agentStatus;
                    valueB = b.agentStatus;
                    break;

                case "combinedState":
                    valueA = getCombinedState(a);
                    valueB = getCombinedState(b);
                    break;
            }

            const comparison = valueA.localeCompare(valueB);

            return sortDirection === "asc" ? comparison : -comparison;
        });
    }, [agentList, search, state, queue, site, sortKey, sortDirection]);

    return (
        <div className="p-4">
            <AgentFilters
                search={search}
                state={state}
                queue={queue}
                site={site}
                onSearchChange={(value) => updateFilter("search", value)}
                onStateChange={(value) => updateFilter("state", value)}
                onQueueChange={(value) => updateFilter("queue", value)}
                onSiteChange={(value) => updateFilter("site", value)}
                onReset={resetFilters}
            />

            <div className="p-5">
                <p className="mb-3 text-sm text-gray-600">
                    Showing {filteredAgents.length} of {agentList.length} agents
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-100">
                                <th
                                    onClick={() => handleSort("name")}
                                    className="cursor-pointer border border-gray-300 px-3 py-2 text-left hover:bg-gray-200"
                                >
                                    Agent{" "}
                                    {sortKey === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>

                                <th
                                    onClick={() => handleSort("extension")}
                                    className="cursor-pointer border border-gray-300 px-3 py-2 text-left hover:bg-gray-200"
                                >
                                    Extension{" "}
                                    {sortKey === "extension" &&
                                        (sortDirection === "asc" ? "↑" : "↓")}
                                </th>

                                <th
                                    onClick={() => handleSort("queue")}
                                    className="cursor-pointer border border-gray-300 px-3 py-2 text-left hover:bg-gray-200"
                                >
                                    Queue{" "}
                                    {sortKey === "queue" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>

                                <th
                                    onClick={() => handleSort("site")}
                                    className="cursor-pointer border border-gray-300 px-3 py-2 text-left hover:bg-gray-200"
                                >
                                    Site{" "}
                                    {sortKey === "site" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>

                                <th
                                    onClick={() => handleSort("device")}
                                    className="cursor-pointer border border-gray-300 px-3 py-2 text-left hover:bg-gray-200"
                                >
                                    Device{" "}
                                    {sortKey === "device" && (sortDirection === "asc" ? "↑" : "↓")}
                                </th>

                                <th
                                    onClick={() => handleSort("agentState")}
                                    className="cursor-pointer border border-gray-300  whitespace-nowrap px-3 py-2 text-left hover:bg-gray-200"
                                >
                                    Agent State{" "}
                                    {sortKey === "agentState" &&
                                        (sortDirection === "asc" ? "↑" : "↓")}
                                </th>

                                <th
                                    onClick={() => handleSort("combinedState")}
                                    className="cursor-pointer border whitespace-nowrap border-gray-300 px-3 py-2 text-left hover:bg-gray-200"
                                >
                                    Combined State{" "}
                                    {sortKey === "combinedState" &&
                                        (sortDirection === "asc" ? "↑" : "↓")}
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredAgents.map((agent) => (
                                <tr key={agent.agentId} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-3 py-2">
                                        {agent.name}
                                    </td>

                                    <td className="border border-gray-300 px-3 py-2">
                                        {agent.extension}
                                    </td>

                                    <td className="border border-gray-300 px-3 py-2">
                                        {agent.queues.join(", ")}
                                    </td>

                                    <td className="border border-gray-300 px-3 py-2">
                                        {agent.site}
                                    </td>

                                    <td className="border border-gray-300 px-3 py-2">
                                        {agent.deviceStatus}
                                    </td>

                                    <td className="border border-gray-300 px-3 py-2">
                                        {agent.agentStatus}
                                    </td>

                                    <td className="border border-gray-300 px-3 py-2">
                                        {getCombinedState(agent)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
