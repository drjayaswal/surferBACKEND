import { t } from "elysia";

export const UploadAvatarBody = t.Object({
  file: t.File(),
});
export const UploadCorpusBody = t.Object({
  files: t.Array(t.File()),
});
export const UploadNoteBody = t.Object({
  content: t.String(),
});
export const RenameBody = t.Object({
  currentPublicId: t.String(),
  newFolder: t.String(),
  newFilename: t.Optional(t.String()),
});

export const UploadDirectory = t.Object({
  folder: t.String(),
  filename: t.String(),
});
