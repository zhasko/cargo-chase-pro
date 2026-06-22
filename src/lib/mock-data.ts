import { daysFromNow } from "./format";
import type {
  AdminLog,
  Complaint,
  Notification,
  Order,
  Payment,
  Subscription,
  Truck,
  User,
} from "./types";

const MAJOR_CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Қарағанды",
  "Ақтөбе",
  "Тараз",
  "Павлодар",
  "Өскемен",
  "Семей",
  "Атырау",
  "Қостанай",
  "Қызылорда",
  "Ақтау",
  "Орал",
  "Түркістан",
  "Көкшетау",
  "Талдықорған",
  "Қонаев",
  "Петропавл",
  "Жезқазған",
];

const OTHER_CITIES = [
  "Абай",
  "Абай ауданы",
  "Ақкөл",
  "Ақсай",
  "Ақсу",
  "Ақсуат",
  "Ақтоғай",
  "Ақтоғай ауданы",
  "Ақсу ауданы",
  "Ақсу-Аюлы",
  "Алға",
  "Алға ауданы",
  "Алакөл ауданы",
  "Арал ауданы",
  "Арқалық",
  "Арыс",
  "Аягөз",
  "Атбасар",
  "Атбасар ауданы",
  "Бадамша",
  "Байқоңыр",
  "Байзақ ауданы",
  "Балқаш",
  "Балқаш ауданы",
  "Бейнеу",
  "Бейнеу ауданы",
  "Боралдай",
  "Бөрлі ауданы",
  "Бұқар жырау ауданы",
  "Екібастұз",
  "Ерейментау",
  "Ерейментау ауданы",
  "Есік",
  "Есіл",
  "Есіл ауданы",
  "Жаңаарқа ауданы",
  "Жаңақорған",
  "Жаңақорған ауданы",
  "Жаңаөзен",
  "Жаңатас",
  "Жаркент",
  "Жарқайың ауданы",
  "Жетісай",
  "Жетісай ауданы",
  "Зайсан",
  "Зайсан ауданы",
  "Индер ауданы",
  "Исатай ауданы",
  "Қандыағаш",
  "Қарабалық ауданы",
  "Қарасай ауданы",
  "Қаратау",
  "Қарғалы ауданы",
  "Қарқаралы",
  "Қарқаралы ауданы",
  "Қармақшы",
  "Қаскелең",
  "Қазалы",
  "Қазығұрт ауданы",
  "Кентау",
  "Көкпекті ауданы",
  "Қордай",
  "Қордай ауданы",
  "Құлсары",
  "Құрманғазы ауданы",
  "Лисаковск",
  "Макинск",
  "Мақат",
  "Мақат ауданы",
  "Мақтаарал ауданы",
  "Меркі",
  "Меркі ауданы",
  "Мұғалжар ауданы",
  "Наурызбай ауданы",
  "Панфилов ауданы",
  "Райымбек ауданы",
  "Риддер",
  "Рудный",
  "Сайрам ауданы",
  "Саран",
  "Сарқан",
  "Сарыағаш",
  "Сарыағаш ауданы",
  "Сәтбаев",
  "Степногорск",
  "Сырым ауданы",
  "Талас ауданы",
  "Талғар",
  "Талғар ауданы",
  "Текелі",
  "Теміртау",
  "Тереңөзек",
  "Теректі ауданы",
  "Тобыл",
  "Түлкібас ауданы",
  "Ұйғыр ауданы",
  "Үшарал",
  "Үштөбе",
  "Хромтау",
  "Шардара",
  "Шардара ауданы",
  "Шахтинск",
  "Шелек",
  "Шет ауданы",
  "Шиелі",
  "Шу",
  "Шу ауданы",
  "Щучинск",
];

export const CITIES = [
  ...MAJOR_CITIES,
  ...OTHER_CITIES.sort((a, b) => a.localeCompare(b, "kk")),
];

