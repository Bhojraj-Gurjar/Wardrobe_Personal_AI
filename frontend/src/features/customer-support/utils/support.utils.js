import { resolveStorageOrigin } from '@/constants/api';

export function resolveAttachmentUrl(publicUrl) {
  if (!publicUrl) {
    return null;
  }

  if (publicUrl.startsWith('http://') || publicUrl.startsWith('https://')) {
    return publicUrl;
  }

  if (publicUrl.startsWith('/')) {
    return `${resolveStorageOrigin()}${publicUrl}`;
  }

  return publicUrl;
}

/** Build a chronological thread including the original ticket request + replies. */
export function buildSupportConversationThread(ticket, { showInternal = false } = {}) {
  if (!ticket) {
    return [];
  }

  const thread = [];

  if (ticket.description?.trim()) {
    thread.push({
      id: `opening-${ticket.id}`,
      body: ticket.description.trim(),
      authorType: 'USER',
      isInternal: false,
      isOpeningMessage: true,
      createdAt: ticket.createdAt,
      author: ticket.customer || { name: 'Customer' },
      attachments: ticket.attachments || [],
    });
  } else if (ticket.attachments?.length) {
    thread.push({
      id: `opening-${ticket.id}`,
      body: 'Initial attachment(s)',
      authorType: 'USER',
      isInternal: false,
      isOpeningMessage: true,
      createdAt: ticket.createdAt,
      author: ticket.customer || { name: 'Customer' },
      attachments: ticket.attachments || [],
    });
  }

  const replies = (ticket.messages || []).filter(
    (message) => showInternal || !message.isInternal,
  );

  return [...thread, ...replies].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );
}

export function collectDiagnostics() {
  if (typeof window === 'undefined') {
    return {};
  }

  const navigatorInfo = window.navigator;
  const userAgent = navigatorInfo.userAgent || '';

  return {
    browser_info: userAgent,
    device_info: /Mobi|Android/i.test(userAgent) ? 'Mobile' : 'Desktop',
    os_info: resolveOs(userAgent),
    app_version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    page_url: window.location.href,
  };
}

function resolveOs(userAgent) {
  if (/Windows/i.test(userAgent)) return 'Windows';
  if (/Mac OS/i.test(userAgent)) return 'macOS';
  if (/Android/i.test(userAgent)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Linux/i.test(userAgent)) return 'Linux';
  return 'Unknown';
}

export function formatSupportDate(value) {
  if (!value) return '—';

  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatResponseTime(ms) {
  if (!ms) return '—';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

export function buildTicketQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function isSupportTicketReplyDisabled(status) {
  return ['RESOLVED', 'CLOSED', 'CANCELLED'].includes(status);
}

export function resolveIsOwnSupportMessage(message, { currentUserId, viewerIsAdmin = false } = {}) {
  if (!message) {
    return false;
  }

  const authorId = message.author?.id;

  if (authorId && currentUserId) {
    return authorId === currentUserId;
  }

  if (viewerIsAdmin) {
    return message.authorType === 'ADMIN';
  }

  return message.authorType === 'USER';
}

export function getTicketLastMessagePreview(ticket) {
  if (!ticket) {
    return null;
  }

  if (ticket.lastMessagePreview?.trim()) {
    return ticket.lastMessagePreview.trim();
  }

  if (ticket.lastReply?.body?.trim()) {
    return ticket.lastReply.body.trim();
  }

  return null;
}
