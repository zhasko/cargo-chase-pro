import { supabase } from "./supabase";
import {
  MOCK_ADMIN_LOGS,
  MOCK_COMPLAINTS,
  MOCK_NOTIFICATIONS,
  MOCK_PAYMENTS,
  MOCK_SUBSCRIPTIONS,
  MOCK_USERS,
  PLAN_PRICES,
} from "./mock-data";
import type {
  Complaint,
  ComplaintReason,
  Notification,
  Order,
  OrderFilters,
  OrderStatus,
  Subscription,
  Truck,
  User,
} from "./types";

const DB_KEY = "argo_data_v1";

interface LocalDB {
  trucks: Truck[];
  favorites: string[];
  complaints: Complaint[];
  notifRead: string[];
  subOverrides: Record<string, Subscription>;
  blocked: Record<string, boolean>;
}

const empty: LocalDB = {
  trucks: [],
  favorites: [],
  complaints: [],
  notifRead: [],
  subOverrides: {},
  blocked: {},
};

function load(): LocalDB {
  if (typeof localStorage === "undefined") return { ...empty };

  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(DB_KEY) || "{}") };
  } catch {
    return { ...empty };
  }
}

function save(db: LocalDB) {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
}

const delay = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 80));
const uid = () => Math.random().toString(36).slice(2, 10);

function mapOrder(row: any): Order {
  return {
    id: row.id,
    owner_id: row.owner_id,
    cargo_name: row.cargo_name,
    vehicle_type: row.vehicle_type,
    weight: Number(row.weight ?? 0),
    volume: Number(row.volume ?? 0),
    from_city: row.from_city,
    to_city: row.to_city,
    from_address: row.from_address ?? undefined,
    to_address: row.to_address ?? undefined,
    loading_date: row.loading_date,
    price: row.price == null ? undefined : Number(row.price),
    currency: row.currency ?? "KZT",
    negotiable: Boolean(row.negotiable),
    comment: row.comment ?? undefined,
    status: row.status ?? "active",
    created_at: row.created_at,
    views: Number(row.views ?? 0),
    phone_views: Number(row.phone_views ?? 0),
    contact_phone: row.contact_phone ?? undefined,
  };
}

function mapTruck(row: any): Truck {
  return {
    id: row.id,
    driver_id: row.driver_id,
    current_city: row.current_city,
    destination_city: row.destination_city ?? "any",
    vehicle_type: row.vehicle_type,
    load_capacity: Number(row.load_capacity ?? 0),
    volume: Number(row.volume ?? 0),
    comment: row.comment ?? undefined,
    ready_date: row.ready_date,
    status: row.status ?? "active",
    created_at: row.created_at,
    views: Number(row.views ?? 0),
    phone_views: Number(row.phone_views ?? 0),
    contact_phone: row.contact_phone ?? undefined,
  };
}

function mapUser(row: any): User {
  return {
    id: row.id,
    phone: row.phone,
    full_name: row.full_name,
    company_name: row.company_name ?? undefined,
    role: row.role,
    status: row.status ?? "active",
    created_at: row.created_at,
  };
}

function mapSubscription(row: any): Subscription {
  return {
    user_id: row.user_id,
    plan: row.plan,
    status: row.status,
    starts_at: row.starts_at,
    expires_at: row.expires_at,
  };
}

// ─── Orders / Supabase ───

export async function archiveOldOrders(): Promise<void> {
  const { error } = await supabase.rpc("archive_old_orders");

  if (error) {
    console.error("archiveOldOrders error:", error);
  }
}

