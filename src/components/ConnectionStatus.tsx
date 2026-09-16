"use client";

import { useAgentStore } from "../store/agentStore";

export default function ConnectionStatus() {
    const connectionStatus = useAgentStore((state) => state.connectionStatus);

    const statusConfig = {
        connecting: {
            label: "Connecting",
            className: "bg-yellow-100 text-yellow-800",
            dot: "🟡",
        },

        open: {
            label: "Live",
            className: "bg-green-100 text-green-800",
            dot: "🟢",
        },

        closed: {
            label: "Reconnecting",
            className: "bg-orange-100 text-orange-800",
            dot: "🟠",
        },
    };

    const config = statusConfig[connectionStatus];

    return (
        <div
            role="status"
            aria-live="polite"
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${config.className}`}
        >
            <span aria-hidden="true">{config.dot}</span>

            <span>{config.label}</span>
        </div>
    );
}
