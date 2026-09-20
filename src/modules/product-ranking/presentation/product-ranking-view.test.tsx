import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./visit-period-select.client', () => ({
  VisitPeriodSelect: ({ value }: { value: number }) => <span>{`selector:${value}`}</span>,
}));

import { ProductRankingView } from './product-ranking-view';

describe('ProductRankingView', () => {
  it('muestra las visitas totales y el período consultado', () => {
    render(<ProductRankingView data={{
      totalProducts: 84,
      productsWithSales: 53,
      visitPeriodDays: 30,
      totalVisits: 18430,
      products: [],
    }} />);

    expect(screen.getByText('Visitas totales')).toBeInTheDocument();
    expect(screen.getByText((_, element) =>
      element?.classList.contains('ant-statistic-content-value') === true &&
      element.textContent === '18.430',
    )).toBeInTheDocument();
    expect(screen.getByText('Últimos 30 días')).toBeInTheDocument();
    expect(screen.getByText('selector:30')).toBeInTheDocument();
  });
});
