'use client';

import { Select } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

import {
  PRODUCT_RANKING_VISIT_PERIODS,
  type ProductRankingVisitPeriod,
} from '../domain/product-ranking-period';

type Props = Readonly<{
  value: ProductRankingVisitPeriod;
}>;

export function VisitPeriodSelect({ value }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function changePeriod(days: ProductRankingVisitPeriod) {
    const next = new URLSearchParams(searchParams.toString());
    next.set('days', String(days));
    startTransition(() => {
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    });
  }

  return <label>
    <span>Período de visitas:</span>
    <Select<ProductRankingVisitPeriod>
      aria-label="Período de visitas"
      loading={pending}
      onChange={changePeriod}
      options={PRODUCT_RANKING_VISIT_PERIODS.map((days) => ({
        label: `Últimos ${days} días`,
        value: days,
      }))}
      value={value}
    />
  </label>;
}
