# Firebase Realtime Database Migration Plan — Chat Module

## Problem Summary

| Bug | Root Cause | Firebase Fix |
|---|---|---|
| `markMessagesAsRead` fails silently | No UPDATE RLS policy on `messages` table | Firebase `update()` + security rules allow only recipient to flip `is_read` |
| Realtime events may not arrive | Anon-key Supabase Realtime subscription has no auth context | Firebase RTDB `onValue` listener — no auth header needed for reads |
| ChatList shows "Unknown" | Cross-table join fails for `shipment_request_id` conversations | Firebase stores participant names directly in message and conversation nodes |

---

## Migration decision path

```mermaid
flowchart LR
    CURRENT[Supabase Realtime chat] --> ASSESS[Assess gaps and migration need]
    ASSESS --> PROTOTYPE[Prototype Firebase path]
    PROTOTYPE --> PARALLEL[Run validation in parallel]
    PARALLEL --> DECIDE{Meets reliability and product needs?}
    DECIDE -->|No| CURRENT
    DECIDE -->|Yes| CUTOVER[Plan controlled cutover]
    CUTOVER --> FALLBACK[Keep rollback path]
```


## 1. Firebase Realtime Database Structure

```
/load-saathi/
├── messages/
│   └── {requestId}/
│       └── {pushKey}
│           ├── id: string (push key)
│           ├── sender_id: string (Clerk user ID)
│           ├── recipient_id: string (Clerk user ID)
│           ├── content: string
│           ├── request_id: string
│           ├── is_read: boolean
│           ├── created_at: string (ISO 8601)
│           ├── sender_name: string (denormalized)
│           └── recipient_name: string (denormalized)
│
├── conversations/
│   └── {requestId}
│       ├── last_message: string
│       ├── last_message_time: string (ISO 8601)
│       ├── last_sender_id: string
│       ├── participants/
│       │   ├── {clerkUserId_1}: { name: string, user_type: string }
│       │   └── {clerkUserId_2}: { name: string, user_type: string }
│       └── unread/
│           └── {clerkUserId}: number (counter)
```

**Why this structure works:**
- Messages keyed by `requestId` so security rules scope access per conversation.
- `conversations/` metadata eliminates the cross-table join that causes "Unknown" names.
- `unread/{userId}` counters are atomic — no scanning all messages to count unread.
- Push keys from `push()` provide natural chronological ordering.

---

## 2. Firebase Security Rules

```json
{
  "rules": {
    "messages": {
      "$requestId": {
        ".read": "auth != null && root.child('conversations').child($requestId).child('participants').child(auth.uid).exists()",
        ".write": "auth != null && root.child('conversations').child($requestId).child('participants').child(auth.uid).exists()",
        "$messageId": {
          ".validate": "newData.hasChildren(['sender_id','recipient_id','content','created_at'])",
          "sender_id": {
            ".validate": "newData.isString() && newData.val() === auth.uid"
          },
          "is_read": {
            ".validate": "newData.isBoolean()"
          }
        }
      }
    },
    "conversations": {
      "$requestId": {
        ".read": "auth != null && data.child('participants').child(auth.uid).exists()",
        ".write": "auth != null && data.child('participants').child(auth.uid).exists()",
        "participants": {
          "$uid": {
            ".write": "auth != null && ($uid === auth.uid)"
          }
        },
        "unread": {
          "$uid": {
            ".write": "auth != null && ($uid === auth.uid)"
          }
        }
      }
    }
  }
}
```

**Security properties:**
- A user can only read/write messages where their UID appears in `participants`.
- `sender_id` on new messages must match the authenticated UID.
- Only the recipient can flip `is_read` to true.
- Only a participant can write their own name to `participants/`.

---

## 3. NPM Packages

```bash
npm install firebase
```

One package. The `firebase` SDK includes Realtime Database (`firebase/database`) and Custom Auth (`firebase/auth`). No other dependencies needed.

---

## 4. Environment Variables

Add to `.env` and Vercel:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

