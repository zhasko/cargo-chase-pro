import { supabase } from "./supabase";
import { PLAN_PRICES } from "./mock-data";

import type {
  Complaint,
  ComplaintReason,
  Order,
  OrderFilters,
  OrderStatus,
  Subscription,
  Truck,
  User,
} from "./types";

// ─────────────────────────────────────────────
// MAPPERS
// ─────────────────────────────────────────────

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
    public_id: row.public_id ?? undefined,

    phone: row.phone,
    full_name: row.full_name,

    company_name: row.company_name ?? undefined,

    role: row.role,

    status: row.status ?? "active",

    created_at: row.created_at,

    avatar_url: row.avatar_url ?? undefined,
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

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

export async function archiveOldOrders(): Promise<void> {
  const { error } = await supabase.rpc("archive_old_orders");

  if (error) {
    console.error("archiveOldOrders error:", error);
  }
}

export async function listOrders(
  filters: OrderFilters = {}
): Promise<Order[]> {
  await archiveOldOrders();

  let q = supabase
    .from("orders")
    .select("*")
    .eq("status", "active");

  if (filters.from) {
    q = q.eq("from_city", filters.from);
  }

  if (filters.to) {
    q = q.eq("to_city", filters.to);
  }

  if (filters.vehicle_type) {
    q = q.eq("vehicle_type", filters.vehicle_type);
  }

  if (filters.min_weight != null) {
    q = q.gte("weight", filters.min_weight);
  }

  if (filters.max_weight != null) {
    q = q.lte("weight", filters.max_weight);
  }

  if (filters.min_volume != null) {
    q = q.gte("volume", filters.min_volume);
  }

  if (filters.max_volume != null) {
    q = q.lte("volume", filters.max_volume);
  }

  if (filters.min_price != null) {
    q = q.gte("price", filters.min_price);
  }

  if (filters.max_price != null) {
    q = q.lte("price", filters.max_price);
  }

  if (filters.negotiable) {
    q = q.eq("negotiable", true);
  }

  if (filters.date && filters.date !== "all") {
    const today = new Date();
    const todayString = today.toISOString().slice(0, 10);

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    const tomorrow = tomorrowDate.toISOString().slice(0, 10);

    const weekDate = new Date();
    weekDate.setDate(weekDate.getDate() + 7);

    const week = weekDate.toISOString().slice(0, 10);

    if (filters.date === "today") {
      q = q.eq("loading_date", todayString);
    }

    if (filters.date === "tomorrow") {
      q = q.eq("loading_date", tomorrow);
    }

    if (filters.date === "week") {
      q = q
        .gte("loading_date", todayString)
        .lte("loading_date", week);
    }
  }

  if (filters.sort === "price_high") {
    q = q.order("price", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (filters.sort === "price_low") {
    q = q.order("price", {
      ascending: true,
      nullsFirst: false,
    });
  } else if (filters.sort === "weight") {
    q = q.order("weight", {
      ascending: false,
    });
  } else if (filters.sort === "volume") {
    q = q.order("volume", {
      ascending: false,
    });
  } else {
    q = q.order("created_at", {
      ascending: false,
    });
  }

  const { data, error } = await q;

  if (error) {
    console.error("listOrders error:", error);
    return [];
  }

  return (data ?? []).map(mapOrder);
}

export async function getOrder(
  id: string
): Promise<Order | undefined> {
  await archiveOldOrders();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getOrder error:", error);
    return undefined;
  }

  return data ? mapOrder(data) : undefined;
}

export async function listMyOrders(
  ownerId: string
): Promise<Order[]> {
  await archiveOldOrders();

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("owner_id", ownerId)
    .neq("status", "deleted")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("listMyOrders error:", error);
    return [];
  }

  return (data ?? []).map(mapOrder);
}

export async function countTodayOrders(
  ownerId: string
): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);

  const { count, error } = await supabase
    .from("orders")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("owner_id", ownerId)
    .gte("created_at", `${today}T00:00:00`)
    .lt("created_at", `${today}T23:59:59`);

  if (error) {
    console.error("countTodayOrders error:", error);
    return 0;
  }

  return count ?? 0;
}

