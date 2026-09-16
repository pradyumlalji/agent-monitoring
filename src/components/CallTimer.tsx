"use client";

import { useEffect, useState } from "react";

interface CallTimerProps {
    startedAt: string;
}

function formatDuration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return [
        hours > 0 ? String(hours).padStart(2, "0") : null,
        String(minutes).padStart(2, "0"),
        String(remainingSeconds).padStart(2, "0"),
    ]
        .filter(Boolean)
        .join(":");
}

function getElapsedSeconds(startedAt: string) {
    const start = new Date(startedAt).getTime();

    if (Number.isNaN(start)) {
        return 0;
    }

    return Math.max(0, Math.floor((Date.now() - start) / 1000));
}

export default function CallTimer({ startedAt }: CallTimerProps) {
    const [elapsed, setElapsed] = useState(() => getElapsedSeconds(startedAt));

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(getElapsedSeconds(startedAt));
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [startedAt]);

    return <span className="font-mono text-sm text-gray-500">{formatDuration(elapsed)}</span>;
}
