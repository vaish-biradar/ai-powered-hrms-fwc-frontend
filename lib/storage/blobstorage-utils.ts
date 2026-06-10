import { BlobServiceClient, ContainerClient, StorageSharedKeyCredential, BlobSASPermissions, generateBlobSASQueryParameters } from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || "";
const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

/**
 * Get the Container Client
 */
const getContainerClient = (containerName: string): ContainerClient => {
  return blobServiceClient.getContainerClient(containerName);
};

/**
 * Upload a Blob to Azure Storage
 */
export async function uploadBlob(containerName: string, blobName: string, buffer: Buffer, mimeType: string) {
  try {
    const containerClient = getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(buffer, { blobHTTPHeaders: { blobContentType: mimeType } });

    return { message: "Blob uploaded successfully", url: blockBlobClient.url };
  } catch (error) {
    console.error("Error uploading blob:", error);
    return { error: "Failed to upload blob" };
  }
}

/**
 * Delete a Blob from Azure Storage
 */
export async function deleteBlob(containerName: string, blobName: string) {
  try {
    const containerClient = getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.delete();
    return { message: "Blob deleted successfully" };
  } catch (error) {
    console.error("Error deleting blob:", error);
    return { error: "Failed to delete blob" };
  }
}

/**
 * Get Blob URL (Without SAS Token)
 */
export function getBlobUrl(containerName: string, blobName: string): string {
  const containerClient = getContainerClient(containerName);
  return `${containerClient.url}/${blobName}`;
}

/**
 * Generate a SAS Token for Secure Access to a Blob
 */
export async function generateSasToken(
  containerName: string,
  blobName: string,
  expiresInHours: number = 1
) {
  try {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || "";
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY || "";

    if (!accountName || !accountKey) {
      throw new Error("Azure Storage account credentials are missing");
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
    const permissions = BlobSASPermissions.parse("r"); // Read access only

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + expiresInHours);

    // Infer content type based on extension (basic)
    const contentType = blobName.endsWith(".pdf")
      ? "application/pdf"
      : blobName.endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/octet-stream";

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions,
        expiresOn: expiryDate,
        contentDisposition: "inline",
        contentType, // this is crucial
      },
      sharedKeyCredential
    ).toString();

    const url = `${getBlobUrl(containerName, blobName)}?${sasToken}`;

    return { sasToken, url };
  } catch (error) {
    console.error("Error generating SAS token:", error);
    return { error: "Failed to generate SAS token" };
  }
}

/**
 * Download a Blob from Azure Storage
 */
export async function downloadBlob(containerName: string, blobName: string) {
  try {
    const containerClient = getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download();
    const downloadedBuffer = await streamToBuffer(downloadResponse.readableStreamBody!);

    return { buffer: downloadedBuffer, contentType: downloadResponse.contentType };
  } catch (error) {
    console.error("Error downloading blob:", error);
    return { error: "Failed to download blob" };
  }
}

/**
 * Convert Stream to Buffer (For Downloading Blobs)
 */
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    readableStream.on("end", () => resolve(Buffer.concat(chunks)));
    readableStream.on("error", reject);
  });
}
