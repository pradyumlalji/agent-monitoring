"use client";

import { useEffect, useState } from "react";
import { fetchAgents, getEvents } from "../services/agentService";
import { useAgentStore } from "../store/agentStore";
import AgentGrid from "@/components/AgentGrid";

export default function Home() {
    const agents = useAgentStore((state) => state.agents);
    const initializeAgents = useAgentStore((state) => state.initializeAgents);
    const processEvent = useAgentStore((state) => state.processEvent);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await fetchAgents();

            initializeAgents(data);
            setLoading(false);

            // Temporary: process mock events sequentially
            const events = getEvents();

            events.forEach((event) => {
                processEvent(event);
            });
        }

        load();
    }, [initializeAgents, processEvent]);

    if (loading) {
        return <div>Loading agents...</div>;
    }

    const agentList = Object.values(agents);

    return (
        <main>
            <div className="px-4 pt-4">
                <h1>Live Agent Monitoring</h1>

                <p>Total Agents: {agentList.length}</p>
            </div>

            <AgentGrid />
        </main>
    );
}
