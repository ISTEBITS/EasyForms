import { useEffect, useState, useRef, useCallback } from "react";
import { API_BASE_URL } from "@/api/client";
import type { CollaboratorPresence, FormResponse, ResponseStatus, Form } from "@/types/form";

interface UseFormCollaborationOptions {
  formId?: string;
  onResponseUpdated?: (response: FormResponse) => void;
  onResponseCreated?: (response: FormResponse) => void;
  onResponseDeleted?: (responseId: string) => void;
  onBulkResponsesDeleted?: (responseIds: string[]) => void;
  onBulkStatusUpdated?: (responseIds: string[], status: ResponseStatus) => void;
  onFormUpdated?: (form: Form) => void;
}

function getClientId(): string {
  // Generate a tab-unique client ID so multiple tabs can collaborate in real time
  let id = sessionStorage.getItem("easyforms_collab_tab_client_id");
  if (!id) {
    id = `tab_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
    sessionStorage.setItem("easyforms_collab_tab_client_id", id);
  }
  return id;
}

export function useFormCollaboration({
  formId,
  onResponseUpdated,
  onResponseCreated,
  onResponseDeleted,
  onBulkResponsesDeleted,
  onBulkStatusUpdated,
  onFormUpdated,
}: UseFormCollaborationOptions) {
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CollaboratorPresence>>({});
  const [isConnected, setIsConnected] = useState(false);
  const clientIdRef = useRef(getClientId());
  const clientId = clientIdRef.current;

  // Stable callback refs to avoid reconnecting SSE on handler changes
  const callbacksRef = useRef({
    onResponseUpdated,
    onResponseCreated,
    onResponseDeleted,
    onBulkResponsesDeleted,
    onBulkStatusUpdated,
    onFormUpdated,
  });

  useEffect(() => {
    callbacksRef.current = {
      onResponseUpdated,
      onResponseCreated,
      onResponseDeleted,
      onBulkResponsesDeleted,
      onBulkStatusUpdated,
      onFormUpdated,
    };
  });

  useEffect(() => {
    if (!formId) return;

    let eventSource: EventSource | null = null;
    let isSubscribed = true;

    try {
      const streamUrl = `${API_BASE_URL}/forms/${formId}/collaboration-stream?clientId=${encodeURIComponent(clientId)}`;
      eventSource = new EventSource(streamUrl, { withCredentials: true });

      eventSource.onopen = () => {
        if (isSubscribed) setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        if (!isSubscribed || !event.data) return;

        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case "presence_update": {
              const allCollabs: CollaboratorPresence[] = message.collaborators || [];
              setCollaborators(allCollabs);

              // Map remote active cursors (exclude current client)
              const cursors: Record<string, CollaboratorPresence> = {};
              for (const collab of allCollabs) {
                if (collab.clientId !== clientId && collab.activeCell) {
                  const { rowKey, rowIndex, colIndex, questionId } = collab.activeCell;
                  if (rowKey !== undefined && colIndex !== undefined) {
                    cursors[`${rowKey}_${colIndex}`] = collab;
                  }
                  if (rowIndex !== undefined && colIndex !== undefined) {
                    cursors[`${rowIndex}_${colIndex}`] = collab;
                  }
                  if (rowKey !== undefined && questionId !== undefined) {
                    cursors[`${rowKey}_${questionId}`] = collab;
                  }
                }
              }
              setRemoteCursors(cursors);
              break;
            }

            case "response_updated":
              if (message.data) callbacksRef.current.onResponseUpdated?.(message.data);
              break;

            case "response_created":
              if (message.data) callbacksRef.current.onResponseCreated?.(message.data);
              break;

            case "response_deleted":
              if (message.data?.responseId) callbacksRef.current.onResponseDeleted?.(message.data.responseId);
              break;

            case "responses_bulk_deleted":
              if (message.data?.responseIds) callbacksRef.current.onBulkResponsesDeleted?.(message.data.responseIds);
              break;

            case "responses_status_updated":
              if (message.data?.responseIds && message.data?.status) {
                callbacksRef.current.onBulkStatusUpdated?.(message.data.responseIds, message.data.status);
              }
              break;

            case "form_updated":
              if (message.data) callbacksRef.current.onFormUpdated?.(message.data);
              break;
          }
        } catch {
          // Ignore invalid JSON payloads or heartbeats
        }
      };

      eventSource.onerror = () => {
        if (isSubscribed) setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      isSubscribed = false;
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [formId, clientId]);

  // Broadcast active cell focus / blur
  const updatePresence = useCallback(
    async (
      activeCell: {
        rowKey: string;
        rowIndex: number;
        colIndex: number;
        questionId?: string;
      } | null
    ) => {
      if (!formId) return;
      try {
        await fetch(`${API_BASE_URL}/forms/${formId}/presence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            clientId,
            activeCell,
          }),
        });
      } catch {
        // Silently fail network drop
      }
    },
    [formId, clientId]
  );

  return {
    collaborators,
    remoteCursors,
    isConnected,
    clientId,
    updatePresence,
  };
}
