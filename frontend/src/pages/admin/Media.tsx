import { useRef, useState, type DragEvent } from "react";
import { Copy, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ErrorState, LoadingState } from "../../components/ui/States";
import { Pagination } from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import { ApiError } from "../../api/client";
import type { MediaAsset } from "../../api/types";
import { useAdminMedia, useDeleteMedia, useUploadMedia } from "../../hooks/admin";
import { formatBytes, formatDate } from "../../utils/format";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export function AdminMedia() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const media = useAdminMedia(page);
  const upload = useUploadMedia();
  const remove = useDeleteMedia();
  const inputRef = useRef<HTMLInputElement>(null);

  const startUpload = (file: File | undefined) => {
    if (file === undefined) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Only JPEG, PNG, WebP, GIF or SVG images are allowed.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Images must be 5 MB or smaller.");
      return;
    }
    upload.mutate(file, {
      onSuccess: () => toast.success("Uploaded."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Upload failed."),
    });
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (upload.isPending) return;
    startUpload(event.dataTransfer.files[0]);
  };

  const copyUrl = async (asset: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(asset.secureUrl);
      toast.success("URL copied to clipboard.");
    } catch {
      toast.error("Could not copy — select the URL manually.");
    }
  };

  const deleting = media.data?.data.find((asset) => asset.id === deleteId) ?? null;

  return (
    <>
      <div
        className={`media-upload-zone${dragging ? " drag" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Upload an image"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {upload.isPending ? (
          <>
            <span className="spinner" aria-hidden="true" />
            <p className="state-text" style={{ marginTop: "var(--space-3)" }}>
              Uploading…
            </p>
          </>
        ) : (
          <>
            <UploadCloud size={30} aria-hidden="true" style={{ color: "var(--violet)" }} />
            <p className="state-text" style={{ marginTop: "var(--space-3)" }}>
              <strong>Click to choose an image</strong> or drag &amp; drop it here
            </p>
            <p className="muted" style={{ fontSize: "var(--fs-small)" }}>
              JPEG, PNG, WebP, GIF or SVG — up to 5 MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          hidden
          onChange={(event) => {
            startUpload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      {media.isError ? (
        <ErrorState message="Could not load the media library." onRetry={() => void media.refetch()} />
      ) : media.isLoading ? (
        <LoadingState padded={false} />
      ) : media.data !== undefined && media.data.data.length === 0 ? (
        <div className="media-empty-grid">
          <p>
            <ImagePlus size={26} aria-hidden="true" style={{ marginInline: "auto", marginBottom: 10, opacity: 0.5 }} />
            Nothing uploaded yet. Images for project covers and galleries live here.
          </p>
        </div>
      ) : (
        <>
          <div className="media-grid">
            {(media.data?.data ?? []).map((asset) => (
              <figure className="media-card" key={asset.id}>
                <img src={asset.secureUrl} alt={asset.filename} loading="lazy" />
                <div className="media-card-overlay">
                  <figcaption className="media-meta" title={`${asset.filename} — ${formatBytes(asset.byteSize)} · ${formatDate(asset.createdAt)}`}>
                    {asset.filename} · {formatBytes(asset.byteSize)}
                  </figcaption>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button type="button" className="row-action" aria-label={`Copy URL for ${asset.filename}`} onClick={() => void copyUrl(asset)}>
                      <Copy aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="row-action danger"
                      aria-label={`Delete ${asset.filename}`}
                      onClick={() => setDeleteId(asset.id)}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </figure>
            ))}
          </div>
          {media.data?.meta !== undefined && media.data.data.length > 0 ? (
            <Pagination meta={media.data.meta} onChangePage={setPage} />
          ) : null}
        </>
      )}

      <ConfirmDialog
        open={deleteId !== null && deleting !== null}
        title="Delete image"
        message={
          <>
            Delete <strong>{deleting?.filename}</strong>? Images still attached to projects or testimonials cannot be
            deleted — the backend will refuse it.
          </>
        }
        confirmLabel="Delete image"
        loading={remove.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId === null) return;
          remove.mutate(deleteId, {
            onSuccess: () => {
              toast.success("Image deleted.");
              setDeleteId(null);
            },
            onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete the image."),
          });
        }}
      />
    </>
  );
}
