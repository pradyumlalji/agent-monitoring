export type DeviceStatus =
    | "Registered"
    | "Unregistered"
    | "Ringing"
    | "Answered"
    | "OnHold"
    | "CallEnded";

export type AgentStatus = "Available" | "OnBreak" | "AfterCallWork" | "LoggedOut";

export interface Agent {
    agentId: string;
    name: string;
    extension: string;
    email: string;
    queues: string[];
    team: string;
    site: string;
    shiftStart: string;

    deviceStatus: DeviceStatus;
    agentStatus: AgentStatus;

    currentCallId: string | null;
    callStartedAt: string | null;
    statusChangedAt: string;

    snapshotSeq: number;
}

export type AgentEvent =
    | {
          eventId: string;
          agentId: string;
          stream: "device";
          status: DeviceStatus;
          sequence: number;
          emittedAt: string;

          callId?: string;
          callerNumber?: string;
          direction?: string;
          queue?: string;
          hangupCause?: string;
          resumedFromHold?: boolean;
          talkTimeSeconds?: number;
      }
    | {
          eventId: string;
          agentId: string;
          stream: "agent";
          status: AgentStatus;
          sequence: number;
          emittedAt: string;

          reason?: string;
      };

export interface Call {
    callId: string;
    agentId: string;
    queue: string;
    startedAt: string;
    endedAt: string | null;
    talkTimeSeconds: number;
    holdTimeSeconds: number;
    hangupCause: string;
    answered: boolean;
    direction: string;
    disposition: string;
}

export interface AgentRuntime extends Agent {
    latestSequence: number;
}

export type ConnectionStatus = "connecting" | "open" | "closed";
