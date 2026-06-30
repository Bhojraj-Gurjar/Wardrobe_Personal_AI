import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from '../../../database/redis.service';
import { PrismaService } from '../../../database/prisma.service';
import { STYLIST_MAX_HISTORY, STYLIST_SESSION_TTL_SECONDS } from '../constants/stylist.constants';

const SESSION_PREFIX = 'stylist:session:';
const USER_SESSIONS_PREFIX = 'stylist:user:sessions:';

export @Injectable()
class StylistRepository {
  constructor(
    @Inject(RedisService) redisService,
    @Inject(PrismaService) prismaService,
  ) {
    this.redis = redisService;
    this.prisma = prismaService;
  }

  sessionKey(sessionId) {
    return `${SESSION_PREFIX}${sessionId}`;
  }

  userSessionsKey(userId) {
    return `${USER_SESSIONS_PREFIX}${userId}`;
  }

  async createSession(userId, title = 'New styling chat') {
    const session = {
      id: randomUUID(),
      user_id: userId,
      title,
      messages: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.persistSession(session);
    await this.redis.lpush(this.userSessionsKey(userId), session.id);
    await this.redis.ltrim(this.userSessionsKey(userId), 0, 49);
    await this.persistSessionToDb(session);

    return session;
  }

  async getSession(userId, sessionId) {
    const raw = await this.redis.get(this.sessionKey(sessionId));
    if (!raw) {
      return this.loadSessionFromDb(userId, sessionId);
    }

    const session = JSON.parse(raw);
    if (session.user_id !== userId) {
      return null;
    }

    return session;
  }

  async listSessions(userId) {
    const ids = await this.redis.lrange(this.userSessionsKey(userId), 0, 19);
    const sessions = [];

    for (const id of ids) {
      const session = await this.getSession(userId, id);
      if (session) {
        sessions.push({
          id: session.id,
          title: session.title,
          message_count: session.messages?.length || 0,
          updated_at: session.updated_at,
          created_at: session.created_at,
        });
      }
    }

    return sessions;
  }

  async appendMessage(session, message) {
    const next = {
      ...session,
      messages: [...(session.messages || []), message].slice(-STYLIST_MAX_HISTORY),
      updated_at: new Date().toISOString(),
    };

    if (
      message.role === 'user'
      && next.title === 'New styling chat'
      && message.content
    ) {
      next.title = `${message.content}`.slice(0, 60);
    }

    await this.persistSession(next);
    await this.persistMessageToDb(next.id, message);

    return next;
  }

  async deleteSession(userId, sessionId) {
    const session = await this.getSession(userId, sessionId);
    if (!session) {
      return false;
    }

    await this.redis.del(this.sessionKey(sessionId));
    await this.redis.lrem(this.userSessionsKey(userId), 0, sessionId);

    try {
      await this.prisma.$executeRaw`
        DELETE FROM stylist_chat_sessions WHERE id = ${sessionId} AND user_id = ${userId}
      `;
    } catch {
      // Table may not exist yet
    }

    return true;
  }

  async persistSession(session) {
    await this.redis.setex(
      this.sessionKey(session.id),
      STYLIST_SESSION_TTL_SECONDS,
      JSON.stringify(session),
    );
  }

  async persistSessionToDb(session) {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO stylist_chat_sessions (id, user_id, title, created_at, updated_at)
        VALUES (${session.id}, ${session.user_id}, ${session.title}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, updated_at = NOW()
      `;
    } catch {
      // Optional migration
    }
  }

  async persistMessageToDb(sessionId, message) {
    try {
      await this.prisma.$executeRaw`
        INSERT INTO stylist_chat_messages (id, session_id, role, content, metadata, created_at)
        VALUES (
          ${message.id},
          ${sessionId},
          ${message.role},
          ${message.content},
          ${JSON.stringify(message.metadata || {})}::jsonb,
          NOW()
        )
      `;
    } catch {
      // Optional migration
    }
  }

  async loadSessionFromDb(userId, sessionId) {
    try {
      const rows = await this.prisma.$queryRaw`
        SELECT id, user_id, title, created_at, updated_at
        FROM stylist_chat_sessions
        WHERE id = ${sessionId} AND user_id = ${userId}
        LIMIT 1
      `;

      if (!rows?.length) {
        return null;
      }

      const row = rows[0];
      const messages = await this.prisma.$queryRaw`
        SELECT id, role, content, metadata, created_at
        FROM stylist_chat_messages
        WHERE session_id = ${sessionId}
        ORDER BY created_at ASC
        LIMIT ${STYLIST_MAX_HISTORY}
      `;

      const session = {
        id: row.id,
        user_id: row.user_id,
        title: row.title || 'New styling chat',
        created_at: row.created_at,
        updated_at: row.updated_at,
        messages: (messages || []).map((entry) => ({
          id: entry.id,
          role: entry.role,
          content: entry.content,
          metadata: entry.metadata || {},
          created_at: entry.created_at,
        })),
      };

      await this.persistSession(session);
      return session;
    } catch {
      return null;
    }
  }
}