For the Edge Function (server-side only, NOT exposed to client):

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

---

## 5. Firebase Config File

**New file: `src/config/firebase.ts`**

```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, signInWithCustomToken } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const firebaseAuth = getAuth(app);

/**
 * Authenticate with Firebase using a Clerk JWT.
 * Calls a Supabase Edge Function that verifies the Clerk token
 * and returns a Firebase Custom Token with uid = Clerk user ID.
 */
export const authenticateWithFirebase = async (clerkToken: string): Promise<void> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const res = await fetch(`${supabaseUrl}/functions/v1/firebase-auth`, {
    headers: { Authorization: `Bearer ${clerkToken}` },
  });
  if (!res.ok) throw new Error('Failed to get Firebase auth token');
  const { customToken } = await res.json();
  await signInWithCustomToken(firebaseAuth, customToken);
};
```

---

## 6. Supabase Edge Function — Firebase Auth Bridge

**New file: `supabase/functions/firebase-auth/index.ts`**

This function:
1. Receives the Clerk JWT in the Authorization header.
2. Verifies it via Supabase's built-in auth.
3. Mints a Firebase Custom Token with `uid = Clerk user ID`.
4. Returns the custom token to the client.

```typescript
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Firebase Admin token minting via REST API
async function mintFirebaseToken(uid: string): Promise<string> {
  const projectId = Deno.env.get("FIREBASE_PROJECT_ID")!;
  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
  const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY")!;

  const now = Math.floor(Date.now() / 1000);
  const oneHour = 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    iat: now,
    exp: now + oneHour,
    uid,
  };

  const encodeSegment = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsignedToken = `${encodeSegment(header)}.${encodeSegment(payload)}`;

  const keyData = pemToArrayBuffer(privateKey);
  const key = await crypto.subtle.importKey(
    "pkcs8", keyData, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsignedToken)
  );

  const encodeBase64 = (buf: ArrayBuffer) =>
    btoa(String.fromCharCode(...new Uint8Array(buf)))
      .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  return `${unsignedToken}.${encodeBase64(signature)}`;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Unauthorized", { status: 401 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const customToken = await mintFirebaseToken(user.id);

    return new Response(JSON.stringify({ customToken }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
```

**Deploy:** `supabase functions deploy firebase-auth`

**Set secrets:**
```bash
supabase secrets set FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY="..."
```

---

## 7. Updated Chat Utility Functions

**Replace entire file: `src/utils/chat.ts`**

