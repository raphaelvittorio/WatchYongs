import Image from "next/image";

type PhotoItem = {
  id: string;
  path: string;
};

export function PhotoGallery({ photos }: { photos: PhotoItem[] }) {
  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada foto.</p>;
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
      {photos.map((photo) => (
        <a
          key={photo.id}
          href={photo.path}
          target="_blank"
          rel="noreferrer"
          className="group relative aspect-square overflow-hidden rounded-md border"
        >
          <Image
            src={photo.path}
            alt=""
            fill
            sizes="(max-width: 768px) 33vw, 20vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </a>
      ))}
    </div>
  );
}
