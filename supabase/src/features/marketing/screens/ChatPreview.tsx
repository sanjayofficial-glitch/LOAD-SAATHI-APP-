
import { useState } from 'react';
import { MessageSquare, Send, Check, Clock, Phone, MoreVertical, Search } from 'lucide-react';
import SeoMeta from "@/components/SeoMeta";

interface Message {
  id: number;
  text: string;
  time: string;
  sender: 'me' | 'other';
  status?: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: number;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

const conversations: Conversation[] = [
  {
    id: 1, name: 'Rajesh Kumar', role: 'Trucker', avatar: 'RK',
    lastMessage: 'Yes, I can take the load from Mumbai to Delhi tomorrow morning.',
    time: '2m ago', unread: 2, online: true,
    messages: [
      { id: 1, text: 'Hi Rajesh, are you available for a shipment from Mumbai to Delhi?', time: '10:32 AM', sender: 'me', status: 'read' },
      { id: 2, text: 'Yes sir, when do you need pickup?', time: '10:35 AM', sender: 'other' },
      { id: 3, text: 'Tomorrow morning, around 7 AM. The load is 18 tons of electronics.', time: '10:36 AM', sender: 'me', status: 'read' },
      { id: 4, text: 'Yes, I can take the load from Mumbai to Delhi tomorrow morning.', time: '10:38 AM', sender: 'other' },
      { id: 5, text: 'Perfect. I will send the pickup location shortly.', time: '10:40 AM', sender: 'me', status: 'delivered' },
    ],
  },
  {
    id: 2, name: 'Suresh Patel', role: 'Trucker', avatar: 'SP',
    lastMessage: 'Rate is ₹28,500 for Bangalore to Hyderabad. Includes loading.',
    time: '15m ago', unread: 0, online: true,
    messages: [
      { id: 1, text: 'What is your rate for Bangalore to Hyderabad?', time: '9:15 AM', sender: 'me', status: 'read' },
      { id: 2, text: 'Rate is ₹28,500 for Bangalore to Hyderabad. Includes loading.', time: '9:20 AM', sender: 'other' },
    ],
  },
  {
    id: 3, name: 'Amit Singh', role: 'Trucker', avatar: 'AS',
    lastMessage: 'Reached Chennai warehouse. Will start unloading in 30 mins.',
    time: '1h ago', unread: 0, online: false,
    messages: [
      { id: 1, text: 'ETA to Chennai?', time: '12:10 PM', sender: 'me', status: 'read' },
      { id: 2, text: 'Reached Chennai warehouse. Will start unloading in 30 mins.', time: '12:45 PM', sender: 'other' },
    ],
  },
  {
    id: 4, name: 'Vikram Joshi', role: 'Shipper', avatar: 'VJ',
    lastMessage: 'The shipment is ready for pickup at our Pune warehouse.',
    time: '2h ago', unread: 1, online: true,
    messages: [
      { id: 1, text: 'The shipment is ready for pickup at our Pune warehouse.', time: '11:00 AM', sender: 'other' },
    ],
  },
  {
    id: 5, name: 'Deepak Verma', role: 'Trucker', avatar: 'DV',
    lastMessage: 'Will reach Jaipur by evening. Traffic is moderate.',
    time: '3h ago', unread: 0, online: false,
    messages: [
      { id: 1, text: 'How is the traffic on the Delhi-Jaipur highway?', time: '2:30 PM', sender: 'me', status: 'read' },
      { id: 2, text: 'Will reach Jaipur by evening. Traffic is moderate.', time: '2:45 PM', sender: 'other' },
    ],
  },
];

export default function ChatPreview() {
  const [activeChat, setActiveChat] = useState<Conversation>(conversations[0] ?? {
    id: 0, name: '', role: '', avatar: '', lastMessage: '', time: '', unread: 0, online: false, messages: []
  });
  const [messageText, setMessageText] = useState('');

  return (
    <>
      <SeoMeta title="Chat Preview — LoadSaathi App Screens" description="Preview LoadSaathi's real-time messaging between shippers and truckers with delivery status, read receipts, and direct communication." canonical="/screens/chat" breadcrumbs={[{ name: "App Screens", url: "/gallery" }, { name: "Chat Preview", url: "/screens/chat" }]} />
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden border-b border-border bg-gradient-to-b from-green-500/5 via-transparent to-transparent">
          <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full opacity-[0.06] pointer-events-none"
            style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)", filter: "blur(60px)" }} />
          <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-16 sm:py-20 relative z-10">
            <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4">App Preview: Chat</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Real-time messaging between shippers and truckers with delivery status and read receipts.
          </p>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 py-12">
        <div className="glass-card rounded-xl border-border overflow-hidden shadow-2xl">
          <div className="h-11 border-b border-border bg-card/80 flex items-center px-5 gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">MESSENGER</span>
            <div className="flex-grow" />
            <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          </div>

          <div className="flex h-[600px] bg-background/50 dark:bg-[#050816]/50">
            {/* Sidebar */}
            <div className="w-80 border-r border-border flex flex-col">
              <div className="p-3 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex-grow overflow-y-auto">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveChat(conv)}
                    className={`w-full text-left p-4 border-b border-border transition-colors hover:bg-card/50 ${
                      activeChat.id === conv.id ? 'bg-card/80' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                          {conv.avatar}
                        </div>
                        {conv.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground truncate">{conv.name}</span>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">{conv.time}</span>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{conv.lastMessage}</span>
                          {conv.unread > 0 && (
                            <span className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                              {conv.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-grow flex flex-col">
              {/* Chat Header */}
              <div className="h-14 border-b border-border flex items-center px-5 gap-3 bg-card/50">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                  {activeChat.avatar}
                </div>
                <div className="flex-grow">
                  <div className="text-sm font-bold text-foreground">{activeChat.name}</div>
                  <div className="flex items-center gap-1.5">
                    {activeChat.online && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                    <span className="text-[10px] text-muted-foreground">
                      {activeChat.online ? 'Online' : 'Offline'} · {activeChat.role}
                    </span>
                  </div>
                </div>
                <Phone className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
                <MoreVertical className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              </div>

              {/* Messages */}
              <div className="flex-grow overflow-y-auto p-5 space-y-4">
                {activeChat.messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${msg.sender === 'me' ? 'order-1' : 'order-1'}`}>
                      {msg.sender === 'other' && (
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-blue-600 flex items-center justify-center text-[7px] font-bold text-white">
                            {activeChat.avatar}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{activeChat.name}</span>
                        </div>
                      )}
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                        msg.sender === 'me'
                          ? 'bg-orange-500 text-white rounded-br-md'
                          : 'glass-card border-border rounded-bl-md'
                      }`}>
                        {msg.text}
                      </div>
                      <div className={`flex items-center gap-1 mt-0.5 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                        {msg.sender === 'me' && msg.status && (
                          msg.status === 'read' ? (
                            <div className="flex">
                              <Check className="h-2.5 w-2.5 text-blue-400" />
                              <Check className="h-2.5 w-2.5 text-blue-400 -ml-1" />
                            </div>
                          ) : msg.status === 'delivered' ? (
                            <div className="flex">
                              <Check className="h-2.5 w-2.5 text-muted-foreground" />
                              <Check className="h-2.5 w-2.5 text-muted-foreground -ml-1" />
                            </div>
                          ) : (
                            <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-border p-4 bg-card/30">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-grow px-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-green-500/50 transition-colors"
                  />
                  <button
                    className="p-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors disabled:opacity-50"
                    disabled={!messageText.trim()}
                  >
                    <Send className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}