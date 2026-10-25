"use client";

import { Button, Image, Space, Typography } from "antd";
import { useId, useState, type ReactNode } from "react";

type Props = Readonly<{
  label: string;
  count: number;
  imageUrl: string | null;
  children: ReactNode;
}>;

/**
 * Only mounts publication editors on the first expansion. Afterwards they
 * remain mounted but hidden, preserving in-progress edits and avoiding
 * repeated Tiendanube lookups when the group is closed and reopened.
 */
export function PublicationWorkspaceVariantGroup({
  label,
  count,
  imageUrl,
  children,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const contentId = useId();

  function toggle() {
    if (!expanded) setHasOpened(true);
    setExpanded((current) => !current);
  }

  return (
    <section aria-label={`Publicaciones de ${label}`} style={{ width: "100%" }}>
      <Button
        type="text"
        aria-expanded={expanded}
        aria-controls={hasOpened ? contentId : undefined}
        aria-label={`${expanded ? "Cerrar" : "Abrir"} ${label}`}
        onClick={toggle}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f3f7fc",
          border: "1px solid #e5eaf1",
          borderRadius: 8,
          minHeight: 64,
          height: "auto",
          padding: "8px 16px",
          width: "100%",
          textAlign: "left",
          whiteSpace: "normal",
        }}
      >
        <Space align="center" size="middle">
          <span aria-hidden="true">{expanded ? "▾" : "▸"}</span>
          {imageUrl ? (
            <Image
              alt={`Imagen de ${label}`}
              src={imageUrl}
              preview={false}
              width={48}
              height={48}
              style={{ borderRadius: 6, objectFit: "cover" }}
            />
          ) : null}
          <strong>{label}</strong>
        </Space>
        <Typography.Text type="secondary">
          {count} {count === 1 ? "publicación" : "publicaciones"}
        </Typography.Text>
      </Button>
      {hasOpened ? (
        <div
          id={contentId}
          style={{ display: expanded ? "block" : "none", marginTop: 8 }}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
