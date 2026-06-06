import type { Response } from "express";

interface SSEClient {
  id: string;
  res: Response;
}

const clients = new Map<string, SSEClient>();
let _clientSeq = 0;

export function addSSEClient(res: Response): string {
  const id = `sse_${++_clientSeq}_${Date.now()}`;
  clients.set(id, { id, res });
  return id;
}

export function removeSSEClient(id: string): void {
  clients.delete(id);
}

export function broadcastSSE(event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients.values()) {
    try {
      client.res.write(payload);
    } catch {
      clients.delete(client.id);
    }
  }
}

export function getSSEClientCount(): number {
  return clients.size;
}