export async function createOrder(
  input: Partial<Order>,
  ownerId: string
): Promise<Order> {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      owner_id: ownerId,

      cargo_name: input.cargo_name ?? "",
      vehicle_type: input.vehicle_type ?? "",

      weight: input.weight ?? 0,
      volume: input.volume ?? 0,

      from_city: input.from_city ?? "",
      to_city: input.to_city ?? "",

      from_address: input.from_address ?? null,
      to_address: input.to_address ?? null,

      loading_date: input.loading_date
        ? input.loading_date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),

      price: input.negotiable
        ? null
        : input.price ?? null,

      currency: "KZT",

      negotiable: Boolean(input.negotiable),

      comment: input.comment ?? null,

      status: "active",

      views: 0,
      phone_views: 0,

      contact_phone: input.contact_phone ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createOrder error:", error);
    throw new Error(error.message);
  }

  return mapOrder(data);
}

export async function updateOrder(
  id: string,
  patch: Partial<Order>
): Promise<void> {
  const payload: Record<string, any> = {
    ...patch,
  };

  if (payload.loading_date) {
    payload.loading_date = String(
      payload.loading_date
    ).slice(0, 10);
  }

  if (payload.negotiable) {
    payload.price = null;
  }

  delete payload.id;
  delete payload.owner_id;
  delete payload.created_at;
  delete payload.views;
  delete payload.phone_views;

  const { error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("updateOrder error:", error);
    throw new Error(error.message);
  }
}

export async function setOrderStatus(
  id: string,
  status: OrderStatus
): Promise<void> {
  const payload: Record<string, any> = {
    status,
  };

  if (status === "active") {
    payload.created_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("setOrderStatus error:", error);
    throw new Error(error.message);
  }
}

export async function bumpView(
  id: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "increment_order_views",
    {
      order_id: id,
    }
  );

  if (error) {
    console.error("bumpView error:", error);
  }
}

export async function bumpPhoneView(
  id: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "increment_order_phone_views",
    {
      order_id: id,
    }
  );

  if (error) {
    console.error("bumpPhoneView error:", error);
  }
}

// ─────────────────────────────────────────────
// FAVORITES
// ─────────────────────────────────────────────

export async function listFavorites(
  userId: string
): Promise<string[]> {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("order_id")
    .eq("user_id", userId);

  if (error) {
    console.error("listFavorites error:", error);
    return [];
  }

  return (data ?? []).map((item) => item.order_id);
}

export async function toggleFavorite(
  userId: string,
  orderId: string
): Promise<boolean> {
  if (!userId || !orderId) return false;

  const { data: existing, error: findError } =
    await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("order_id", orderId)
      .maybeSingle();

  if (findError) {
    console.error(
      "toggleFavorite find error:",
      findError
    );
    throw new Error(findError.message);
  }

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);

    if (error) {
      console.error(
        "toggleFavorite delete error:",
        error
      );
      throw new Error(error.message);
    }

    return false;
  }

  const { error } = await supabase
    .from("favorites")
    .insert({
      user_id: userId,
      order_id: orderId,
    });

  if (error) {
    console.error(
      "toggleFavorite insert error:",
      error
    );
    throw new Error(error.message);
  }

  return true;
}

// ─────────────────────────────────────────────
// TRUCKS
// ─────────────────────────────────────────────

export async function listTrucks(
  filters: {
    city?: string;
    dest?: string;
    vehicle_type?: string;
  } = {}
): Promise<Truck[]> {
  let q = supabase
    .from("trucks")
    .select("*")
    .eq("status", "active");

  if (filters.city) {
    q = q.eq(
      "current_city",
      filters.city
    );
  }

  if (filters.dest) {
    q = q.or(
      `destination_city.eq.${filters.dest},destination_city.eq.any`
    );
  }

  if (filters.vehicle_type) {
    q = q.eq(
      "vehicle_type",
      filters.vehicle_type
    );
  }

  q = q.order("created_at", {
    ascending: false,
  });

  const { data, error } = await q;

  if (error) {
    console.error("listTrucks error:", error);
    return [];
  }

  return (data ?? []).map(mapTruck);
}

export async function getTruck(
  id: string
): Promise<Truck | undefined> {
  const { data, error } = await supabase
    .from("trucks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getTruck error:", error);
    return undefined;
  }

  return data ? mapTruck(data) : undefined;
}

export async function listMyTrucks(
  driverId: string
): Promise<Truck[]> {
  const { data, error } = await supabase
    .from("trucks")
    .select("*")
    .eq("driver_id", driverId)
    .neq("status", "deleted")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("listMyTrucks error:", error);
    return [];
  }

  return (data ?? []).map(mapTruck);
}

