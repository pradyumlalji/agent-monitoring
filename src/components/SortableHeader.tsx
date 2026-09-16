"use client";

export type SortDirection = "asc" | "desc";

export type SortKey =
    | "name"
    | "extension"
    | "queues"
    | "site"
    | "deviceStatus"
    | "agentStatus"
    | "combinedState";

interface SortableHeaderProps {
    label: string;
    sortKey: SortKey;
    activeSortKey: SortKey;
    direction: SortDirection;
    onSort: (key: SortKey) => void;
}

export default function SortableHeader({
    label,
    sortKey,
    activeSortKey,
    direction,
    onSort,
}: SortableHeaderProps) {
    const isActive = activeSortKey === sortKey;

    return (
        <th className="border border-gray-300 bg-gray-100 px-3 py-2 text-left">
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className="font-semibold hover:underline"
                aria-label={`Sort by ${label}`}
            >
                {label}

                {isActive && (
                    <span className="ml-1" aria-hidden="true">
                        {direction === "asc" ? "↑" : "↓"}
                    </span>
                )}
            </button>
        </th>
    );
}
