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
  users: defineTable({
    role: v.union(v.literal('patient'), v.literal('doctor')),
    name: v.string(),
    language: v.optional(v.string()),
    contact: v.optional(v.string()),
  }).index('by_role', ['role']),
  doctors: defineTable({
    code: v.string(),
    name: v.string(),
    languages: v.array(v.string()),
    active: v.boolean(),
  }).index('by_active', ['active']),
  summaries: defineTable({
    sessionId: v.string(),
    text: v.string(),
    model: v.optional(v.string()),
    lang: v.optional(v.string()),
  }).index('by_sessionId', ['sessionId']),
  consents: defineTable({
    sessionId: v.string(),
    scope: v.string(),
    granted: v.boolean(),
    timestamp: v.number(),
  }).index('by_sessionId', ['sessionId']),
});
