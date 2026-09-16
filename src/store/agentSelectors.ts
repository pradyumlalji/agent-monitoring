import type { AgentRuntime } from "./agentTypes";

const STALE_DEVICE_THRESHOLD_MS = 30_000;

export function getCombinedState(agent: AgentRuntime): string {
    const lastDeviceEvent = new Date(agent.lastDeviceEventAt).getTime();

    const isDeviceStale =
        !Number.isNaN(lastDeviceEvent) && Date.now() - lastDeviceEvent > STALE_DEVICE_THRESHOLD_MS;

    if (isDeviceStale) {
        return "Stale";
    }

    if (agent.agentStatus === "LoggedOut") {
        return "Logged Out";
    }

    if (agent.deviceStatus === "Unregistered") {
        return "Unavailable";
    }

    if (agent.deviceStatus === "Ringing") {
        return "Ringing";
    }

    if (agent.deviceStatus === "Answered") {
        return "On Call";
    }

    if (agent.deviceStatus === "OnHold") {
        return "On Hold";
    }

    if (agent.agentStatus === "OnBreak") {
        return "On Break";
    }

    if (agent.agentStatus === "AfterCallWork") {
        return "After Call Work";
    }

    return "Available";
}
