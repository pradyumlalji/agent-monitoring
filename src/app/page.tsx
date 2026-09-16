"use client";

import { useEffect, useState } from "react";

import { connectAgentStream, fetchAgents } from "../services/agentService";

import { useAgentStore } from "../store/agentStore";

import AgentGrid from "@/components/AgentGrid";
import ConnectionStatus from "@/components/ConnectionStatus";

export default function Home() {
    const agents = useAgentStore((state) => state.agents);

    const initializeAgents = useAgentStore((state) => state.initializeAgents);

    const processEvent = useAgentStore((state) => state.processEvent);

    const setConnectionStatus = useAgentStore((state) => state.setConnectionStatus);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let connection: { close: () => void } | null = null;

        async function load() {
            try {
                setLoading(true);
                setError(null);

                // Load initial snapshot
                const data = await fetchAgents();

                initializeAgents(data);

                setLoading(false);

                // Connect to live agent stream
                connection = connectAgentStream(
                    (event) => {
                        processEvent(event);
                    },
                    (status) => {
                        setConnectionStatus(status);
                    },
                );
            } catch (err) {
                console.error(err);

                setError(err instanceof Error ? err.message : "Failed to load agents");

                setLoading(false);
            }
        }

        load();

        return () => {
            connection?.close();
        };
    }, [initializeAgents, processEvent, setConnectionStatus]);

    if (loading) {
        return (
            <main className="p-6">
                <p>Loading agents...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="p-6">
                <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-700">
                    Failed to load agents: {error}
                </div>
            </main>
        );
    }

    const agentList = Object.values(agents);

    return (
        <main>
            <div className="flex items-center justify-between px-4 pt-4">
                <div>
                    <h1>Live Agent Monitoring</h1>

                    <p>Total Agents: {agentList.length}</p>
                </div>

                <ConnectionStatus />
            </div>

            <AgentGrid />
        </main>
    );
}
