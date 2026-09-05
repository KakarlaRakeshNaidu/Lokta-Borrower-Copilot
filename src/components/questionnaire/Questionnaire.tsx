import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight, HelpCircle, IndianRupee } from 'lucide-react';
import { FormProvider, type Path, type PathValue, useForm, type UseFormReturn } from 'react-hook-form';
import type { BorrowerAnswers, Known } from '../../domain/types';
import { isKnown, known, notApplicable, unknown } from '../../domain/types';
import { applicableSteps, borrowerSchema } from '../../features/assessment/questions';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type KnownNumberPath =
  | 'netMonthlyIncome'
  | 'itrAnnualIncome'
  | 'employmentYears'
  | 'yearsInBusiness'
  | 'existingMonthlyEmis'
  | 'essentialMonthlyExpenses'
  | 'rentMonthly'
  | 'highCostDebtOutstanding'
  | 'highCostDebtMonthlyPayment'
  | 'dependents'
  | 'emergencySavingsMonths'
  | 'coApplicantMonthlyIncome'
  | 'expectedIncrementalIncome'
  | 'collateral.value';

function setKnownNumber(form: UseFormReturn<BorrowerAnswers>, field: KnownNumberPath, raw: string, allowUnknown = true) {
  const parsed = raw === '' || Number.isNaN(Number(raw)) ? (allowUnknown ? unknown<number>() : known(0)) : known(Number(raw));
  form.setValue(field as Path<BorrowerAnswers>, parsed as PathValue<BorrowerAnswers, Path<BorrowerAnswers>>, { shouldDirty: true, shouldValidate: true });
}

function setKnownBoolean(form: UseFormReturn<BorrowerAnswers>, field: 'collateral.unencumbered', value: boolean | 'unknown') {
  const next = value === 'unknown' ? unknown<boolean>() : known(value);
  form.setValue(field, next, { shouldDirty: true, shouldValidate: true });
}

function knownNumberValue(value: Known<number>): string {
  return isKnown(value) ? String(value.value) : '';
}

function FieldLabel({ htmlFor, label, helper }: { htmlFor: string; label: string; helper?: string | undefined }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
      {label}
      {helper && <span className="mt-1 block text-sm font-normal leading-5 text-slate-600">{helper}</span>}
    </label>
  );
}

function InputShell({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

function NumberInput({ form, field, label, helper, prefix, allowUnknown = true, min = 0 }: {
  form: UseFormReturn<BorrowerAnswers>;
  field: KnownNumberPath;
  label: string;
  helper?: string | undefined;
  prefix?: React.ReactNode;
  allowUnknown?: boolean;
  min?: number;
}) {
  const current = form.watch(field as Path<BorrowerAnswers>) as Known<number>;
  const id = field.replaceAll('.', '-');
  return (
    <InputShell>
      <FieldLabel htmlFor={id} label={label} helper={helper} />
      <div className="flex gap-2">
        <div className="relative flex-1">
          {prefix && <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{prefix}</div>}
          <input
            id={id}
            inputMode="numeric"
            min={min}
            type="number"
            value={knownNumberValue(current)}
            onChange={(event) => setKnownNumber(form, field, event.target.value, allowUnknown)}
            className="h-11 w-full rounded-lg border border-[#cbd8d3] bg-white px-3 text-base text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/20 data-[prefix=true]:pl-9"
            data-prefix={Boolean(prefix)}
          />
        </div>
        {allowUnknown && (
          <Button type="button" variant={current.status === 'unknown' ? 'secondary' : 'ghost'} onClick={() => setKnownNumber(form, field, '')}>
            I don't know
          </Button>
        )}
      </div>
    </InputShell>
  );
}

function RangeInput({ form, label, helper }: { form: UseFormReturn<BorrowerAnswers>; label: string; helper?: string | undefined }) {
  const current = form.watch('variableMonthlyIncome');
  const min = isKnown(current) ? current.value.min : '';
  const max = isKnown(current) ? current.value.max : '';
  const update = (side: 'min' | 'max', raw: string) => {
    const existing = isKnown(current) ? current.value : { min: 0, max: 0 };
    const value = Math.max(0, Number(raw));
    form.setValue('variableMonthlyIncome', known({ ...existing, [side]: Number.isNaN(value) ? 0 : value }), { shouldDirty: true, shouldValidate: true });
  };
  return (
    <InputShell>
      <FieldLabel htmlFor="income-low" label={label} helper={helper} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input id="income-low" type="number" min={0} inputMode="numeric" placeholder="Low month" value={min} onChange={(event) => update('min', event.target.value)} className="h-11 rounded-lg border border-[#cbd8d3] px-3 text-base focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20" />
        <input id="income-high" type="number" min={0} inputMode="numeric" placeholder="High month" value={max} onChange={(event) => update('max', event.target.value)} className="h-11 rounded-lg border border-[#cbd8d3] px-3 text-base focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20" />
        <Button type="button" variant={current.status === 'unknown' ? 'secondary' : 'ghost'} onClick={() => form.setValue('variableMonthlyIncome', unknown(), { shouldDirty: true, shouldValidate: true })}>I don't know</Button>
      </div>
    </InputShell>
  );
}

function SelectField<T extends string>({ id, label, value, options, onChange, helper }: {
  id: string;
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  helper?: string | undefined;
}) {
  return (
    <InputShell>
      <FieldLabel htmlFor={id} label={label} helper={helper} />
      <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)} className="h-11 w-full rounded-lg border border-[#cbd8d3] bg-white px-3 text-base text-ink focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </InputShell>
  );
}

