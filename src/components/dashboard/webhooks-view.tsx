"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Webhook as WebhookIcon, Plus, Trash2, Send, Check, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface WebhookItem {
  id: string;
  name: string;
  url: string;
  secret: string | null;
  events: string;
  status: string;
  createdAt: string;
  logs?: Array<{ id: string; event: string; statusCode: number; createdAt: string }>;
}

export function WebhooksView() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["key.created", "key.revoked", "hwid.reset", "license.expired"]);

  // Test state
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/webhooks");
      if (res.ok) {
        const json = await res.json();
        setWebhooks(json.webhooks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !url.trim()) {
      toast.error("Name and URL are required");
      return;
    }

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          secret: secret.trim() || null,
          events: selectedEvents,
        }),
      });

      if (!res.ok) throw new Error("Failed to create webhook");
      toast.success("Webhook endpoint created!");
      setCreateOpen(false);
      setName("");
      setUrl("");
      setSecret("");
      fetchWebhooks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error creating webhook");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete webhook");
      toast.success("Webhook deleted");
      fetchWebhooks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error deleting webhook");
    }
  };

  const handleTestDispatch = async (hook: WebhookItem) => {
    setTestingId(hook.id);
    try {
      const res = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: hook.url,
          secret: hook.secret,
          event: "test.ping",
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Test webhook delivered! Status: ${json.statusCode} (${json.latencyMs}ms)`);
      } else {
        toast.error(`Test failed! Status: ${json.statusCode || 500} - ${json.responseBody || "Endpoint unreachable"}`);
      }
      fetchWebhooks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test dispatch failed");
    } finally {
      setTestingId(null);
    }
  };

  const toggleEvent = (ev: string) => {
    if (selectedEvents.includes(ev)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== ev));
    } else {
      setSelectedEvents([...selectedEvents, ev]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2">
            <WebhookIcon className="w-5 h-5 text-emerald-400" />
            Webhook Subscriptions & Automation
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure external endpoints to receive real-time JSON event payloads on API key creation, revocation, HWID resets, and expiration.
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Webhook Endpoint
        </Button>
      </div>

      {loading ? (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mb-3" />
          <p className="text-xs text-muted-foreground">Loading webhooks...</p>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
            <WebhookIcon className="w-6 h-6 text-emerald-400" />
          </div>
          <h4 className="text-sm font-semibold mb-1">No Webhooks Configured</h4>
          <p className="text-xs text-muted-foreground max-w-sm mb-4">
            Add a webhook URL (e.g. Discord, Slack, Zapier, custom server) to get notified on system events automatically.
          </p>
          <Button onClick={() => setCreateOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-xs">
            Create Webhook
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {webhooks.map((hook) => {
              const eventsList: string[] = JSON.parse(hook.events || "[]");
              return (
                <motion.div
                  key={hook.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass rounded-xl p-4 border border-white/5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold text-sm">{hook.name}</h4>
                        <code className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-0.5 rounded truncate inline-block max-w-md">
                          {hook.url}
                        </code>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestDispatch(hook)}
                        disabled={testingId === hook.id}
                        className="text-xs bg-white/5 border-white/10 hover:bg-white/10 gap-1.5"
                      >
                        <Send className={`w-3.5 h-3.5 ${testingId === hook.id ? "animate-pulse" : ""}`} />
                        {testingId === hook.id ? "Testing..." : "Test Dispatch"}
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(hook.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/5">
                    <span className="text-[10px] uppercase font-medium text-muted-foreground mr-1">Events:</span>
                    {eventsList.map((ev) => (
                      <Badge key={ev} variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-mono">
                        {ev}
                      </Badge>
                    ))}
                  </div>

                  {hook.logs && hook.logs.length > 0 && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 pt-1">
                      <span>Recent Delivery:</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
                          hook.logs[0].statusCode === 200
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-destructive/20 text-destructive"
                        }`}
                      >
                        HTTP {hook.logs[0].statusCode} - {hook.logs[0].event}
                      </Badge>
                      <span className="text-[10px] font-mono">
                        {new Date(hook.logs[0].createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Create Webhook */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-card border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <WebhookIcon className="w-5 h-5 text-emerald-400" />
              Add Webhook Subscription
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground">Endpoint Name</Label>
              <Input
                placeholder="e.g. Discord Notification / Slack / Zapier"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/5 border-white/10 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Target Webhook URL</Label>
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-white/5 border-white/10 font-mono text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">HMAC Secret Key (Optional)</Label>
              <Input
                placeholder="secret_signature_key_123"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="bg-white/5 border-white/10 font-mono text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Subscribe to Events</Label>
              <div className="grid grid-cols-2 gap-2">
                {["key.created", "key.revoked", "hwid.reset", "license.expired", "hwid.mismatch", "security.anomaly"].map((ev) => {
                  const checked = selectedEvents.includes(ev);
                  return (
                    <button
                      key={ev}
                      type="button"
                      onClick={() => toggleEvent(ev)}
                      className={`text-xs font-mono p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                        checked
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : "bg-white/5 border-white/10 text-muted-foreground"
                      }`}
                    >
                      <span>{ev}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button onClick={handleCreate} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-xs">
              Create Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
