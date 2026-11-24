"use client";

import { Truck, CircleCheck, Loader2, MapPin, Navigation, Phone, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type State = "ready" | "riding" | "done" | "cancelled";

export function RiderConsole(p: {
  orderId: string;
  riderKey: string;
  orderNumber: string;
  riderName: string | null;
  customerName: string;
  customerPhone: string;
  address: string;
  instructions: string;
  dest: { lat: number; lng: number } | null;
  items: string[];
  cashToCollect: number | null;
  currency: string;
  initialState: State;
}) {
  const [state, setState] = useState<State>(p.initialState);
  const [sharing, setSharing] = useState(false);
  const [lastSent, setLastSent] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const watch = useRef<number | null>(null);
  const lastPost = useRef(0);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  const post = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch(`/api/rider/${p.orderId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ k: p.riderKey, ...payload }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Something went wrong.");
    },
    [p.orderId, p.riderKey],
  );

  const stopSharing = useCallback(() => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current);
    watch.current = null;
    setSharing(false);
    void wakeLock.current?.release().catch(() => undefined);
    wakeLock.current = null;
  }, []);

  const startSharing = useCallback(() => {
    if (!("geolocation" in navigator)) return setError("This phone can't share its location. Try Chrome.");
    setError(null);
    // Keep the screen awake so the browser keeps sending location.
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock?.request("screen").then((l) => (wakeLock.current = l)).catch(() => undefined);
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastPost.current < 5000) return;
        lastPost.current = now;
        const c = pos.coords;
        post({
          action: "ping",
          lat: c.latitude,
          lng: c.longitude,
          accuracy: Number.isFinite(c.accuracy) ? c.accuracy : null,
          heading: c.heading !== null && Number.isFinite(c.heading) ? c.heading : null,
          speed: c.speed !== null && Number.isFinite(c.speed) ? c.speed : null,
        })
          .then(() => setLastSent(Date.now()))
          .catch((e: Error) => setError(e.message));
      },
      (e) => setError(e.code === 1 ? "Location is blocked. Allow location for this site in your browser settings, then tap Start again." : "Can't get a GPS fix. Move to an open spot."),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    setSharing(true);
  }, [post]);

  // Reopening the page mid-trip resumes sharing straight away.
  useEffect(() => {
    const t = p.initialState === "riding" ? window.setTimeout(startSharing, 0) : undefined;
    return () => {
      window.clearTimeout(t);
      stopSharing();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setBusy(true);
    try {
      await post({ action: "start" });
      setState("riding");
      startSharing();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function delivered() {
    setBusy(true);
    try {
      await post({ action: "delivered" });
      stopSharing();
      setState("done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const mapsUrl = p.dest
    ? `https://www.google.com/maps/dir/?api=1&destination=${p.dest.lat},${p.dest.lng}&travelmode=driving`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.address)}`;
  const money = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency }).format(v / 100);

  return (
    <div className="space-y-4">
      <div className="rounded-[26px] border border-[#ECE7D8] bg-white p-5 shadow-[0_6px_24px_rgba(23,63,43,0.06)]">
        <p className="text-sm font-semibold text-[#5E6B60]">{p.riderName ? `Hi ${p.riderName.split(" ")[0]}, ` : ""}order {p.orderNumber}</p>
        <h1 className="mt-1 text-2xl font-extrabold text-forest">{p.customerName}</h1>
        <p className="mt-2 flex gap-2 text-[#3E4A40]"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#D6336C]" aria-hidden />{p.address || "Address to confirm by phone"}</p>
        {p.instructions && <p className="mt-2 rounded-[14px] bg-[#FDF3CF] px-3 py-2 text-sm text-[#7A5A00]">“{p.instructions}”</p>}
        <ul className="mt-3 text-sm text-[#5E6B60]">{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
        {p.cashToCollect !== null && (
          <p className="mt-3 rounded-[14px] bg-[#FDE9DA] px-3 py-2 text-sm font-semibold text-[#9A4410]">Collect {money(p.cashToCollect)} on delivery</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={`tel:${p.customerPhone.replace(/\s/g, "")}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E1DBC8] py-3 text-sm font-semibold text-forest">
            <Phone className="h-4 w-4" aria-hidden /> Call
          </a>
          <a href={mapsUrl} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#E1DBC8] py-3 text-sm font-semibold text-forest">
            <Navigation className="h-4 w-4" aria-hidden /> Directions
          </a>
        </div>
      </div>

      {state === "ready" && (
        <button onClick={start} disabled={busy} className="flex w-full items-center justify-center gap-3 rounded-[22px] bg-[#E7752B] py-5 text-lg font-extrabold text-white shadow-[0_10px_30px_rgba(231,117,43,0.35)] disabled:opacity-60">
          {busy ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <Truck className="h-6 w-6" aria-hidden />} Start delivery
        </button>
      )}

      {state === "riding" && (
        <>
          <div className="flex items-center gap-3 rounded-[22px] bg-white p-4">
            <span className="relative grid h-10 w-10 place-items-center">
              {sharing && <span className="admin-ping absolute inset-1 rounded-full bg-[#2F8F4E]" aria-hidden />}
              <span className="relative h-4 w-4 rounded-full" style={{ backgroundColor: sharing ? "#2F8F4E" : "#C9C3B1" }} />
            </span>
            <div className="flex-1 text-sm">
              <p className="font-bold text-forest">{sharing ? "Sharing your location" : "Location paused"}</p>
              <p className="text-[#5E6B60]">{lastSent ? `Last sent ${new Date(lastSent).toLocaleTimeString("en-GB")}` : "Waiting for GPS…"} · keep this page open</p>
            </div>
            {!sharing && <button onClick={startSharing} className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white">Resume</button>}
          </div>
          <button onClick={delivered} disabled={busy} className="flex w-full items-center justify-center gap-3 rounded-[22px] bg-[#2F8F4E] py-5 text-lg font-extrabold text-white shadow-[0_10px_30px_rgba(47,143,78,0.35)] disabled:opacity-60">
            {busy ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden /> : <CircleCheck className="h-6 w-6" aria-hidden />} Mark as delivered
          </button>
        </>
      )}

      {state === "done" && (
        <div className="rounded-[22px] bg-[#E3F3E6] p-5 text-center text-[#1D5E32]">
          <CircleCheck className="mx-auto h-10 w-10" aria-hidden />
          <p className="mt-2 text-lg font-extrabold">Delivered. Thank you!</p>
          <p className="text-sm">Location sharing has stopped.</p>
        </div>
      )}
      {state === "cancelled" && <p className="rounded-[22px] bg-[#FBE2EB] p-5 font-semibold text-[#9C1F4C]">This order was cancelled. Please return to the kitchen.</p>}

      {error && (
        <p role="alert" className="flex gap-2 rounded-[18px] bg-[#FBE2EB] p-4 text-sm text-[#9C1F4C]"><TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />{error}</p>
      )}
      <p className="text-center text-xs text-[#5E6B60]">Your location is only shared while a delivery is in progress, and stops when you mark it delivered.</p>
    </div>
  );
}
