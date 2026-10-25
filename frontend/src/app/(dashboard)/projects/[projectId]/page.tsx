"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  Check,
  Copy,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Skeleton,
} from "@/src/components/ui";
import { WORKSPACE_STAGES } from "@/src/lib/stages";
import {
  deleteProject,
  fetchProjectActivities,
  fetchProjectById,
  generateInviteLink,
  removeMember,
  updateMemberRole,
  updateProject,
} from "@/src/store/slices/projectSlice";
import type { AppDispatch, RootState } from "@/src/store/store";

type MemberRole = "EDITOR" | "VIEWER";

const ROLE_LABEL: Record<MemberRole, string> = {
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const relativeTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
};

const humanizeAction = (action: string) => {
  const text = action.toLowerCase().replace(/_/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const project = useSelector(
    (state: RootState) => state.project.currentProject,
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const activities = useSelector(
    (state: RootState) => state.project.activities,
  );
  const fetchActivities = useSelector(
    (state: RootState) => state.project.fetchActivities,
  );
  const inviteLink = useSelector(
    (state: RootState) => state.project.inviteLink,
  );
  const inviteLinkState = useSelector(
    (state: RootState) => state.project.inviteLinkState,
  );
  const removeState = useSelector((state: RootState) => state.project.remove);

  const [name, setName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchProjectActivities(projectId));
    }
  }, [dispatch, projectId]);

  useEffect(() => {
    if (project?.name) setName(project.name);
  }, [project?.name]);

  if (!project) {
    return (
      <div className="mx-auto w-full max-w-[1200px] space-y-6 px-5 py-6 sm:px-8">
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  const members = project.members ?? [];
  const myMembership = members.find((member) => member.user_id === user?.id);
  const isOwner = Boolean(user?.id && project.owner_id === user.id);
  const canEdit =
    isOwner || myMembership?.role === "EDITOR";
  const sections = project.sections ?? [];
  const approvedStages = Math.min(project.approvedStages ?? 0, 4);
  const nextStage =
    WORKSPACE_STAGES.find((stage) => !sections.includes(stage.type)) ??
    WORKSPACE_STAGES[0]!;
  const owner = project.owner;

  const saveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 3 || trimmed.length > 50) {
      setError("Project name must be between 3 and 50 characters.");
      return;
    }

    setSavingName(true);
    setError(null);

    try {
      await dispatch(updateProject({ projectId, name: trimmed })).unwrap();
      await dispatch(fetchProjectById(projectId)).unwrap();
      setEditingName(false);
    } catch (err) {
      setError(
        typeof err === "string" ? err : "Could not update the project name.",
      );
    } finally {
      setSavingName(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: MemberRole) => {
    setError(null);
    try {
      await dispatch(
        updateMemberRole({ projectId, memberId, role }),
      ).unwrap();
      await dispatch(fetchProjectById(projectId)).unwrap();
    } catch (err) {
      setError(
        typeof err === "string" ? err : "Could not update the member role.",
      );
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!window.confirm("Remove this member from the project?")) return;
    setError(null);
    try {
      await dispatch(removeMember({ projectId, memberId: userId })).unwrap();
      await dispatch(fetchProjectById(projectId)).unwrap();
    } catch (err) {
      setError(
        typeof err === "string" ? err : "Could not remove the member.",
      );
    }
  };

  const handleGenerateInvite = async () => {
    setError(null);
    try {
      await dispatch(generateInviteLink(projectId)).unwrap();
    } catch (err) {
      setError(
        typeof err === "string" ? err : "Could not generate an invite link.",
      );
    }
  };

  const copyInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the invite link.");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Delete this project and all of its sections? This cannot be undone.",
      )
    ) {
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      await dispatch(deleteProject(projectId)).unwrap();
      router.push("/projects");
    } catch (err) {
      setError(
        typeof err === "string" ? err : "Could not delete the project.",
      );
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">
            Project / Settings
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-tight text-ink">
            {project.name}
          </h1>
          <p className="mt-1 text-[13px] text-ink-muted">
            Manage details, members and the blueprint.
          </p>
        </div>

        <Button
          rightIcon={<ArrowRight size={15} />}
          onClick={() =>
            router.push(`/projects/${projectId}/${nextStage.path}`)
          }
        >
          Open blueprint
        </Button>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-[12px] text-danger"
        >
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-semibold text-ink">
                  Project details
                </h2>
                <span className="font-mono text-[11px] text-ink-muted">
                  01 / SETTINGS
                </span>
              </div>

              <div className="mt-4 space-y-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                    Name
                  </p>
                  {editingName ? (
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        maxLength={50}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          loading={savingName}
                          onClick={() => void saveName()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setName(project.name);
                            setEditingName(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-[16px] font-medium text-ink">
                        {project.name}
                      </p>
                      {canEdit ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          leftIcon={<Pencil size={13} />}
                          onClick={() => setEditingName(true)}
                        >
                          Edit
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                      Owner
                    </p>
                    <p className="mt-1 text-[13px] text-ink">
                      {owner?.name || owner?.email || "—"}
                      {owner?.id === user?.id ? " (you)" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                      Created
                    </p>
                    <p className="mt-1 text-[13px] text-ink">
                      {formatDate(project.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                      Stages approved
                    </p>
                    <p className="mt-1 text-[13px] text-ink">
                      {approvedStages}/4
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                      Visibility
                    </p>
                    <div className="mt-1">
                      <Badge tone="neutral">Private project</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-ink">
                    Members
                  </h2>
                  <Badge tone="neutral">{members.length + 1}</Badge>
                </div>
                {isOwner ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<UserPlus size={14} />}
                    loading={inviteLinkState.loading}
                    onClick={() => void handleGenerateInvite()}
                  >
                    Invite
                  </Button>
                ) : null}
              </div>

              <div className="mt-3 divide-y divide-line">
                <div className="flex items-center gap-3 py-3">
                  <Avatar
                    src={owner?.avatarUrl}
                    name={owner?.name || owner?.email}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {owner?.name || owner?.email || "Owner"}
                      {owner?.id === user?.id ? " (you)" : ""}
                    </p>
                    <p className="truncate text-[11px] text-ink-muted">
                      {owner?.email}
                    </p>
                  </div>
                  <Badge tone="brand">Owner</Badge>
                </div>

                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-wrap items-center gap-3 py-3"
                  >
                    <Avatar
                      src={
                        typeof member.user?.avatarUrl === "string"
                          ? member.user.avatarUrl
                          : ""
                      }
                      name={member.user?.name || member.user?.email}
                      size="md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {member.user?.name || member.user?.email || "Member"}
                        {member.user_id === user?.id ? " (you)" : ""}
                      </p>
                      <p className="truncate text-[11px] text-ink-muted">
                        {member.user?.email}
                      </p>
                    </div>

                    {isOwner ? (
                      <>
                        <select
                          value={member.role ?? "VIEWER"}
                          onChange={(event) =>
                            void handleRoleChange(
                              member.id,
                              event.target.value as MemberRole,
                            )
                          }
                          className="h-8 rounded-md border border-line bg-surface px-2 text-[11px] text-ink outline-none focus:border-brand"
                        >
                          <option value="EDITOR">Editor</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            void handleRemoveMember(member.user_id)
                          }
                          aria-label="Remove member"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </>
                    ) : (
                      <Badge tone="neutral">
                        {ROLE_LABEL[(member.role ?? "VIEWER") as MemberRole]}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              {inviteLink && isOwner ? (
                <div className="mt-4 rounded-lg bg-canvas p-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted">
                    Invite link
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Input
                      readOnly
                      value={inviteLink}
                      className="font-mono text-[11px]"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => void copyInvite()}
                      aria-label="Copy invite link"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                  </div>
                  <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
                    Anyone with this link joins as a Viewer. The link expires
                    in 7 days.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-semibold text-ink">
                  Activity
                </h2>
                <span className="font-mono text-[11px] text-ink-muted">
                  {activities.length}
                </span>
              </div>

              {fetchActivities.loading ? (
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : activities.length === 0 ? (
                <p className="mt-3 text-[12px] text-ink-muted">
                  No activity yet.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {activities.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] text-ink">
                          {humanizeAction(activity.action)}
                          {activity.details ? ` — ${activity.details}` : ""}
                        </p>
                        <p className="mt-0.5 text-[10px] text-ink-muted">
                          {activity.user?.name ||
                            activity.user?.email ||
                            "System"}{" "}
                          · {relativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[14px] font-semibold text-ink">
                  Blueprint
                </h2>
                <span className="font-mono text-[11px] text-ink-muted">
                  {approvedStages}/4
                </span>
              </div>

              <div className="mt-3 flex gap-1">
                {[0, 1, 2, 3].map((segment) => (
                  <span
                    key={segment}
                    className={
                      segment < approvedStages
                        ? "h-1 flex-1 rounded-xs bg-brand"
                        : "h-1 flex-1 rounded-xs bg-surface-muted"
                    }
                  />
                ))}
              </div>

              <div className="mt-4 space-y-1">
                {WORKSPACE_STAGES.map((stage) => {
                  const approved = sections.includes(stage.type);
                  return (
                    <Link
                      key={stage.id}
                      href={`/projects/${projectId}/${stage.path}`}
                      className="flex items-center justify-between gap-2 rounded-md px-2 py-2 transition-colors hover:bg-surface-muted"
                    >
                      <span className="flex items-center gap-2 text-[12px] text-ink">
                        <span className="font-mono text-[10px] text-ink-muted">
                          {stage.number}
                        </span>
                        {stage.label}
                      </span>
                      <Badge tone={approved ? "brand" : "neutral"}>
                        {approved ? "Approved" : "Draft"}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-[14px] font-semibold text-ink">
                Danger zone
              </h2>
              <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
                Deleting this project removes every section, membership and
                invite. This cannot be undone.
              </p>
              <Button
                variant="danger"
                className="mt-4 w-full"
                leftIcon={<Trash2 size={15} />}
                loading={deleting || removeState.loading}
                disabled={!isOwner}
                onClick={() => void handleDelete()}
              >
                Delete project
              </Button>
              {!isOwner ? (
                <p className="mt-2 text-[10px] text-ink-muted">
                  Only the owner can delete this project.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