export const VEHICLE_TYPES = [
  "Тент",
  "Шторка",
  "Бортовой",
  "Открытый платформа",

  "Рефрижератор",
  "Изотерм",

  "Контейнер 20'",
  "Контейнер 40'",
  "Контейнеровоз",

  "Самосвал",
  "Цементовоз",
  "Зерновоз",

  "Цистерна",
  "Бензовоз",
  "Газовоз",

  "Автовоз",
  "Манипулятор",
  "Кран",

  "Трал",
  "Низкорамный трал",

  "Микроавтобус",
  "Фургон",
  "Пикап",

  "Мега",
  "Jumbo",

  "Лесовоз",
  "Скотовоз",

  "Кез келген көлік",
];

export const PAYMENT_METHODS = [
  { id: "kaspi_qr", label: "Kaspi QR" },
  { id: "kaspi", label: "Kaspi" },
  { id: "visa", label: "Visa" },
  { id: "mastercard", label: "Mastercard" },
  { id: "halyk", label: "Halyk Pay" },
];

export const PLAN_PRICES = { monthly: 4990, yearly: 49900 };

const cargoNames = ["Ұн", "Цемент", "Құрылыс материалы", "Жемістер", "Көкөністер", "Бөлшектер", "Жиһаз", "Тұрмыстық техника", "Тыңайтқыш", "Сүт өнімдері"];

export const MOCK_USERS: User[] = [
  { id: "u1", phone: "+7 701 000 0001", full_name: "Айдар Сериков", role: "driver", status: "active", created_at: "2026-05-01", company_name: "AS Logistics" },
  { id: "u2", phone: "+7 701 000 0002", full_name: "Бекзат Нұрланов", role: "driver", status: "active", created_at: "2026-05-04" },
  { id: "u3", phone: "+7 701 000 0003", full_name: "Дамир Қали", role: "driver", status: "active", created_at: "2026-05-07" },
  { id: "u4", phone: "+7 701 000 0004", full_name: "Ермек Жанаев", role: "driver", status: "active", created_at: "2026-05-09" },
  { id: "u5", phone: "+7 701 000 0005", full_name: "Қанат Мұратов", role: "driver", status: "active", created_at: "2026-05-12" },
  { id: "u6", phone: "+7 702 000 0001", full_name: "Алия Сатпаева", role: "cargo_owner", status: "active", created_at: "2026-05-02", company_name: "Алтын Дән" },
  { id: "u7", phone: "+7 702 000 0002", full_name: "Мейрам Қасымов", role: "cargo_owner", status: "active", created_at: "2026-05-03", company_name: "Steppe Trade" },
  { id: "u8", phone: "+7 702 000 0003", full_name: "Жанар Омарова", role: "cargo_owner", status: "active", created_at: "2026-05-06" },
  { id: "u9", phone: "+7 702 000 0004", full_name: "Серік Әбілов", role: "cargo_owner", status: "blocked", created_at: "2026-05-08", company_name: "Tulpar" },
  { id: "u10", phone: "+7 702 000 0005", full_name: "Гүлмира Тұрар", role: "cargo_owner", status: "active", created_at: "2026-05-10" },
  { id: "admin1", phone: "+7 700 000 0000", full_name: "ARGO Admin", role: "admin", status: "active", created_at: "2026-01-01" },
];

export const MOCK_ORDERS: Order[] = Array.from({ length: 20 }).map((_, i) => {
  const fromIdx = i % CITIES.length;
  const toIdx = (i + 3) % CITIES.length;
  return {
    id: `o${i + 1}`,
    owner_id: MOCK_USERS[5 + (i % 5)].id,
    cargo_name: cargoNames[i % cargoNames.length],
    vehicle_type: VEHICLE_TYPES[i % VEHICLE_TYPES.length],
    weight: 5 + (i % 15),
    volume: 20 + ((i * 4) % 80),
    from_city: CITIES[fromIdx],
    to_city: CITIES[toIdx],
    from_address: "Сейфуллина к. 100",
    to_address: "Абай д. 25",
    loading_date: daysFromNow(i % 10),
    price: i % 4 === 0 ? undefined : 250000 + i * 25000,
    currency: "KZT",
    negotiable: i % 4 === 0,
    comment: i % 3 === 0 ? "Шұғыл. Факт бойынша төлем." : undefined,
    status: i < 16 ? "active" : "archived",
    created_at: daysFromNow(-i),
    views: 5 + i * 7,
    phone_views: i * 2,
  };
});