export async function createTruck(
  input: Partial<Truck>,
  driverId: string
): Promise<Truck> {
  const { data, error } = await supabase
    .from("trucks")
    .insert({
      driver_id: driverId,

      current_city: input.current_city ?? "",
      destination_city:
        input.destination_city ?? "any",

      vehicle_type: input.vehicle_type ?? "",

      load_capacity:
        input.load_capacity ?? 0,

      volume: input.volume ?? 0,

      comment: input.comment ?? null,

      ready_date: input.ready_date
        ? input.ready_date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),

      status: "active",

      views: 0,
      phone_views: 0,

      contact_phone:
        input.contact_phone ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createTruck error:", error);
    throw new Error(error.message);
  }

  return mapTruck(data);
}

export async function updateTruck(
  id: string,
  patch: Partial<Truck>
): Promise<void> {
  const payload: Record<string, any> = {
    ...patch,
  };

  if (payload.ready_date) {
    payload.ready_date = String(
      payload.ready_date
    ).slice(0, 10);
  }

  delete payload.id;
  delete payload.driver_id;
  delete payload.created_at;
  delete payload.views;
  delete payload.phone_views;

  const { error } = await supabase
    .from("trucks")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("updateTruck error:", error);
    throw new Error(error.message);
  }
}

export async function setTruckStatus(
  id: string,
  status:
    | "active"
    | "inactive"
    | "archived"
    | "deleted"
): Promise<void> {
  const { error } = await supabase
    .from("trucks")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error("setTruckStatus error:", error);
    throw new Error(error.message);
  }
}

export async function bumpTruckView(
  id: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "increment_truck_views",
    {
      truck_id: id,
    }
  );

  if (error) {
    console.error("bumpTruckView error:", error);
  }
}

export async function bumpTruckPhoneView(
  id: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "increment_truck_phone_views",
    {
      truck_id: id,
    }
  );

  if (error) {
    console.error(
      "bumpTruckPhoneView error:",
      error
    );
  }
}

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

export async function getUser(
  id: string
): Promise<User | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("getUser error:", error);
    return null;
  }

  return mapUser(data);
}

export async function listUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "admin")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("listUsers error:", error);
    return [];
  }

  return (data ?? []).map(mapUser);
}

export async function setUserBlocked(
  id: string,
  blocked: boolean
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      status: blocked
        ? "blocked"
        : "active",
    })
    .eq("id", id);

  if (error) {
    console.error("setUserBlocked error:", error);
    throw new Error(error.message);
  }
}

export async function deleteUserAccount(
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc(
    "admin_delete_user_account",
    {
      p_user_id: userId,
    }
  );

  if (error) {
    console.error(
      "deleteUserAccount error:",
      error
    );

    throw new Error(error.message);
  }
}

export async function hasDriverProfile(
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("driver_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "hasDriverProfile error:",
      error
    );

    return false;
  }

  return !!data;
}

export async function updateUserRole(
  userId: string,
  role: "driver" | "cargo_owner"
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    console.error(
      "updateUserRole error:",
      error
    );

    throw new Error(error.message);
  }
}

// ─────────────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────────────

export async function getSubscription(
  userId: string
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "getSubscription error:",
      error
    );

    return null;
  }

  return data ? mapSubscription(data) : null;
}

export async function isSubscriptionActiveAsync(
  userId: string
): Promise<boolean> {
  const subscription =
    await getSubscription(userId);

  return subscriptionIsActive(subscription ?? undefined);
}

export function subscriptionIsActive(
  subscription?: Subscription
): boolean {
  if (!subscription) return false;

  return (
    subscription.status === "active" &&
    new Date(subscription.expires_at).getTime() >
      Date.now()
  );
}

// ─────────────────────────────────────────────
// TRIAL / SUBSCRIBE
// ─────────────────────────────────────────────

