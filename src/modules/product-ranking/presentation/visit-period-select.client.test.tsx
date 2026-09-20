import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: new URLSearchParams('query=remera'),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/ranking-productos',
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => navigation.searchParams,
}));

import { VisitPeriodSelect } from './visit-period-select.client';

afterEach(cleanup);

describe('VisitPeriodSelect', () => {
  it('muestra exactamente los ocho períodos y 30 días por default', async () => {
    const user = userEvent.setup();
    render(<VisitPeriodSelect value={30} />);

    expect(screen.getByText('Últimos 30 días')).toBeInTheDocument();
    await user.click(screen.getByRole('combobox'));
    expect(document.querySelectorAll('.ant-select-item-option')).toHaveLength(8);
    for (const days of [7, 10, 15, 30, 60, 90, 120, 150]) {
      expect(screen.getAllByText(`Últimos ${days} días`).length).toBeGreaterThan(0);
    }
  });

  it.each([7, 150] as const)('actualiza la URL con days=%i', async (days) => {
    const user = userEvent.setup();
    navigation.replace.mockClear();
    render(<VisitPeriodSelect value={30} />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByTitle(`Últimos ${days} días`));

    expect(navigation.replace).toHaveBeenCalledWith(
      `/ranking-productos?query=remera&days=${days}`,
      { scroll: false },
    );
  });
});
