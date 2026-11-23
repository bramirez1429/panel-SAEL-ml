"use client";

import { ArrowRightOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Input, Typography, type InputRef } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

import { parsePublicationSearch } from "@/shared/lib/publication-search";
import styles from "./mercadolibre-publication-search.module.css";

type Props = Readonly<{
  initialSearch: string;
  pathname: "/promociones" | "/publicaciones" | "/replicar";
  onResetCursorHistory: () => void;
  clearSearchParams?: readonly string[];
  hasAdditionalFilters?: boolean;
  integrated?: boolean;
  className?: string;
}>;

/** Visual upgrade only: preserves parsing, URL params, cursor reset and server filtering. */
export function MercadoLibrePublicationSearch({
  initialSearch,
  pathname,
  onResetCursorHistory,
  clearSearchParams = [],
  hasAdditionalFilters = false,
  integrated = false,
  className,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<InputRef>(null);
  const [value, setValue] = useState(initialSearch);
  const [pending, startTransition] = useTransition();
  const criteria = parsePublicationSearch(value);

  useEffect(() => {
    function handleSearchShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleSearchShortcut);
    return () => document.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  function navigate(term: string, clearAdditionalFilters = false): void {
    const parsed = parsePublicationSearch(term);
    const params = new URLSearchParams(searchParams.toString());
    onResetCursorHistory();
    params.delete("cursor");
    params.set("page", "1");
    if (parsed) params.set("search", parsed.value);
    else params.delete("search");
    if (clearAdditionalFilters) clearSearchParams.forEach((param) => params.delete(param));
    const query = params.toString();
    startTransition(() => router.push(query ? pathname + "?" + query : pathname));
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    navigate(value);
  }

  function clear(): void {
    setValue("");
    navigate("", true);
  }

  const searchField = (
    <div className={styles.searchShell}>
      <SearchOutlined className={styles.searchIcon} aria-hidden="true" />
      <Input
        ref={inputRef}
        className={styles.searchInput}
        allowClear={integrated}
        aria-label="Buscar publicaciones"
        type={integrated ? "search" : "text"}
        autoComplete="off"
        onChange={(event) => setValue(event.target.value)}
        onClear={integrated ? clear : undefined}
        placeholder={integrated ? "Buscar por familia, MLA o nombre" : "Buscar por nombre, Family ID o MLA"}
        value={value}
      />
      <Button
        aria-label="Buscar"
        className={styles.searchButton}
        htmlType="submit"
        icon={<ArrowRightOutlined />}
        iconPlacement="end"
        loading={pending}
        type="primary"
      >
        Buscar
      </Button>
    </div>
  );

  return (
    <form
      className={[styles.form, integrated ? styles.integrated : styles.standalone, className ?? ""]
        .filter(Boolean).join(" ")}
      role="search"
      onSubmit={submit}
    >
      {!integrated ? (
        <div className={styles.heading}>
          <div className={styles.eyebrow}><span className={styles.liveDot} /> BÚSQUEDA INTELIGENTE</div>
          <Typography.Title level={3} className={styles.title}>Encontrá tus publicaciones</Typography.Title>
          <Typography.Text className={styles.description}>
            Buscá por nombre, ID de publicación o familia desde un mismo lugar.
          </Typography.Text>
        </div>
      ) : null}
      {searchField}
      <div className={styles.meta}>
        <span className={styles.detected}>
          <SearchOutlined aria-hidden="true" />
          {criteria ? criteriaLabel(criteria.type) : "Nombre · Family ID · MLA"}
        </span>
        <div className={styles.metaRight}>
          {!integrated ? (
            <Button
              className={styles.clearButton}
              disabled={!initialSearch && !value && !hasAdditionalFilters}
              htmlType="button"
              onClick={clear}
              type="link"
            >
              Limpiar
            </Button>
          ) : null}
          <span className={styles.shortcutHint} aria-label="Atajo Control o Comando más K">
            Ctrl / ⌘ K
          </span>
        </div>
      </div>
    </form>
  );
}

function criteriaLabel(type: PublicationSearchCriteria["type"]): string {
  if (type === "FAMILY") return "Detectado: Family ID";
  if (type === "MLA") return "Detectado: código MLA";
  return "Búsqueda por nombre";
}

type PublicationSearchCriteria = NonNullable<ReturnType<typeof parsePublicationSearch>>;
