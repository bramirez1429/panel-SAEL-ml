import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { ProductRankingTable } from './product-ranking-table.client';

const data = {
  totalProducts: 2,
  productsWithSales: 2,
  visitPeriodDays: 30 as const,
  totalVisits: 1250,
  products: [
    { title: 'Buzo', sold: 20, visits: 1250, type: 'LEGACY' as const, itemIds: ['MLA1'], familyId: null, userProductIds: [], thumbnailUrl: 'https://img/buzo.jpg', variantsCount: 0 },
    { title: 'Remera', sold: 10, visits: null, type: 'USER_PRODUCT' as const, itemIds: ['MLA2', 'MLA3'], familyId: 'FAM1', userProductIds: ['UP1', 'UP2'], thumbnailUrl: 'https://img/remera.jpg', variantsCount: 2 },
  ],
};

const variants = [
  { id: 'v-low', label: 'Blanco / M', itemId: 'MLA3', userProductId: 'MLAU3', sold: 2, visits: 680, thumbnailUrl: null },
  { id: 'v-best-a', label: 'Negro / S', itemId: 'MLA2', userProductId: 'MLAU2', sold: 8, visits: 520, thumbnailUrl: null },
  { id: 'v-best-b', label: 'Rojo / S', itemId: 'MLA4', userProductId: null, sold: 8, visits: 680, thumbnailUrl: null },
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

  it('muestra el período seleccionado, formatea miles y distingue null de cero', () => {
    const zeroData = {
      ...data,
      products: data.products.map((product) =>
        product.title === 'Remera' ? { ...product, visits: 0 } : product,
      ),
    };
    render(<ProductRankingTable data={zeroData} />);

    expect(screen.getAllByText('últimos 30 días').length).toBeGreaterThan(0);
    expect(screen.getByText('1.250')).toBeInTheDocument();
    const zeroRow = screen.getByText('Remera').closest('tr');
    expect(zeroRow).not.toBeNull();
    expect(within(zeroRow!).getByText('0')).toBeInTheDocument();

    cleanup();
    render(<ProductRankingTable data={data} />);
    const nullRow = screen.getByText('Remera').closest('tr');
    expect(nullRow).not.toBeNull();
    expect(within(nullRow!).getByText('—')).toBeInTheDocument();
  });

  it('carga variantes sólo al abrir, las ordena, marca empates y reutiliza cache', async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: true as const, variants });
    render(<ProductRankingTable data={data} loadVariantsAction={action} />);
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /Ver variantes \(2\)/ }));
    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith({ type: 'family', id: 'FAM1', days: 30 });
    expect(await screen.findByText('Negro / S')).toBeInTheDocument();
    const labels = screen.getAllByText(/^(Negro \/ S|Rojo \/ S|Blanco \/ M)$/).map((element) => element.textContent);
    expect(labels).toEqual(['Negro / S', 'Rojo / S', 'Blanco / M']);
    expect(screen.getAllByText('Más vendida')).toHaveLength(2);
    expect(screen.getAllByText('Más vista')).toHaveLength(2);
    expect(screen.getByText('520')).toBeInTheDocument();
    expect(screen.getAllByText('680').length).toBeGreaterThan(0);
    const bothBadges = screen.getByText('Rojo / S').parentElement?.parentElement;
    expect(bothBadges).not.toBeNull();
    expect(within(bothBadges!).getByText('Más vendida')).toBeInTheDocument();
    expect(within(bothBadges!).getByText('Más vista')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Ocultar variantes/ }));
    await user.click(screen.getByRole('button', { name: /Ver variantes \(2\)/ }));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('separa el cache por producto y período y recalcula Más vista', async () => {
    const sevenDayVariants = variants.map((variant) => ({
      ...variant,
      visits: variant.id === 'v-best-a' ? 900 : 100,
    }));
    const action = vi.fn()
      .mockResolvedValueOnce({ ok: true as const, variants })
      .mockResolvedValueOnce({ ok: true as const, variants: sevenDayVariants });
    const { rerender } = render(
      <ProductRankingTable data={data} loadVariantsAction={action} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Ver variantes/ }));
    await screen.findByText('Negro / S');
    expect(action).toHaveBeenLastCalledWith({ type: 'family', id: 'FAM1', days: 30 });

    rerender(
      <ProductRankingTable
        data={{ ...data, visitPeriodDays: 7 }}
        loadVariantsAction={action}
      />,
    );
    await waitFor(() => expect(screen.getByRole('button', { name: /Ver variantes/ })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Ver variantes/ }));
    await waitFor(() => expect(action).toHaveBeenCalledTimes(2));
    expect(action).toHaveBeenLastCalledWith({ type: 'family', id: 'FAM1', days: 7 });
    const sevenDayBest = screen.getByText('Negro / S').parentElement?.parentElement;
    expect(sevenDayBest).not.toBeNull();
    expect(within(sevenDayBest!).getByText('Más vista')).toBeInTheDocument();
    expect(within(sevenDayBest!).getByText('Más vendida')).toBeInTheDocument();

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

  it('no marca más vista cuando todas tienen cero visitas', async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: true as const, variants: variants.map((variant) => ({ ...variant, visits: 0 })) });
    render(<ProductRankingTable data={data} loadVariantsAction={action} />);
    await user.click(screen.getByRole('button', { name: /Ver variantes/ }));
    await screen.findByText('Negro / S');
    expect(screen.queryByText('Más vista')).not.toBeInTheDocument();
  });

  it('excluye null al calcular la variante más vista', async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({
      ok: true as const,
      variants: [
        { ...variants[0], visits: null },
        { ...variants[1], visits: 50 },
        { ...variants[2], visits: 50 },
      ],
    });
    render(<ProductRankingTable data={data} loadVariantsAction={action} />);
    await user.click(screen.getByRole('button', { name: /Ver variantes/ }));
    await screen.findByText('Negro / S');
    expect(screen.getAllByText('Más vista')).toHaveLength(2);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
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
