import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "./types";

type Dict = Record<string, any>;

const kk: Dict = {
  nav: { home: "Басты бет", orders: "Жүктер", trucks: "Көліктер", pricing: "Тарифтер", faq: "Сұрақтар", contact: "Байланыс", profile: "Профиль", notifications: "Хабарламалар", myCargo: "Жүктерім", admin: "Әкімші", addCargo: "Жүк қосу", addTruck: "Машина қосу" },
  common: { continue: "Жалғастыру", login: "Кіру", logout: "Шығу", cancel: "Болдырмау", save: "Сақтау", delete: "Жою", edit: "Өзгерту", view: "Қарау", call: "Қоңырау", back: "Артқа", next: "Келесі", publish: "Жариялау", search: "Іздеу", filter: "Сүзгі", clear: "Тазарту", from: "Қайдан", to: "Қайда", all: "Барлығы", loading: "Жүктелуде...", empty: "Бос", error: "Қате", success: "Дайын", confirm: "Растау", subscribe: "Жазылу", apply: "Қолдану", reset: "Қалпына келтіру", required: "Бұл өріс міндетті", today: "Бүгін", tomorrow: "Ертең", thisWeek: "Осы апта" },
  home: { heroBadge: "Қазақстан логистикасы", heroTitle: "Жүк пен тасымалдаушыны бір жерден табыңыз", heroSub: "Жүк иелері мен жүргізушілерге арналған заманауи логистика алаңы. Тікелей байланыс, комиссиясыз.", findCargo: "Жүк іздеу", publishCargo: "Жүк қосу", findTruck: "Көлік іздеу", latestCargo: "Соңғы жүктер", latestTrucks: "Қолжетімді көліктер", seeAll: "Барлығы", benefits: "Артықшылықтары", b1: "Жылдам байланыс", b1d: "Жүргізушімен тікелей хабарласыңыз", b2: "Комиссиясыз", b2d: "Делдалсыз тура мәміле", b3: "Бүкіл Қазақстан", b3d: "Барлық қалалар арасында тасымал" },
  auth: { welcome: "ARGO-ға қош келдіңіз", phoneTitle: "Телефон нөмірін енгізіңіз", phoneSub: "Сізге SMS-код жіберіледі", phonePlaceholder: "+7 (___) ___ __ __", sendCode: "Код жіберу", codeTitle: "Кодты енгізіңіз", codeSub: "нөміріне жіберілген 6 саннан тұратын код", resend: "Қайта жіберу", changePhone: "Нөмірді өзгерту", verify: "Растау", terms: "Жалғастыру арқылы сіз шарттар мен құпиялылық саясатын қабылдайсыз", roleTitle: "Рөліңізді таңдаңыз", roleSub: "Кейін профильден өзгерте аласыз", roleOwner: "Жүк иесі", roleOwnerDesc: "Жүк жариялаймын, көлік іздеймін", roleDriver: "Жүргізуші", roleDriverDesc: "Жүк іздеймін, көлік жариялаймын", regTitle: "Профильді толтырыңыз", fullName: "Толық аты-жөні", companyName: "Компания (міндетті емес)", vehicleType: "Көлік түрі", capacity: "Жүк көтерімділігі (т)", volume: "Көлемі (м³)", currentCity: "Қазіргі қала", finish: "Аяқтау", created: "Аккаунт сәтті құрылды", demoHint: "Демо: кез келген 6 сан кодты қабылдайды" },
  order: { name: "Жүк атауы", vehicleType: "Көлік түрі", weight: "Салмағы (т)", volume: "Көлемі (м³)", route: "Маршрут", fromCity: "Қай қаладан", fromAddress: "Нақты тиеу мекенжайы", toCity: "Қай қалаға", toAddress: "Нақты түсіру мекенжайы", loadingDate: "Тиеу күні", price: "Нақты баға (₸)", negotiable: "Келісімді баға", comment: "Қосымша түсініктеме", preview: "Алдын ала қарау", stepCargo: "Жүк", stepRoute: "Маршрут", stepPrice: "Күн мен баға", stepPreview: "Тексеру", publishSuccess: "Жүк жарияланды!", views: "Қаралым", phoneViews: "Телефон көрсетілді", contactLocked: "Байланыс жабық", contactLockedDesc: "Телефонды көру үшін жүргізуші ретінде кіріп, жазылым рәсімдеңіз", showPhone: "Телефонды көрсету", limitReached: "Күндік лимит толды (10 жүк)", detail: "Жүк туралы", noOrders: "Жүктер табылмады", noOrdersDesc: "Сүзгіні өзгертіп көріңіз" },
  truck: { current: "Қазіргі қала", destination: "Баратын қала", anyDirection: "Кез келген бағыт", comment: "Комментарий", readyDate: "Дайын күні", publishTitle: "Бос көлік жариялау", publishSuccess: "Көлік жарияланды!", noTrucks: "Көліктер табылмады", capacity: "Жүк көтерімділігі", driver: "Жүргізуші", activeSearch: "Активный поиск" },
  filters: { title: "Сүзгілер", minWeight: "Мин. салмақ", maxWeight: "Макс. салмақ", minVolume: "Мин. көлем", maxVolume: "Макс. көлем", minPrice: "Мин. баға", maxPrice: "Макс. баға", sort: "Сұрыптау", sortNew: "Ең жаңалары", sortPriceHigh: "Жоғары төлем", sortPriceLow: "Төмен төлем", sortWeight: "Салмағы бойынша", sortVolume: "Көлемі бойынша" },
  pricing: { title: "Тарифтер", sub: "Жүргізушілерге арналған жазылым. Жүк иелеріне тегін.", free: "Тегін", freeDesc: "Жүк иелеріне", trial: "30 күн тегін", monthly: "Айлық", yearly: "Жылдық", perMonth: "/ ай", perYear: "/ жыл", best: "Тиімді", f1: "Клиент телефонын көру", f2: "Толық ақпарат", f3: "Активный поиск жариялау", f4: "Шексіз іздеу", choose: "Таңдау", ownerFree: "Жүк жариялау тегін" },
  profile: { title: "Профиль", myCargo: "Менің жүктерім", myTruck: "Менің көлігім", favorites: "Таңдаулылар", subscription: "Жазылым", payments: "Төлем тарихы", stats: "Статистика", complaints: "Шағымдар", notifications: "Хабарламалар", settings: "Баптаулар", switchRole: "Рөлді ауыстыру", role: "Рөл", phone: "Телефон" },
  sub: { active: "Жазылым белсенді", expired: "Жазылым аяқталды", expiresIn: "күн қалды", trial: "Сынақ кезеңі", renew: "Жаңарту", plan: "Тариф" },
  complaint: { title: "Шағым беру", reason: "Себебі", fake_order: "Жалған тапсырыс", no_answer: "Телефон жауап бермейді", wrong_info: "Қате ақпарат", fraud: "Алаяқтық күдігі", other: "Басқа себеп", description: "Сипаттама", submit: "Жіберу", submitted: "Шағым жіберілді", status_new: "Жаңа", status_in_review: "Қаралуда", status_closed: "Жабық" },
  admin: { dashboard: "Дашборд", users: "Пайдаланушылар", orders: "Жүктер", trucks: "Көліктер", subscriptions: "Жазылымдар", payments: "Төлемдер", complaints: "Шағымдар", logs: "Логтар", settings: "Баптаулар", clients: "Клиенттер", drivers: "Жүргізушілер", activeOrders: "Белсенді жүктер", archivedOrders: "Архив жүктер", activeSearches: "Активный поиск", activeSubs: "Белсенді жазылымдар", block: "Блоктау", unblock: "Блоктан шығару", extend: "Ұзарту", close: "Жабу", revenue: "Кіріс" },
  status: { active: "Белсенді", accepted: "Қабылданды", archived: "Архив", deleted: "Жойылды", blocked: "Бұғатталған" },
};