export async function listOrders(filters: OrderFilters = {}): Promise<Order[]> {
  await archiveOldOrders();

  let q = supabase.from("orders").select("*").eq("status", "active");

  if (filters.from) q = q.eq("from_city", filters.from);
  if (filters.to) q = q.eq("to_city", filters.to);
  if (filters.vehicle_type) q = q.eq("vehicle_type", filters.vehicle_type);
  if (filters.min_weight != null) q = q.gte("weight", filters.min_weight);
  if (filters.max_weight != null) q = q.lte("weight", filters.max_weight);
  if (filters.min_volume != null) q = q.gte("volume", filters.min_volume);
  if (filters.max_volume != null) q = q.lte("volume", filters.max_volume);
  if (filters.min_price != null) q = q.gte("price", filters.min_price);
  if (filters.max_price != null) q = q.lte("price", filters.max_price);
  if (filters.negotiable) q = q.eq("negotiable", true);

  if (filters.date && filters.date !== "all") {
    const today = new Date().toISOString().slice(0, 10);

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = tomorrowDate.toISOString().slice(0, 10);

    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() + 7);
    const week = weekDate.toISOString().slice(0, 10);

    if (filters.date === "today") q = q.eq("loading_date", today);
    if (filters.date === "tomorrow") q = q.eq("loading_date", tomorrow);
    if (filters.date === "week") q = q.gte("loading_date", today).lte("loading_date", week);
  }

  if (filters.sort === "price_high") {
    q = q.order("price", { ascending: false, nullsFirst: false });
  } else if (filters.sort === "price_low") {
    q = q.order("price", { ascending: true, nullsFirst: false });
  } else if (filters.sort === "weight") {
    q = q.order("weight", { ascending: false });
  } else if (filters.sort === "volume") {
    q = q.order("volume", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  const { data, error } = await q;

  if (error) {
    console.error("listOrders error:", error);
    return [];
  }

  return (data || []).map(mapOrder);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  await archiveOldOrders();

  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getOrder error:", error);
    return undefined;
  }

  return data ? mapOrder(data) : undefined;
}

export async function listMyOrders(ownerId: string): Promise<Order[]> {
  await archiveOldOrders();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("owner_id", ownerId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listMyOrders error:", error);
    return [];
  }

  return (data || []).map(mapOrder);
}

export async function countTodayOrders(ownerId: string): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .gte("created_at", `${today}T00:00:00`)
    .lt("created_at", `${today}T23:59:59`);

  if (error) {
    console.error("countTodayOrders error:", error);
    return 0;
  }

  return count || 0;
}

export async function createOrder(input: Partial<Order>, ownerId: string): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      owner_id: ownerId,
      cargo_name: input.cargo_name || "",
      vehicle_type: input.vehicle_type || "",
      weight: input.weight || 0,
      volume: input.volume || 0,
      from_city: input.from_city || "",
      to_city: input.to_city || "",
      from_address: input.from_address || null,
      to_address: input.to_address || null,
      loading_date: input.loading_date ? input.loading_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      price: input.negotiable ? null : input.price ?? null,
      currency: "KZT",
      negotiable: Boolean(input.negotiable),
      comment: input.comment || null,
      status: "active",
      views: 0,
      phone_views: 0,
      contact_phone: input.contact_phone || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createOrder error:", error);
    throw new Error(error.message);
  }

  return mapOrder(data);
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<void> {
  const payload: Record<string, any> = { ...patch };

  if (payload.loading_date) payload.loading_date = String(payload.loading_date).slice(0, 10);
  if (payload.negotiable) payload.price = null;

  const { error } = await supabase.from("orders").update(payload).eq("id", id);

  if (error) {
    console.error("updateOrder error:", error);
    throw new Error(error.message);
  }
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const payload: Record<string, any> = { status };

  if (status === "active") {
    payload.created_at = new Date().toISOString();
  }

  const { error } = await supabase.from("orders").update(payload).eq("id", id);

  if (error) {
    console.error("setOrderStatus error:", error);
    throw new Error(error.message);
  }
}

export async function bumpView(id: string): Promise<void> {
  const { error } = await supabase.rpc("increment_order_views", { order_id: id });
  if (error) console.error("bumpView error:", error);
}

export async function bumpPhoneView(id: string): Promise<void> {
  const { error } = await supabase.rpc("increment_order_phone_views", { order_id: id });
  if (error) console.error("bumpPhoneView error:", error);
}

// ─── Favorites / local ───

