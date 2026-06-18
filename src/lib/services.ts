/**
 * Service layer — single data-access boundary for the whole app.
 *
 * Today it is backed by mock data + localStorage so the MVP is fully
 * interactive offline. To move to Supabase, replace the body of each function
 * with a Supabase query (server function) — the call sites do not change.
 */
import { daysFromNow } from "./format";
import {
  MOCK_ADMIN_LOGS,
  MOCK_COMPLAINTS,
  MOCK_NOTIFICATIONS,
  MOCK_ORDERS,
  MOCK_PAYMENTS,
  MOCK_SUBSCRIPTIONS,
  MOCK_TRUCKS,
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
  userOrders: Order[];
  userTrucks: Truck[];
  favorites: string[];
  statusOverrides: Record<string, OrderStatus>;
  viewBumps: Record<string, number>;
  phoneBumps: Record<string, number>;
  complaints: Complaint[];
  notifRead: string[];
  subOverrides: Record<string, Subscription>;
  blocked: Record<string, boolean>;
}

const empty: LocalDB = {
  userOrders: [],
  userTrucks: [],
  favorites: [],
  statusOverrides: {},
  viewBumps: {},
  phoneBumps: {},
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
  if (typeof localStorage !== "undefined") localStorage.setItem(DB_KEY, JSON.stringify(db));
}

const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));
const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Orders ───
function allOrdersSync(): Order[] {
  const db = load();
  const merged = [...db.userOrders, ...MOCK_ORDERS.filter((m) => !db.userOrders.some((u) => u.id === m.id))];
  return merged
    .filter((o) => (db.statusOverrides[o.id] || o.status) !== "deleted")
    .map((o) => ({
      ...o,
      status: db.statusOverrides[o.id] || o.status,
      views: (o.views || 0) + (db.viewBumps[o.id] || 0),
      phone_views: (o.phone_views || 0) + (db.phoneBumps[o.id] || 0),
    }));
}

export async function listOrders(filters: OrderFilters = {}): Promise<Order[]> {
  let list = allOrdersSync().filter((o) => o.status === "active");
  const f = filters;
  if (f.from) list = list.filter((o) => o.from_city === f.from);
  if (f.to) list = list.filter((o) => o.to_city === f.to);
  if (f.vehicle_type) list = list.filter((o) => o.vehicle_type === f.vehicle_type);
  if (f.min_weight != null) list = list.filter((o) => o.weight >= f.min_weight!);
  if (f.max_weight != null) list = list.filter((o) => o.weight <= f.max_weight!);
  if (f.min_volume != null) list = list.filter((o) => o.volume >= f.min_volume!);
  if (f.max_volume != null) list = list.filter((o) => o.volume <= f.max_volume!);
  if (f.min_price != null) list = list.filter((o) => (o.price ?? 0) >= f.min_price!);
  if (f.max_price != null) list = list.filter((o) => (o.price ?? Infinity) <= f.max_price!);
  if (f.negotiable) list = list.filter((o) => o.negotiable);
  if (f.date && f.date !== "all") {
    const now = new Date();
    list = list.filter((o) => {
      const d = new Date(o.loading_date);
      const diff = Math.floor((d.getTime() - now.setHours(0, 0, 0, 0)) / 86400000);
      if (f.date === "today") return diff === 0;
      if (f.date === "tomorrow") return diff === 1;
      if (f.date === "week") return diff >= 0 && diff <= 7;
      return true;
    });
  }
  switch (f.sort) {
    case "price_high": list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0)); break;
    case "price_low": list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity)); break;
    case "weight": list.sort((a, b) => b.weight - a.weight); break;
    case "volume": list.sort((a, b) => b.volume - a.volume); break;
    default: list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  }
  return delay(list);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  return delay(allOrdersSync().find((o) => o.id === id));
}

