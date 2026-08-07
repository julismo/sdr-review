export const intakeIntents = ["explore", "evaluate", "implement"] as const;
export type IntakeIntent = (typeof intakeIntents)[number];

export const dataSensitivities = ["standard", "restricted"] as const;
export type DataSensitivity = (typeof dataSensitivities)[number];

export interface IntakeRequest {
  readonly id: string;
  readonly company: string;
  readonly intent: IntakeIntent;
  readonly dataSensitivity: DataSensitivity;
  readonly consent: boolean;
  readonly scope: string;
  readonly context?: string;
}

export type RequestField =
  | "id"
  | "company"
  | "intent"
  | "dataSensitivity"
  | "consent"
  | "scope"
  | "context";

export interface ValidationError {
  readonly field: RequestField;
  readonly message: string;
}

export type ValidationResult =
  | {
      readonly ok: true;
      readonly value: IntakeRequest;
    }
  | {
      readonly ok: false;
      readonly errors: readonly ValidationError[];
    };

export type PolicyOutcome = "allow" | "review" | "block";

export interface PolicyResult {
  readonly policyId: string;
  readonly outcome: PolicyOutcome;
  readonly explanation: string;
}

export interface Evaluation {
  readonly recommendation: PolicyOutcome;
  readonly results: readonly PolicyResult[];
}

export type ReviewStatus =
  | "new"
  | "evaluated"
  | "needs_review"
  | "approved"
  | "context_requested"
  | "rejected";

export type ReviewAction = "approve" | "request_context" | "reject";

export type AuditActor = "system" | "reviewer";

export type AuditEventType =
  | "request_created"
  | "request_evaluated"
  | "request_approved"
  | "context_requested"
  | "request_rejected";

export interface AuditEvent {
  readonly id: string;
  readonly occurredAt: string;
  readonly actor: AuditActor;
  readonly type: AuditEventType;
  readonly summary: string;
}

export interface WorkflowRecord {
  readonly request: IntakeRequest;
  readonly status: ReviewStatus;
  readonly evaluation?: Evaluation;
  readonly events: readonly AuditEvent[];
}

export type TransitionResult =
  | { readonly ok: true; readonly value: WorkflowRecord }
  | { readonly ok: false; readonly error: string; readonly value: WorkflowRecord };