export function listFavorites(): string[] {
  return load().favorites;
}

export async function toggleFavorite(orderId: string): Promise<boolean> {
  const db = load();
  const has = db.favorites.includes(orderId);

  db.favorites = has ? db.favorites.filter((x) => x !== orderId) : [...db.favorites, orderId];

  save(db);
  return delay(!has);
}

// ─── Trucks / Supabase ───

export async function listTrucks(
  filters: { city?: string; dest?: string; vehicle_type?: string } = {}
): Promise<Truck[]> {
  let q = supabase.from("trucks").select("*").eq("status", "active");

  if (filters.city) q = q.eq("current_city", filters.city);
  if (filters.dest) q = q.or(`destination_city.eq.${filters.dest},destination_city.eq.any`);
  if (filters.vehicle_type) q = q.eq("vehicle_type", filters.vehicle_type);

  q = q.order("created_at", { ascending: false });

  const { data, error } = await q;

  if (error) {
    console.error("listTrucks error:", error);
    return [];
  }

  return (data || []).map(mapTruck);
}

export async function getTruck(id: string): Promise<Truck | undefined> {
  const { data, error } = await supabase.from("trucks").select("*").eq("id", id).maybeSingle();

  if (error) {
    console.error("getTruck error:", error);
    return undefined;
  }

  return data ? mapTruck(data) : undefined;
}

export async function listMyTrucks(driverId: string): Promise<Truck[]> {
  const { data, error } = await supabase
    .from("trucks")
    .select("*")
    .eq("driver_id", driverId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listMyTrucks error:", error);
    return [];
  }

  return (data || []).map(mapTruck);
}

export async function createTruck(input: Partial<Truck>, driverId: string): Promise<Truck> {
  const { data, error } = await supabase
    .from("trucks")
    .insert({
      driver_id: driverId,
      current_city: input.current_city || "",
      destination_city: input.destination_city || "any",
      vehicle_type: input.vehicle_type || "",
      load_capacity: input.load_capacity || 0,
      volume: input.volume || 0,
      comment: input.comment || null,
      ready_date: input.ready_date ? input.ready_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: "active",
      views: 0,
      phone_views: 0,
      contact_phone: input.contact_phone || null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createTruck error:", error);
    throw new Error(error.message);
  }

  return mapTruck(data);
}

export async function updateTruck(id: string, patch: Partial<Truck>): Promise<void> {
  const payload: Record<string, any> = { ...patch };

  if (payload.ready_date) payload.ready_date = String(payload.ready_date).slice(0, 10);

  const { error } = await supabase.from("trucks").update(payload).eq("id", id);

  if (error) {
    console.error("updateTruck error:", error);
    throw new Error(error.message);
  }
}

export async function setTruckStatus(
  id: string,
  status: "active" | "inactive" | "archived" | "deleted"
): Promise<void> {
  const { error } = await supabase.from("trucks").update({ status }).eq("id", id);

  if (error) {
    console.error("setTruckStatus error:", error);
    throw new Error(error.message);
  }
}

export async function bumpTruckView(id: string): Promise<void> {
  const { error } = await supabase.rpc("increment_truck_views", { truck_id: id });
  if (error) console.error("bumpTruckView error:", error);
}

export async function bumpTruckPhoneView(id: string): Promise<void> {
  const { error } = await supabase.rpc("increment_truck_phone_views", { truck_id: id });
  if (error) console.error("bumpTruckPhoneView error:", error);
}

// ─── Users / profiles ───

export async function getUser(id: string): Promise<User | undefined> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();

  if (!error && data) return mapUser(data);

  const db = load();
  const u = MOCK_USERS.find((x) => x.id === id);

  if (u && db.blocked[id]) return { ...u, status: "blocked" };

  return delay(u);
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "admin")
    .order("created_at", { ascending: false });

  if (!error && data) return data.map(mapUser);

  const db = load();

  return delay(
    MOCK_USERS.filter((u) => u.role !== "admin").map((u) =>
      db.blocked[u.id] ? { ...u, status: "blocked" } : u
    )
  );
}

