"use client";

import { useState } from "react";
import { BookmarkCheck, BookmarkPlus, Check, ExternalLink, PlayCircle, TriangleAlert } from "lucide-react";
import { useProgress } from "@/components/progress-provider";
import {
  embedUrl,
  thumbnailUrl,
  type VideoLesson as Video,
} from "@/lib/content/videos";
import { useMotionOk } from "./motion/use-motion-ok";
import { cn } from "@/lib/utils";

export function VideoLesson({
  video,
  className,
}: {
  video: Video;
  className?: string;
}) {
  const [tocando, setTocando] = useState(false);
  const [capaFalhou, setCapaFalhou] = useState(false);
  const animar = useMotionOk();
  const { markVideoOpened, isVideoOpened, toggleWatchLater, isWatchLater } =
    useProgress();

  const jaAberto = isVideoOpened(video.lesson);
  const guardado = isWatchLater(video.lesson);

  function abrir() {
    setTocando(true);

    markVideoOpened(video.lesson);
  }

  const vertical = video.format === "short";
  const tituloAcessivel = `Assistir ao vídeo complementar: ${video.title}${
    video.startAt ? `, a partir de ${video.startAt} segundos` : ""
  }`;

  return (
    <section
      className={cn("panel overflow-hidden", className)}
      aria-labelledby={`video-${video.youtubeId}`}
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-rail bg-panel-sunken px-4 py-2.5">
        <PlayCircle className="size-3.5 shrink-0 text-copper" aria-hidden />
        <span className="silkscreen">Vídeo complementar</span>
        {vertical && (
          <span className="font-mono text-2xs text-muted-foreground">Short</span>
        )}
        {jaAberto && (
          <span className="ml-auto inline-flex items-center gap-1 font-mono text-2xs text-signal">
            <Check className="size-3" aria-hidden />
            aberto
          </span>
        )}
      </p>

      <div className="p-4">
        <h3 id={`video-${video.youtubeId}`} className="text-base font-semibold">
          {video.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Explicação em vídeo, complementar ao conteúdo desta aula.
        </p>

        <div
          className={cn(
            "relative mt-3 overflow-hidden rounded-sm border border-rail bg-panel-sunken",
            vertical ? "mx-auto max-w-[19rem]" : "",
          )}

          style={{ aspectRatio: vertical ? "9 / 16" : "16 / 9" }}
        >
          {tocando ? (
            <iframe
              src={embedUrl(video)}
              title={video.title}

              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              className="absolute inset-0 size-full border-0"
            />
          ) : (
            <button
              type="button"
              onClick={abrir}
              aria-label={tituloAcessivel}
              className="group absolute inset-0 flex size-full items-center justify-center outline-none"
            >
              {!capaFalhou ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl(video.youtubeId)}
                  alt=""
                  width={480}
                  height={360}
                  loading="lazy"
                  decoding="async"
                  onError={() => setCapaFalhou(true)}
                  className={cn(
                    "absolute inset-0 size-full object-cover",

                    "opacity-80 transition-opacity duration-200 group-hover:opacity-95 group-focus-visible:opacity-95",
                  )}
                />
              ) : (
                <span
                  aria-hidden
                  className="absolute inset-0 bg-panel-sunken"
                />
              )}

              <span
                aria-hidden
                className={cn(
                  "relative flex items-center gap-2 rounded-sm border border-copper bg-background/85 px-3 py-2 text-sm font-medium text-copper backdrop-blur-sm",
                  animar &&
                    "transition-transform duration-200 group-hover:-translate-y-px group-focus-visible:-translate-y-px",
                )}
              >
                <PlayCircle className="size-4" aria-hidden />
                Assistir vídeo
              </span>

              <span className="absolute inset-0 rounded-sm ring-inset ring-ring group-focus-visible:ring-2" />
            </button>
          )}
        </div>

        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-6 items-center gap-1.5 text-fiber underline-offset-4 hover:underline"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            Abrir no YouTube
          </a>

          <button
            type="button"
            onClick={() => toggleWatchLater(video.lesson)}
            aria-pressed={guardado}
            className={cn(
              "hit-44 inline-flex min-h-6 items-center gap-1.5 rounded-sm underline-offset-4 hover:underline",
              guardado ? "text-copper" : "text-muted-foreground",
            )}
          >
            {guardado ? (
              <BookmarkCheck className="size-3.5" aria-hidden />
            ) : (
              <BookmarkPlus className="size-3.5" aria-hidden />
            )}
            {guardado ? "Guardado para depois" : "Ver depois"}
          </button>
          {tocando && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <TriangleAlert className="size-3.5" aria-hidden />
              Se o player não carregar, use o link acima.
            </span>
          )}
        </p>
      </div>
    </section>
  );
}
