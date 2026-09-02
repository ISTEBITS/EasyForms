// Real-time Collaboration Service for EasyForms
// Provides high-performance SSE stream, presence tracking, live active cursors, and data mutation broadcasts

const COLLABORATOR_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#14b8a6", // teal
];

// Map of formId -> Map<clientId, { clientId, userId, name, email, role, color, activeCell, res, lastSeen }>
const formRooms = new Map();

function hashStringToColor(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLLABORATOR_COLORS.length;
  return COLLABORATOR_COLORS[index];
}

export function registerCollaboratorStream(formId, clientInfo, res) {
  if (!formRooms.has(formId)) {
    formRooms.set(formId, new Map());
  }

  const room = formRooms.get(formId);
  const color = hashStringToColor(clientInfo.email || clientInfo.userId || String(Date.now()));

  const collaborator = {
    clientId: clientInfo.clientId,
    userId: clientInfo.userId,
    name: clientInfo.name || clientInfo.email?.split("@")[0] || "Collaborator",
    email: clientInfo.email,
    role: clientInfo.role || "viewer",
    color,
    activeCell: null,
    res,
    lastSeen: Date.now(),
  };

  room.set(clientInfo.clientId, collaborator);

  // Broadcast presence update to everyone in room
  broadcastPresence(formId);

  // Setup client disconnect handler
  res.on("close", () => {
    unregisterCollaboratorStream(formId, clientInfo.clientId);
  });
}

export function unregisterCollaboratorStream(formId, clientId) {
  const room = formRooms.get(formId);
  if (!room) return;

  room.delete(clientId);
  if (room.size === 0) {
    formRooms.delete(formId);
  } else {
    broadcastPresence(formId);
  }
}

export function updateCollaboratorPresence(formId, clientId, activeCell) {
  const room = formRooms.get(formId);
  if (!room) return;

  const collaborator = room.get(clientId);
  if (collaborator) {
    collaborator.activeCell = activeCell;
    collaborator.lastSeen = Date.now();
    broadcastPresence(formId);
  }
}

export function broadcastPresence(formId) {
  const room = formRooms.get(formId);
  if (!room) return;

  // Deduplicate collaborators by user identity (email or userId)
  // so each user has exactly 1 avatar in the header avatar stack
  const userMap = new Map();

  for (const c of room.values()) {
    const userKey = (c.email || c.userId || c.clientId).toLowerCase();
    const existing = userMap.get(userKey);

    if (!existing) {
      userMap.set(userKey, {
        clientId: c.clientId,
        userId: c.userId,
        name: c.name,
        email: c.email,
        role: c.role,
        color: c.color,
        activeCell: c.activeCell,
        lastSeen: c.lastSeen,
      });
    } else {
      // Prioritize the tab that currently has an active cell focus
      if (c.activeCell) {
        existing.activeCell = c.activeCell;
        existing.clientId = c.clientId;
      }
      if (c.lastSeen > (existing.lastSeen || 0)) {
        existing.lastSeen = c.lastSeen;
      }
    }
  }

  const collaborators = Array.from(userMap.values()).map((u) => ({
    clientId: u.clientId,
    userId: u.userId,
    name: u.name,
    email: u.email,
    role: u.role,
    color: u.color,
    activeCell: u.activeCell,
  }));

  const payload = JSON.stringify({ type: "presence_update", collaborators });

  for (const client of room.values()) {
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      // client connection closed
    }
  }
}

export function broadcastFormEvent(formId, eventType, data, excludeClientId = null) {
  const room = formRooms.get(formId);
  if (!room) return;

  const payload = JSON.stringify({ type: eventType, data, timestamp: Date.now() });

  for (const [clientId, client] of room.entries()) {
    if (excludeClientId && clientId === excludeClientId) continue;
    try {
      client.res.write(`data: ${payload}\n\n`);
    } catch {
      // client connection closed
    }
  }
}
