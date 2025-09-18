import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const triageValidator = v.object({
  category: v.string(),
  urgency: v.union(
    v.literal('routine'),
    v.literal('urgent'),
    v.literal('emergency'),
  ),
  language: v.string(),
  symptoms: v.string(),
});

export default defineSchema({
  sessions: defineTable({
    sessionId: v.string(),
    status: v.union(
      v.literal('waiting'),
      v.literal('claimed'),
      v.literal('in_call'),
      v.literal('ended'),
    ),
    triage: triageValidator,
    claimedByDoctor: v.optional(v.string()),
  })
    .index('by_status', ['status'])
    .index('by_sessionId', ['sessionId']),
  notes: defineTable({
    sessionId: v.string(),
    body: v.string(),
  }).index('by_sessionId', ['sessionId']),
  messages: defineTable({
    sessionId: v.string(),
    sender: v.string(),
    text: v.string(),
  }).index('by_sessionId', ['sessionId']),
});
