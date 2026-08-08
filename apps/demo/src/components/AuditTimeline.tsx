import type { AuditEvent } from "@reviewable-intake/core";

interface AuditTimelineProps {
  readonly events: readonly AuditEvent[];
}

function formatTimestamp(occurredAt: string): string {
  return new Date(occurredAt).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  });
}

export function AuditTimeline({ events }: AuditTimelineProps) {
  return (
    <section aria-labelledby="audit-timeline-heading">
      <h2 id="audit-timeline-heading">Audit timeline</h2>
      <ol className="audit-timeline">
        {events.map((event) => (
          <li key={event.id}>
            <time dateTime={event.occurredAt}>
              {formatTimestamp(event.occurredAt)}
            </time>
            <strong>{event.actor}</strong>
            <span>{event.summary}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
