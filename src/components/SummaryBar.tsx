"use client";

import { useAgentStore } from "../store/agentStore";
import { getCombinedState } from "../store/agentSelectors";

export default function SummaryBar() {
    const agents = useAgentStore((state) => state.agents);

    const agentList = Object.values(agents);

    const counts = {
        total: agentList.length,
        available: 0,
        onCall: 0,
        onBreak: 0,
        afterCallWork: 0,
        loggedOut: 0,
    };

    agentList.forEach((agent) => {
        const state = getCombinedState(agent);

        switch (state) {
            case "Available":
                counts.available++;
                break;

            case "On Call":
                counts.onCall++;
                break;

            case "On Break":
                counts.onBreak++;
                break;

            case "After Call Work":
                counts.afterCallWork++;
                break;

            case "Logged Out":
                counts.loggedOut++;
                break;
        }
    });

    const items = [
        { label: "Total", value: counts.total },
        { label: "Available", value: counts.available },
        { label: "On Call", value: counts.onCall },
        { label: "On Break", value: counts.onBreak },
        {
            label: "After Call Work",
            value: counts.afterCallWork,
        },
        { label: "Logged Out", value: counts.loggedOut },
    ];

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
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
