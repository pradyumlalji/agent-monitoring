"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAgentStore } from "../store/agentStore";
import type { AgentRuntime } from "../store/agentTypes";
import { getCombinedState } from "../store/agentSelectors";

import AgentFilters from "./AgentFilters";
import AgentRow from "./AgentRow";
import AgentDetailPanel from "./AgentDetailPanel";

type SortKey = "name" | "extension" | "site" | "deviceStatus" | "agentStatus" | "combinedState";

type SortDirection = "asc" | "desc";

const COLUMNS: {
    key: SortKey;
    label: string;
}[] = [
    { key: "name", label: "Name" },
    { key: "extension", label: "Extension" },
    { key: "site", label: "Site" },
    { key: "deviceStatus", label: "Device State" },
    { key: "agentStatus", label: "Agent State" },
    { key: "combinedState", label: "Actionable State" },
];

function getSortValue(agent: AgentRuntime, key: SortKey): string {
    switch (key) {
        case "combinedState":
            return getCombinedState(agent);

        case "name":
            return agent.name;

        case "extension":
            return agent.extension;

        case "site":
            return agent.site;

        case "deviceStatus":
            return agent.deviceStatus;

        case "agentStatus":
            return agent.agentStatus;

        default:
            return "";
    }
}

interface SortableHeaderProps {
    label: string;
    sortKey: SortKey;
    activeSortKey: SortKey;
    direction: SortDirection;
    onSort: (key: SortKey) => void;
}

function SortableHeader({ label, sortKey, activeSortKey, direction, onSort }: SortableHeaderProps) {
    const isActive = activeSortKey === sortKey;

    return (
        <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className="font-semibold hover:underline"
                aria-label={`Sort by ${label}`}
            >
                {label}

                {isActive && (
                    <span className="ml-1" aria-hidden="true">
                        {direction === "asc" ? "↑" : "↓"}
                    </span>
                )}
            </button>
        </th>
    );
}

export default function AgentGrid() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const agents = useAgentStore((state) => state.agents);

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

    const search = searchParams.get("search") ?? "";
    const queue = searchParams.get("queue") ?? "";
    const site = searchParams.get("site") ?? "";
    const state = searchParams.get("state") ?? "";

    const [searchInput, setSearchInput] = useState(search);

    const [sortKey, setSortKey] = useState<SortKey>("name");

    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const pushParams = useCallback(
        (mutate: (params: URLSearchParams) => void, replace = false) => {
            const params = new URLSearchParams(searchParams.toString());

            mutate(params);

            const queryString = params.toString();

            const url = queryString ? `${pathname}?${queryString}` : pathname;

            if (replace) {
                router.replace(url);
            } else {
                router.push(url);
            }
        },
        [pathname, router, searchParams],
    );

    // Debounce search updates so every keystroke does not
    // immediately trigger filtering + URL navigation.
    useEffect(() => {
        if (searchInput === search) {
            return;
        }

        const timer = setTimeout(() => {
            pushParams((params) => {
                const value = searchInput.trim();

                if (value) {
                    params.set("search", value);
                } else {
                    params.delete("search");
                }
            }, true);
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [searchInput, search, pushParams]);

    const agentList = useMemo(() => Object.values(agents), [agents]);

    const filteredAgents = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return agentList.filter((agent) => {
            const matchesSearch =
                !normalizedSearch ||
                agent.name.toLowerCase().includes(normalizedSearch) ||
                agent.extension.toLowerCase().includes(normalizedSearch) ||
                agent.agentId.toLowerCase().includes(normalizedSearch);

            const matchesQueue = !queue || agent.queues.includes(queue);

            const matchesSite = !site || agent.site === site;

            const matchesState = !state || getCombinedState(agent) === state;

            return matchesSearch && matchesQueue && matchesSite && matchesState;
        });
    }, [agentList, search, queue, site, state]);

    const sortedAgents = useMemo(() => {
        const sorted = [...filteredAgents];

        sorted.sort((a, b) => {
            const aValue = getSortValue(a, sortKey);
            const bValue = getSortValue(b, sortKey);

            const comparison = aValue.localeCompare(bValue, undefined, {
                numeric: true,
                sensitivity: "base",
            });

            return sortDirection === "asc" ? comparison : -comparison;
        });

        return sorted;
    }, [filteredAgents, sortKey, sortDirection]);

    const handleSort = useCallback(
        (key: SortKey) => {
            if (sortKey === key) {
                setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            } else {
                setSortKey(key);
                setSortDirection("asc");
            }
        },
        [sortKey],
    );

    const handleSelectAgent = useCallback((agentId: string) => {
        setSelectedAgentId(agentId);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setSelectedAgentId(null);
    }, []);

    const handleFilterChange = useCallback(
        (key: "queue" | "site" | "state", value: string) => {
            pushParams((params) => {
                if (value) {
                    params.set(key, value);
                } else {
                    params.delete(key);
                }
            });
        },
        [pushParams],
    );

    return (
        <section className="p-4">
            <AgentFilters
                search={searchInput}
                queue={queue}
                site={site}
                state={state}
                onSearchChange={setSearchInput}
                onQueueChange={(value) => handleFilterChange("queue", value)}
                onSiteChange={(value) => handleFilterChange("site", value)}
                onStateChange={(value) => handleFilterChange("state", value)}
                onReset={() => {
                    pushParams((params) => {
                        params.delete("search");
                        params.delete("queue");
                        params.delete("site");
                        params.delete("state");
                    });

                    setSearchInput("");
                }}
            />

            <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    Showing {sortedAgents.length} of {agentList.length} agents
                </p>
            </div>

            {sortedAgents.length === 0 ? (
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-8 text-center">
                    <p className="font-medium text-gray-700">No agents found</p>

                    <p className="mt-1 text-sm text-gray-500">
                        Try changing or clearing your filters.
                    </p>
                </div>
            ) : (
                <div className="mt-4 max-h-[calc(100vh-220px)] overflow-auto rounded-lg border border-gray-300">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr>
                                {COLUMNS.map((column) => (
                                    <SortableHeader
                                        key={column.key}
                                        label={column.label}
                                        sortKey={column.key}
                                        activeSortKey={sortKey}
                                        direction={sortDirection}
                                        onSort={handleSort}
                                    />
                                ))}

                                <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">
                                    Queues
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {sortedAgents.map((agent) => (
                                <AgentRow
                                    key={agent.agentId}
                                    agentId={agent.agentId}
                                    onSelect={handleSelectAgent}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedAgentId && agents[selectedAgentId] && (
                <AgentDetailPanel agent={agents[selectedAgentId]} onClose={handleCloseDetail} />
            )}
        </section>
    );
}
