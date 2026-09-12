"use client";

import { Button, Input, Space, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { parsePublicationSearch } from "@/shared/lib/publication-search";
import styles from "./mercadolibre-publication-search.module.css";

type Props = Readonly<{
  initialSearch: string;
  pathname: "/promociones" | "/publicaciones";
  onResetCursorHistory: () => void;
  clearSearchParams?: readonly string[];
  hasAdditionalFilters?: boolean;
}>;

export function MercadoLibrePublicationSearch({ initialSearch, pathname, onResetCursorHistory, clearSearchParams = [], hasAdditionalFilters = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);
  const [pending, startTransition] = useTransition();
  const criteria = parsePublicationSearch(value);

  function navigate(term: string, clearAdditionalFilters = false): void {
    const parsed = parsePublicationSearch(term);
    const params = new URLSearchParams(searchParams.toString());
    onResetCursorHistory();
    params.delete("cursor");
    params.set("page", "1");
    if (parsed) params.set("search", parsed.value);
    else params.delete("search");
    if (clearAdditionalFilters) {
      clearSearchParams.forEach((param) => params.delete(param));
    }
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    navigate(value);
  }

  function clear(): void {
    setValue("");
    navigate("", true);
  }

  return <form className={styles.form} onSubmit={submit}>
    <Space className={styles.controls} wrap>
      <Input
        aria-label="Buscar publicaciones"
        className={styles.input}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar por familia, MLA o nombre"
      />
      <Button htmlType="submit" type="primary" loading={pending}>Buscar</Button>
      <Button htmlType="button" onClick={clear} disabled={!initialSearch && !value && !hasAdditionalFilters}>Limpiar</Button>
      <Typography.Text type="secondary">{criteria ? criteriaLabel(criteria.type) : "Familia · MLA · Nombre"}</Typography.Text>
    </Space>
  </form>;
}

function criteriaLabel(type: PublicationSearchCriteria["type"]): string {
  if (type === "FAMILY") return "Búsqueda por familia";
  if (type === "MLA") return "Búsqueda por MLA";
  return "Búsqueda por nombre";
}

type PublicationSearchCriteria = NonNullable<ReturnType<typeof parsePublicationSearch>>;
