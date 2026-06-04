import { useState, useCallback } from "react";

export interface IntegrationConfig {
  nodeManagementEndpoint: string;
  apiKey: string;
  webhookSecret: string;
  autoReplaceOnDrop: boolean;
  autoReplaceOnAbuse: boolean;
  slackWebhookUrl: string;
  discordWebhookUrl: string;
  notifyOnHot: boolean;
  notifyOnWarm: boolean;
  hasApiKey: boolean;
  hasWebhookSecret: boolean;
  hasSlack: boolean;
  hasDiscord: boolean;
  updatedAt: string;
}

export function useIntegrations() {
  const [config, setConfig] = useState<IntegrationConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/config");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConfig(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveConfig = useCallback(async (patch: Partial<IntegrationConfig>) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConfig(data.config);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const testWebhook = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/integrations/test", { method: "POST" });
      const data = await res.json();
      setTestResult({
        ok: data.ok,
        message: data.ok ? `Connected — HTTP ${data.status}` : data.error ?? "Connection failed",
      });
    } catch (e) {
      setTestResult({ ok: false, message: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }, []);

  return { config, loading, saving, testing, error, testResult, fetchConfig, saveConfig, testWebhook };
}