export async function setUserBlocked(id: string, blocked: boolean): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ status: blocked ? "blocked" : "active" })
    .eq("id", id);

  if (error) {
    console.error("setUserBlocked error:", error);
    throw new Error(error.message);
  }
}

export async function deleteUserAccount(userId: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_user_account", {
    p_user_id: userId,
  });

  if (error) {
    console.error("deleteUserAccount error:", error);
    throw new Error(error.message);
  }
}

export async function hasDriverProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("driver_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("hasDriverProfile error:", error);
    return false;
  }

  return !!data;
}

export async function updateUserRole(userId: string, role: "driver" | "cargo_owner"): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    console.error("updateUserRole error:", error);
    throw new Error(error.message);
  }
}

// ─── Subscriptions / Supabase ───

export async function getSubscription(userId: string): Promise<Subscription | undefined> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getSubscription error:", error);

    const db = load();
    return db.subOverrides[userId] || MOCK_SUBSCRIPTIONS.find((s) => s.user_id === userId);
  }

  return data ? mapSubscription(data) : undefined;
}

export async function isSubscriptionActiveAsync(userId: string): Promise<boolean> {
  const s = await getSubscription(userId);

  if (!s) return false;

  return s.status === "active" && new Date(s.expires_at).getTime() > Date.now();
}

export function getSubscriptionSync(userId: string): Subscription | undefined {
  const db = load();
  return db.subOverrides[userId] || MOCK_SUBSCRIPTIONS.find((s) => s.user_id === userId);
}

export function isSubscriptionActive(userId: string): boolean {
  const s = getSubscriptionSync(userId);

  if (!s) return false;

  return s.status === "active" && new Date(s.expires_at).getTime() > Date.now();
}

export async function giveSubscription(
  userId: string,
  days: number,
  plan: "monthly" | "yearly" | "trial" = "monthly"
): Promise<Subscription> {
  const current = await getSubscription(userId);

  const baseDate =
    current && new Date(current.expires_at).getTime() > Date.now()
      ? new Date(current.expires_at)
      : new Date();

  baseDate.setDate(baseDate.getDate() + days);

  const payload = {
    user_id: userId,
    plan,
    status: "active",
    starts_at: current?.starts_at || new Date().toISOString(),
    expires_at: baseDate.toISOString(),
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    console.error("giveSubscription error:", error);
    throw new Error(error.message);
  }

  if (plan === "monthly" || plan === "yearly") {
    const amount = plan === "yearly" ? 49900 : 4990;

    const { error: paymentError } = await supabase.from("payments").insert({
      user_id: userId,
      amount,
      plan,
      status: "paid",
      source: "admin",
    });

    if (paymentError) {
      console.error("payment insert error:", paymentError);
      throw new Error(paymentError.message);
    }
  }

  return mapSubscription(data);
}

export async function cancelSubscription(userId: string): Promise<void> {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      expires_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("cancelSubscription error:", error);
    throw new Error(error.message);
  }
}

export function subscriptionIsActive(sub?: Subscription): boolean {
  if (!sub) return false;

  return sub.status === "active" && new Date(sub.expires_at).getTime() > Date.now();
}

export async function startTrialSubscription(userId: string): Promise<Subscription> {
  return giveSubscription(userId, 14, "trial");
}

export async function subscribe(userId: string, plan: "monthly" | "yearly"): Promise<Subscription> {
  return giveSubscription(userId, plan === "yearly" ? 365 : 30, plan);
}

export async function extendSubscription(userId: string, days: number): Promise<void> {
  await giveSubscription(userId, days, "monthly");
}

// ─── Notifications / mock ───

export async function listNotifications(userId: string): Promise<Notification[]> {
  const db = load();

  return delay(
    MOCK_NOTIFICATIONS.filter((n) => n.user_id === userId).map((n) => ({
      ...n,
      read: n.read || db.notifRead.includes(n.id),
    }))
  );
}

// ─── Payments / mock ───

