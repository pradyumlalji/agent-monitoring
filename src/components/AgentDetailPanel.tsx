"use client";

import { useEffect, useState } from "react";

import { fetchCalls } from "../services/agentService";

import type { AgentRuntime, Call } from "../store/agentTypes";

interface AgentDetailPanelProps {
    agent: AgentRuntime;
    onClose: () => void;
}

const PAGE_SIZE = 10;

export default function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
    const [calls, setCalls] = useState<Call[]>([]);
    const [offset, setOffset] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCalls = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetchCalls(agent.agentId, offset, PAGE_SIZE);

            setCalls(response.calls);
        } catch (err) {
            setCalls([]);

            setError(err instanceof Error ? err.message : "Failed to load call history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                const response = await fetchCalls(agent.agentId, offset, PAGE_SIZE);

                if (!cancelled) {
                    setCalls(response.calls);
                }
            } catch (err) {
                if (!cancelled) {
                    setCalls([]);

                    setError(err instanceof Error ? err.message : "Failed to load call history");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [agent.agentId, offset]);

    const handlePrevious = () => {
        setOffset((current) => Math.max(0, current - PAGE_SIZE));
    };

    const handleNext = () => {
        if (calls.length === PAGE_SIZE) {
            setOffset((current) => current + PAGE_SIZE);
        }
    };

    return (
        <div className="fixed inset-y-0 right-0 z-50 flex h-screen w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-5 py-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">{agent.name}</h2>

                    <p className="text-sm text-gray-500">Extension {agent.extension}</p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md px-3 py-2 text-2xl leading-none text-gray-500 hover:bg-gray-100"
                    aria-label="Close agent details"
                >
                    ✕
                </button>
            </div>

            {/* Scrollable content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <div className="space-y-5">
                    {/* Agent information */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Agent State</p>

                            <p className="mt-1 font-medium">{agent.agentStatus}</p>
                        </div>

                        <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Device</p>

                            <p className="mt-1 font-medium">{agent.deviceStatus}</p>
                        </div>

                        <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Site</p>

                            <p className="mt-1 font-medium">{agent.site}</p>
                        </div>

                        <div className="rounded-md bg-gray-50 p-3">
                            <p className="text-xs text-gray-500">Team</p>

                            <p className="mt-1 font-medium">{agent.team}</p>
                        </div>
                    </div>

                    {/* Call history */}
                    <div>
                        <div className="mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Calls</h3>
                        </div>

                        {/* Loading */}
                        {loading && (
                            <div className="rounded-md border p-4 text-sm text-gray-500">
                                Loading call history...
                            </div>
                        )}

                        {/* Error */}
                        {!loading && error && (
                            <div className="rounded-md border border-red-200 bg-red-50 p-4">
                                <p className="text-sm font-medium text-red-700">
                                    ⚠️ Unable to load call history
                                </p>

                                <p className="mt-1 text-sm text-red-600">{error}</p>

                                <button
                                    type="button"
                                    onClick={loadCalls}
                                    className="mt-3 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {/* Empty */}
                        {!loading && !error && calls.length === 0 && (
                            <div className="rounded-md border p-4 text-sm text-gray-500">
                                No call history available.
                            </div>
                        )}

                        {/* Calls */}
                        {!loading && !error && calls.length > 0 && (
                            <>
                                <p className="mb-3 text-xs text-gray-500">
                                    Showing calls {offset + 1}–{offset + calls.length}
                                </p>

                                <div className="space-y-2">
                                    {calls.map((call) => (
                                        <div
                                            key={call.callId}
                                            className="rounded-md border border-gray-200 p-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{call.queue}</span>

                                                <span className="text-xs text-gray-500">
                                                    {call.direction}
                                                </span>
                                            </div>

                                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                                <span>
                                                    Started:{" "}
                                                    {new Date(call.startedAt).toLocaleString()}
                                                </span>

                                                <span>Duration: {call.talkTimeSeconds}s</span>

                                                <span>Hold: {call.holdTimeSeconds}s</span>

                                                <span>{call.disposition}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                <div className="mt-4 flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={handlePrevious}
                                        disabled={offset === 0}
                                        className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        ← Previous
                                    </button>

                                    <span className="text-sm text-gray-500">
                                        Page {Math.floor(offset / PAGE_SIZE) + 1}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        disabled={calls.length < PAGE_SIZE}
                                        className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
