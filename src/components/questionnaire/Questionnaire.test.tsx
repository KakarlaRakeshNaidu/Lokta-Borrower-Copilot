import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Questionnaire } from './Questionnaire';
import { blankAnswers, ravi } from '../../domain/fixtures/personas';

describe('Questionnaire', () => {
  it('preserves answers when moving forward and back', async () => {
    const user = userEvent.setup();
    render(<Questionnaire initialAnswers={blankAnswers()} onComplete={vi.fn()} onCancel={vi.fn()} />);
    const amount = screen.getByLabelText(/How much do you want/i);
    await user.clear(amount);
    await user.type(amount, '250000');
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Back/i }));
    expect(screen.getByLabelText(/How much do you want/i)).toHaveValue(250000);
  });

  it('renders the self-employed income branch from a Ravi-style fixture', async () => {
    const user = userEvent.setup();
    render(<Questionnaire initialAnswers={ravi} onComplete={vi.fn()} onCancel={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Next/i }));
    await user.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByLabelText(/Annual ITR/i)).toBeInTheDocument();
  });
});