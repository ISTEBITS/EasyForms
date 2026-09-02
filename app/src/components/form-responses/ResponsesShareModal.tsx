import React, { useState } from "react";
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Lock,
  UserPlus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Form, CollaboratorRole } from "@/types/form";

interface ResponsesShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: Form;
  onAddCollaborator: (email: string, role: CollaboratorRole) => Promise<void>;
  onRemoveCollaborator: (collaboratorId: string) => Promise<void>;
  onUpdateShareSettings: (isPublic: boolean, permission: "viewer" | "editor") => Promise<void>;
}

export const ResponsesShareModal: React.FC<ResponsesShareModalProps> = ({
  isOpen,
  onClose,
  form,
  onAddCollaborator,
  onRemoveCollaborator,
  onUpdateShareSettings,
}) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareSettings = form.shareSettings || {
    isPublicShareEnabled: false,
    shareToken: null,
    publicPermission: "viewer" as const,
  };

  const shareableUrl = shareSettings.shareToken
    ? `${window.location.origin}/shared-responses/${shareSettings.shareToken}`
    : `${window.location.origin}/forms/${form.id}/responses`;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      setIsSubmitting(true);
      await onAddCollaborator(inviteEmail.trim(), inviteRole);
      setInviteEmail("");
    } catch {
      // handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      toast.success("Responses link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleTogglePublic = async (checked: boolean) => {
    await onUpdateShareSettings(checked, shareSettings.publicPermission || "viewer");
  };

  const handleChangePublicPermission = async (permission: "viewer" | "editor") => {
    await onUpdateShareSettings(shareSettings.isPublicShareEnabled, permission);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-md border border-border bg-background shadow-xl p-5 space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent-1 border border-border text-foreground">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground font-sans">
                Share Responses Sheet
              </h2>
              <p className="text-sm text-accent-5 truncate max-w-xs">{form.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-sm text-accent-5 hover:bg-accent-1 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="space-y-2">
          <label className="block text-sm font-sans uppercase text-accent-5 font-medium">
            Add Collaborator
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="flex-1 rounded-sm border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-accent-4 focus:outline-none focus:ring-1 focus:ring-foreground"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as CollaboratorRole)}
              className="rounded-sm border border-border bg-background px-2.5 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-foreground cursor-pointer"
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <Button
              type="submit"
              size="xs"
              disabled={isSubmitting || !inviteEmail.trim()}
              className="rounded-sm h-8 px-3 gap-1 bg-foreground text-background hover:bg-accent-7"
            >
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              <span>Invite</span>
            </Button>
          </div>
        </form>

        {/* Active Collaborators List */}
        <div className="space-y-2.5">
          <label className="block text-sm font-sans uppercase text-accent-5 font-medium">
            People with access
          </label>

          <div className="space-y-2 max-h-40 overflow-y-auto rounded-sm border border-border/80 bg-accent-1/20 p-2">
            {/* Owner */}
            <div className="flex items-center justify-between p-1.5 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-xs bg-foreground text-background font-sans text-[10px] font-semibold">
                  O
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {form.owner?.email || form.owner?.adminUsername || "Owner"}
                  </p>
                  <p className="text-[10px] text-accent-5">Form Creator</p>
                </div>
              </div>
              <span className="rounded-xs bg-accent-2 px-2 py-0.5 text-[10px] font-sans font-medium text-foreground">
                Owner
              </span>
            </div>

            {/* Collaborators */}
            {form.collaborators?.map((c) => (
              <div
                key={c._id || c.email}
                className="flex items-center justify-between p-1.5 text-sm rounded-xs hover:bg-accent-1/60"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs bg-accent-2 text-foreground font-sans text-[10px]">
                    {c.email.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium text-foreground truncate">{c.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-xs bg-accent-2 px-2 py-0.5 text-[10px] font-sans capitalize text-accent-6">
                    {c.role}
                  </span>
                  <button
                    onClick={() => void onRemoveCollaborator(c._id || c.email)}
                    className="text-accent-4 hover:text-red-500 p-1 transition-colors cursor-pointer"
                    title="Remove access"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* General Access / Shareable Link */}
        <div className="space-y-3 pt-2 border-t border-border">
          <label className="block text-sm font-sans uppercase text-accent-5 font-medium">
            General Access
          </label>

          <div className="rounded-sm border border-border bg-accent-1/30 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-accent-2 text-foreground">
                {shareSettings.isPublicShareEnabled ? (
                  <Globe className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Lock className="h-4 w-4 text-accent-5" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {shareSettings.isPublicShareEnabled
                    ? "Anyone with the link"
                    : "Restricted Access"}
                </p>
                <p className="text-[10px] text-accent-5">
                  {shareSettings.isPublicShareEnabled
                    ? `Anyone who has this link can ${shareSettings.publicPermission || "view"}`
                    : "Only invited people can access responses"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                type="checkbox"
                checked={shareSettings.isPublicShareEnabled}
                onChange={(e) => void handleTogglePublic(e.target.checked)}
                className="h-4 w-4 rounded-xs border-border text-foreground accent-foreground cursor-pointer"
              />
              {shareSettings.isPublicShareEnabled && (
                <select
                  value={shareSettings.publicPermission || "viewer"}
                  onChange={(e) => void handleChangePublicPermission(e.target.value as "viewer" | "editor")}
                  className="rounded-sm border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
              )}
            </div>
          </div>

          {/* Copy Link Button */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="rounded-sm gap-1.5 text-sm font-sans h-8"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Link Copied" : "Copy Responses Link"}</span>
            </Button>

            <Button
              size="sm"
              onClick={onClose}
              className="rounded-sm text-sm font-sans h-8 bg-foreground text-background hover:bg-accent-7"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