export async function giveSubscription(
  userId: string,
  days: number,
  plan:
    | "monthly"
    | "yearly"
    | "trial" = "monthly"
): Promise<Subscription> {
  const current =
    await getSubscription(userId);

  // ─────────────────────
  // TRIAL
  // ─────────────────────

  if (plan === "trial") {
    // Trial тек бір рет беріледі.
    if (current) {
      return current;
    }

    const startsAt = new Date();

    const expiresAt = new Date(
      startsAt.getTime() +
        days * 24 * 60 * 60 * 1000
    );

    const payload = {
      user_id: userId,
      plan: "trial" as const,
      status: "active" as const,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(payload, {
        onConflict: "user_id",
      })
      .select("*")
      .single();

    if (error) {
      console.error(
        "giveSubscription trial error:",
        error
      );

      throw new Error(error.message);
    }

    return mapSubscription(data);
  }

  // ─────────────────────
  // MONTHLY / YEARLY
  // ─────────────────────

  const baseDate =
    current &&
    new Date(current.expires_at).getTime() >
      Date.now()
      ? new Date(current.expires_at)
      : new Date();

  const subscriptionDays =
    plan === "yearly"
      ? 365
      : days || 30;

  baseDate.setDate(
    baseDate.getDate() +
      subscriptionDays
  );

  const now = new Date();

  const payload = {
    user_id: userId,

    plan,

    status: "active",

    starts_at:
      current?.starts_at ??
      now.toISOString(),

    expires_at:
      baseDate.toISOString(),
  };

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select("*")
    .single();

  if (error) {
    console.error(
      "giveSubscription error:",
      error
    );

    throw new Error(error.message);
  }

  // Тек ақылы тарифтер үшін payment жазылады.
  const amount =
    plan === "yearly"
      ? 49900
      : 4990;

  const { error: paymentError } =
    await supabase
      .from("payments")
      .insert({
        user_id: userId,
        amount,
        plan,
        status: "paid",
        source: "admin",
      });

  if (paymentError) {
    console.error(
      "payment insert error:",
      paymentError
    );

    throw new Error(
      paymentError.message
    );
  }

  return mapSubscription(data);
}

export async function startTrialSubscription(
  userId: string
): Promise<Subscription> {
  return giveSubscription(
    userId,
    30,
    "trial"
  );
}

export async function subscribe(
  userId: string,
  plan: "monthly" | "yearly"
): Promise<Subscription> {
  return giveSubscription(
    userId,
    plan === "yearly" ? 365 : 30,
    plan
  );
}

export async function extendSubscription(
  userId: string,
  days: number
): Promise<void> {
  await giveSubscription(
    userId,
    days,
    "monthly"
  );
}

export async function cancelSubscription(
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "cancelled",
      expires_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error(
      "cancelSubscription error:",
      error
    );

    throw new Error(error.message);
  }
}

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

export async function listPayments(
  userId?: string
) {
  let q = supabase
    .from("payments")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (userId) {
    q = q.eq("user_id", userId);
  }

  const { data, error } = await q;

  if (error) {
    console.error(
      "listPayments error:",
      error
    );

    return [];
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// COMPLAINTS
// ─────────────────────────────────────────────

export async function createComplaint(
  input: {
    user_id: string;
    target_type: Complaint["target_type"];
    target_id: string;
    reason: ComplaintReason;
    description?: string;
  }
): Promise<Complaint> {
  const { data, error } = await supabase
    .from("complaints")
    .insert({
      user_id: input.user_id,
      target_type: input.target_type,
      target_id: input.target_id,
      reason: input.reason,
      description:
        input.description ?? null,
      status: "new",
    })
    .select("*")
    .single();

  if (error) {
    console.error(
      "createComplaint error:",
      error
    );

    throw new Error(error.message);
  }

  return {
    id: data.id,
    user_id: data.user_id,

    target_type:
      data.target_type,

    target_id:
      data.target_id,

    reason: data.reason,

    description:
      data.description ??
      undefined,

    status: data.status,

    created_at:
      data.created_at,
  };
}

export async function listComplaints(): Promise<
  Complaint[]
> {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "listComplaints error:",
      error
    );

    return [];
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

export async function adminStats() {
  const [
    users,
    orders,
    trucks,
  ] = await Promise.all([
    listUsers(),
    listOrders({
      date: "all",
    }),
    listTrucks(),
  ]);

  const subscriptions =
    await Promise.all(
      users.map((user) =>
        getSubscription(user.id)
      )
    );

  const activeSubs =
    subscriptions.filter(
      (subscription) =>
        subscriptionIsActive(
          subscription ??
            undefined
        )
    ).length;

  const { data: payments } =
    await supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid");

  const { count: complaintsCount } =
    await supabase
      .from("complaints")
      .select("id", {
        count: "exact",
        head: true,
      });

  const revenue =
    (payments ?? []).reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.amount ?? 0
        ),
      0
    );

  const { count: archivedOrders } =
    await supabase
      .from("orders")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "archived");

  return {
    clients: users.filter(
      (user) =>
        user.role === "cargo_owner"
    ).length,

    drivers: users.filter(
      (user) =>
        user.role === "driver"
    ).length,

    activeOrders:
      orders.filter(
        (order) =>
          order.status === "active"
      ).length,

    archivedOrders:
      archivedOrders ?? 0,

    activeSearches:
      trucks.length,

    activeSubs,

    revenue,

    complaints:
      complaintsCount ?? 0,
  };
}

