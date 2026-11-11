import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/hooks/useSupabase';
import { recordAudit } from '@/lib/adminAudit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from '@/lib/utils';
import {
  documentStatusLabel,
  expiryState,
  friendlyKycError,
  getDocSpec,
  getSignedDocumentUrl,
  listDocuments,
} from '@/utils/kyc';
import { formatBytes } from '@/utils/imageCompress';
import type { UserDocument, VerificationStatus } from '@/types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Phone,
  RefreshCw,
  ShieldCheck,
  Truck,
  XCircle,
} from 'lucide-react';

interface QueueUser {
  id: string;
  full_name: string | null;
  phone: string | null;
  user_type: string | null;
  avatar_url: string | null;
  verification_status: VerificationStatus;
  verification_note: string | null;
  kyc_submitted_at: string | null;
  verified_at: string | null;
  created_at: string;
  pendingDocCount: number;
  docCount: number;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Light surfaces matching the rest of the admin section (which is intentionally
// light-only, like UserManagement/Moderation/AuditLog). The queue used to be
// styled dark-only, which made its white headings invisible in light mode.
function statusChip(status: VerificationStatus) {
  if (status === 'verified') {
    return { label: 'Verified', className: 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' };
  }
  if (status === 'rejected') {
    return { label: 'Rejected', className: 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' };
  }
  if (status === 'pending') {
    return { label: 'Pending', className: 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400' };
  }
  return { label: 'Not started', className: 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400' };
}

const VerificationQueue = () => {
  const { userProfile } = useAuth();
  const { getAuthenticatedClient } = useSupabase();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [selected, setSelected] = useState<QueueUser | null>(null);
  const [docs, setDocs] = useState<UserDocument[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [docsLoading, setDocsLoading] = useState(false);
  const [note, setNote] = useState('');
  const [deciding, setDeciding] = useState<'verified' | 'rejected' | null>(null);

  const queueQuery = useQuery({
    queryKey: ['kyc-queue'],
    refetchInterval: 30_000,
    queryFn: async (): Promise<QueueUser[]> => {
      const client = await getAuthenticatedClient();

      const [{ data: users, error: usersError }, { data: docs, error: docsError }] = await Promise.all([
        client.rpc('admin_users_view'),
        client.from('user_documents').select('user_id, status'),
      ]);

      if (usersError) throw new Error(friendlyKycError(usersError));
      if (docsError) throw new Error(friendlyKycError(docsError));

      // admin_users_view returns every user row; replicate the previous
      // server-side filtering and ordering locally.
      const queueUsers = ((users || []) as Array<{ verification_status: string; kyc_submitted_at?: string | null; [key: string]: unknown }>)
        .filter((u) => ['pending', 'verified', 'rejected'].includes(u.verification_status))
        .sort((a, b) => (b.kyc_submitted_at || '').localeCompare(a.kyc_submitted_at || ''));

      const pendingByUser = new Map<string, number>();
      const totalByUser = new Map<string, number>();
      for (const row of (docs || []) as { user_id: string; status: string }[]) {
        totalByUser.set(row.user_id, (totalByUser.get(row.user_id) || 0) + 1);
        if (row.status === 'pending') {
          pendingByUser.set(row.user_id, (pendingByUser.get(row.user_id) || 0) + 1);
        }
      }

      return (queueUsers as Omit<QueueUser, 'pendingDocCount' | 'docCount'>[])
        .map((u) => ({
          ...u,
          pendingDocCount: pendingByUser.get(u.id) || 0,
          docCount: totalByUser.get(u.id) || 0,
        }))
        // A verified trucker who later re-uploads a document re-enters the queue.
        .filter((u) => u.verification_status === 'pending' || u.pendingDocCount > 0 || u.verification_status !== 'none')
        .sort((a, b) => {
          const aNeeds = (a.verification_status === 'pending' || a.pendingDocCount > 0) ? 0 : 1;
          const bNeeds = (b.verification_status === 'pending' || b.pendingDocCount > 0) ? 0 : 1;
          if (aNeeds !== bNeeds) return aNeeds - bNeeds;
          return (b.kyc_submitted_at || '').localeCompare(a.kyc_submitted_at || '');
        });
    },
  });

  const rows = useMemo(() => queueQuery.data || [], [queueQuery.data]);
  const grouped = useMemo(
    () => ({
      pending: rows.filter(
        (r) => (r.verification_status === 'pending' || r.pendingDocCount > 0) && r.verification_status !== 'verified',
      ),
      // Verified users who re-uploaded still need attention, so surface them under Pending.
      verified: rows.filter((r) => r.verification_status === 'verified' && r.pendingDocCount === 0),
      rejected: rows.filter((r) => r.verification_status === 'rejected'),
    }),
    [rows],
  );

  const pendingAttention = rows.filter(
    (r) => r.verification_status === 'pending' || r.pendingDocCount > 0,
  ).length;

  const openUser = useCallback(
    async (user: QueueUser) => {
      setSelected(user);
      setNote(user.verification_note || '');
      setDocs([]);
      setSignedUrls({});
      setDocsLoading(true);
      try {
        const client = await getAuthenticatedClient();
        const userDocs = await listDocuments(client, user.id);
        setDocs(userDocs);
        const pairs = await Promise.all(
          userDocs.map(async (d) => [d.id, await getSignedDocumentUrl(client, d.storage_path)] as const),
        );
        const map: Record<string, string> = {};
        for (const [id, url] of pairs) if (url) map[id] = url;
        setSignedUrls(map);
      } catch (err) {
        showError(friendlyKycError(err));
      } finally {
        setDocsLoading(false);
      }
    },
    [getAuthenticatedClient],
  );

  const handleDecision = async (decision: 'verified' | 'rejected') => {
    if (!selected) return;
    if (decision === 'rejected' && !note.trim()) {
      showError('Please add a short reason so the trucker knows what to fix.');
      return;
    }
    setDeciding(decision);
    try {
      const client = await getAuthenticatedClient();
      const { error } = await client.rpc('review_kyc', {
        p_user_id: selected.id,
        p_decision: decision,
        p_note: note.trim() || null,
      });
      if (error) throw new Error(friendlyKycError(error));

      await recordAudit(client, {
        action: 'kyc_review',
        targetType: 'user',
        targetId: selected.id,
        metadata: {
          decision,
          note: note.trim() || null,
          documentsReviewed: docs.length,
          reviewedBy: userProfile?.id,
        },
      });

      showSuccess(decision === 'verified' ? 'Trucker verified.' : 'Submission rejected with your note.');
      setSelected(null);
      await queryClient.invalidateQueries({ queryKey: ['kyc-queue'] });
    } catch (err) {
      showError(friendlyKycError(err));
    } finally {
      setDeciding(null);
    }
  };

  const renderRow = (user: QueueUser) => {
    const chip = statusChip(user.verification_status);
    const needsAttention = user.verification_status === 'pending' || user.pendingDocCount > 0;

    return (
      <button
        key={user.id}
        onClick={() => void openUser(user)}
        className="flex w-full items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-left transition-colors hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              {user.user_type === 'trucker' ? (
                <Truck className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              ) : (
                <ShieldCheck className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium text-gray-900 dark:text-gray-100">{user.full_name || 'Unnamed user'}</p>
            <Badge variant="outline" className={cn('text-[10px]', chip.className)}>
              {chip.label}
            </Badge>
            {needsAttention && user.pendingDocCount > 0 && (
              <Badge variant="outline" className="border-orange-200 dark:border-orange-800 text-[10px] text-orange-700 dark:text-orange-400">
                {user.pendingDocCount} doc{user.pendingDocCount > 1 ? 's' : ''} to check
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {user.phone || 'No phone'}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {user.docCount} document{user.docCount === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {user.kyc_submitted_at ? `Submitted ${formatDate(user.kyc_submitted_at)}` : 'Not submitted'}
            </span>
          </div>
        </div>

        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">Review →</span>
      </button>
    );
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verification Queue</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Check the licence and truck documents, then approve or reject.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingAttention > 0 && (
            <Badge className="bg-orange-600 text-white">{pendingAttention} awaiting review</Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void queueQuery.refetch()}
            disabled={queueQuery.isFetching}
            className="border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', queueQuery.isFetching && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {queueQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : queueQuery.isError ? (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-700 dark:text-red-400">
          Could not load the queue: {(queueQuery.error as Error).message}
        </div>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="pending">
              Pending{grouped.pending.length ? ` (${grouped.pending.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="verified">
              Verified{grouped.verified.length ? ` (${grouped.verified.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected{grouped.rejected.length ? ` (${grouped.rejected.length})` : ''}
            </TabsTrigger>
          </TabsList>

          {(['pending', 'verified', 'rejected'] as const).map((key) => (
            <TabsContent key={key} value={key} className="mt-4 space-y-3">
              {grouped[key].length === 0 ? (
                <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-8 text-center text-sm text-gray-400 dark:text-gray-500">
                  Nothing here right now.
                </div>
              ) : (
                grouped[key].map(renderRow)
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-gray-900 dark:text-gray-100">{selected.full_name || 'Unnamed user'}</SheetTitle>
                <SheetDescription className="text-gray-500 dark:text-gray-400">
                  {selected.phone || 'No phone on file'} · {selected.user_type || 'no role'} · joined{' '}
                  {formatDate(selected.created_at)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {selected.verification_note && selected.verification_status === 'rejected' && (
                  <div className="rounded border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 p-3 text-xs text-amber-700 dark:text-amber-400">
                    Last rejection note: {selected.verification_note}
                  </div>
                )}

                {docsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
                    ))}
                  </div>
                ) : docs.length === 0 ? (
                  <p className="rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4 text-sm text-gray-500 dark:text-gray-400">
                    This user has not uploaded any documents yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {docs.map((doc) => {
                      const spec = getDocSpec(doc.doc_type);
                      const expiry = expiryState(doc.valid_until);
                      return (
                        <div key={doc.id} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {spec?.label || doc.doc_type}
                              {spec?.required ? (
                                <span className="ml-2 text-[10px] text-orange-600 dark:text-orange-400">required</span>
                              ) : null}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px]',
                                doc.status === 'approved'
                                  ? 'border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                  : doc.status === 'rejected'
                                    ? 'border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                                    : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
                              )}
                            >
                              {documentStatusLabel(doc)}
                            </Badge>
                          </div>

                          <div className="mt-2 flex gap-3">
                            {signedUrls[doc.id] && (doc.mime_type || '').startsWith('image/') ? (
                              <a
                                href={signedUrls[doc.id]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0 overflow-hidden rounded border border-gray-200 dark:border-gray-800"
                              >
                                <img
                                  src={signedUrls[doc.id]}
                                  alt={spec?.label || doc.doc_type}
                                  loading="lazy"
                                  className="h-24 w-32 object-cover"
                                />
                              </a>
                            ) : (
                              <a
                                href={signedUrls[doc.id] || undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-24 w-32 shrink-0 flex-col items-center justify-center gap-1 rounded border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                              >
                                <FileText className="h-6 w-6" />
                                <span className="text-[11px]">
                                  {doc.mime_type === 'application/pdf' ? 'Open PDF' : 'No preview'}
                                </span>
                              </a>
                            )}

                            <div className="min-w-0 flex-1 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                              <p>Size: {formatBytes(doc.file_size)}</p>
                              {doc.original_size && doc.file_size && doc.original_size > doc.file_size ? (
                                <p className="text-green-600 dark:text-green-400">
                                  Compressed from {formatBytes(doc.original_size)}
                                </p>
                              ) : null}
                              <p>Valid until: {doc.valid_until ? formatDate(doc.valid_until) : 'not provided'}</p>
                              {expiry === 'expired' && (
                                <p className="flex items-center gap-1 text-red-600 dark:text-red-400">
                                  <AlertTriangle className="h-3 w-3" /> Expired
                                </p>
                              )}
                              {expiry === 'expiring' && (
                                <p className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                  <AlertTriangle className="h-3 w-3" /> Expiring within 30 days
                                </p>
                              )}
                              {signedUrls[doc.id] ? (
                                <a
                                  href={signedUrls[doc.id]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block underline hover:text-gray-900 dark:hover:text-gray-100"
                                >
                                  Open full size
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="review-note" className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Note to the trucker
                  </label>
                  <Textarea
                    id="review-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Required when rejecting. Example: the RC photo is blurry, please retake it."
                    className="min-h-[90px] border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>

                <div className="flex flex-col gap-2 pb-6 sm:flex-row">
                  <Button
                    onClick={() => void handleDecision('verified')}
                    disabled={deciding !== null}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {deciding === 'verified' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Approve &amp; verify
                  </Button>
                  <Button
                    onClick={() => void handleDecision('rejected')}
                    disabled={deciding !== null}
                    variant="outline"
                    className="flex-1 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
                  >
                    {deciding === 'rejected' ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default VerificationQueue;
