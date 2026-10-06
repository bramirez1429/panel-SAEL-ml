export type ReplicablePublicationType = "USER_PRODUCT" | "LEGACY";

export type ReplicablePublication = Readonly<{
  sourceKey: string;
  title: string;
  sold: number;
  priceFrom: number | null;
  priceTo: number | null;
  currency: string | null;
  thumbnailUrl: string | null;
  familyId: string | null;
  itemId: string | null;
  userProductId: string | null;
  type: ReplicablePublicationType;
}>;

export type ReplicationPreview = Readonly<{
  sourceKey: string;
  title: string;
  thumbnailUrl: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  currency: string | null;
  tags: readonly string[];
}>;
