import { NextRequest, NextResponse } from "next/server";

export const config = {
  runtime: "edge", // This enables streaming & removes buffering
};

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleRequest(req, { params });
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleRequest(req, { params });
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleRequest(req, { params });
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return handleRequest(req, { params });
}



async function handleRequest(req: NextRequest, context: { params: { path?: string[] } }) {
  const { path } = context.params;

  if (!Array.isArray(path) || path.length === 0) {
    return NextResponse.json(
      { error: "Invalid request: Missing path parameters" },
      { status: 400 }
    );
  }

  const backendPath = path.join("/");
  const apiKey = process.env.SECRET_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing API key in environment variables" },
      { status: 500 }
    );
  }

  try {
    const backendBaseUrl = process.env.BACKEND_URL || 'https://fwc-backend-app-a0bzb9e9bahufacv.eastus-01.azurewebsites.net';
    const backendUrl = `${backendBaseUrl}/${backendPath}`;

    const headers = new Headers({
      "FWC-API-KEY": apiKey,
    });

    // Preserve Content-Type from the original request
    const contentType = req.headers.get("Content-Type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }

    // ✅ Preserve the original file stream
    let body: BodyInit | null = null;
    if (req.method !== "GET" && req.method !== "HEAD") {
      body = await req.blob(); // Preserve binary data integrity
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
      body,
    };


    const response = await fetch(backendUrl, fetchOptions);

    // ✅ Enable streaming only for 'analysis' routes
    const shouldStream = path.includes("analysis");

    if (shouldStream && response.body) {
      
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "text/plain; charset=utf-8");
      headers.set("Cache-Control", "no-cache, no-transform");
      headers.set("X-Accel-Buffering", "no"); // Ensures Azure doesn't buffer response
      headers.set("Transfer-Encoding", "chunked"); // Enable chunked transfer encoding for streaming
    
      return new NextResponse(response.body, {
        status: response.status,
        headers,
      });
    }
    else {
      const textResponse = await response.text();
      return new NextResponse(textResponse, {
        status: response.status,
        headers: response.headers,
      });
    }
  } catch (error) {
    console.error("API proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch from backend", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}