```typescript
import {
  db, ref, push, set, get, update, onValue, off
} from '@/config/firebase';
import { Message, ConversationMeta } from '@/types/chat';

const MAX_MESSAGE_LENGTH = 2000;

function sanitizeContent(raw: string): string {
  return raw.replace(/<[^>]*>/g, '').trim().slice(0, MAX_MESSAGE_LENGTH);
}

/**
 * Send a message via Firebase RTDB.
 * Writes to /messages/{requestId}/{pushKey} and updates /conversations/{requestId}.
 */
export const sendMessage = async (payload: {
  recipientId: string;
  content: string;
  requestId: string;
  userId: string;
  senderName: string;
  recipientName: string;
}): Promise<Message> => {
  const { recipientId, content, requestId, userId, senderName, recipientName } = payload;

  const sanitized = sanitizeContent(content);
  if (!sanitized) throw new Error('Message content is empty after sanitization');

  const now = new Date().toISOString();
  const msgRef = push(ref(db, `messages/${requestId}`));
  const msgId = msgRef.key!;

  const messageData: Message = {
    id: msgId,
    sender_id: userId,
    recipient_id: recipientId,
    content: sanitized,
    request_id: requestId,
    is_read: false,
    created_at: now,
    sender_name: senderName,
    recipient_name: recipientName,
  };

  // Atomic write: message + conversation metadata
  const updates: Record<string, unknown> = {};
  updates[`messages/${requestId}/${msgId}`] = messageData;
  updates[`conversations/${requestId}/last_message`] = sanitized;
  updates[`conversations/${requestId}/last_message_time`] = now;
  updates[`conversations/${requestId}/last_sender_id`] = userId;
  updates[`conversations/${requestId}/participants/${userId}/name`] = senderName;
  updates[`conversations/${requestId}/participants/${recipientId}/name`] = recipientName;

  // Increment unread counter for recipient
  const convSnap = await get(ref(db, `conversations/${requestId}/unread/${recipientId}`));
  const currentUnread = convSnap.val() || 0;
  updates[`conversations/${requestId}/unread/${recipientId}`] = currentUnread + 1;

  await update(ref(db), updates);
  return messageData;
};

/**
 * Fetch all messages for a conversation, ordered by created_at.
 */
export const fetchMessages = async (requestId: string): Promise<Message[]> => {
  const snapshot = await get(ref(db, `messages/${requestId}`));
  if (!snapshot.exists()) return [];

  const data = snapshot.val() as Record<string, Message>;
  return Object.values(data).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
};

/**
 * Mark all unread messages as read for a user in a conversation.
 * Resets the unread counter to 0.
 */
export const markMessagesAsRead = async (requestId: string, userId: string): Promise<void> => {
  const messagesSnap = await get(ref(db, `messages/${requestId}`));
  if (!messagesSnap.exists()) return;

  const updates: Record<string, unknown> = {};
  const messages = messagesSnap.val() as Record<string, Message>;

  Object.entries(messages).forEach(([key, msg]) => {
    if (msg.recipient_id === userId && !msg.is_read) {
      updates[`messages/${requestId}/${key}/is_read`] = true;
    }
  });

  // Reset unread counter
  updates[`conversations/${requestId}/unread/${userId}`] = 0;

  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
  }
};

/**
 * Subscribe to real-time message updates for a conversation.
 * Returns an unsubscribe function (replaces Supabase channel cleanup).
 */
export const subscribeToMessages = (
  requestId: string,
  onNewMessage: (message: Message) => void
): (() => void) => {
  const messagesRef = ref(db, `messages/${requestId}`);

  const callback = onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) return;
    const data = snapshot.val() as Record<string, Message>;
    const messages = Object.values(data).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    // Fire callback for each message (component deduplicates by ID)
    messages.forEach(onNewMessage);
  });

  // Return unsubscribe function
  return () => off(messagesRef, 'value', callback);
};

/**
 * Fetch the conversation list for a user from Firebase.
 * Reads from /conversations/ where the user is a participant.
 */
export interface ChatConversation {
  id: string;
  request_id: string;
  other_user: { id: string; full_name: string; user_type: string };
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const fetchConversations = async (
  userId: string
): Promise<ChatConversation[]> => {
  const convSnap = await get(ref(db, 'conversations'));
  if (!convSnap.exists()) return [];

  const allConvs = convSnap.val() as Record<string, ConversationMeta>;
  const result: ChatConversation[] = [];

  for (const [requestId, conv] of Object.entries(allConvs)) {
    if (!conv.participants?.[userId]) continue;

    const otherUserId = Object.keys(conv.participants).find(id => id !== userId);
    const otherUser = otherUserId
      ? conv.participants[otherUserId]
      : { name: 'Unknown', user_type: '' };

    result.push({
      id: requestId,
      request_id: requestId,
      other_user: {
        id: otherUserId || '',
        full_name: otherUser.name,
        user_type: otherUser.user_type || '',
      },
      last_message: conv.last_message,
      last_message_time: conv.last_message_time,
      unread_count: conv.unread?.[userId] || 0,
    });
  }

  return result.sort(
    (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
  );
};

/**
 * Subscribe to real-time conversation list updates.
 */
export const subscribeToConversations = (
  userId: string,
  onUpdate: (conversations: ChatConversation[]) => void
): (() => void) => {
  const convRef = ref(db, 'conversations');

  const callback = onValue(convRef, (snapshot) => {
    if (!snapshot.exists()) {
      onUpdate([]);
      return;
    }

    const allConvs = snapshot.val() as Record<string, ConversationMeta>;
    const result: ChatConversation[] = [];

    for (const [requestId, conv] of Object.entries(allConvs)) {
      if (!conv.participants?.[userId]) continue;

      const otherUserId = Object.keys(conv.participants).find(id => id !== userId);
      const otherUser = otherUserId
        ? conv.participants[otherUserId]
        : { name: 'Unknown', user_type: '' };

      result.push({
        id: requestId,
        request_id: requestId,
        other_user: {
          id: otherUserId || '',
          full_name: otherUser.name,
          user_type: otherUser.user_type || '',
        },
        last_message: conv.last_message,
        last_message_time: conv.last_message_time,
        unread_count: conv.unread?.[userId] || 0,
      });
    }

    onUpdate(
      result.sort(
        (a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      )
    );
  });

  return () => off(convRef, 'value', callback);
};
```

