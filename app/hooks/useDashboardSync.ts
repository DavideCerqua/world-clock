"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { CLOCKS_STORAGE_KEY, SETTINGS_STORAGE_KEY } from "../lib/constants";
import { createClient, isSupabaseConfigured } from "../lib/supabase/client";

type SyncState = "disabled" | "signed-out" | "loading" | "synced" | "error";

type Options = {
  clocks: unknown;
  isReady: boolean;
  settings: unknown;
};

export function useDashboardSync({ clocks, isReady, settings }: Options) {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => configured ? createClient() : null, [configured]);
  const [user, setUser] = useState<User | null>(null);
  const [syncState, setSyncState] = useState<SyncState>(configured ? "loading" : "disabled");
  const initializedUserRef = useRef<string | null>(null);
  const lastSyncedPayloadRef = useRef<string | null>(null);
  const payload = useMemo(() => JSON.stringify({ clocks, settings }), [clocks, settings]);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data, error }) => {
      setUser(error ? null : data.user);
      setSyncState(error || !data.user ? "signed-out" : "loading");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      initializedUserRef.current = null;
      lastSyncedPayloadRef.current = null;
      setUser(session?.user ?? null);
      setSyncState(session?.user ? "loading" : "signed-out");
    });
    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user || !isReady || initializedUserRef.current === user.id) return;
    initializedUserRef.current = user.id;
    let cancelled = false;

    void supabase
      .from("dashboard_states")
      .select("clocks, settings, updated_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          initializedUserRef.current = null;
          setSyncState("error");
          return;
        }

        if (!data) {
          const { error: insertError } = await supabase.from("dashboard_states").insert({
            user_id: user.id,
            clocks,
            settings,
          });
          if (!insertError) lastSyncedPayloadRef.current = payload;
          setSyncState(insertError ? "error" : "synced");
          return;
        }

        const cloudClocks = JSON.stringify(data.clocks);
        const cloudSettings = JSON.stringify(data.settings);
        const localClocks = localStorage.getItem(CLOCKS_STORAGE_KEY);
        const localSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        const loadMarker = `wc-cloud-loaded:${user.id}:${data.updated_at}`;

        if (
          sessionStorage.getItem(loadMarker) !== "true" &&
          (cloudClocks !== localClocks || cloudSettings !== localSettings)
        ) {
          localStorage.setItem(CLOCKS_STORAGE_KEY, cloudClocks);
          localStorage.setItem(SETTINGS_STORAGE_KEY, cloudSettings);
          sessionStorage.setItem(loadMarker, "true");
          window.location.reload();
          return;
        }
        lastSyncedPayloadRef.current = payload;
        setSyncState("synced");
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, supabase, user]);

  useEffect(() => {
    if (
      !supabase ||
      !user ||
      !isReady ||
      syncState !== "synced" ||
      payload === lastSyncedPayloadRef.current
    ) return;
    const timeout = window.setTimeout(() => {
      setSyncState("loading");
      void supabase
        .from("dashboard_states")
        .upsert({
          user_id: user.id,
          clocks,
          settings,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (!error) lastSyncedPayloadRef.current = payload;
          setSyncState(error ? "error" : "synced");
        });
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [clocks, isReady, payload, settings, supabase, syncState, user]);

  async function signIn(provider: "google" | "github") {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    initializedUserRef.current = null;
    lastSyncedPayloadRef.current = null;
  }

  return { configured, signIn, signOut, syncState, user };
}
