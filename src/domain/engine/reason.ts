import type { Reason, Severity } from '../types';

export function reason(params: {
  code: string;
  severity: Severity;
  title: string;
  detail: string;
  inputsUsed: string[];
  rulesUsed: string[];
  affects: Reason['affects'];
}): Reason {
  return params;
}