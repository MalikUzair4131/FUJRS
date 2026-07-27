"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

const inputClass =
  "mt-1 w-full border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze";
const labelClass = "font-body text-label-sm uppercase tracking-widest text-on-surface-variant";

function NameSection({ initialName }: { initialName: string }) {
  const { updateName } = useAuth();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error ?? "Could not update name.");
      setSaving(false);
      return;
    }

    await updateName(name);
    setSaving(false);
    setMessage("Name updated.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="settings-name" className={labelClass}>
          Full Name
        </label>
        <input
          id="settings-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      {message && <p className="font-label-sm text-marketplace-bronze">{message}</p>}
      {error && <p className="font-label-sm text-error">{error}</p>}
      <Button type="submit" disabled={saving} variant="secondary">
        {saving ? "Saving…" : "Save Name"}
      </Button>
    </form>
  );
}

function EmailSection({ initialEmail }: { initialEmail: string }) {
  const { updateEmail } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const result = await updateEmail(email);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Check your new email address for a confirmation link.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="settings-email" className={labelClass}>
          Email Address
        </label>
        <input
          id="settings-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>
      {message && <p className="font-label-sm text-marketplace-bronze">{message}</p>}
      {error && <p className="font-label-sm text-error">{error}</p>}
      <Button type="submit" disabled={saving} variant="secondary">
        {saving ? "Saving…" : "Update Email"}
      </Button>
    </form>
  );
}

function PasswordSection() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSaving(true);
    const result = await updatePassword(password);
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    setMessage("Password updated.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="settings-password" className={labelClass}>
          New Password
        </label>
        <input
          id="settings-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="settings-confirm-password" className={labelClass}>
          Confirm New Password
        </label>
        <input
          id="settings-confirm-password"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      {message && <p className="font-label-sm text-marketplace-bronze">{message}</p>}
      {error && <p className="font-label-sm text-error">{error}</p>}
      <Button type="submit" disabled={saving} variant="secondary">
        {saving ? "Saving…" : "Update Password"}
      </Button>
    </form>
  );
}

function AddressSection() {
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/address")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.address) {
          setStreet(data.address.street ?? "");
          setCity(data.address.city ?? "");
          setPostalCode(data.address.postalCode ?? "");
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const res = await fetch("/api/account/address", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ street, city, postalCode }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      setError(data?.error ?? "Could not save address.");
      return;
    }
    setMessage("Address saved.");
  }

  if (!loaded) {
    return <p className="text-body-md text-on-surface-variant">Loading…</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="settings-street" className={labelClass}>
          Street Address
        </label>
        <input
          id="settings-street"
          required
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          className={inputClass}
          placeholder="House number and street name"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="settings-city" className={labelClass}>
            City
          </label>
          <input
            id="settings-city"
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="settings-postal-code" className={labelClass}>
            Postal Code
          </label>
          <input
            id="settings-postal-code"
            required
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      {message && <p className="font-label-sm text-marketplace-bronze">{message}</p>}
      {error && <p className="font-label-sm text-error">{error}</p>}
      <Button type="submit" disabled={saving} variant="secondary">
        {saving ? "Saving…" : "Save Address"}
      </Button>
    </form>
  );
}

export default function AccountSettingsPage() {
  const { session, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login?callbackUrl=/account/settings");
  }, [status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="max-w-container-max mx-auto px-margin-mobile py-16 text-center text-on-surface-variant">
        Loading…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-margin-mobile md:px-margin-desktop py-16">
      <Link
        href="/account"
        className="font-label-sm uppercase tracking-widest text-on-surface-variant hover:text-primary"
      >
        ← Back to Account
      </Link>
      <p className="mt-6 font-body text-label-sm uppercase tracking-widest text-marketplace-bronze">
        My Account
      </p>
      <h1 className="mt-2 font-display text-headline-md">Account Settings</h1>

      <div className="mt-10 space-y-10 divide-y divide-outline-variant/30">
        <div>
          <h2 className="font-headline-sm text-headline-sm mb-6">Name</h2>
          <NameSection initialName={session.user.name} />
        </div>
        <div className="pt-10">
          <h2 className="font-headline-sm text-headline-sm mb-6">Email</h2>
          <EmailSection initialEmail={session.user.email} />
        </div>
        <div className="pt-10">
          <h2 className="font-headline-sm text-headline-sm mb-6">Password</h2>
          <PasswordSection />
        </div>
        <div className="pt-10">
          <h2 className="font-headline-sm text-headline-sm mb-6">Saved Address</h2>
          <p className="mb-6 text-body-md text-on-surface-variant">
            Used to prefill your shipping details at checkout.
          </p>
          <AddressSection />
        </div>
      </div>
    </div>
  );
}
