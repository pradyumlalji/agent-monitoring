const STATUS_CLASSES: Record<string, string> = {
    Available: "bg-green-50 text-green-700",
    Answered: "bg-green-100 text-green-800",

    Ringing: "bg-yellow-100 text-yellow-800",
    OnBreak: "bg-yellow-100 text-yellow-800",

    OnHold: "bg-orange-100 text-orange-800",

    Unregistered: "bg-red-100 text-red-800",
    OnCall: "bg-red-100 text-red-800",
    Unavailable: "bg-red-100 text-red-800",
    Stale: "bg-red-100 text-red-800",

    Registered: "bg-blue-100 text-blue-800",
    AfterCallWork: "bg-blue-100 text-blue-800",

    LoggedOut: "bg-gray-100 text-gray-700",
    CallEnded: "bg-gray-100 text-gray-700",
};

const DEFAULT_STATUS_CLASS = "bg-gray-100 text-gray-700";

// Statuses come in from a couple of sources with inconsistent spacing
// ("On Hold" vs "OnHold"), so normalize before lookup instead of
// listing every spaced/unspaced variant as its own case.
function normalizeStatus(status: string) {
    return status.replace(/\s+/g, "");
}

export function getStatusClass(status: string) {
    return STATUS_CLASSES[normalizeStatus(status)] ?? DEFAULT_STATUS_CLASS;
}