export const MOCK_TRUCKS: Truck[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `t${i + 1}`,
  driver_id: MOCK_USERS[i % 5].id,
  current_city: CITIES[i % CITIES.length],
  destination_city: i % 3 === 0 ? "any" : CITIES[(i + 4) % CITIES.length],
  vehicle_type: VEHICLE_TYPES[i % VEHICLE_TYPES.length],
  load_capacity: 10 + (i % 10) * 2,
  volume: 40 + ((i * 5) % 60),
  comment: i % 2 === 0 ? "Бүгін жүктеуге дайын" : undefined,
  ready_date: daysFromNow(i % 5),
  status: "active",
  created_at: daysFromNow(-i),
}));

export const MOCK_SUBSCRIPTIONS: Subscription[] = MOCK_USERS
  .filter((u) => u.role === "driver")
  .map((u, i) => ({
    user_id: u.id,
    plan: i === 0 ? "yearly" : i === 1 ? "monthly" : "trial",
    status: i < 3 ? "active" : "expired",
    starts_at: daysFromNow(-30),
    expires_at: daysFromNow(i === 0 ? 300 : i === 1 ? 20 : 5),
  }));

export const MOCK_PAYMENTS: Payment[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `p${i + 1}`,
  user_id: MOCK_USERS[i % 5].id,
  amount: i % 2 === 0 ? 4990 : 49900,
  currency: "KZT",
  method: PAYMENT_METHODS[i % PAYMENT_METHODS.length].id,
  status: (["paid", "paid", "pending", "failed"] as const)[i % 4],
  created_at: daysFromNow(-i * 3),
  plan: i % 2 === 0 ? "monthly" : "yearly",
}));

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", user_id: "u1", title: "Маршрут бойынша жаңа жүк", body: "Алматы → Астана, ұн, 20т", type: "new_cargo", read: false, created_at: daysFromNow(0) },
  { id: "n2", user_id: "u1", title: "Жазылу аяқталып жатыр", body: "3 күн қалды", type: "sub_ending", read: false, created_at: daysFromNow(-1) },
  { id: "n3", user_id: "u1", title: "Жаңа жүк", body: "Шымкент → Тараз", type: "new_cargo", read: true, created_at: daysFromNow(-2) },
  { id: "n4", user_id: "u6", title: "Тапсырыс жарияланды", body: "Жүгіңіз орналастырылды", type: "order_published", read: true, created_at: daysFromNow(-1) },
];

export const MOCK_COMPLAINTS: Complaint[] = [
  { id: "c1", user_id: "u1", target_type: "order", target_id: "o3", reason: "no_answer", status: "new", created_at: daysFromNow(-1), description: "Екінші күн трубка алмайды" },
  { id: "c2", user_id: "u2", target_type: "order", target_id: "o5", reason: "fake_order", status: "in_review", created_at: daysFromNow(-3) },
  { id: "c3", user_id: "u6", target_type: "user", target_id: "u3", reason: "fraud", status: "closed", created_at: daysFromNow(-7) },
];

export const MOCK_ADMIN_LOGS: AdminLog[] = [
  { id: "l1", admin_id: "admin1", action: "block_user", entity_type: "user", entity_id: "u9", created_at: daysFromNow(-1) },
  { id: "l2", admin_id: "admin1", action: "close_complaint", entity_type: "complaint", entity_id: "c3", created_at: daysFromNow(-7) },
  { id: "l3", admin_id: "admin1", action: "extend_subscription", entity_type: "subscription", entity_id: "u1", created_at: daysFromNow(-10) },
];
