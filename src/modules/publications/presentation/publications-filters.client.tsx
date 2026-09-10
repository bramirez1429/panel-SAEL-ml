"use client";

import { useTransition, type FormEvent } from "react";
import { Button, Input, Select } from "antd";
import { useRouter, useSearchParams } from "next/navigation";

import {
  buildPublicationsUrl,
  normalizePublicationSearch,
  parsePublicationsSearchParams,
  type PublicationsUrlState,
} from "./publications-search-params";
import styles from "./publications-view.module.css";
import { resetPublicationsCursorHistory } from "./publications-cursor-history.client";

type PublicationsFiltersProps = Readonly<{
  filters: PublicationsUrlState;
}>;

export function PublicationsFilters({ filters }: PublicationsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const navigate = (patch: Partial<PublicationsUrlState>) => {
    const current = parsePublicationsSearchParams(
      Object.fromEntries(searchParams.entries()),
    );

    if (patch.cursor === null) resetPublicationsCursorHistory();
    startTransition(() => {
      router.push(buildPublicationsUrl(current, patch));
    });
  };

  const submitFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    navigate({
      page: 1,
      cursor: null,
      search: normalizePublicationSearch(String(formData.get("search") ?? "")),
      status: String(formData.get("status") ?? "").trim(),
    });
  };

  return (
    <form
      key={`${filters.search}:${filters.status}`}
      className={styles.filters}
      action="/publicaciones"
      method="get"
      onSubmit={submitFilters}
    >
      <input name="page" type="hidden" value="1" />

      <label className={styles.filterField}>
        <span>Buscar</span>
        <Input
          defaultValue={filters.search}
          name="search"
          placeholder="Buscar por título, SKU, Familia, MLA o MLAU"
        />
      </label>

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
        loading={isPending}
        type="primary"
      >
        Aplicar filtros
      </Button>
    </form>
  );
}
