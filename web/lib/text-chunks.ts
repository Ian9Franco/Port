const MAX_BYTES = 420;
const MAX_CHUNKS = 8;

export function utf8Bytes(value: string): number {
  return new TextEncoder().encode(value).length;
}

function sliceByBytes(value: string, maxBytes: number): string {
  let out = "";
  let bytes = 0;
  for (const char of value) {
    const size = utf8Bytes(char);
    if (bytes + size > maxBytes) break;
    out += char;
    bytes += size;
  }
  return out;
}

/**
 * MyMemory's free endpoint rejects queries over ~500 bytes.
 * The cap keeps one job view inside a small anonymous quota.
 */
export function chunkForTranslation(
  text: string,
  maxBytes = MAX_BYTES,
  maxChunks = MAX_CHUNKS
): { chunks: string[]; truncated: boolean } {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  let index = 0;

  const pushCurrent = () => {
    if (!current) return false;
    if (chunks.length >= maxChunks) return true;
    chunks.push(current);
    current = "";
    return false;
  };

  while (index < words.length) {
    const word = words[index];
    if (!word) {
      index += 1;
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (utf8Bytes(candidate) <= maxBytes) {
      current = candidate;
      index += 1;
      continue;
    }
    if (pushCurrent()) return { chunks, truncated: true };
    if (utf8Bytes(word) <= maxBytes) {
      current = word;
      index += 1;
      continue;
    }
    let rest = word;
    let consumed = false;
    while (rest) {
      if (chunks.length >= maxChunks) return { chunks, truncated: true };
      const slice = sliceByBytes(rest, maxBytes);
      if (!slice) break;
      if (slice.length === rest.length) {
        current = slice;
        consumed = true;
        break;
      }
      chunks.push(slice);
      rest = rest.slice(slice.length);
    }
    if (!consumed && rest) return { chunks, truncated: true };
    index += 1;
  }

  if (current) {
    if (chunks.length >= maxChunks) return { chunks, truncated: true };
    chunks.push(current);
  }
  return { chunks, truncated: false };
}
