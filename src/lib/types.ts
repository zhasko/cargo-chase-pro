export type Role = "cargo_owner" | "driver" | "admin";
export type Lang = "kk" | "ru" | "en";

export type OrderStatus = "active" | "accepted" | "archived" | "deleted";
export type SubPlan = "trial" | "monthly" | "yearly";
export type SubStatus = "active" | "expired";
export type ComplaintStatus = "new" | "in_review" | "closed";
export type ComplaintReason = "fake_order" | "no_answer" | "wrong_info" | "fraud" | "other";

export interface User {
  id: string;
  phone: string;
  full_name: string;
  role: Role;
  status: "active" | "blocked";
  created_at: string;
  company_name?: string;
}

export interface DriverProfile {
  user_id: string;
  vehicle_type: string;
  load_capacity: number;
  volume: number;
}

export interface Order {
  id: string;
  owner_id: string;
  cargo_name: string;
  vehicle_type: string;
  weight: number;
  volume: number;
  from_city: string;
  to_city: string;
  from_address?: string;
  to_address?: string;
  loading_date: string;
  price?: number;
  currency: string;
  negotiable: boolean;
  comment?: string;
  status: OrderStatus;
  created_at: string;
  views: number;
  phone_views: number;
}

export interface Truck {
  id: string;
  driver_id: string;
  current_city: string;
  destination_city: string; // city or "any"
  vehicle_type: string;
  load_capacity: number;
  volume: number;
  comment?: string;
  ready_date: string;
  status: "active" | "inactive";
  created_at: string;
}

export interface Subscription {
  user_id: string;
  plan: SubPlan;
  status: SubStatus;
  starts_at: string;
  expires_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  method: string;
  status: "paid" | "pending" | "failed";
  created_at: string;
  plan: SubPlan | "monthly" | "yearly";
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Complaint {
  id: string;
  user_id: string;
  target_type: "order" | "user" | "truck";
  target_id: string;
  reason: ComplaintReason;
  status: ComplaintStatus;
  created_at: string;
  description?: string;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

export interface OrderFilters {
  from?: string;
  to?: string;
  vehicle_type?: string;
  min_weight?: number;
  max_weight?: number;
  min_volume?: number;
  max_volume?: number;
  min_price?: number;
  max_price?: number;
  negotiable?: boolean;
  date?: "today" | "tomorrow" | "week" | "all";
  sort?: "new" | "price_high" | "price_low" | "weight" | "volume";
}
