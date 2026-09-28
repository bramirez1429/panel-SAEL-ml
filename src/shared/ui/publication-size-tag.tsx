import { Tag } from "antd";

export function PublicationSizeTag({ size }: Readonly<{ size: string }>) {
  return (
    <Tag
      color="#55acee"
      style={{
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        marginTop: 6,
        padding: "3px 10px",
      }}
    >
      Talle {size}
    </Tag>
  );
}
