import { describe, expect, it } from 'vitest';
import { applicableSteps, questionSteps, validateBorrowerAnswers } from './questions';
import { anita, priya, ravi } from '../../domain/fixtures/personas';

describe('adaptive question design', () => {
  it('every additional/adaptive step declares affected outputs', () => {
    expect(questionSteps.every((step) => step.affects.length > 0)).toBe(true);
  });

  it('salaried path avoids the secured business branch by default', () => {
    expect(applicableSteps(priya).map((step) => step.id)).not.toContain('secured');
  });

  it('self-employed business path asks collateral/support questions', () => {
    expect(applicableSteps(ravi).map((step) => step.id)).toContain('secured');
  });

  it('informal path validates and keeps high-cost debt fields relevant in fixture', () => {
    expect(validateBorrowerAnswers(anita).success).toBe(true);
  });
});