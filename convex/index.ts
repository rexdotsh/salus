import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const enqueueSession = mutation({
  args: {
    sessionId: v.string(),
    triage: v.object({
      category: v.string(),
      urgency: v.union(
        v.literal('routine'),
        v.literal('urgent'),
        v.literal('emergency'),
      ),
      language: v.string(),
      symptoms: v.string(),
    }),
  },
  returns: v.id('sessions'),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert('sessions', {
      sessionId: args.sessionId,
      status: 'waiting',
      triage: args.triage,
    });
  },
});

export const listQueue = query({
  args: {
    urgency: v.optional(
      v.union(
        v.literal('routine'),
        v.literal('urgent'),
        v.literal('emergency'),
      ),
    ),
  },
  returns: v.array(
    v.object({
      _id: v.id('sessions'),
      sessionId: v.string(),
      status: v.string(),
      triage: v.object({
        category: v.string(),
        urgency: v.union(
          v.literal('routine'),
          v.literal('urgent'),
          v.literal('emergency'),
        ),
        language: v.string(),
        symptoms: v.string(),
      }),
    }),
  ),
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query('sessions')
      .withIndex('by_status', (q) => q.eq('status', 'waiting'))
      .collect();
    return items
      .filter((s) => (args.urgency ? s.triage.urgency === args.urgency : true))
      .map(({ _id, sessionId, status, triage }) => ({
        _id,
        sessionId,
        status,
        triage,
      }));
  },
});

export const claimSession = mutation({
  args: { sessionId: v.string(), doctorId: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const s = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .unique();
    if (!s) return false;
    await ctx.db.patch(s._id, {
      status: 'claimed',
      claimedByDoctor: args.doctorId,
    });
    return true;
  },
});

export const upsertNotes = mutation({
  args: { sessionId: v.string(), body: v.string() },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('notes')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { body: args.body });
      return true;
    }
    await ctx.db.insert('notes', {
      sessionId: args.sessionId,
      body: args.body,
    });
    return true;
  },
});

export const getNotes = query({
  args: { sessionId: v.string() },
  returns: v.union(v.object({ body: v.string() }), v.null()),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('notes')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .unique();
    if (!existing) return null;
    return { body: existing.body };
  },
});

export const listMessages = query({
  args: { sessionId: v.string() },
  returns: v.array(
    v.object({
      _id: v.id('messages'),
      sessionId: v.string(),
      sender: v.string(),
      text: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('messages')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .collect();
    return rows.map((m) => ({
      _id: m._id,
      sessionId: m.sessionId,
      sender: m.sender,
      text: m.text,
    }));
  },
});

export const sendMessage = mutation({
  args: { sessionId: v.string(), sender: v.string(), text: v.string() },
  returns: v.id('messages'),
  handler: async (ctx, args) => {
    return await ctx.db.insert('messages', {
      sessionId: args.sessionId,
      sender: args.sender,
      text: args.text,
    });
  },
});

export const getSession = query({
  args: { sessionId: v.string() },
  returns: v.union(
    v.object({
      sessionId: v.string(),
      status: v.string(),
      triage: v.object({
        category: v.string(),
        urgency: v.union(
          v.literal('routine'),
          v.literal('urgent'),
          v.literal('emergency'),
        ),
        language: v.string(),
        symptoms: v.string(),
      }),
      claimedByDoctor: v.optional(v.string()),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const s = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .unique();
    if (!s) return null;
    return {
      sessionId: s.sessionId,
      status: s.status,
      triage: s.triage,
      claimedByDoctor: s.claimedByDoctor,
    };
  },
});

export const setSessionStatus = mutation({
  args: {
    sessionId: v.string(),
    status: v.union(
      v.literal('waiting'),
      v.literal('claimed'),
      v.literal('in_call'),
      v.literal('ended'),
    ),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const s = await ctx.db
      .query('sessions')
      .withIndex('by_sessionId', (q) => q.eq('sessionId', args.sessionId))
      .unique();
    if (!s) return false;
    await ctx.db.patch(s._id, { status: args.status });
    return true;
  },
});
