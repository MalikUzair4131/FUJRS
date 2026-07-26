import { createAdminSupabaseClient, type AppRole, type AppUserProfile } from "./server";

export interface ProductRecord {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  price: number;
  category: string;
  gender: string;
  image_url?: string | null;
  created_at?: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  created_at?: string;
}

export interface OrderRecord {
  id: string;
  user_id: string;
  status: string;
  fabric_total: number;
  stitching_total: number;
  shipping: number;
  total: number;
  first_name: string;
  last_name: string;
  street: string;
  city: string;
  postal_code: string;
  payment_method: string;
  stripe_payment_intent_id?: string | null;
  created_at: string;
}

export interface OrderItemRecord {
  id: string;
  order_id: string;
  product_slug: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  stitching_label?: string | null;
  stitching_add_on?: number | null;
  stitcher_slug?: string | null;
  stitching_status?: string | null;
}

export interface OrderItemPayload {
  productSlug: string;
  title: string;
  image: string;
  price: number;
  qty: number;
  stitchingLabel?: string | null;
  stitchingAddOn?: number | null;
  stitcherSlug?: string | null;
}

export interface ReviewRecord {
  id: string;
  product_slug: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  assigned_stitcher_slug?: string | null;
  created_at?: string;
}

async function getSupabaseClient() {
  return createAdminSupabaseClient();
}

function mapOrderRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    fabricTotal: row.fabric_total,
    stitchingTotal: row.stitching_total,
    shipping: row.shipping,
    total: row.total,
    firstName: row.first_name,
    lastName: row.last_name,
    street: row.street,
    city: row.city,
    postalCode: row.postal_code,
    paymentMethod: row.payment_method,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    createdAt: row.created_at,
  };
}

function mapOrderItemRow(row: any) {
  return {
    id: row.id,
    orderId: row.order_id,
    productSlug: row.product_slug,
    title: row.title,
    image: row.image,
    price: row.price,
    qty: row.qty,
    stitchingLabel: row.stitching_label,
    stitchingAddOn: row.stitching_add_on,
    stitcherSlug: row.stitcher_slug,
    stitchingStatus: row.stitching_status,
  };
}

export const productService = {
  async list() {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as ProductRecord[];
  },

  async getBySlug(slug: string) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data as ProductRecord | null;
  },

  async create(payload: Partial<ProductRecord>) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("products").insert(payload).select().single();
    if (error) throw error;
    return data as ProductRecord;
  },
};

export const categoryService = {
  async list() {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("categories").select("*");
    if (error) throw error;
    return (data ?? []) as CategoryRecord[];
  },
};

export const customerService = {
  async list() {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) throw error;
    return (data ?? []) as CustomerRecord[];
  },
};

export const reviewService = {
  async list(productSlug: string) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("reviews").select("*").eq("product_slug", productSlug);
    if (error) throw error;
    return (data ?? []) as ReviewRecord[];
  },

  async create(payload: Partial<ReviewRecord>) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("reviews").insert(payload).select().single();
    if (error) throw error;
    return data as ReviewRecord;
  },
};

export const orderService = {
  async listByUser(userId: string) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      ...mapOrderRow(row),
      items: (row.order_items ?? []).map(mapOrderItemRow),
    }));
  },

  async getById(id: string, userId?: string) {
    const supabase = await getSupabaseClient();
    let query = supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
    if (userId) query = supabase.from("orders").select("*, order_items(*)").eq("id", id).eq("user_id", userId).maybeSingle();

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return null;
    return {
      ...mapOrderRow(data),
      items: (data.order_items ?? []).map(mapOrderItemRow),
    };
  },

  async create(userId: string, payload: { items: OrderItemPayload[]; fabricTotal: number; stitchingTotal: number; shipping: number; total: number; firstName: string; lastName: string; street: string; city: string; postalCode: string; paymentMethod: string; stripePaymentIntentId?: string | null; }) {
    const supabase = await getSupabaseClient();
    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "CONFIRMED",
        fabric_total: payload.fabricTotal,
        stitching_total: payload.stitchingTotal,
        shipping: payload.shipping,
        total: payload.total,
        first_name: payload.firstName,
        last_name: payload.lastName,
        street: payload.street,
        city: payload.city,
        postal_code: payload.postalCode,
        payment_method: payload.paymentMethod,
        stripe_payment_intent_id: payload.stripePaymentIntentId ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    if (!order) throw new Error("Could not create order");

    const insertedItems = payload.items.map((item) => ({
      order_id: order.id,
      product_slug: item.productSlug,
      title: item.title,
      image: item.image,
      price: item.price,
      qty: item.qty,
      stitching_label: item.stitchingLabel,
      stitching_add_on: item.stitchingAddOn,
      stitcher_slug: item.stitcherSlug,
      stitching_status: item.stitchingLabel ? "Awaiting Measurements" : null,
    }));

    const { data: items, error: itemsError } = await supabase.from("order_items").insert(insertedItems).select();
    if (itemsError) throw itemsError;

    return {
      ...mapOrderRow(order),
      items: (items ?? []).map(mapOrderItemRow),
    };
  },

  async stats() {
    const supabase = await getSupabaseClient();
    const [{ count: totalOrders }, { data: totals }, { data: recent }] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total"),
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(5),
    ]);

    const totalRevenue = (totals ?? []).reduce((sum: number, item: any) => sum + Number(item.total ?? 0), 0);
    return {
      totalOrders: totalOrders ?? 0,
      totalRevenue,
      recentOrders: (recent ?? []).map((row: any) => ({
        id: row.id,
        customer: `${row.first_name} ${row.last_name}`,
        total: row.total,
        status: row.status,
        itemCount: (row.order_items ?? []).length,
      })),
    };
  },
};

