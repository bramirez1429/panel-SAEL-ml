export type PublicationSearchCriteria = Readonly<{
  type: "FAMILY" | "MLA" | "TITLE";
  value: string;
}>;