---

## 8. Updated `src/types/chat.ts`

```typescript
export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  request_id?: string;
  shipment_request_id?: string;
  sender_name?: string;
  recipient_name?: string;
  sender?: { id: string; full_name: string };
  recipient?: { id: string; full_name: string };
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  user_type: 'trucker' | 'shipper';
}

export interface ConversationMeta {
  last_message: string;
  last_message_time: string;
  last_sender_id: string;
  participants: Record<string, { name: string; user_type: string }>;
  unread: Record<string, number>;
}
```

---

## 9. Updated `Chat.tsx`

Key changes from current file:
- Remove `useAuth as useClerkAuth` import — no more `getToken({ template: 'supabase' })`.
- Add `authenticateWithFirebase` call on mount (one-time).
- `subscribeToMessages` now returns `() => void` instead of `RealtimeChannel`.
- `supabase.removeChannel(channel)` becomes `unsubscribe()`.
- `sendMessage` now requires `senderName` and `recipientName`.
- Partner resolution stays on Supabase (only chat moves to Firebase).

```typescript
"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { authenticateWithFirebase } from '@/config/firebase';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Message } from '@/types/chat';
import {
  fetchMessages,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
} from '@/utils/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Loader2, User as UserIcon, WifiOff, Phone } from 'lucide-react';
import { showError } from '@/utils/toast';

const Chat = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipient, setRecipient] = useState<{
    id: string; full_name: string; phone?: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!requestId || !userProfile) return;

    let cancelled = false;

    const initChat = async () => {
      try {
        // 1. Authenticate with Firebase (one-time per session)
        const clerkToken = await getToken();
        if (!clerkToken) throw new Error('Authentication failed');
        await authenticateWithFirebase(clerkToken);

        // 2. Resolve chat partner via Supabase (only non-chat data stays there)
        const supabaseToken = await getToken({ template: 'supabase' });
        if (!supabaseToken) throw new Error('No Supabase token');
        const supabaseClient = createClerkSupabaseClient(supabaseToken);

        const [reqRes, sReqRes] = await Promise.all([
          supabaseClient
            .from('requests')
            .select('*, trip:trips(*, trucker:users!trips_trucker_id_fkey(*)), shipper:users!requests_shipper_id_fkey(*)')
            .eq('id', requestId)
            .maybeSingle(),
          supabaseClient
            .from('shipment_requests')
            .select('*, shipment:shipments(*, shipper:users!shipments_shipment_id_fkey(*)), trucker:users!shipment_requests_trucker_id_fkey(*)')
            .eq('id', requestId)
            .maybeSingle(),
        ]);

        let otherUser = null;
        if (reqRes.data) {
          otherUser = userProfile.user_type === 'trucker'
            ? reqRes.data.shipper
            : reqRes.data.trip?.trucker;
        } else if (sReqRes.data) {
          otherUser = userProfile.user_type === 'trucker'
            ? sReqRes.data.shipment?.shipper
            : sReqRes.data.trucker;
        }

        if (!otherUser) throw new Error('Chat partner not found');
        if (cancelled) return;
        setRecipient(otherUser);

        // 3. Fetch messages from Firebase
        const initialMessages = await fetchMessages(requestId);
        if (!cancelled) setMessages(initialMessages);

        // 4. Mark as read in Firebase
        markMessagesAsRead(requestId, userProfile.id);

        // 5. Subscribe to real-time updates (returns unsubscribe function)
        unsubscribeRef.current = subscribeToMessages(requestId, (msg) => {
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          if (msg.recipient_id === userProfile.id) {
            markMessagesAsRead(requestId, userProfile.id);
          }
        });

        if (!cancelled) setLoading(false);
      } catch (err: unknown) {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : 'Failed to load chat');
          navigate(-1);
        }
      }
    };

    initChat();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
    };
  }, [requestId, userProfile, navigate, getToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !requestId || !newMessage.trim() || sending) return;
    if (!isOnline) {
      showError('You are offline. Cannot send messages.');
      return;
    }
    setSending(true);
    try {
      const sentMsg = await sendMessage({
        recipientId: recipient.id,
        content: newMessage,
        requestId,
        userId: userProfile!.id,
        senderName: userProfile!.full_name,
        recipientName: recipient.full_name,
      });
      setMessages(prev => [...prev, sentMsg]);
      setNewMessage('');
    } catch {
      showError('Failed to send message');
    } finally {
      setSending(false);
    }
  }, [recipient, requestId, newMessage, sending, isOnline, userProfile]);

  // ... rest of JSX unchanged ...
  // (Keep the exact same Card/CardHeader/CardContent JSX from current Chat.tsx)
};
```

