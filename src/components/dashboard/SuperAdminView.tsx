"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { RevenueTrendChart } from "@/components/dashboard/charts/RevenueTrendChart";
import { CategoryBarChart } from "@/components/dashboard/charts/CategoryBarChart";
import { CatalogManager } from "@/components/dashboard/CatalogManager";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { DEMO_STATS, DEMO_USERS } from "@/lib/auth/demoData";
import type { AppRole } from "@/lib/auth/roles";

type Section = "OVERVIEW" | "CATALOGUE" | "USERS" | "ACCESS";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "CATALOGUE", label: "Catalogue" },
  { id: "USERS", label: "Users" },
  { id: "ACCESS", label: "Access" },
];

const ASSIGNABLE_ROLES: AppRole[] = ["CUSTOMER", "ADMIN", "VENDOR", "TAILOR", "SUPER_ADMIN"];

const ACCESS_CATEGORIES = ["Products", "Orders", "Stitching", "Vendors", "Reports"] as const;
const ACCESS_ROLES: AppRole[] = ["ADMIN", "VENDOR", "TAILOR"];

interface StatsResponse {
  totalOrders: number;
  totalRevenue: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: AppRole;
}

interface UsersResponse {
  users: UserRow[];
  roleCounts: { role: AppRole; count: number }[];
}

export function SuperAdminView() {
  // Fixture data throughout — user creation and access toggles update local
  // state only, since there is no backend to persist them to yet.
  const [section, setSection] = useState<Section>("OVERVIEW");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [usersData, setUsersData] = useState<UsersResponse | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("CUSTOMER");

  const [access, setAccess] = useState<Record<AppRole, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = {};
    for (const r of ACCESS_ROLES) {
      initial[r] = Object.fromEntries(ACCESS_CATEGORIES.map((c) => [c, true]));
    }
    return initial as Record<AppRole, Record<string, boolean>>;
  });

  useEffect(() => {
    setStats(DEMO_STATS);
    setUsersData(DEMO_USERS);
  }, []);

  function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      role,
    };
    setUsersData((prev) => {
      const users = [...(prev?.users ?? []), newUser];
      const roleCounts = Object.entries(
        users.reduce<Record<string, number>>((acc, u) => {
          acc[u.role] = (acc[u.role] ?? 0) + 1;
          return acc;
        }, {})
      ).map(([r, count]) => ({ role: r as AppRole, count }));
      return { users, roleCounts };
    });
    setName("");
    setEmail("");
    setPassword("");
    setRole("CUSTOMER");
  }

  function toggleAccess(r: AppRole, category: string) {
    setAccess((prev) => ({
      ...prev,
      [r]: { ...prev[r], [category]: !prev[r][category] },
    }));
  }

  return (
    <div>
      <p className="text-label-sm text-marketplace-bronze uppercase tracking-widest">
        Sample data — this dashboard isn&apos;t connected to a database yet.
      </p>

      <div className="mt-4 flex gap-2 border border-outline-variant p-1 w-fit">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`px-6 py-2.5 label-caps ${
              section === s.id ? "bg-primary text-on-primary" : "text-on-surface"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "OVERVIEW" && (
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Total Orders</p>
              <p className="mt-2 font-display text-headline-sm">
                {stats ? stats.totalOrders.toLocaleString() : "—"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Total Revenue</p>
              <p className="mt-2 font-display text-headline-sm">
                {stats ? `PKR ${stats.totalRevenue.toLocaleString()}` : "—"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Total Users</p>
              <p className="mt-2 font-display text-headline-sm">
                {usersData ? usersData.users.length.toLocaleString() : "—"}
              </p>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Staff Accounts</p>
              <p className="mt-2 font-display text-headline-sm">
                {usersData
                  ? usersData.users.filter((u) => u.role !== "CUSTOMER").length.toLocaleString()
                  : "—"}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">
                Revenue, last {stats?.revenueByDay.length ?? 14} days
              </p>
              <div className="mt-4">
                <RevenueTrendChart
                  data={(stats?.revenueByDay ?? []).map((d) => ({
                    label: d.date.slice(5),
                    value: d.revenue,
                  }))}
                  valueFormatter={(v) => `PKR ${v.toLocaleString()}`}
                  emptyMessage={stats ? "No revenue in this window yet." : "Loading…"}
                />
              </div>
            </div>
            <div className="border border-border-subtle p-6">
              <p className="text-label-sm uppercase text-text-muted">Users by role</p>
              <div className="mt-4">
                <CategoryBarChart
                  data={(usersData?.roleCounts ?? []).map((rc) => ({
                    label: ROLE_LABELS[rc.role],
                    value: rc.count,
                  }))}
                  emptyMessage={usersData ? "No users yet." : "Loading…"}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {section === "CATALOGUE" && (
        <div className="mt-8">
          <CatalogManager />
        </div>
      )}

      {section === "USERS" && (
        <div className="mt-8">
          <h2 className="font-display text-headline-sm">Create User</h2>
          <p className="mt-1 text-label-sm text-marketplace-bronze">
            Adds a user to this screen only — not saved anywhere yet.
          </p>
          <form
            onSubmit={handleCreateUser}
            className="mt-4 grid gap-4 border border-border-subtle p-6 sm:grid-cols-2 lg:grid-cols-5"
          >
            <input
              required
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
            <input
              required
              type="password"
              minLength={8}
              placeholder="Temporary password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-outline-variant bg-transparent px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className="border border-outline-variant bg-white px-4 py-3 font-body text-body-md focus:outline-none focus:border-marketplace-bronze"
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <Button type="submit" variant="primary">
              Create
            </Button>
          </form>

          <h2 className="mt-10 font-display text-headline-sm">All Users</h2>
          <div className="mt-4 overflow-x-auto border border-border-subtle">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {!usersData && (
                  <tr>
                    <td className="px-4 py-6 text-text-muted" colSpan={3}>
                      Loading…
                    </td>
                  </tr>
                )}
                {usersData?.users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-4 py-3">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-label-sm uppercase text-text-muted">
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-label-sm text-text-muted">
            Editing an existing user&apos;s role or deactivating an account isn&apos;t wired up yet
            — there&apos;s no status column on profiles for it (see TASKS.md).
          </p>
        </div>
      )}

      {section === "ACCESS" && (
        <div className="mt-8">
          <p className="text-label-sm text-marketplace-bronze uppercase tracking-widest mb-4">
            Preview only — these toggles are not yet read by any API. Enforcement lands once
            Permission/UserPermission tables exist (REQUIREMENTS.md §4.2).
          </p>
          <div className="overflow-x-auto border border-border-subtle">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3">Role</th>
                  {ACCESS_CATEGORIES.map((c) => (
                    <th key={c} className="px-4 py-3">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {ACCESS_ROLES.map((r) => (
                  <tr key={r}>
                    <td className="px-4 py-3 text-label-sm uppercase text-text-muted">
                      {ROLE_LABELS[r]}
                    </td>
                    {ACCESS_CATEGORIES.map((c) => (
                      <td key={c} className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={access[r][c]}
                          onChange={() => toggleAccess(r, c)}
                          aria-label={`${ROLE_LABELS[r]} access to ${c}`}
                          className="h-4 w-4 accent-marketplace-bronze"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