const ru: Dict = {
  nav: { home: "Главная", orders: "Грузы", trucks: "Транспорт", pricing: "Тарифы", faq: "Вопросы", contact: "Контакты", profile: "Профиль", notifications: "Уведомления", myCargo: "Мои грузы", admin: "Админ", addCargo: "Добавить груз", addTruck: "Добавить машину" },
  common: { continue: "Продолжить", login: "Войти", logout: "Выйти", cancel: "Отмена", save: "Сохранить", delete: "Удалить", edit: "Изменить", view: "Смотреть", call: "Позвонить", back: "Назад", next: "Далее", publish: "Опубликовать", search: "Поиск", filter: "Фильтр", clear: "Очистить", from: "Откуда", to: "Куда", all: "Все", loading: "Загрузка...", empty: "Пусто", error: "Ошибка", success: "Готово", confirm: "Подтвердить", subscribe: "Подписаться", apply: "Применить", reset: "Сбросить", required: "Обязательное поле", today: "Сегодня", tomorrow: "Завтра", thisWeek: "Эта неделя" },
  home: { heroBadge: "Логистика Казахстана", heroTitle: "Найдите груз и перевозчика в одном месте", heroSub: "Современная логистическая площадка для грузовладельцев и водителей. Прямой контакт, без комиссий.", findCargo: "Найти груз", publishCargo: "Добавить груз", findTruck: "Найти машину", latestCargo: "Последние грузы", latestTrucks: "Доступные машины", seeAll: "Все", benefits: "Преимущества", b1: "Быстрый контакт", b1d: "Связывайтесь с водителем напрямую", b2: "Без комиссий", b2d: "Прямая сделка без посредников", b3: "Весь Казахстан", b3d: "Перевозки между всеми городами" },
  auth: { welcome: "Добро пожаловать в ARGO", phoneTitle: "Введите номер телефона", phoneSub: "Мы отправим вам SMS-код", phonePlaceholder: "+7 (___) ___ __ __", sendCode: "Отправить код", codeTitle: "Введите код", codeSub: "6-значный код отправлен на номер", resend: "Отправить снова", changePhone: "Изменить номер", verify: "Подтвердить", terms: "Продолжая, вы принимаете условия и политику конфиденциальности", roleTitle: "Выберите роль", roleSub: "Позже можно изменить в профиле", roleOwner: "Грузовладелец", roleOwnerDesc: "Публикую грузы, ищу транспорт", roleDriver: "Водитель", roleDriverDesc: "Ищу грузы, публикую транспорт", regTitle: "Заполните профиль", fullName: "Полное имя", companyName: "Компания (необязательно)", vehicleType: "Тип транспорта", capacity: "Грузоподъёмность (т)", volume: "Объём (м³)", currentCity: "Текущий город", finish: "Завершить", created: "Аккаунт успешно создан", demoHint: "Демо: подойдёт любой 6-значный код" },
  order: { name: "Название груза", vehicleType: "Тип транспорта", weight: "Вес (т)", volume: "Объём (м³)", route: "Маршрут", fromCity: "Из города", fromAddress: "Точный адрес загрузки", toCity: "В город", toAddress: "Точный адрес выгрузки", loadingDate: "Дата загрузки", price: "Точная цена (₸)", negotiable: "Договорная цена", comment: "Дополнительный комментарий", preview: "Предпросмотр", stepCargo: "Груз", stepRoute: "Маршрут", stepPrice: "Дата и цена", stepPreview: "Проверка", publishSuccess: "Груз опубликован!", views: "Просмотры", phoneViews: "Показов телефона", contactLocked: "Контакт скрыт", contactLockedDesc: "Чтобы увидеть телефон, войдите как водитель и оформите подписку", showPhone: "Показать телефон", limitReached: "Дневной лимит достигнут (10 грузов)", detail: "О грузе", noOrders: "Грузы не найдены", noOrdersDesc: "Попробуйте изменить фильтры" },
  truck: { current: "Текущий город", destination: "Город назначения", anyDirection: "Любое направление", comment: "Комментарий", readyDate: "Дата готовности", publishTitle: "Опубликовать свободную машину", publishSuccess: "Машина опубликована!", noTrucks: "Машины не найдены", capacity: "Грузоподъёмность", driver: "Водитель", activeSearch: "Активный поиск" },
  filters: { title: "Фильтры", minWeight: "Мин. вес", maxWeight: "Макс. вес", minVolume: "Мин. объём", maxVolume: "Макс. объём", minPrice: "Мин. цена", maxPrice: "Макс. цена", sort: "Сортировка", sortNew: "Сначала новые", sortPriceHigh: "Дороже", sortPriceLow: "Дешевле", sortWeight: "По весу", sortVolume: "По объёму" },
  pricing: { title: "Тарифы", sub: "Подписка для водителей. Для грузовладельцев бесплатно.", free: "Бесплатно", freeDesc: "Грузовладельцам", trial: "30 дней бесплатно", monthly: "Месячный", yearly: "Годовой", perMonth: "/ мес", perYear: "/ год", best: "Выгодно", f1: "Просмотр телефона клиента", f2: "Полная информация", f3: "Публикация активного поиска", f4: "Безлимитный поиск", choose: "Выбрать", ownerFree: "Публикация грузов бесплатна" },
  profile: { title: "Профиль", myCargo: "Мои грузы", myTruck: "Моя машина", favorites: "Избранное", subscription: "Подписка", payments: "История платежей", stats: "Статистика", complaints: "Жалобы", notifications: "Уведомления", settings: "Настройки", switchRole: "Сменить роль", role: "Роль", phone: "Телефон" },
  sub: { active: "Подписка активна", expired: "Подписка истекла", expiresIn: "дней осталось", trial: "Пробный период", renew: "Продлить", plan: "Тариф" },
  complaint: { title: "Подать жалобу", reason: "Причина", fake_order: "Фейковый заказ", no_answer: "Не отвечает телефон", wrong_info: "Неверная информация", fraud: "Подозрение в мошенничестве", other: "Другая причина", description: "Описание", submit: "Отправить", submitted: "Жалоба отправлена", status_new: "Новая", status_in_review: "На рассмотрении", status_closed: "Закрыта" },
  admin: { dashboard: "Дашборд", users: "Пользователи", orders: "Грузы", trucks: "Транспорт", subscriptions: "Подписки", payments: "Платежи", complaints: "Жалобы", logs: "Логи", settings: "Настройки", clients: "Клиенты", drivers: "Водители", activeOrders: "Активные грузы", archivedOrders: "Архивные грузы", activeSearches: "Активный поиск", activeSubs: "Активные подписки", block: "Заблокировать", unblock: "Разблокировать", extend: "Продлить", close: "Закрыть", revenue: "Доход" },
  status: { active: "Активный", accepted: "Принят", archived: "Архив", deleted: "Удалён", blocked: "Заблокирован" },
};

