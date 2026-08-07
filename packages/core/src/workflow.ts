import { evaluateRequest } from "./policy";
import type {
  AuditEvent,
  AuditEventType,
  IntakeRequest,
  PolicyOutcome,
  ReviewAction,
  ReviewStatus,
  TransitionResult,
  WorkflowRecord,
} from "./types";

function freezeEvent(event: AuditEvent): AuditEvent {
  return Object.freeze(event);
}

function appendEvent(
  events: readonly AuditEvent[],
  event: AuditEvent,
): readonly AuditEvent[] {
  return Object.freeze([...events, freezeEvent(event)]);
}

function event(
  id: string,
  occurredAt: string,
  type: AuditEventType,
  summary: string,
  actor: AuditEvent["actor"],
): AuditEvent {
  return freezeEvent({ id, occurredAt, type, summary, actor });
}

function evaluationStatus(
  status: ReviewStatus,
  recommendation: PolicyOutcome,
): ReviewStatus {
  if (status !== "new") {
    return status;
  }

  return recommendation === "allow" ? "evaluated" : "needs_review";
}

export function createWorkflow(
  request: IntakeRequest,
  occurredAt: string,
): WorkflowRecord {
  return Object.freeze({
    request,
    status: "new",
    events: appendEvent(
      [],
      event(
        request.id + "-created",
        occurredAt,
        "request_created",
        "Synthetic request created.",
        "system",
      ),
    ),
  });
}

export function evaluateWorkflow(
  workflow: WorkflowRecord,
  occurredAt: string,
): WorkflowRecord {
  const evaluation = evaluateRequest(workflow.request);
  const status = evaluationStatus(workflow.status, evaluation.recommendation);

  return Object.freeze({
    ...workflow,
    status,
    evaluation,
    events: appendEvent(
      workflow.events,
      event(
        workflow.request.id + "-evaluated",
        occurredAt,
        "request_evaluated",
        "Deterministic policy evaluation completed.",
        "system",
      ),
    ),
  });
}

const actionDetails: Record<
  ReviewAction,
  {
    readonly status: ReviewStatus;
    readonly type: AuditEventType;
    readonly summary: string;
  }
> = {
  approve: {
    status: "approved",
    type: "request_approved",
    summary: "Human reviewer approved the request.",
  },
  request_context: {
    status: "context_requested",
    type: "context_requested",
    summary: "Human reviewer requested additional context.",
  },
  reject: {
    status: "rejected",
    type: "request_rejected",
    summary: "Human reviewer rejected the request.",
  },
};

export function transitionReview(
  workflow: WorkflowRecord,
  action: ReviewAction,
  occurredAt: string,
): TransitionResult {
  if (workflow.status === "new") {
    return {
      ok: false,
      error: "A request must be evaluated before it can be reviewed.",
      value: workflow,
    };
  }

  if (
    workflow.status === "approved" ||
    workflow.status === "context_requested" ||
    workflow.status === "rejected"
  ) {
    return {
      ok: false,
      error: "A completed review cannot be changed in this demo.",
      value: workflow,
    };
  }

  const detail = actionDetails[action];

  return {
    ok: true,
    value: Object.freeze({
      ...workflow,
      status: detail.status,
      events: appendEvent(
        workflow.events,
        event(
          workflow.request.id + "-" + detail.type,
          occurredAt,
          detail.type,
          detail.summary,
          "reviewer",
        ),
      ),
    }),
  };
}
