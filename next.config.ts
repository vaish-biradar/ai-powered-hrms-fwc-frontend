import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ["images.unsplash.com","www.fwc.co.in"],
  },
  env: {
    COSMOS_DB_ENDPOINT: process.env.COSMOS_DB_ENDPOINT,
    COSMOS_DB_KEY: process.env.COSMOS_DB_KEY,
    COSMOS_DB_NAME: process.env.COSMOS_DB_NAME,
    AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,
    AZURE_STORAGE_ACCOUNT_KEY: process.env.AZURE_STORAGE_ACCOUNT_KEY,
    AZURE_STORAGE_ACCOUNT_NAME: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  },
};

export default nextConfig;
