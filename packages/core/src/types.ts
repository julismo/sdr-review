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
