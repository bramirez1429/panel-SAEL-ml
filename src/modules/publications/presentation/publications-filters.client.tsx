"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button, Flex, Input, Select, Switch } from "antd";
import { useRouter, useSearchParams } from "next/navigation";

import {
  buildPublicationsUrl,
  parsePublicationsSearchParams,
  type PublicationsUrlState,
} from "./publications-search-params";
import styles from "./publications-view.module.css";
import { resetPublicationsCursorHistory } from "./publications-cursor-history.client";
import { MercadoLibrePublicationSearch } from "@/shared/ui/mercadolibre-publication-search.client";
import type { PublicationQuickFilter } from "../application/publication-quick-filter";

type PublicationsFiltersProps = Readonly<{
  filters: PublicationsUrlState;
}>;

export function PublicationsFilters({ filters }: PublicationsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingQuickFilter, setPendingQuickFilter] = useState<PublicationQuickFilter | null>(null);

  const navigate = (
    patch: Partial<PublicationsUrlState>,
    quickFilter: PublicationQuickFilter | null = null,
  ) => {
    const current = parsePublicationsSearchParams(
      Object.fromEntries(searchParams.entries()),
    );

    if (patch.cursor === null) resetPublicationsCursorHistory();
    setPendingQuickFilter(quickFilter);
    startTransition(() => {
      router.push(buildPublicationsUrl(current, patch));
    });
  };

  const toggleQuickFilter = (
    quickFilter: PublicationQuickFilter,
    checked: boolean,
  ) => {
    const nextFilters = checked
      ? [...filters.quickFilters, quickFilter]
      : filters.quickFilters.filter((filter) => filter !== quickFilter);

    navigate({ page: 1, cursor: null, quickFilters: nextFilters }, quickFilter);
  };

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    navigate({
      page: 1,
      cursor: null,
      status: String(formData.get("status") ?? "").trim(),
    });
  };

  return (<>
    <MercadoLibrePublicationSearch
      initialSearch={filters.search}
      pathname="/publicaciones"
      onResetCursorHistory={resetPublicationsCursorHistory}
      clearSearchParams={["quick"]}
      hasAdditionalFilters={filters.quickFilters.length > 0}
    />
    <Flex className={styles.quickFilters} gap={8} wrap>
      {quickFilterOptions.map(({ value, label }) => (
        <label className={styles.quickFilter} key={value}>
          <span>{label}</span>
          <Switch
            aria-label={label}
            checked={filters.quickFilters.includes(value)}
            checkedChildren="Sí"
            disabled={isPending && pendingQuickFilter !== value}
            loading={isPending && pendingQuickFilter === value}
            onChange={(checked) => toggleQuickFilter(value, checked)}
            unCheckedChildren="No"
          />
        </label>
      ))}
    </Flex>
    <form
      key={`${filters.search}:${filters.status}`}
      className={styles.filters}
      action="/publicaciones"
      method="get"
      onSubmit={submitFilters}
    >
      <input name="page" type="hidden" value="1" />

      <label className={styles.filterField}>
        <span>Tipo</span>
        <input name="type" type="hidden" value={filters.type ?? ""} />
        <Select
          aria-label="Filtrar por tipo"
          allowClear
          onChange={(type: PublicationsUrlState["type"]) =>
            navigate({ page: 1, cursor: null, type: type ?? null })
          }
          options={[
            { label: "Familia", value: "USER_PRODUCT" },
            { label: "Legacy", value: "LEGACY" },
          ]}
          placeholder="Todos"
          value={filters.type ?? undefined}
        />
      </label>

      <label className={styles.filterField}>
        <span>Estado</span>
        <Input
          defaultValue={filters.status}
          name="status"
          placeholder="Estado exacto"
        />
      </label>

      <Button
        className={styles.filterButton}
        htmlType="submit"
        loading={isPending && pendingQuickFilter === null}
        type="primary"
      >
        Aplicar filtros
      </Button>
    </form>
  </>);
}

const quickFilterOptions: readonly Readonly<{
  value: PublicationQuickFilter;
  label: string;
}>[] = [
  { value: "WOMEN_TSHIRT", label: "Remera de mujer" },
  { value: "WOMEN_SWEATSHIRT", label: "Buzo de mujer" },
  { value: "GIRLS_TSHIRT", label: "Remera de niña" },
  { value: "GIRLS_SWEATSHIRT", label: "Buzo de niña" },
];
