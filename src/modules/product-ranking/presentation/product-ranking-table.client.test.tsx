import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { ProductRankingTable } from './product-ranking-table.client';

const data = {
  totalProducts: 2,
  productsWithSales: 2,
  products: [
    { title: 'Buzo', sold: 20, type: 'LEGACY' as const, itemIds: ['MLA1'], familyId: null, userProductIds: [], thumbnailUrl: 'https://img/buzo.jpg', variantsCount: 0 },
    { title: 'Remera', sold: 10, type: 'USER_PRODUCT' as const, itemIds: ['MLA2', 'MLA3'], familyId: 'FAM1', userProductIds: ['UP1', 'UP2'], thumbnailUrl: 'https://img/remera.jpg', variantsCount: 2 },
  ],
};

const variants = [
  { id: 'v-low', label: 'Blanco / M', itemId: 'MLA3', userProductId: 'MLAU3', sold: 2, thumbnailUrl: null },
  { id: 'v-best-a', label: 'Negro / S', itemId: 'MLA2', userProductId: 'MLAU2', sold: 8, thumbnailUrl: null },
  { id: 'v-best-b', label: 'Rojo / S', itemId: 'MLA4', userProductId: null, sold: 8, thumbnailUrl: null },
];

afterEach(cleanup);

describe('ProductRankingTable', () => {
  it('muestra thumbnail, familia dentro del producto y un resumen compacto de MLA', () => {
    render(<ProductRankingTable data={data} />);
    expect(screen.getByAltText('Imagen de Buzo')).toBeInTheDocument();
    expect(screen.getByText('FAM1')).toBeInTheDocument();
    expect(screen.getByText('+ 1 más')).toBeInTheDocument();
    expect(screen.queryByText('UP1')).not.toBeInTheDocument();
    const legacyRow = screen.getByText('Buzo').closest('tr');
    expect(legacyRow).not.toBeNull();
    expect(within(legacyRow!).queryByText('Familia:')).not.toBeInTheDocument();
  });

  it('carga variantes sólo al abrir, las ordena, marca empates y reutiliza cache', async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: true as const, variants });
    render(<ProductRankingTable data={data} loadVariantsAction={action} />);
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Ver variantes \(2\)/ }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith({ type: 'family', id: 'FAM1' });
    expect(await screen.findByText('Negro / S')).toBeInTheDocument();
    const labels = screen.getAllByText(/^(Negro \/ S|Rojo \/ S|Blanco \/ M)$/).map((element) => element.textContent);
    expect(labels).toEqual(['Negro / S', 'Rojo / S', 'Blanco / M']);
    expect(screen.getAllByText('Más vendida')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: /Ocultar variantes/ }));
    await user.click(screen.getByRole('button', { name: /Ver variantes \(2\)/ }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('muestra loading solamente dentro del producto abierto', async () => {
    const user = userEvent.setup();
    let resolve!: (value: { ok: true; variants: typeof variants }) => void;
    const action = vi.fn(() => new Promise<{ ok: true; variants: typeof variants }>((done) => { resolve = done; }));
    render(<ProductRankingTable data={data} loadVariantsAction={action} />);
    await user.click(screen.getByRole('button', { name: /Ver variantes/ }));
    expect(screen.getByText('Cargando variantes…')).toBeInTheDocument();
    resolve({ ok: true, variants });
    expect(await screen.findByText('Negro / S')).toBeInTheDocument();
  });

  it('no marca más vendida cuando todas las variantes tienen cero ventas', async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: true as const, variants: variants.map((variant) => ({ ...variant, sold: 0 })) });
    render(<ProductRankingTable data={data} loadVariantsAction={action} />);
    await user.click(screen.getByRole('button', { name: /Ver variantes/ }));
    await screen.findByText('Negro / S');
    expect(screen.queryByText('Más vendida')).not.toBeInTheDocument();
  });

  it('muestra error y reintenta la carga de variantes', async () => {
    const user = userEvent.setup();
    const action = vi.fn()
      .mockResolvedValueOnce({ ok: false as const, message: 'falló' })
      .mockResolvedValueOnce({ ok: true as const, variants });
    render(<ProductRankingTable data={data} loadVariantsAction={action} />);
    await user.click(screen.getByRole('button', { name: /Ver variantes/ }));
    expect(await screen.findByText('No se pudieron cargar las variantes.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('Negro / S')).toBeInTheDocument();
  });

  it('muestra el error principal sin renderizar un svg', () => {
    const { container } = render(<ProductRankingTable error />);
    expect(screen.getByText('No se pudo consultar Mercado Libre. Revisá la conexión desde Integraciones.')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });
});
