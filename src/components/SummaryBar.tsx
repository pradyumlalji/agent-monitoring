"use client";

import { useMemo } from "react";

import { useAgentStore } from "../store/agentStore";
import { getCombinedState } from "../store/agentSelectors";

function formatDuration(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s`;
}

// Maps each combined state to the summary card that should count it.
// Any state not listed here (e.g. transient/unknown states) is simply
// not tallied, matching the old switch's implicit default.
const STATE_TO_METRIC: Record<string, string> = {
    Available: "available",
    "On Call": "onCall",
    "On Break": "onBreak",
    "After Call Work": "afterCallWork",
    "Logged Out": "loggedOut",
    Stale: "stale",
};

const SUMMARY_CARDS: { key: string; label: string }[] = [
    { key: "available", label: "Available" },
    { key: "onCall", label: "On Call" },
    { key: "onBreak", label: "On Break" },
    { key: "afterCallWork", label: "After Call Work" },
    { key: "loggedOut", label: "Logged Out" },
    { key: "stale", label: "Stale Devices" },
];

function getCallDurationSeconds(callStartedAt: string) {
    const startedAt = new Date(callStartedAt).getTime();
    if (Number.isNaN(startedAt)) return 0;
    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
}

export default function SummaryBar() {
    const agents = useAgentStore((state) => state.agents);

    const metrics = useMemo(() => {
        const agentList = Object.values(agents);
        const counts: Record<string, number> = {};

        let longestCallSeconds = 0;

        agentList.forEach((agent) => {
            const state = getCombinedState(agent);
            const metricKey = STATE_TO_METRIC[state];

            if (metricKey) {
                counts[metricKey] = (counts[metricKey] ?? 0) + 1;
            }

            if (state === "On Call" && agent.callStartedAt) {
                longestCallSeconds = Math.max(
                    longestCallSeconds,
                    getCallDurationSeconds(agent.callStartedAt),
                );
            }
        });

        return { total: agentList.length, counts, longestCallSeconds };
    }, [agents]);

    const items = [
        { label: "Total", value: metrics.total },
        ...SUMMARY_CARDS.map((card) => ({
            label: card.label,
            value: metrics.counts[card.key] ?? 0,
        })),
        { label: "Longest Current Call", value: formatDuration(metrics.longestCallSeconds) },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            {items.map((item) => (
                <div
                    key={item.label}
                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">{item.value}</p>
                </div>
            ))}
        </div>
    );
}
