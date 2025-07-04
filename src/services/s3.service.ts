import { UploadableFile } from "../types/upload.types";
import { getExtension } from "../utils";
import { s3 } from "../utils/s3.client";
import { PutObjectCommand } from "@aws-sdk/client-s3";

const { AWS_BUCKET_NAME, AWS_REGION } = process.env;

if (!AWS_BUCKET_NAME || !AWS_REGION) {
  throw new Error("AWS S3 Bucket Name is missing");
}

export const upload_avatar_to_s3 = async (
  file: UploadableFile,
  userId: string
) => {
  const filename = "AVATAR" + file.name.slice(file.name.lastIndexOf("."));

  const key = `users/${userId}/avatar/${filename}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.type,
    })
  );

  const url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;

  return {
    success: true,
    message: "File uploaded to S3",
    url,
  };
};

export const upload_corpuses_to_s3 = async (
  files: UploadableFile[],
  userId: string
) => {
  const uploaded = [];
  let i = 0;
  for (const file of files) {
    const ext = getExtension(file.name);
    const key = `users/${userId}/corpuses/CORPUS-${Date.now()}-${
      i + 1
    }${ext}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.type,
      })
    );

    const url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    uploaded.push({ url });
  }

  return {
    success: true,
    message: "corpuses files uploaded successfully",
    data: uploaded,
  };
};

export const upload_to_s3 = async (files: UploadableFile[], userId: string) => {
  const uploaded = [];
  let i = 0;
  for (const file of files) {
    const ext = getExtension(file.name);
    const key = `users/${userId}/attachments/ATTACHMENT-${Date.now()}-${
      i + 1
    }${ext}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.type,
      })
    );

    const url = `https://${AWS_BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${key}`;
    uploaded.push({ url });
  }

  return {
    success: true,
    message: "corpuses files uploaded successfully",
    data: uploaded,
  };
};