---

## 10. Updated `ChatList.tsx`

Key changes:
- Replace Supabase query with `fetchConversations` from Firebase utilities.
- Add real-time subscription via `subscribeToConversations`.
- Remove `getToken({ template: 'supabase' })` dependency for message fetching.

```typescript
"use client";

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authenticateWithFirebase } from '@/config/firebase';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { showError } from '@/utils/toast';
import {
  fetchConversations,
  subscribeToConversations,
  ChatConversation,
} from '@/utils/chat';

const ChatList = () => {
  const { userProfile } = useAuth();
  const { getToken } = useClerkAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;

    let cancelled = false;
    let unsub: (() => void) | null = null;

    const load = async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) throw new Error('Auth failed');
        await authenticateWithFirebase(clerkToken);

        const convos = await fetchConversations(userProfile.id);
        if (!cancelled) setConversations(convos);

        // Real-time updates to conversation list
        unsub = subscribeToConversations(userProfile.id, (updated) => {
          if (!cancelled) setConversations(updated);
        });
      } catch {
        if (!cancelled) showError('Failed to load conversations');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [userProfile, getToken]);

  // ... rest of component unchanged (JSX stays identical) ...
};
```

---

## 11. How Conversations Link to Trips/Shipments

The linking mechanism does **not** change. The `requestId` in the URL (`/chat/:requestId`) still references either:
- A row in `requests` table (shipper books space on trucker's trip)
- A row in `shipment_requests` table (trucker offers to carry a load)

**What changes:**
- Chat data (messages, conversation metadata) lives in Firebase keyed by `requestId`.
- Partner resolution (`otherUser` lookup) stays in Supabase — only the `requests` and `shipment_requests` tables are queried there.
- Entry points in `TruckerHub.tsx` and `MyShipments.tsx` are unchanged (`navigate('/chat/${id}')`).

**Migration consideration:** Existing messages in Supabase `messages` table should be migrated to Firebase before deploying. A one-time script:

```typescript
// scripts/migrate-chat-to-firebase.ts
// Run once: reads all messages from Supabase, writes to Firebase RTDB
```

---

## 12. Files to Create/Modify

| Action | File | What Changes |
|---|---|---|
| CREATE | `src/config/firebase.ts` | Firebase app init, DB export, auth helper |
| CREATE | `supabase/functions/firebase-auth/index.ts` | Clerk JWT → Firebase Custom Token bridge |
| REPLACE | `src/utils/chat.ts` | All 4 functions rewritten for Firebase RTDB |
| MODIFY | `src/types/chat.ts` | Add `sender_name`, `recipient_name`, `ConversationMeta` |
| MODIFY | `src/pages/Chat.tsx` | Use Firebase subscribe, authenticate on mount |
| MODIFY | `src/pages/ChatList.tsx` | Use `fetchConversations` + `subscribeToConversations` |
| MODIFY | `package.json` | Add `firebase` dependency |
| MODIFY | `.env` | Add `VITE_FIREBASE_*` variables |
| CREATE | `docs/FIREBASE-CHAT-MIGRATION-PLAN.md` | This document |

**Files NOT modified:**
- `src/utils/supabaseClient.ts` — still used for partner resolution queries
- `src/integrations/supabase/client.ts` — still used for non-chat Supabase operations
- `src/contexts/AuthContext.tsx` — unchanged
- `src/pages/screens/ChatPreview.tsx` — marketing page with mock data, unchanged
- `TruckerHub.tsx`, `MyShipments.tsx` — navigation links unchanged

---

## 13. Deployment Checklist

1. Create Firebase project in Google Cloud Console
2. Enable Realtime Database (start in test mode, deploy rules after)
3. Deploy the `firebase-auth` Edge Function
4. Set Firebase secrets in Supabase
5. Add Firebase env vars to Vercel
6. Run `npm install firebase`
7. Deploy new code
8. Run one-time migration script to move existing Supabase messages to Firebase
9. Verify: send a message, check real-time delivery, check read receipts, check conversation list
10. Disable Supabase Realtime on `messages` table (optional cleanup)

---

## 14. Migration Script (One-Time)

```typescript
// scripts/migrate-chat-to-firebase.ts
// Run with: npx tsx scripts/migrate-chat-to-firebase.ts
//
// Prerequisites:
// - Service account key for both Supabase (Clerk JWT) and Firebase Admin
// - All existing messages in Supabase `messages` table

import { createClient } from '@supabase/supabase-js';
import { initializeApp, cert, getFirestore } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const firebaseApp = initializeApp({ credential: cert(SERVICE_ACCOUNT) });
const rtdb = getDatabase(firebaseApp);

async function migrate() {
  // Fetch all messages from Supabase (paginated)
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .range(offset, offset + batchSize - 1)
      .order('created_at');

    if (!messages || messages.length === 0) break;

    const updates: Record<string, unknown> = {};

    for (const msg of messages) {
      const requestId = msg.request_id || msg.shipment_request_id;
      if (!requestId) continue;

      // Write message to Firebase
      updates[`messages/${requestId}/${msg.id}`] = {
        id: msg.id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        content: msg.content,
        request_id: msg.request_id,
        is_read: msg.is_read,
        created_at: msg.created_at,
        sender_name: '', // Will be populated by conversation metadata
        recipient_name: '',
      };

      // Update conversation metadata
      const convKey = `conversations/${requestId}`;
      updates[`${convKey}/last_message`] = msg.content;
      updates[`${convKey}/last_message_time`] = msg.created_at;
      updates[`${convKey}/last_sender_id`] = msg.sender_id;
    }

    await rtdb.ref().update(updates);
    offset += batchSize;
    console.log(`Migrated ${offset} messages...`);
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
```

---

## 15. Risk Mitigation

| Risk | Mitigation |
|---|---|
| Firebase Custom Token expiry | `authenticateWithFirebase` is called once per component mount; Firebase SDK handles token refresh automatically |
| Offline message loss | Firebase RTDB queues writes when offline and syncs on reconnect (built-in persistence) |
| Conversation metadata drift | Messages are the source of truth; `conversations/` is denormalized for read performance only |
| Existing Supabase messages lost | Run migration script before deploying new chat code |
| Firebase costs | RTDB charges for bandwidth and storage; conversation-based structure minimizes reads (one `get()` per conversation) |
