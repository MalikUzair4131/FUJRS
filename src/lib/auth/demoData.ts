// Sample data for the role dashboards. This build has no backend, so these
// fixtures are what every dashboard renders.
import type { AppRole } from "@/lib/auth/roles";
import { STITCHING_STATUSES } from "@/lib/stitchingStatus";

const DEMO_REVENUE_DAYS = 14;
const DEMO_DAILY_REVENUE_BASE = 45_000;
const DEMO_DAILY_REVENUE_VARIANCE = 30_000;

function buildDemoRevenueSeries() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return Array.from({ length: DEMO_REVENUE_DAYS }, (_, i) => {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - (DEMO_REVENUE_DAYS - 1 - i));
    const wave = Math.sin(i / 2) * DEMO_DAILY_REVENUE_VARIANCE;
    const revenue = Math.max(0, Math.round(DEMO_DAILY_REVENUE_BASE + wave));
    return { date: day.toISOString().slice(0, 10), revenue };
  });
}

export const DEMO_STATS = {
  totalOrders: 128,
  totalRevenue: 5_460_000,
  revenueByDay: buildDemoRevenueSeries(),
  ordersByStatus: [
    { status: "CONFIRMED", count: 96 },
    { status: "PROCESSING", count: 21 },
    { status: "DELIVERED", count: 11 },
  ],
  recentOrders: [
    {
      id: "demo-order-4f2a9c31",
      customer: "Ayesha Raza",
      total: 42500,
      status: "CONFIRMED",
      itemCount: 2,
    },
    {
      id: "demo-order-88b1d740",
      customer: "Bilal Ahmed",
      total: 18900,
      status: "PROCESSING",
      itemCount: 1,
    },
    {
      id: "demo-order-1c7e5b92",
      customer: "Sana Tariq",
      total: 76200,
      status: "DELIVERED",
      itemCount: 3,
    },
    {
      id: "demo-order-a30f6d15",
      customer: "Usman Ali",
      total: 31000,
      status: "CONFIRMED",
      itemCount: 1,
    },
    {
      id: "demo-order-6e94b0c8",
      customer: "Zara Khan",
      total: 54800,
      status: "CONFIRMED",
      itemCount: 2,
    },
  ],
};

export const DEMO_USERS: {
  users: { id: string; name: string; email: string; role: AppRole }[];
  roleCounts: { role: AppRole; count: number }[];
} = {
  users: [
    { id: "demo-customer", name: "Demo Customer", email: "user@gmail.com", role: "CUSTOMER" },
    { id: "demo-admin", name: "Demo Admin", email: "admin@gmail.com", role: "ADMIN" },
    { id: "demo-vendor", name: "Demo Vendor", email: "vendor@gmail.com", role: "VENDOR" },
    { id: "demo-tailor", name: "Demo Tailor", email: "tailor@gmail.com", role: "TAILOR" },
    {
      id: "demo-super-admin",
      name: "Demo Super Admin",
      email: "superadmin@gmail.com",
      role: "SUPER_ADMIN",
    },
  ],
  roleCounts: [
    { role: "CUSTOMER", count: 1 },
    { role: "ADMIN", count: 1 },
    { role: "VENDOR", count: 1 },
    { role: "TAILOR", count: 1 },
    { role: "SUPER_ADMIN", count: 1 },
  ],
};

export interface DemoDraft {
  id: string;
  title: string;
  vendorId: string;
  price: number;
  fabric: string;
  category: string;
  gender: string;
  description: string;
  status: string;
  createdAt: string;
}

export const DEMO_DRAFTS: DemoDraft[] = [
  {
    id: "demo-draft-1",
    title: "Ivory Silk Sherwani",
    vendorId: "demo-vendor",
    price: 32000,
    fabric: "Silk",
    category: "Sherwanis",
    gender: "Men",
    description: "Hand-embroidered ivory sherwani with a matching stole.",
    status: "PENDING",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-draft-2",
    title: "Emerald Velvet Waistcoat",
    vendorId: "demo-vendor",
    price: 12500,
    fabric: "Velvet",
    category: "Waistcoats",
    gender: "Men",
    description: "Emerald green velvet waistcoat with brass buttons.",
    status: "APPROVED",
    createdAt: new Date().toISOString(),
  },
];

export interface DemoQueueItem {
  id: string;
  orderId: string;
  customer: string;
  garment: string;
  stitchingLabel: string;
  status: string;
  createdAt: string;
}

export const DEMO_TAILOR_QUEUE: DemoQueueItem[] = [
  {
    id: "demo-queue-1",
    orderId: "demo-order-4f2a9c31",
    customer: "Ayesha Raza",
    garment: "3-Piece Suit",
    stitchingLabel: "Bespoke Fit",
    status: STITCHING_STATUSES[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-queue-2",
    orderId: "demo-order-a30f6d15",
    customer: "Usman Ali",
    garment: "Sherwani",
    stitchingLabel: "Custom Measurements",
    status: STITCHING_STATUSES[1],
    createdAt: new Date().toISOString(),
  },
];
