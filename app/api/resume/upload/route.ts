import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

export const runtime = "nodejs";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new NextResponse(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers || {})
    }
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const MAX_BYTES = 10 * 1024 * 1024;
let didInstallPdfPolyfills = false;
const execFileAsync = promisify(execFile);

function isPdf(buffer: Buffer) {
  return buffer.subarray(0, 4).toString() === "%PDF";
}

function errorToMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function extractTextWithPdfToText(buffer: Buffer) {
  const dir = await mkdtemp(join(tmpdir(), "resume-upload-"));
  const inputPath = join(dir, "input.pdf");
  const outputPath = join(dir, "output.txt");
  try {
    await writeFile(inputPath, buffer);
    await execFileAsync("pdftotext", ["-layout", "-enc", "UTF-8", inputPath, outputPath]);
    const text = await readFile(outputPath, "utf8");
    return text.trim();
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function installPdfNodePolyfills() {
  if (didInstallPdfPolyfills) {
    return;
  }
  didInstallPdfPolyfills = true;

  const g = globalThis as Record<string, unknown>;

  if (!g.DOMMatrix) {
    class MinimalDOMMatrix {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;

      constructor(
        init?: string | ArrayLike<number> | { a?: number; b?: number; c?: number; d?: number; e?: number; f?: number }
      ) {
        if (!init) {
          return;
        }
        if (typeof init === "string") {
          const numbers = init.match(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi)?.map(Number) ?? [];
          if (numbers.length >= 6) {
            this.set(numbers[0], numbers[1], numbers[2], numbers[3], numbers[4], numbers[5]);
          }
          return;
        }
        if ("length" in init) {
          const values = Array.from(init as ArrayLike<number>);
          if (values.length >= 6) {
            this.set(values[0], values[1], values[2], values[3], values[4], values[5]);
          }
          return;
        }
        this.set(
          init.a ?? this.a,
          init.b ?? this.b,
          init.c ?? this.c,
          init.d ?? this.d,
          init.e ?? this.e,
          init.f ?? this.f
        );
      }

      private set(a: number, b: number, c: number, d: number, e: number, f: number) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.e = e;
        this.f = f;
      }

      private static to2DMatrix(value: unknown) {
        if (value instanceof MinimalDOMMatrix) {
          return value;
        }
        return new MinimalDOMMatrix(
          value as { a?: number; b?: number; c?: number; d?: number; e?: number; f?: number }
        );
      }

      private static mul(
        left: { a: number; b: number; c: number; d: number; e: number; f: number },
        right: { a: number; b: number; c: number; d: number; e: number; f: number }
      ) {
        return {
          a: left.a * right.a + left.c * right.b,
          b: left.b * right.a + left.d * right.b,
          c: left.a * right.c + left.c * right.d,
          d: left.b * right.c + left.d * right.d,
          e: left.a * right.e + left.c * right.f + left.e,
          f: left.b * right.e + left.d * right.f + left.f,
        };
      }

      multiplySelf(other: unknown) {
        const m = MinimalDOMMatrix.to2DMatrix(other);
        const next = MinimalDOMMatrix.mul(this, m);
        this.set(next.a, next.b, next.c, next.d, next.e, next.f);
        return this;
      }

      preMultiplySelf(other: unknown) {
        const m = MinimalDOMMatrix.to2DMatrix(other);
        const next = MinimalDOMMatrix.mul(m, this);
        this.set(next.a, next.b, next.c, next.d, next.e, next.f);
        return this;
      }

      multiply(other: unknown) {
        return new MinimalDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]).multiplySelf(other);
      }

      translateSelf(tx = 0, ty = 0) {
        return this.multiplySelf({ a: 1, b: 0, c: 0, d: 1, e: tx, f: ty });
      }

      translate(tx = 0, ty = 0) {
        return new MinimalDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]).translateSelf(tx, ty);
      }

      scaleSelf(scaleX = 1, scaleY = scaleX, _scaleZ = 1, originX = 0, originY = 0) {
        if (originX || originY) {
          this.translateSelf(originX, originY);
        }
        this.multiplySelf({ a: scaleX, b: 0, c: 0, d: scaleY, e: 0, f: 0 });
        if (originX || originY) {
          this.translateSelf(-originX, -originY);
        }
        return this;
      }

      scale(scaleX = 1, scaleY = scaleX) {
        return new MinimalDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]).scaleSelf(scaleX, scaleY);
      }

      rotateSelf(rotX = 0, _rotY = 0, rotZ = 0) {
        const angle = rotZ || rotX;
        const radians = (angle * Math.PI) / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        return this.multiplySelf({ a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 });
      }

      rotate(rotX = 0, rotY = 0, rotZ = 0) {
        return new MinimalDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]).rotateSelf(rotX, rotY, rotZ);
      }

      invertSelf() {
        const det = this.a * this.d - this.b * this.c;
        if (!det) {
          this.set(NaN, NaN, NaN, NaN, NaN, NaN);
          return this;
        }
        const a = this.d / det;
        const b = -this.b / det;
        const c = -this.c / det;
        const d = this.a / det;
        const e = (this.c * this.f - this.d * this.e) / det;
        const f = (this.b * this.e - this.a * this.f) / det;
        this.set(a, b, c, d, e, f);
        return this;
      }

      inverse() {
        return new MinimalDOMMatrix([this.a, this.b, this.c, this.d, this.e, this.f]).invertSelf();
      }

      transformPoint(point?: { x?: number; y?: number; z?: number; w?: number }) {
        const x = point?.x ?? 0;
        const y = point?.y ?? 0;
        return {
          x: this.a * x + this.c * y + this.e,
          y: this.b * x + this.d * y + this.f,
          z: point?.z ?? 0,
          w: point?.w ?? 1,
        };
      }

      get isIdentity() {
        return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
      }

      get is2D() {
        return true;
      }

      get m11() {
        return this.a;
      }
      set m11(value: number) {
        this.a = value;
      }
      get m12() {
        return this.b;
      }
      set m12(value: number) {
        this.b = value;
      }
      get m21() {
        return this.c;
      }
      set m21(value: number) {
        this.c = value;
      }
      get m22() {
        return this.d;
      }
      set m22(value: number) {
        this.d = value;
      }
      get m41() {
        return this.e;
      }
      set m41(value: number) {
        this.e = value;
      }
      get m42() {
        return this.f;
      }
      set m42(value: number) {
        this.f = value;
      }
    }

    g.DOMMatrix = MinimalDOMMatrix;
  }

  if (!g.ImageData) {
    class MinimalImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      colorSpace = "srgb";

      constructor(dataOrWidth: Uint8ClampedArray | number, widthOrHeight: number, height?: number) {
        if (typeof dataOrWidth === "number") {
          this.width = dataOrWidth;
          this.height = widthOrHeight;
          this.data = new Uint8ClampedArray(this.width * this.height * 4);
          return;
        }
        this.data = dataOrWidth;
        this.width = widthOrHeight;
        this.height = height ?? Math.floor(this.data.length / (this.width * 4));
      }
    }

    g.ImageData = MinimalImageData;
  }

  if (!g.Path2D) {
    class MinimalPath2D {
      constructor(_path?: string | MinimalPath2D) {}
      addPath(_path: MinimalPath2D, _transform?: unknown) {}
    }
    g.Path2D = MinimalPath2D;
  }
}

