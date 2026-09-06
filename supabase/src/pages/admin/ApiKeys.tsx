import { useState, useCallback, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useSupabase } from '@/hooks/useSupabase';
import AdminShell from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Key, CheckCircle, XCircle, Save, Trash2, Info, RefreshCw, AlertTriangle } from 'lucide-react';
import { recordAudit } from '@/lib/adminAudit';

interface SecretEntry {
  name: string;
  value: string | null;
  has_value: boolean;
}

const MANAGEABLE_SECRETS: (keyof typeof SECRET_DESCRIPTIONS)[] = [
  'GEMINI_API_KEY',
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
];

const SECRET_DESCRIPTIONS = {
  GEMINI_API_KEY: {
    label: 'Google Gemini',
    functions: ['match-ml', 'gemini-proxy'],
    description: 'Primary AI provider for match scoring and natural language search.',
  },
  GROQ_API_KEY: {
    label: 'Groq',
    functions: ['match-ml', 'gemini-proxy'],
    description: 'Secondary AI provider (fallback). Fast LLaMA inference.',
  },
  OPENROUTER_API_KEY: {
    label: 'OpenRouter',
    functions: ['match-ml', 'gemini-proxy'],
    description: 'Tertiary AI provider (fallback). Routes to multiple open models.',
  },
} as const;

const STATUS_LABELS: Record<string, string> = {
  'match-ml': 'Match scoring',
  'gemini-proxy': 'NL search',
};

export default function ApiKeys() {
  const { getToken } = useClerkAuth();
  const { getAuthenticatedClient } = useSupabase();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const [secrets, setSecrets] = useState<SecretEntry[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const callAdminSecrets = useCallback(async (method: 'GET' | 'POST' | 'DELETE', body?: unknown) => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${supabaseUrl}/functions/v1/admin-secrets`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
    return data;
  }, [getToken, supabaseUrl]);

  const fetchSecrets = useCallback(async () => {
    try {
      const data = await callAdminSecrets('GET');
      setSecrets(data.secrets || []);
      for (const key of MANAGEABLE_SECRETS) {
        if (!(key in inputValues)) {
          setInputValues(prev => ({ ...prev, [key]: '' }));
        }
      }
    } catch (err) {
      toast.error('Failed to load API key status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [callAdminSecrets, inputValues]);

  useEffect(() => {
    fetchSecrets();
  }, [fetchSecrets]);

const handleSave = useCallback(async (secretName: keyof typeof SECRET_DESCRIPTIONS) => {
    const value = inputValues[secretName]?.trim();
    if (!value) {
      toast.error('Please enter an API key value');
      return;
    }

    setSavingIds(prev => new Set([...prev, secretName]));
    try {
      await callAdminSecrets('POST', { secret: secretName, value });
      toast.success(`${SECRET_DESCRIPTIONS[secretName]?.label} API key updated`);
      setInputValues(prev => ({ ...prev, [secretName]: '' }));

      try {
        const supabase = await getAuthenticatedClient();
        await recordAudit(supabase, {
          action: 'api_key_update',
          targetType: 'secret',
          targetId: secretName,
          metadata: { provider: SECRET_DESCRIPTIONS[secretName]?.label, action: 'set' },
        });
      } catch (auditErr) {
        console.warn('Audit log failed:', auditErr);
      }

      const data = await callAdminSecrets('GET');
      setSecrets(data.secrets || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update API key');
    } finally {
      setSavingIds(prev => {
        const copy = new Set(prev);
        copy.delete(secretName);
        return copy;
      });
    }
  }, [inputValues, callAdminSecrets, getAuthenticatedClient]);

const handleRemove = useCallback(async (secretName: keyof typeof SECRET_DESCRIPTIONS) => {
    if (!confirm(`Remove ${SECRET_DESCRIPTIONS[secretName]?.label} API key?`)) {
      return;
    }

    setRemovingIds(prev => new Set([...prev, secretName]));
    try {
      await callAdminSecrets('DELETE', { secret: secretName });
      toast.success(`${SECRET_DESCRIPTIONS[secretName]?.label} API key removed`);

      try {
        const supabase = await getAuthenticatedClient();
        await recordAudit(supabase, {
          action: 'api_key_update',
          targetType: 'secret',
          targetId: secretName,
          metadata: { provider: SECRET_DESCRIPTIONS[secretName]?.label, action: 'unset' },
        });
      } catch (auditErr) {
        console.warn('Audit log failed:', auditErr);
      }

      const data = await callAdminSecrets('GET');
      setSecrets(data.secrets || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove API key');
    } finally {
      setRemovingIds(prev => {
        const copy = new Set(prev);
        copy.delete(secretName);
        return copy;
      });
    }
  }, [callAdminSecrets, getAuthenticatedClient]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSecrets();
    setRefreshing(false);
    toast.success('Refreshed');
  }, [fetchSecrets]);

  if (loading) {
    return (
      <AdminShell title="API Key Management" description="Manage AI provider API keys">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="API Key Management"
      description="Manage AI provider API keys for edge functions. Keys are used by match-ml and gemini-proxy."
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Alert className="border-blue-900/30 bg-blue-900/10 max-w-2xl">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription>
              API keys are stored as Supabase Edge Function secrets. They are never exposed to the client.
              The match-ml and gemini-proxy functions use these keys with a fallback chain: Gemini to Groq to OpenRouter to local heuristic.
            </AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4">
          {MANAGEABLE_SECRETS.map((secretName) => {
            const desc = SECRET_DESCRIPTIONS[secretName];
            const entry = secrets.find(s => s.name === secretName);
            const isConfigured = entry?.has_value ?? false;
            const isSaving = savingIds.has(secretName);
            const isRemoving = removingIds.has(secretName);

            return (
              <Card key={secretName} className="border-gray-200 dark:border-gray-800">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Key className="h-5 w-5 text-orange-500" />
                      <div>
                        <CardTitle className="text-lg">{desc.label}</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {desc.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant={isConfigured ? "default" : "outline"}>
                      {isConfigured ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Configured
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Not set
                        </span>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Used by: {desc.functions.map(f => STATUS_LABELS[f] || f).join(', ')}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        type="password"
                        placeholder={`Enter new ${desc.label} API key`}
                        value={inputValues[secretName] || ''}
                        onChange={(e) => setInputValues(prev => ({ ...prev, [secretName]: e.target.value }))}
                        disabled={isSaving || isRemoving}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSave(secretName)}
                        disabled={isSaving || isRemoving || !inputValues[secretName]?.trim()}
                      >
                        {isSaving ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                      {isConfigured && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemove(secretName)}
                          disabled={isSaving || isRemoving}
                        >
                          {isRemoving ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {isSaving && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Saving {desc.label} API key...
                      </p>
                    )}
                    {isRemoving && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Removing {desc.label} API key...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!MANAGEABLE_SECRETS.some(s => {
          const entry = secrets.find(e => e.name === s);
          return entry?.has_value;
        }) && (
          <Alert className="border-amber-900/30 bg-amber-900/10">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription>
              None of the AI provider keys are configured. The platform will use the local fallback scoring until an API key is added.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </AdminShell>
  );
}