function YesNoUnknown({ value, onChange, label }: { value: 'yes' | 'no' | 'unknown'; onChange: (value: 'yes' | 'no' | 'unknown') => void; label: string }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-ink">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {(['no', 'yes', 'unknown'] as const).map((item) => (
          <button key={item} type="button" onClick={() => onChange(item)} className={`min-h-11 rounded-lg border px-3 text-sm font-semibold ${value === item ? 'border-mint bg-mint/10 text-ink' : 'border-[#cbd8d3] bg-white text-slate-700'}`}>
            {item === 'no' ? 'No' : item === 'yes' ? 'Yes' : "I don't know"}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function StepFields({ stepId, form }: { stepId: string; form: UseFormReturn<BorrowerAnswers> }) {
  const answers = form.watch();
  if (stepId === 'loan') {
    return (
      <div className="grid gap-5">
        <SelectField id="loan-purpose" label="Why do you need the money?" value={answers.loanPurpose} onChange={(value) => form.setValue('loanPurpose', value, { shouldDirty: true })} options={[
          { value: 'wedding', label: 'Wedding or family event' },
          { value: 'business_expansion', label: 'Business stock or expansion' },
          { value: 'vehicle_for_income', label: 'Vehicle/scooter to earn more' },
          { value: 'home', label: 'Home purchase or repair' },
          { value: 'education', label: 'Education' },
          { value: 'medical', label: 'Medical or emergency' },
          { value: 'refinance', label: 'Refinance existing debt' },
          { value: 'other', label: 'Other need' }
        ]} />
        <InputShell>
          <FieldLabel htmlFor="requestedAmount" label="How much do you want to borrow?" helper="Use the full principal amount before fees." />
          <div className="relative">
            <IndianRupee size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input id="requestedAmount" type="number" min={1} inputMode="numeric" {...form.register('requestedAmount', { valueAsNumber: true })} className="h-11 w-full rounded-lg border border-[#cbd8d3] pl-9 pr-3 text-base focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20" />
          </div>
        </InputShell>
        <SelectField id="product" label="Which product are you considering?" helper="Choose not sure if you want the app to route it." value={answers.productIntent} onChange={(value) => form.setValue('productIntent', value, { shouldDirty: true })} options={[
          { value: 'not_sure', label: 'Not sure - recommend a route' },
          { value: 'personal', label: 'Personal loan' },
          { value: 'business', label: 'Business loan' },
          { value: 'lap', label: 'Loan against property' },
          { value: 'home', label: 'Home loan' },
          { value: 'gold', label: 'Gold loan' },
          { value: 'vehicle', label: 'Two-wheeler / vehicle loan' }
        ]} />
      </div>
    );
  }

  if (stepId === 'profile') {
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        <InputShell><FieldLabel htmlFor="name" label="First name" /><input id="name" {...form.register('name')} className="h-11 w-full rounded-lg border border-[#cbd8d3] px-3 text-base focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20" /></InputShell>
        <InputShell><FieldLabel htmlFor="city" label="City" /><input id="city" {...form.register('city')} className="h-11 w-full rounded-lg border border-[#cbd8d3] px-3 text-base focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20" /></InputShell>
        <InputShell><FieldLabel htmlFor="age" label="Age" /><input id="age" type="number" min={18} max={70} {...form.register('age', { valueAsNumber: true })} className="h-11 w-full rounded-lg border border-[#cbd8d3] px-3 text-base focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20" /></InputShell>
        <SelectField id="incomeType" label="Income type" value={answers.incomeType} onChange={(value) => form.setValue('incomeType', value, { shouldDirty: true })} options={[
          { value: 'salaried', label: 'Salaried' },
          { value: 'self_employed', label: 'Self-employed / business' },
          { value: 'informal', label: 'Informal, gig or variable' }
        ]} />
      </div>
    );
  }

  if (stepId === 'income' && answers.incomeType === 'salaried') {
    return (
      <div className="grid gap-5">
        <NumberInput form={form} field="netMonthlyIncome" label="Net monthly salary" prefix={<IndianRupee size={16} />} allowUnknown={false} />
        <NumberInput form={form} field="employmentYears" label="Years in current field or employer" helper="This can tighten salary stability confidence." />
        <SelectField id="employerStability" label="Job stability" value={answers.employerStability} onChange={(value) => form.setValue('employerStability', value, { shouldDirty: true })} options={[
          { value: 'large_stable', label: 'Large/stable employer' },
          { value: 'stable', label: 'Stable job' },
          { value: 'new_or_probation', label: 'New job or probation' },
          { value: 'unknown', label: "I don't know" }
        ]} />
      </div>
    );
  }

  if (stepId === 'income' && answers.incomeType === 'self_employed') {
    return (
      <div className="grid gap-5">
        <RangeInput form={form} label="Recent monthly business cash-income range" helper="Use sustainable cash income, not only the best month." />
        <NumberInput form={form} field="itrAnnualIncome" label="Annual ITR/documented income" prefix={<IndianRupee size={16} />} />
        <NumberInput form={form} field="yearsInBusiness" label="Years in business" />
        <SelectField id="banked" label="How much income is banked/documented?" value={answers.bankedIncomeShare} onChange={(value) => form.setValue('bankedIncomeShare', value, { shouldDirty: true })} options={[
          { value: 'mostly_banked', label: 'Mostly banked' },
          { value: 'mixed', label: 'Mixed cash and banked' },
          { value: 'cash_heavy', label: 'Cash-heavy' },
          { value: 'unknown', label: "I don't know" }
        ]} />
      </div>
    );
  }

  if (stepId === 'income') {
    return (
      <div className="grid gap-5">
        <RangeInput form={form} label="Recent monthly income range" helper="Use the low and high of recent months from delivery, tailoring or other work." />
        <NumberInput form={form} field="dependents" label="Dependents supported by this income" />
        <NumberInput form={form} field="expectedIncrementalIncome" label="Expected extra monthly income from the loan-funded asset" helper="Shown as upside only; not counted as guaranteed." prefix={<IndianRupee size={16} />} />
      </div>
    );
  }

  if (stepId === 'cashflow') {
    return (
      <div className="grid gap-5">
        <NumberInput form={form} field="existingMonthlyEmis" label="Current monthly EMIs" helper="Include formal loans. App-loan payments can be entered below." prefix={<IndianRupee size={16} />} />
        <NumberInput form={form} field="essentialMonthlyExpenses" label="Essential monthly expenses excluding rent" helper="Food, school, utilities, medicines and similar essentials." prefix={<IndianRupee size={16} />} />
        <NumberInput form={form} field="rentMonthly" label="Rent or housing outflow" prefix={<IndianRupee size={16} />} />
        <NumberInput form={form} field="emergencySavingsMonths" label="Emergency savings in months" />
        {answers.incomeType === 'informal' && (
          <div className="grid gap-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <NumberInput form={form} field="highCostDebtOutstanding" label="High-cost app or short-term loan outstanding" prefix={<IndianRupee size={16} />} />
            <NumberInput form={form} field="highCostDebtMonthlyPayment" label="Monthly payment on those short-term loans" prefix={<IndianRupee size={16} />} />
          </div>
        )}
      </div>
    );
  }

  if (stepId === 'credit') {
    return (
      <div className="grid gap-5">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-ink">Credit score</legend>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input aria-label="CIBIL score" type="number" min={300} max={900} inputMode="numeric" value={answers.creditScore.status === 'known' ? answers.creditScore.value : ''} onChange={(event) => form.setValue('creditScore', event.target.value === '' ? { status: 'unknown' } : { status: 'known', value: Number(event.target.value) }, { shouldDirty: true, shouldValidate: true })} className="h-11 rounded-lg border border-[#cbd8d3] px-3 text-base focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/20" placeholder="300-900" />
            <Button type="button" variant={answers.creditScore.status === 'unknown' ? 'secondary' : 'ghost'} onClick={() => form.setValue('creditScore', { status: 'unknown' }, { shouldDirty: true })}>Unknown</Button>
            <Button type="button" variant={answers.creditScore.status === 'thin_file' ? 'secondary' : 'ghost'} onClick={() => form.setValue('creditScore', { status: 'thin_file' }, { shouldDirty: true })}>No formal history</Button>
          </div>
        </fieldset>
        <YesNoUnknown value={answers.recentMissedPayment} onChange={(value) => form.setValue('recentMissedPayment', value, { shouldDirty: true })} label="Any EMI bounce or missed payment in the last 3 months?" />
      </div>
    );
  }

  if (stepId === 'secured') {
    return (
      <div className="grid gap-5">
        <SelectField id="collateral-kind" label="Collateral available" value={answers.collateral.kind} onChange={(value) => {
          form.setValue('collateral.kind', value, { shouldDirty: true });
          if (value === 'none') {
            form.setValue('collateral.value', notApplicable(), { shouldDirty: true });
            form.setValue('collateral.unencumbered', notApplicable(), { shouldDirty: true });
          }
        }} options={[
          { value: 'none', label: 'None' },
          { value: 'property', label: 'Property' },
          { value: 'gold', label: 'Gold' },
          { value: 'vehicle', label: 'Vehicle' }
        ]} />
        {answers.collateral.kind !== 'none' && (
          <>
            <NumberInput form={form} field="collateral.value" label="Approximate collateral value" prefix={<IndianRupee size={16} />} />
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold text-ink">Is it unencumbered?</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button type="button" variant={isKnown(answers.collateral.unencumbered) && answers.collateral.unencumbered.value ? 'secondary' : 'ghost'} onClick={() => setKnownBoolean(form, 'collateral.unencumbered', true)}>Yes</Button>
                <Button type="button" variant={isKnown(answers.collateral.unencumbered) && !answers.collateral.unencumbered.value ? 'secondary' : 'ghost'} onClick={() => setKnownBoolean(form, 'collateral.unencumbered', false)}>No</Button>
                <Button type="button" variant={answers.collateral.unencumbered.status === 'unknown' ? 'secondary' : 'ghost'} onClick={() => setKnownBoolean(form, 'collateral.unencumbered', 'unknown')}>I don't know</Button>
              </div>
            </fieldset>
          </>
        )}
        <label className="flex items-start gap-3 rounded-lg border border-[#dce7e2] bg-white p-4 text-sm text-slate-700">
          <input type="checkbox" checked={answers.coApplicantAvailable} onChange={(event) => form.setValue('coApplicantAvailable', event.target.checked, { shouldDirty: true })} className="mt-1 h-4 w-4 accent-mint" />
          Co-applicant income is genuinely available for repayment.
        </label>
        <NumberInput form={form} field="coApplicantMonthlyIncome" label="Co-applicant monthly income" prefix={<IndianRupee size={16} />} />
      </div>
    );
  }

  const hasOffer = answers.lenderOffer !== null;
  const offer = answers.lenderOffer ?? { nominalRateAnnual: 0, tenureMonths: 36, processingFeePct: 0, quotedEmi: 0 };
  const setOfferField = (field: keyof NonNullable<BorrowerAnswers['lenderOffer']>, value: number) => {
    form.setValue('lenderOffer', { ...offer, [field]: value }, { shouldDirty: true, shouldValidate: true });
  };
  return (
    <div className="grid gap-5">
      <label className="flex items-start gap-3 rounded-lg border border-[#dce7e2] bg-white p-4 text-sm text-slate-700">
        <input type="checkbox" checked={hasOffer} onChange={(event) => form.setValue('lenderOffer', event.target.checked ? offer : null, { shouldDirty: true })} className="mt-1 h-4 w-4 accent-mint" />
        I have a lender quote to compare.
      </label>
      {hasOffer && (
        <div className="grid gap-4 rounded-lg border border-[#dce7e2] bg-[#f8fbfa] p-4 sm:grid-cols-2">
          <InputShell><FieldLabel htmlFor="offer-rate" label="Quoted nominal rate (%)" /><input id="offer-rate" type="number" min={0} step="0.1" value={offer.nominalRateAnnual} onChange={(event) => setOfferField('nominalRateAnnual', Number(event.target.value))} className="h-11 rounded-lg border border-[#cbd8d3] px-3" /></InputShell>
          <InputShell><FieldLabel htmlFor="offer-tenure" label="Tenure (months)" /><input id="offer-tenure" type="number" min={1} value={offer.tenureMonths} onChange={(event) => setOfferField('tenureMonths', Number(event.target.value))} className="h-11 rounded-lg border border-[#cbd8d3] px-3" /></InputShell>
          <InputShell><FieldLabel htmlFor="offer-fee" label="Processing fee (%)" /><input id="offer-fee" type="number" min={0} step="0.1" value={offer.processingFeePct} onChange={(event) => setOfferField('processingFeePct', Number(event.target.value))} className="h-11 rounded-lg border border-[#cbd8d3] px-3" /></InputShell>
          <InputShell><FieldLabel htmlFor="offer-emi" label="Quoted EMI" /><input id="offer-emi" type="number" min={0} value={offer.quotedEmi} onChange={(event) => setOfferField('quotedEmi', Number(event.target.value))} className="h-11 rounded-lg border border-[#cbd8d3] px-3" /></InputShell>
        </div>
      )}
    </div>
  );
}

export function Questionnaire({ initialAnswers, onComplete, onCancel }: { initialAnswers: BorrowerAnswers; onComplete: (answers: BorrowerAnswers) => void; onCancel: () => void }) {
  const form = useForm<BorrowerAnswers>({ resolver: zodResolver(borrowerSchema), defaultValues: initialAnswers, mode: 'onBlur' });
  const [stepIndex, setStepIndex] = useState(0);
  const answers = form.watch();
  const steps = useMemo(() => applicableSteps(answers), [answers]);
  const step = steps[Math.min(stepIndex, steps.length - 1)];

  useEffect(() => {
    form.reset(initialAnswers);
    setStepIndex(0);
  }, [form, initialAnswers]);

  useEffect(() => {
    if (stepIndex >= steps.length) setStepIndex(Math.max(0, steps.length - 1));
  }, [stepIndex, steps.length]);

  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const submit = form.handleSubmit((valid) => onComplete(valid));

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} className="mx-auto grid w-full max-w-3xl gap-5">
        <Card className="p-0">
          <div className="border-b border-[#dce7e2] p-5">
            <div className="mb-3 flex items-center justify-between gap-3 text-sm text-slate-600">
              <span>Step {stepIndex + 1} of {steps.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#e7f0ec]"><div className="h-2 rounded-full bg-mint transition-all" style={{ width: `${progress}%` }} /></div>
            <div className="mt-5 flex items-start gap-3">
              <HelpCircle className="mt-1 shrink-0 text-mint" size={20} aria-hidden />
              <div>
                <h2 className="text-2xl font-semibold tracking-normal text-ink">{step?.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{step?.helper}</p>
              </div>
            </div>
          </div>
          <div className="p-5">{step && <StepFields stepId={step.id} form={form} />}</div>
        </Card>

        {form.formState.isSubmitted && !form.formState.isValid && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Please check the highlighted answers. Amount, age and income must be plausible before results can be calculated.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={onCancel}>Start over</Button>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" disabled={stepIndex === 0} onClick={() => setStepIndex((index) => Math.max(0, index - 1))}><ArrowLeft size={17} /> Back</Button>
            {stepIndex < steps.length - 1 ? (
              <Button type="button" onClick={() => setStepIndex((index) => Math.min(steps.length - 1, index + 1))}>Next <ArrowRight size={17} /></Button>
            ) : (
              <Button type="submit">Show my borrowing position <ArrowRight size={17} /></Button>
            )}
          </div>
        </div>
      </form>
    </FormProvider>
  );
}