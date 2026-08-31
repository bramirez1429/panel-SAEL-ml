"use client";

import { Button, Input, Space, Typography } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { parsePublicationSearch } from "../domain/publication-search.parser";
import styles from "./publication-search-bar.module.css";

type Props = Readonly<{ initialSearch: string }>;

export function PublicationSearchBar({ initialSearch }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);
  const [pending, startTransition] = useTransition();
  const criteria = parsePublicationSearch(value);

  function navigate(term: string): void {
    const parsed = parsePublicationSearch(term);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cursor");
    if (parsed) params.set("search", parsed.value);
    else params.delete("search");
    const query = params.toString();
    startTransition(() => router.push(query ? `/promociones?${query}` : "/promociones"));
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    navigate(value);
  }

  function clear(): void {
    setValue("");
    navigate("");
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
      <Button htmlType="button" onClick={clear} disabled={!initialSearch && !value}>Limpiar</Button>
      <Typography.Text type="secondary">{criteria ? criteriaLabel(criteria.type) : "Familia · MLA · Nombre"}</Typography.Text>
    </Space>
  </form>;
}

function criteriaLabel(type: "FAMILY" | "MLA" | "TITLE"): string {
  if (type === "FAMILY") return "Búsqueda por familia";
  if (type === "MLA") return "Búsqueda por MLA";
  return "Búsqueda por nombre";
}