type ParsedFile = {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
};

function getMultipartBoundary(contentType: string) {
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return (match?.[1] || match?.[2] || "").trim();
}

function trimLeadingCrlf(buffer: Buffer) {
  let start = 0;
  while (start + 1 < buffer.length && buffer[start] === 13 && buffer[start + 1] === 10) {
    start += 2;
  }
  return buffer.subarray(start);
}

function trimTrailingCrlf(buffer: Buffer) {
  let end = buffer.length;
  while (end - 2 >= 0 && buffer[end - 2] === 13 && buffer[end - 1] === 10) {
    end -= 2;
  }
  return buffer.subarray(0, end);
}

function parseMultipartManually(body: Buffer, boundary: string) {
  const boundaryMarker = Buffer.from(`--${boundary}`);
  const headerSeparator = Buffer.from("\r\n\r\n");
  const fields = new Map<string, string>();
  const files = new Map<string, ParsedFile>();

  let cursor = 0;
  while (cursor < body.length) {
    const partStart = body.indexOf(boundaryMarker, cursor);
    if (partStart < 0) {
      break;
    }
    const afterBoundary = partStart + boundaryMarker.length;
    if (afterBoundary + 1 < body.length && body[afterBoundary] === 45 && body[afterBoundary + 1] === 45) {
      break;
    }
    const nextBoundary = body.indexOf(boundaryMarker, afterBoundary);
    if (nextBoundary < 0) {
      break;
    }

    let part = body.subarray(afterBoundary, nextBoundary);
    part = trimLeadingCrlf(trimTrailingCrlf(part));
    cursor = nextBoundary;

    const headerEnd = part.indexOf(headerSeparator);
    if (headerEnd < 0) {
      continue;
    }

    const rawHeaders = part.subarray(0, headerEnd).toString("utf8");
    const content = part.subarray(headerEnd + headerSeparator.length);
    const dispositionLine = rawHeaders
      .split("\r\n")
      .find((line) => line.toLowerCase().startsWith("content-disposition:"));
    if (!dispositionLine) {
      continue;
    }

    const nameMatch = dispositionLine.match(/name="([^"]+)"/i);
    if (!nameMatch) {
      continue;
    }
    const fieldName = nameMatch[1];
    const fileNameMatch = dispositionLine.match(/filename="([^"]*)"/i);
    const typeMatch = rawHeaders.match(/content-type:\s*([^\r\n;]+)/i);

    if (fileNameMatch) {
      files.set(fieldName, {
        name: fileNameMatch[1] || "upload.pdf",
        type: typeMatch?.[1] || "",
        size: content.length,
        buffer: content,
      });
      continue;
    }

    fields.set(fieldName, content.toString("utf8"));
  }

  return { fields, files };
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const ctLower = contentType.toLowerCase();
    if (!ctLower.startsWith("multipart/form-data")) {
      return jsonResponse(
        { error: "Content-Type must be multipart/form-data." },
        { status: 415 }
      );
    }
    const boundary = getMultipartBoundary(contentType);
    if (!boundary) {
      return jsonResponse(
        { error: "Malformed multipart request: missing boundary. Do not set Content-Type manually." },
        { status: 415 }
      );
    }

    const reqClone = req.clone();
    let file: File | ParsedFile | null = null;
    let jobDescription = "";

    try {
      const form = await req.formData();
      const formFile = form.get("file");
      file = formFile instanceof File ? formFile : null;
      jobDescription = form.get("jobDescription")?.toString().trim() ?? "";
    } catch {
      try {
        const body = Buffer.from(await reqClone.arrayBuffer());
        const parsed = parseMultipartManually(body, boundary);
        file = parsed.files.get("file") ?? null;
        jobDescription = parsed.fields.get("jobDescription")?.trim() ?? "";
      } catch {
        return jsonResponse(
          {
            error:
              "Failed to parse multipart/form-data. Use form-data with a file field named 'file' and let the client set the boundary."
          },
          { status: 400 }
        );
      }
    }

    if (!file) {
      return jsonResponse(
        { error: 'Missing file field "file".' },
        { status: 400 }
      );
    }

    const fileName = file instanceof File ? file.name : file.name;
    const fileType = file instanceof File ? file.type : file.type;
    const fileSize = file instanceof File ? file.size : file.size;

    if (typeof fileSize === "number" && fileSize > MAX_BYTES) {
      return jsonResponse(
        { error: `PDF too large. Max ${Math.round(MAX_BYTES / (1024 * 1024))}MB.` },
        { status: 413 }
      );
    }

    const buffer =
      file instanceof File ? Buffer.from(await file.arrayBuffer()) : file.buffer;

    const looksLikePdfByType =
      fileType.toLowerCase().includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
    if (!looksLikePdfByType && !isPdf(buffer)) {
      return jsonResponse(
        { error: "Only PDF uploads are allowed." },
        { status: 415 }
      );
    }

    if (!isPdf(buffer)) {
      return jsonResponse(
        { error: "Invalid PDF file." },
        { status: 400 }
      );
    }

    installPdfNodePolyfills();
    const pdfParseModule = await import("pdf-parse");
    const PDFParse = (pdfParseModule as { PDFParse: new (options: { data: Uint8Array }) => {
      getText: () => Promise<{ text?: string }>;
      destroy: () => Promise<void>;
    } }).PDFParse;

    let resumeText = "";
    let primaryParseError = "";
    try {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const parsed = await parser.getText();
        resumeText = (parsed.text ?? "").trim();
      } finally {
        await parser.destroy();
      }
    } catch (pdfError) {
      primaryParseError = errorToMessage(pdfError);
      console.error("PDF parse failed:", pdfError);
    }

    if (!resumeText) {
      try {
        resumeText = await extractTextWithPdfToText(buffer);
      } catch (fallbackError) {
        console.error("pdftotext fallback failed:", fallbackError);
        return jsonResponse(
          {
            error: "Unable to extract text from this PDF.",
            details: `pdf-parse: ${primaryParseError || "empty text"}; pdftotext: ${errorToMessage(fallbackError)}`
          },
          { status: 422 }
        );
      }
    }

    if (!resumeText) {
      return jsonResponse(
        { error: "PDF text is empty. Use a text-based PDF (not image-only/scanned)." },
        { status: 422 }
      );
    }

    const analyzeUrl = new URL("/api/resume/analyze", req.url).toString();
    const analyzeResponse = await fetch(analyzeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        jobDescription
      })
    });

    const analyzeBodyText = await analyzeResponse.text();
    let result: unknown;
    try {
      result = analyzeBodyText ? JSON.parse(analyzeBodyText) : {};
    } catch {
      return jsonResponse(
        {
          error: "Analyze service returned a non-JSON response.",
          details: analyzeBodyText.slice(0, 500)
        },
        { status: 502 }
      );
    }

    return jsonResponse(result, { status: analyzeResponse.status });
  } catch (error) {
    console.error("Upload failed:", error);
    const message = error instanceof Error ? error.message : "Unknown upload error.";
    return jsonResponse(
      {
        error: "Resume upload parsing failed.",
        details: message
      },
      { status: 500 }
    );
  }
}