export const cartService = {
  async list(userId: string) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("cart_items").select("*").eq("user_id", userId).order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((item: any) => ({
      id: item.id,
      slug: item.product_slug,
      title: item.title,
      image: item.image,
      price: item.price,
      qty: item.qty,
      stitching: item.stitching_label && item.stitching_add_on != null ? { label: item.stitching_label, addOn: item.stitching_add_on } : undefined,
      stitcherSlug: item.stitcher_slug ?? undefined,
    }));
  },

  async sync(userId: string, items: Array<{ slug: string; title: string; image: string; price: number; qty: number; stitching?: { label: string; addOn: number }; stitcherSlug?: string }>) {
    const supabase = await getSupabaseClient();
    await supabase.from("cart_items").delete().eq("user_id", userId);

    if (items.length > 0) {
      const payload = items.map((item) => ({
        user_id: userId,
        product_slug: item.slug,
        title: item.title,
        image: item.image,
        price: item.price,
        qty: item.qty,
        stitching_label: item.stitching?.label ?? null,
        stitching_add_on: item.stitching?.addOn ?? null,
        stitcher_slug: item.stitcherSlug ?? null,
      }));
      const { error } = await supabase.from("cart_items").insert(payload);
      if (error) throw error;
    }
  },
};

export const wishlistService = {
  async list(userId: string) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("wishlist_items").select("product_slug").eq("user_id", userId);
    if (error) throw error;
    return (data ?? []).map((item: any) => item.product_slug);
  },

  async toggle(userId: string, productSlug: string) {
    const supabase = await getSupabaseClient();
    const { data: existing } = await supabase.from("wishlist_items").select("id").eq("user_id", userId).eq("product_slug", productSlug).maybeSingle();
    if (existing) {
      await supabase.from("wishlist_items").delete().eq("id", existing.id);
      return false;
    }

    await supabase.from("wishlist_items").insert({ user_id: userId, product_slug: productSlug });
    return true;
  },
};

export const tailoringService = {
  async getConfig(userId: string) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("tailoring_configs").select("*").eq("user_id", userId).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      measurements: JSON.parse(data.measurements),
      neckline: data.neckline,
      necklinePrice: data.neckline_price,
      sleeve: data.sleeve,
      sleevePrice: data.sleeve_price,
      hemline: data.hemline,
      hemlinePrice: data.hemline_price,
      garmentType: data.garment_type,
      basePrice: data.base_price,
      stitcherSlug: data.stitcher_slug,
    };
  },

  async saveConfig(userId: string, config: any) {
    const supabase = await getSupabaseClient();
    const payload = {
      user_id: userId,
      measurements: JSON.stringify(config.measurements),
      neckline: config.neckline,
      neckline_price: config.necklinePrice,
      sleeve: config.sleeve,
      sleeve_price: config.sleevePrice,
      hemline: config.hemline,
      hemline_price: config.hemlinePrice,
      garment_type: config.garmentType,
      base_price: config.basePrice,
      stitcher_slug: config.stitcherSlug,
    };

    const { error } = await supabase.from("tailoring_configs").upsert(payload, { onConflict: "user_id" });
    if (error) throw error;
  },
};

export const tailoringQueueService = {
  async list(userRole: AppRole, assignedStitcherSlug?: string | null) {
    const supabase = await getSupabaseClient();
    let query = supabase.from("order_items").select("*, orders(id, first_name, last_name, created_at)").not("stitching_label", "is", null);
    if (userRole === "TAILOR") {
      query = query.eq("stitcher_slug", assignedStitcherSlug ?? "__none__");
    }
    const { data, error } = await query.order("created_at", { foreignTable: "orders", ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      orderId: row.orders?.id,
      customer: `${row.orders?.first_name ?? ""} ${row.orders?.last_name ?? ""}`.trim(),
      garment: row.title,
      stitchingLabel: row.stitching_label,
      stitcherSlug: row.stitcher_slug,
      status: row.stitching_status ?? "Awaiting Measurements",
      createdAt: row.orders?.created_at,
    }));
  },

  async updateStatus(itemId: string, status: string) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("order_items").update({ stitching_status: status }).eq("id", itemId).select().single();
    if (error) throw error;
    return data;
  },
};

export const uploadService = {
  async uploadFile(fileBuffer: Buffer, fileName: string, bucket: string, path: string, contentType?: string) {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.storage.from(bucket).upload(path, fileBuffer, {
      contentType,
      upsert: true,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};

export const productDraftService = {
  async list(userRole: AppRole, userId: string) {
    const supabase = await getSupabaseClient();
    let query = supabase.from("product_drafts").select("*");
    if (userRole !== "ADMIN") {
      query = query.eq("vendor_id", userId);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(userId: string, payload: any) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("product_drafts").insert({ vendor_id: userId, ...payload }).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from("product_drafts").update({ status }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  },
};
