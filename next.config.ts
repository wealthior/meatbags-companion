import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "arweave.net",
      },
      {
        protocol: "https",
        hostname: "**.arweave.net",
      },
      {
        protocol: "https",
        hostname: "nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "**.nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "img-cdn.magiceden.dev",
      },
      {
        protocol: "https",
        hostname: "bafybeih*.ipfs.nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "**.ipfs.nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "gateway.pinit.io",
      },
      {
        protocol: "https",
        hostname: "shdw-drive.genesysgo.net",
      },
      {
        protocol: "https",
        hostname: "meatbags.nyc3.cdn.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "**.digitaloceanspaces.com",
      },
      {
        protocol: "https",
        hostname: "cdn.helius-rpc.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
