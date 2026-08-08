import type { WorkflowRecord } from "@reviewable-intake/core";

interface RequestQueueProps {
  readonly records: readonly WorkflowRecord[];
  readonly selectedId: string | undefined;
  readonly onSelect: (id: string) => void;
}

export function RequestQueue({
  records,
  selectedId,
  onSelect,
}: RequestQueueProps) {
  return (
    <nav aria-label="Synthetic request queue" className="request-queue">
      <h2>Request queue</h2>
      <ul>
        {records.map((record) => (
          <li key={record.request.id}>
            <button
              aria-current={
                record.request.id === selectedId ? "true" : undefined
              }
              className="queue-item"
              onClick={() => onSelect(record.request.id)}
              type="button"
            >
              <strong>{record.request.company}</strong>
              <span className="queue-item-status">
                Status: {record.status.replaceAll("_", " ")}
              </span>
              <span>
                Recommendation: {record.evaluation?.recommendation ?? "No evaluation available."}
              </span>
              <span className="queue-item-scope">
                Scope: {record.request.scope}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
