import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import RealtimeEvent from '@/models/RealtimeEvent';

export const runtime = 'nodejs';

function encodeEvent(eventName: string, payload: unknown) {
  return `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: NextRequest) {
  await dbConnect();

  const sinceParam = request.nextUrl.searchParams.get('since');
  let since = sinceParam ? new Date(sinceParam) : new Date(Date.now() - 30_000);
  let closed = false;
  let heartbeatAt = Date.now();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const push = async () => {
        if (closed) return;

        const events = await RealtimeEvent.find({
          createdAt: { $gt: since },
        })
          .sort({ createdAt: 1 })
          .lean();

        for (const event of events) {
          since = new Date(event.createdAt as string | Date);
          controller.enqueue(
            encoder.encode(
              encodeEvent('sync', {
                entity: event.entity,
                action: event.action,
                resourceId: event.resourceId,
                details: event.details || {},
                createdAt: event.createdAt,
              })
            )
          );
        }

        if (Date.now() - heartbeatAt >= 15000) {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
          heartbeatAt = Date.now();
        }
      };

      const timer = setInterval(() => {
        void push();
      }, 2000);

      request.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          // Stream already closed.
        }
      });

      void push();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}