const en: Dict = {
  nav: { home: "Home", orders: "Cargo", trucks: "Trucks", pricing: "Pricing", faq: "FAQ", contact: "Contact", profile: "Profile", notifications: "Notifications", myCargo: "My cargo", admin: "Admin", addCargo: "Add cargo", addTruck: "Add truck" },
  common: { continue: "Continue", login: "Log in", logout: "Log out", cancel: "Cancel", save: "Save", delete: "Delete", edit: "Edit", view: "View", call: "Call", back: "Back", next: "Next", publish: "Publish", search: "Search", filter: "Filter", clear: "Clear", from: "From", to: "To", all: "All", loading: "Loading...", empty: "Empty", error: "Error", success: "Done", confirm: "Confirm", subscribe: "Subscribe", apply: "Apply", reset: "Reset", required: "This field is required", today: "Today", tomorrow: "Tomorrow", thisWeek: "This week" },
  home: { heroBadge: "Kazakhstan logistics", heroTitle: "Find cargo and carriers in one place", heroSub: "A modern logistics platform for cargo owners and drivers. Direct contact, no commissions.", findCargo: "Find cargo", publishCargo: "Add cargo", findTruck: "Find a truck", latestCargo: "Latest cargo", latestTrucks: "Available trucks", seeAll: "See all", benefits: "Benefits", b1: "Fast contact", b1d: "Reach the driver directly", b2: "No commissions", b2d: "Direct deal, no middlemen", b3: "All of Kazakhstan", b3d: "Transport between all cities" },
  auth: { welcome: "Welcome to ARGO", phoneTitle: "Enter your phone number", phoneSub: "We'll send you an SMS code", phonePlaceholder: "+7 (___) ___ __ __", sendCode: "Send code", codeTitle: "Enter the code", codeSub: "6-digit code sent to", resend: "Resend", changePhone: "Change number", verify: "Verify", terms: "By continuing you accept the terms and privacy policy", roleTitle: "Choose your role", roleSub: "You can change it later in your profile", roleOwner: "Cargo owner", roleOwnerDesc: "I post cargo, look for trucks", roleDriver: "Driver", roleDriverDesc: "I look for cargo, post my truck", regTitle: "Complete your profile", fullName: "Full name", companyName: "Company (optional)", vehicleType: "Vehicle type", capacity: "Load capacity (t)", volume: "Volume (m³)", currentCity: "Current city", finish: "Finish", created: "Account created successfully", demoHint: "Demo: any 6-digit code works" },
  order: { name: "Cargo name", vehicleType: "Vehicle type", weight: "Weight (t)", volume: "Volume (m³)", route: "Route", fromCity: "From city", fromAddress: "Exact pickup address", toCity: "To city", toAddress: "Exact drop-off address", loadingDate: "Loading date", price: "Exact price (₸)", negotiable: "Negotiable price", comment: "Additional comment", preview: "Preview", stepCargo: "Cargo", stepRoute: "Route", stepPrice: "Date & price", stepPreview: "Review", publishSuccess: "Cargo published!", views: "Views", phoneViews: "Phone shown", contactLocked: "Contact hidden", contactLockedDesc: "To see the phone, sign in as a driver and get a subscription", showPhone: "Show phone", limitReached: "Daily limit reached (10 cargos)", detail: "About cargo", noOrders: "No cargo found", noOrdersDesc: "Try changing the filters" },
  truck: { current: "Current city", destination: "Destination city", anyDirection: "Any direction", comment: "Comment", readyDate: "Ready date", publishTitle: "Publish an empty truck", publishSuccess: "Truck published!", noTrucks: "No trucks found", capacity: "Load capacity", driver: "Driver", activeSearch: "Active search" },
  filters: { title: "Filters", minWeight: "Min weight", maxWeight: "Max weight", minVolume: "Min volume", maxVolume: "Max volume", minPrice: "Min price", maxPrice: "Max price", sort: "Sort", sortNew: "Newest", sortPriceHigh: "Highest price", sortPriceLow: "Lowest price", sortWeight: "By weight", sortVolume: "By volume" },
  pricing: { title: "Pricing", sub: "Subscription for drivers. Free for cargo owners.", free: "Free", freeDesc: "For cargo owners", trial: "30 days free", monthly: "Monthly", yearly: "Yearly", perMonth: "/ mo", perYear: "/ yr", best: "Best value", f1: "View client phone", f2: "Full information", f3: "Publish active search", f4: "Unlimited search", choose: "Choose", ownerFree: "Posting cargo is free" },
  profile: { title: "Profile", myCargo: "My cargo", myTruck: "My truck", favorites: "Favorites", subscription: "Subscription", payments: "Payment history", stats: "Statistics", complaints: "Complaints", notifications: "Notifications", settings: "Settings", switchRole: "Switch role", role: "Role", phone: "Phone" },
  sub: { active: "Subscription active", expired: "Subscription expired", expiresIn: "days left", trial: "Trial period", renew: "Renew", plan: "Plan" },
  complaint: { title: "Submit a complaint", reason: "Reason", fake_order: "Fake order", no_answer: "Phone not answering", wrong_info: "Wrong information", fraud: "Suspected fraud", other: "Other reason", description: "Description", submit: "Submit", submitted: "Complaint submitted", status_new: "New", status_in_review: "In review", status_closed: "Closed" },
  admin: { dashboard: "Dashboard", users: "Users", orders: "Cargo", trucks: "Trucks", subscriptions: "Subscriptions", payments: "Payments", complaints: "Complaints", logs: "Logs", settings: "Settings", clients: "Clients", drivers: "Drivers", activeOrders: "Active cargo", archivedOrders: "Archived cargo", activeSearches: "Active searches", activeSubs: "Active subscriptions", block: "Block", unblock: "Unblock", extend: "Extend", close: "Close", revenue: "Revenue" },
  status: { active: "Active", accepted: "Accepted", archived: "Archived", deleted: "Deleted", blocked: "Blocked" },
};

const DICTS: Record<Lang, Dict> = { kk, ru, en };
const STORAGE_KEY = "argo_lang";

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (path: string) => string;
}

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("kk");

  useEffect(() => {
    const saved = (typeof localStorage !== "undefined" && localStorage.getItem(STORAGE_KEY)) as Lang | null;
    if (saved && DICTS[saved]) setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (path: string): string => {
    const keys = path.split(".");
    let obj: any = DICTS[lang] || DICTS.kk;
    for (const k of keys) obj = obj?.[k];
    if (obj == null) {
      let fb: any = DICTS.kk;
      for (const k of keys) fb = fb?.[k];
      return fb ?? path;
    }
    return obj;
  };

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