// ─────────────────────────────────────────────
// ADMIN ORDERS
// ─────────────────────────────────────────────

export async function listAdminOrders(): Promise<
  Array<Order & { owner?: User }>
> {
  const { data, error } =
    await supabase
      .from("orders")
      .select(`
        *,
        owner:profiles!orders_owner_id_fkey (
          id,
          public_id,
          phone,
          full_name,
          company_name,
          role,
          status,
          created_at,
          avatar_url
        )
      `)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(
      "listAdminOrders error:",
      error
    );

    return [];
  }

  return (data ?? []).map(
    (row: any) => ({
      ...mapOrder(row),

      owner: row.owner
        ? mapUser(row.owner)
        : undefined,
    })
  );
}

export async function deleteAdminOrder(
  orderId: string
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "deleted",
    })
    .eq("id", orderId);

  if (error) {
    console.error(
      "deleteAdminOrder error:",
      error
    );

    throw new Error(error.message);
  }
}

// ─────────────────────────────────────────────
// ADMIN COMPLAINTS
// ─────────────────────────────────────────────

export async function listAdminComplaints(): Promise<
  any[]
> {
  const { data, error } =
    await supabase
      .from("complaints")
      .select(`
        *,
        user:profiles!complaints_user_id_fkey (
          id,
          public_id,
          phone,
          full_name,
          company_name,
          role,
          status,
          created_at,
          avatar_url
        )
      `)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(
      "listAdminComplaints error:",
      error
    );

    return [];
  }

  return data ?? [];
}

export async function updateComplaintStatus(
  id: string,
  status:
    | "new"
    | "reviewed"
    | "closed"
): Promise<void> {
  const { error } =
    await supabase
      .from("complaints")
      .update({ status })
      .eq("id", id);

  if (error) {
    console.error(
      "updateComplaintStatus error:",
      error
    );

    throw new Error(error.message);
  }
}

// ─────────────────────────────────────────────
// ADMIN PAYMENTS
// ─────────────────────────────────────────────

export async function listAdminPayments(
  range:
    | "day"
    | "week"
    | "14days"
    | "year" = "14days"
) {
  const from = new Date();

  if (range === "day") {
    from.setDate(
      from.getDate() - 1
    );
  }

  if (range === "week") {
    from.setDate(
      from.getDate() - 7
    );
  }

  if (range === "14days") {
    from.setDate(
      from.getDate() - 14
    );
  }

  if (range === "year") {
    from.setFullYear(
      from.getFullYear() - 1
    );
  }

  const { data, error } =
    await supabase
      .from("payments")
      .select(`
        *,
        user:profiles!payments_user_id_fkey (
          id,
          public_id,
          phone,
          full_name,
          company_name,
          role,
          status,
          created_at,
          avatar_url
        )
      `)
      .gte(
        "created_at",
        from.toISOString()
      )
      .eq("status", "paid")
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(
      "listAdminPayments error:",
      error
    );

    return [];
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// PRICES
// ─────────────────────────────────────────────

export {
  PLAN_PRICES,
};

// ─────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  const bucket = "avatars";
  const filePath =
    `${userId}/avatar.png`;

  // 1. Ескі файлды өшіру
  const { error: removeError } =
    await supabase.storage
      .from(bucket)
      .remove([filePath]);

  if (removeError) {
    console.warn(
      "Old avatar remove warning:",
      removeError.message
    );
  }

  // 2. Жаңа файлды жүктеу
  const { error: uploadError } =
    await supabase.storage
      .from(bucket)
      .upload(
        filePath,
        file,
        {
          cacheControl: "3600",
          upsert: true,
          contentType:
            file.type,
        }
      );

  if (uploadError) {
    console.error(
      "Avatar upload error:",
      uploadError
    );

    throw new Error(
      uploadError.message
    );
  }

  // 3. Public URL
  const { data } =
    supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

  const avatarUrl =
    `${data.publicUrl}?v=${Date.now()}`;

  // 4. Profile жаңарту
  const { error: updateError } =
    await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
      })
      .eq("id", userId);

  if (updateError) {
    console.error(
      "Avatar profile update error:",
      updateError
    );

    throw new Error(
      updateError.message
    );
  }

  return avatarUrl;
}