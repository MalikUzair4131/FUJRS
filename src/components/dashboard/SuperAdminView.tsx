"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { RevenueTrendChart } from "@/components/dashboard/charts/RevenueTrendChart";
import { CategoryBarChart } from "@/components/dashboard/charts/CategoryBarChart";
import { CatalogManager } from "@/components/dashboard/CatalogManager";
import { useToast } from "@/components/ui/Toast";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { DEMO_STATS, DEMO_USERS, DEMO_VENDORS, type DemoVendor } from "@/lib/auth/demoData";
import {
  COMMISSION_TYPES,
  COMMISSION_TYPE_LABELS,
  formatCommissionRate,
  validateCommission,
  type CommissionType,
} from "@/lib/commission";
import type { AppRole } from "@/lib/auth/roles";

type Section = "OVERVIEW" | "CATALOGUE" | "VENDORS" | "USERS" | "ACCESS";

const SECTIONS: { id: Section; label: string }[] = [
  { id: "OVERVIEW", label: "Overview" },
  { id: "CATALOGUE", label: "Catalogue" },
  { id: "VENDORS", label: "Vendors" },
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
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("OVERVIEW");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [usersData, setUsersData] = useState<UsersResponse | null>(null);
  const [vendors, setVendors] = useState<DemoVendor[]>(DEMO_VENDORS);

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

  /**
   * Commission is the Super Admin's alone to set — vendors only ever read it.
   * Validation runs here so a bad rate never reaches the (future) API.
   */
  function updateCommission(id: string, patch: { type?: CommissionType; value?: number }) {
    setVendors((prev) =>
      prev.map((vendor) => {
        if (vendor.id !== id) return vendor;
        const commission = { ...vendor.commission, ...patch };
        const problem = validateCommission(commission);
        if (problem) {
          toast(problem, "info");
          return vendor;
        }
        return { ...vendor, commission };
      })
    );
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

      {section === "VENDORS" && (
        <div className="mt-8">
          <h2 className="font-display text-headline-sm">Vendor Commission</h2>
          <p className="mt-1 max-w-prose text-label-sm text-marketplace-bronze">
            Vendors market products through their referral link and earn on what sells. Only you set
            the rate — changes here update this screen only, they aren&apos;t saved anywhere yet.
          </p>

          <div className="mt-4 overflow-x-auto border border-border-subtle">
            <table className="w-full text-left text-body-md">
              <thead className="bg-surface-container-low text-label-sm uppercase text-text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Referral Code</th>
                  <th className="px-4 py-3 font-medium">Commission Type</th>
                  <th className="px-4 py-3 font-medium">Rate</th>
                  <th className="px-4 py-3 font-medium">Clicks</th>
                  <th className="px-4 py-3 font-medium">Sales</th>
                  <th className="px-4 py-3 font-medium">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="align-middle">
                    <td className="px-4 py-3">
                      <p className="font-medium">{vendor.name}</p>
                      <p className="text-label-sm text-text-muted">{vendor.email}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tracking-widest text-text-muted">
                      {vendor.referralCode}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={vendor.commission.type}
                        onChange={(e) =>
                          updateCommission(vendor.id, { type: e.target.value as CommissionType })
                        }
                        aria-label={`Commission type for ${vendor.name}`}
                        className="border border-outline-variant bg-white px-3 py-2 font-body text-body-md focus:border-marketplace-bronze focus:outline-none"
                      >
                        {COMMISSION_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {COMMISSION_TYPE_LABELS[type]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step={vendor.commission.type === "PERCENT" ? 0.5 : 100}
                          value={vendor.commission.value}
                          onChange={(e) =>
                            updateCommission(vendor.id, { value: Number(e.target.value) })
                          }
                          aria-label={`Commission rate for ${vendor.name}`}
                          className="w-24 border border-outline-variant bg-transparent px-3 py-2 font-body text-body-md focus:border-marketplace-bronze focus:outline-none"
                        />
                        <span className="text-label-sm text-text-muted">
                          {vendor.commission.type === "PERCENT" ? "%" : "PKR"}
                        </span>
                      </div>
                      <p className="mt-1 text-label-sm text-marketplace-bronze">
                        {formatCommissionRate(vendor.commission)} per sale
                      </p>
                    </td>
                    <td className="px-4 py-3 text-text-muted">{vendor.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-text-muted">{vendor.sales.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      PKR {vendor.earned.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 max-w-prose text-label-sm text-text-muted">
            Clicks, sales and earnings are sample figures. Crediting a real sale to a vendor needs
            the backend to read the <code className="font-mono">ref</code> code off the incoming
            link.
          </p>
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