export async function listMyOrders(ownerId: string): Promise<Order[]> {
  return delay(allOrdersSync().filter((o) => o.owner_id === ownerId).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
}

export async function countTodayOrders(ownerId: string): Promise<number> {
  const today = new Date().toDateString();
  return load().userOrders.filter((o) => o.owner_id === ownerId && new Date(o.created_at).toDateString() === today).length;
}

export async function createOrder(input: Partial<Order>, ownerId: string): Promise<Order> {
  const db = load();
  const order: Order = {
    id: "o_" + uid(),
    owner_id: ownerId,
    cargo_name: input.cargo_name || "",
    vehicle_type: input.vehicle_type || "",
    weight: input.weight || 0,
    volume: input.volume || 0,
    from_city: input.from_city || "",
    to_city: input.to_city || "",
    from_address: input.from_address,
    to_address: input.to_address,
    loading_date: input.loading_date || daysFromNow(0),
    price: input.negotiable ? undefined : input.price,
    currency: "KZT",
    negotiable: !!input.negotiable,
    comment: input.comment,
    status: "active",
    created_at: new Date().toISOString(),
    views: 0,
    phone_views: 0,
  };
  db.userOrders.unshift(order);
  save(db);
  return delay(order);
}

export async function updateOrder(id: string, patch: Partial<Order>): Promise<void> {
  const db = load();
  const idx = db.userOrders.findIndex((o) => o.id === id);
  if (idx >= 0) db.userOrders[idx] = { ...db.userOrders[idx], ...patch };
  else {
    const base = MOCK_ORDERS.find((o) => o.id === id);
    if (base) db.userOrders.unshift({ ...base, ...patch });
  }
  save(db);
  return delay(undefined);
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const db = load();
  db.statusOverrides[id] = status;
  if (status === "active") {
    const idx = db.userOrders.findIndex((o) => o.id === id);
    if (idx >= 0) db.userOrders[idx].created_at = new Date().toISOString();
  }
  save(db);
  return delay(undefined);
}

export async function bumpPhoneView(id: string): Promise<void> {
  const db = load();
  db.phoneBumps[id] = (db.phoneBumps[id] || 0) + 1;
  save(db);
  return delay(undefined);
}

// ─── Favorites ───
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

// ─── Trucks ───
function allTrucksSync(): Truck[] {
  const db = load();
  return [...db.userTrucks, ...MOCK_TRUCKS];
}

export async function listTrucks(filters: { city?: string; dest?: string; vehicle_type?: string } = {}): Promise<Truck[]> {
  let list = allTrucksSync().filter((t) => t.status === "active");
  if (filters.city) list = list.filter((t) => t.current_city === filters.city);
  if (filters.dest) list = list.filter((t) => t.destination_city === filters.dest || t.destination_city === "any");
  if (filters.vehicle_type) list = list.filter((t) => t.vehicle_type === filters.vehicle_type);
  return delay(list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
}

export async function getTruck(id: string): Promise<Truck | undefined> {
  return delay(allTrucksSync().find((t) => t.id === id));
}

export async function listMyTrucks(driverId: string): Promise<Truck[]> {
  return delay(allTrucksSync().filter((t) => t.driver_id === driverId));
}

export async function createTruck(input: Partial<Truck>, driverId: string): Promise<Truck> {
  const db = load();
  const truck: Truck = {
    id: "t_" + uid(),
    driver_id: driverId,
    current_city: input.current_city || "",
    destination_city: input.destination_city || "any",
    vehicle_type: input.vehicle_type || "",
    load_capacity: input.load_capacity || 0,
    volume: input.volume || 0,
    comment: input.comment,
    ready_date: input.ready_date || daysFromNow(0),
    status: "active",
    created_at: new Date().toISOString(),
  };
  db.userTrucks.unshift(truck);
  save(db);
  return delay(truck);
}

// ─── Users ───
export async function getUser(id: string): Promise<User | undefined> {
  const db = load();
  const u = MOCK_USERS.find((x) => x.id === id);
  if (u && db.blocked[id]) return { ...u, status: "blocked" };
  return delay(u);
}

export async function listUsers(): Promise<User[]> {
  const db = load();
  return delay(MOCK_USERS.filter((u) => u.role !== "admin").map((u) => (db.blocked[u.id] ? { ...u, status: "blocked" } : u)));
}

export async function setUserBlocked(id: string, blocked: boolean): Promise<void> {
  const db = load();
  db.blocked[id] = blocked;
  save(db);
  return delay(undefined);
}

// ─── Subscriptions ───
export function getSubscriptionSync(userId: string): Subscription | undefined {
  const db = load();
  return db.subOverrides[userId] || MOCK_SUBSCRIPTIONS.find((s) => s.user_id === userId);
}

export async function getSubscription(userId: string): Promise<Subscription | undefined> {
  return delay(getSubscriptionSync(userId));
}

export function isSubscriptionActive(userId: string): boolean {
  const s = getSubscriptionSync(userId);
  if (!s) return false;
  return s.status === "active" && new Date(s.expires_at).getTime() > Date.now();
}

export async function subscribe(userId: string, plan: "monthly" | "yearly"): Promise<Subscription> {
  const db = load();
  const sub: Subscription = {
    user_id: userId,
    plan,
    status: "active",
    starts_at: new Date().toISOString(),
    expires_at: daysFromNow(plan === "yearly" ? 365 : 30),
  };
  db.subOverrides[userId] = sub;
  save(db);
  return delay(sub);
}

export async function extendSubscription(userId: string, days: number): Promise<void> {
  const db = load();
  const cur = getSubscriptionSync(userId);
  const base = cur && new Date(cur.expires_at).getTime() > Date.now() ? new Date(cur.expires_at) : new Date();
  base.setDate(base.getDate() + days);
  db.subOverrides[userId] = {
    user_id: userId,
    plan: cur?.plan || "monthly",
    status: "active",
    starts_at: cur?.starts_at || new Date().toISOString(),
    expires_at: base.toISOString(),
  };
  save(db);
  return delay(undefined);
}

// ─── Notifications ───
export async function listNotifications(userId: string): Promise<Notification[]> {
  const db = load();
  return delay(MOCK_NOTIFICATIONS.filter((n) => n.user_id === userId).map((n) => ({ ...n, read: n.read || db.notifRead.includes(n.id) })));
}

// ─── Payments ───
export async function listPayments(userId?: string) {
  return delay(userId ? MOCK_PAYMENTS.filter((p) => p.user_id === userId) : MOCK_PAYMENTS);
}

// ─── Complaints ───
export async function createComplaint(input: { user_id: string; target_type: Complaint["target_type"]; target_id: string; reason: ComplaintReason; description?: string }): Promise<Complaint> {
  const db = load();
  const c: Complaint = { id: "c_" + uid(), status: "new", created_at: new Date().toISOString(), ...input };
  db.complaints.unshift(c);
  save(db);
  return delay(c);
}

export async function listComplaints(): Promise<Complaint[]> {
  return delay([...load().complaints, ...MOCK_COMPLAINTS]);
}

export async function listMyComplaints(userId: string): Promise<Complaint[]> {
  return delay([...load().complaints, ...MOCK_COMPLAINTS].filter((c) => c.user_id === userId));
}

// ─── Admin ───
export async function adminStats() {
  const users = MOCK_USERS.filter((u) => u.role !== "admin");
  const orders = allOrdersSync();
  const trucks = allTrucksSync();
  return delay({
    clients: users.filter((u) => u.role === "cargo_owner").length,
    drivers: users.filter((u) => u.role === "driver").length,
    activeOrders: orders.filter((o) => o.status === "active").length,
    archivedOrders: orders.filter((o) => o.status === "archived").length,
    activeSearches: trucks.filter((t) => t.status === "active").length,
    activeSubs: MOCK_SUBSCRIPTIONS.filter((s) => s.status === "active").length,
    revenue: MOCK_PAYMENTS.filter((p) => p.status === "paid").reduce((a, p) => a + p.amount, 0),
    complaints: MOCK_COMPLAINTS.length,
  });
}

export async function listAdminLogs() {
  return delay(MOCK_ADMIN_LOGS);
}

export { PLAN_PRICES };