export async function listPayments(userId?: string) {
  return delay(userId ? MOCK_PAYMENTS.filter((p) => p.user_id === userId) : MOCK_PAYMENTS);
}

// ─── Complaints / local ───

export async function createComplaint(input: {
  user_id: string;
  target_type: Complaint["target_type"];
  target_id: string;
  reason: ComplaintReason;
  description?: string;
}): Promise<Complaint> {
  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: input.user_id,
      target_type: input.target_type,
      target_id: input.target_id,
      reason: input.reason,
      description: input.description || null,
      status: "new",
    })
    .select("*")
    .single();

  if (error) {
    console.error("createComplaint error:", error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    user_id: data.user_id,
    target_type: data.target_type,
    target_id: data.target_id,
    reason: data.reason,
    description: data.description ?? undefined,
    status: data.status,
    created_at: data.created_at,
  };
}

export async function listComplaints(): Promise<Complaint[]> {
  return delay([...load().complaints, ...MOCK_COMPLAINTS]);
}

export async function listMyComplaints(userId: string): Promise<Complaint[]> {
  return delay([...load().complaints, ...MOCK_COMPLAINTS].filter((c) => c.user_id === userId));
}

// ─── Admin ───

export async function adminStats() {
  const users = await listUsers();
  const orders = await listOrders({ date: "all" });
  const trucks = await listTrucks();

  const subs = await Promise.all(users.map((u) => getSubscription(u.id)));
  const activeSubs = subs.filter(
    (s) => s && s.status === "active" && new Date(s.expires_at).getTime() > Date.now()
  ).length;

  return delay({
    clients: users.filter((u) => u.role === "cargo_owner").length,
    drivers: users.filter((u) => u.role === "driver").length,
    activeOrders: orders.filter((o) => o.status === "active").length,
    archivedOrders: 0,
    activeSearches: trucks.length,
    activeSubs,
    revenue: MOCK_PAYMENTS.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0),
    complaints: MOCK_COMPLAINTS.length,
  });
}

export async function listAdminLogs() {
  return delay(MOCK_ADMIN_LOGS);
}

export async function listAdminOrders(): Promise<Array<Order & { owner?: User }>> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      owner:profiles!orders_owner_id_fkey (
        id,
        phone,
        full_name,
        company_name,
        role,
        status,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAdminOrders error:", error);
    return [];
  }

  return (data || []).map((row: any) => ({
    ...mapOrder(row),
    owner: row.owner ? mapUser(row.owner) : undefined,
  }));
}

export async function deleteAdminOrder(orderId: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "deleted" })
    .eq("id", orderId);

  if (error) {
    console.error("deleteAdminOrder error:", error);
    throw new Error(error.message);
  }
}

export async function listAdminComplaints(): Promise<any[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select(`
      *,
      user:profiles!complaints_user_id_fkey (
        id,
        phone,
        full_name,
        company_name,
        role,
        status,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAdminComplaints error:", error);
    return [];
  }

  return data || [];
}

export async function updateComplaintStatus(
  id: string,
  status: "new" | "reviewed" | "closed"
): Promise<void> {
  const { error } = await supabase
    .from("complaints")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("updateComplaintStatus error:", error);
    throw new Error(error.message);
  }
}

export async function listAdminPayments(range: "day" | "week" | "14days" | "year" = "14days") {
  const from = new Date();

  if (range === "day") from.setDate(from.getDate() - 1);
  if (range === "week") from.setDate(from.getDate() - 7);
  if (range === "14days") from.setDate(from.getDate() - 14);
  if (range === "year") from.setFullYear(from.getFullYear() - 1);

  const { data, error } = await supabase
    .from("payments")
    .select(`
      *,
      user:profiles!payments_user_id_fkey (
        id,
        phone,
        full_name,
        company_name,
        role,
        status,
        created_at
      )
    `)
    .gte("created_at", from.toISOString())
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAdminPayments error:", error);
    return [];
  }

  return data || [];
}

export { PLAN_PRICES };