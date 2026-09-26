export type PublicationImageSource = Readonly<{
  thumbnail: string | null;
  pictures: readonly Readonly<{
    secure_url?: string | null;
    url?: string | null;
  }>[];
}>;

export function getBestPublicationImage(
  publication: PublicationImageSource,
): string | null {
  const firstPicture = publication.pictures[0];

  return (
    firstPicture?.secure_url ??
    firstPicture?.url ??
    publication.thumbnail ??
    null
  );
}
