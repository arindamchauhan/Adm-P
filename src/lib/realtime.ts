import dbConnect from "@/lib/db";
import RealtimeEvent, { RealtimeEntity } from "@/models/RealtimeEvent";

export interface RealtimeEventInput {
  entity: RealtimeEntity;
  action: string;
  resourceId?: string;
  details?: Record<string, unknown>;
}

export async function recordRealtimeEvent(input: RealtimeEventInput) {
  await dbConnect();
  return RealtimeEvent.create({
    entity: input.entity,
    action: input.action,
    resourceId: input.resourceId,
    details: input.details || {},
  });
}