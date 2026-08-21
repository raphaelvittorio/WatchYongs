import Image from "next/image";
import { PHOTO_STAGE_LABELS, type PhotoStage } from "@/lib/status";

type PhotoItem = {
  id: string;
  path: string;
  stage: PhotoStage;
};

function PhotoGrid({ photos }: { photos: PhotoItem[] }) {
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

export function PhotoGallery({ photos }: { photos: PhotoItem[] }) {
  if (photos.length === 0) {
    return <p className="text-sm text-muted-foreground">Belum ada foto.</p>;
  }

  const stages: PhotoStage[] = ["INTAKE", "ASSESSMENT", "COMPLETION"];
  const grouped = stages
    .map((stage) => ({ stage, items: photos.filter((p) => p.stage === stage) }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div key={group.stage}>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {PHOTO_STAGE_LABELS[group.stage]}
          </p>
          <PhotoGrid photos={group.items} />
        </div>
      ))}
    </div>
  );
}
