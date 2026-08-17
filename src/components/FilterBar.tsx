import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { CITIES, VEHICLE_TYPES } from "@/lib/mock-data";
import type { OrderFilters } from "@/lib/types";

type RangeField = "weight" | "volume" | "price";

type DraftRanges = {
  min_weight: string;
  max_weight: string;
  min_volume: string;
  max_volume: string;
  min_price: string;
  max_price: string;
};

const EMPTY_DRAFT: DraftRanges = {
  min_weight: "",
  max_weight: "",
  min_volume: "",
  max_volume: "",
  min_price: "",
  max_price: "",
};

export function FilterBar({
  value,
  onChange,
  onClear,
}: {
  value: OrderFilters;
  onChange: (f: OrderFilters) => void;
  onClear: () => void;
}) {
  const { t } = useI18n();

  const [expanded, setExpanded] = useState(false);

  /*
   * =========================================================
   * BASIC SET
   * =========================================================
   */

  const set = (patch: Partial<OrderFilters>) => {
    onChange({
      ...value,
      ...patch,
    });
  };

  /*
   * =========================================================
   * DRAFT VALUES
   * =========================================================
   *
   * Input-тың ішінде не жазылып тұрғанын бөлек сақтаймыз.
   *
   * Мысалы:
   *
   * MIN = 100
   * MAX = 50
   *
   * MAX input ішінде 50 көрінеді,
   * бірақ parent value-ге 50 жіберілмейді.
   *
   * Сондықтан фильтрдің нақты мәні бұзылмайды.
   */

  const [draft, setDraft] = useState<DraftRanges>(() => ({
  min_weight:
    value.min_weight?.toString() ?? "",
  max_weight:
    value.max_weight?.toString() ?? "",

  min_volume:
    value.min_volume?.toString() ?? "",
  max_volume:
    value.max_volume?.toString() ?? "",

  min_price:
    value.min_price?.toString() ?? "",
  max_price:
    value.max_price?.toString() ?? "",
}));

useEffect(() => {
  setDraft({
    min_weight:
      value.min_weight?.toString() ?? "",
    max_weight:
      value.max_weight?.toString() ?? "",

    min_volume:
      value.min_volume?.toString() ?? "",
    max_volume:
      value.max_volume?.toString() ?? "",

    min_price:
      value.min_price?.toString() ?? "",
    max_price:
      value.max_price?.toString() ?? "",
  });
}, [
  value.min_weight,
  value.max_weight,
  value.min_volume,
  value.max_volume,
  value.min_price,
  value.max_price,
]);

  /*
   * =========================================================
   * NUMBER PARSER
   * =========================================================
   */

  const parseNumber = (
    raw: string,
  ): number | undefined => {
    if (raw.trim() === "") {
      return undefined;
    }

    const parsed = Number(raw);

    if (!Number.isFinite(parsed)) {
      return undefined;
    }

    return parsed;
  };

  /*
   * =========================================================
   * RANGE CONFIG
   * =========================================================
   */

  const getRangeFields = (
    field: RangeField,
  ) => {
    if (field === "weight") {
      return {
        min: "min_weight" as const,
        max: "max_weight" as const,
      };
    }

    if (field === "volume") {
      return {
        min: "min_volume" as const,
        max: "max_volume" as const,
      };
    }

    return {
      min: "min_price" as const,
      max: "max_price" as const,
    };
  };

  /*
   * =========================================================
   * RANGE VALIDATION
   * =========================================================
   */

  const isInvalidRange = (
    minRaw: string,
    maxRaw: string,
  ) => {
    const min = parseNumber(minRaw);
    const max = parseNumber(maxRaw);

    /*
     * Екеуінің бірі бос болса,
     * диапазон қате емес.
     */

    if (
      min === undefined ||
      max === undefined
    ) {
      return false;
    }

    /*
     * Теріс сан да қате.
     */

    if (min < 0 || max < 0) {
      return true;
    }

    /*
     * Ең маңызды шарт:
     *
     * MIN > MAX = ERROR
     */

    return min > max;
  };

  const weightInvalid = isInvalidRange(
    draft.min_weight,
    draft.max_weight,
  );

  const volumeInvalid = isInvalidRange(
    draft.min_volume,
    draft.max_volume,
  );

  const priceInvalid = isInvalidRange(
    draft.min_price,
    draft.max_price,
  );

  /*
   * =========================================================
   * RANGE CHANGE
   * =========================================================
   *
   * Қате мән input-та КӨРІНЕДІ,
   * бірақ parent state-ке ЖІБЕРІЛМЕЙДІ.
   *
   * Осы арқылы:
   *
   * MIN = 100
   * MAX = 200
   *
   * MAX -> 50
   *
   * нәтижесі:
   *
   * input = 50
   * input қызыл
   * parent max = 200
   *
   * Яғни фильтр бұзылмайды.
   */

  const handleRangeChange = (
    field: RangeField,
    side: "min" | "max",
    raw: string,
  ) => {
    const fields = getRangeFields(field);

    const draftKey =
      side === "min"
        ? fields.min
        : fields.max;

    /*
     * Алдымен input-та көрсетеміз.
     */

    setDraft((prev) => ({
      ...prev,
      [draftKey]: raw,
    }));

    /*
     * Бос input.
     */

    if (raw.trim() === "") {
      set({
        [draftKey]: undefined,
      });

      return;
    }

    const next = parseNumber(raw);

    /*
     * Сан емес болса,
     * parent-ке жібермейміз.
     */

    if (next === undefined) {
      return;
    }

    /*
     * Теріс сан.
     *
     * Draft-та қалады -> қызыл.
     * Parent-ке жіберілмейді.
     */

    if (next < 0) {
      return;
    }

    /*
     * Қазіргі draft-тағы екінші мән.
     */

    const otherRaw =
      side === "min"
        ? draft[fields.max]
        : draft[fields.min];

    const otherValue =
      parseNumber(otherRaw);

    /*
     * =====================================================
     * MIN
     * =====================================================
     */

    if (side === "min") {
      /*
       * MAX бар және MIN > MAX
       *
       * -> қабылдамаймыз.
       */

      if (
        otherValue !== undefined &&
        next > otherValue
      ) {
        return;
      }

      /*
       * Дұрыс мән.
       */

      set({
        [fields.min]: next,
      });

      return;
    }

    /*
     * =====================================================
     * MAX
     * =====================================================
     */

    /*
     * MIN бар және MAX < MIN
     *
     * -> қабылдамаймыз.
     */

    if (
      otherValue !== undefined &&
      next < otherValue
    ) {
      return;
    }

    /*
     * Дұрыс мән.
     */

    set({
      [fields.max]: next,
    });
  };

  /*
   * =========================================================
   * DATES
   * =========================================================
   */

  const dates: {
    k: NonNullable<OrderFilters["date"]>;
    label: string;
  }[] = [
    {
      k: "today",
      label: t("common.today"),
    },
    {
      k: "tomorrow",
      label: t("common.tomorrow"),
    },
    {
      k: "week",
      label: t("common.thisWeek"),
    },
    {
      k: "all",
      label: t("common.all"),
    },
  ];

  /*
   * =========================================================
   * INPUT CLASS
   * =========================================================
   */

  const rangeInputClass = (
    invalid: boolean,
  ) => {
    return invalid
      ? "argo-range-input invalid"
      : "argo-range-input";
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="argo-filter">

      {/* =====================================================
          ROUTE SEARCH
      ====================================================== */}

      <div className="argo-route">

        {/* FROM */}

        <div className="argo-route-field">

          <div className="argo-route-label">
            {t("common.from")}
          </div>

          <select
            value={value.from ?? ""}
            onChange={(e) =>
              set({
                from:
                  e.target.value ||
                  undefined,
              })
            }
          >
            <option value="">
              Кез-келген қала
            </option>

            {CITIES.map((city) => (
              <option
                key={city}
                value={city}
              >
                {city}
              </option>
            ))}
          </select>

        </div>

        {/* ARROW */}

        <div
          className="argo-route-arrow"
          aria-hidden="true"
        >
          →
        </div>

        {/* TO */}

        <div className="argo-route-field">

          <div className="argo-route-label">
            {t("common.to")}
          </div>

          <select
            value={value.to ?? ""}
            onChange={(e) =>
              set({
                to:
                  e.target.value ||
                  undefined,
              })
            }
          >
            <option value="">
              Кез-келген қала
            </option>

            {CITIES.map((city) => (
              <option
                key={city}
                value={city}
              >
                {city}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* =====================================================
          ADVANCED SEARCH BUTTON
      ====================================================== */}

      <button
        type="button"
        className={`argo-advanced-trigger ${
          expanded ? "is-open" : ""
        }`}
        onClick={() =>
          setExpanded((prev) => !prev)
        }
      >

        <span>
          КЕҢЕЙТІЛГЕН ІЗДЕУ
        </span>

        <span
          className={`argo-chevron ${
            expanded ? "up" : ""
          }`}
          aria-hidden="true"
        >
          ↓
        </span>

      </button>

      {/* =====================================================
          ADVANCED FILTERS
      ====================================================== */}

      {expanded && (
        <div className="argo-advanced">

          {/* VEHICLE */}

          <div className="argo-field">

            <label>
              {t("order.vehicleType")}
            </label>

            <select
              value={
                value.vehicle_type ?? ""
              }
              onChange={(e) =>
                set({
                  vehicle_type:
                    e.target.value ||
                    undefined,
                })
              }
            >
              <option value="">
                Кез-келген көлік
              </option>

              {VEHICLE_TYPES.map(
                (vehicle) => (
                  <option
                    key={vehicle}
                    value={vehicle}
                  >
                    {vehicle}
                  </option>
                ),
              )}
            </select>

          </div>

          {/* DATE */}

          <div className="argo-field">

            <label>
              Жүктеу күні
            </label>

            <div className="argo-date-tabs">

              {dates.map((date) => (
                <button
                  type="button"
                  key={date.k}
                  className={
                    value.date === date.k
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    set({
                      date: date.k,
                    })
                  }
                >
                  {date.label}
                </button>
              ))}

            </div>

          </div>

          {/* =================================================
              WEIGHT
          ================================================== */}

          <div className="argo-field">

            <label>
              Салмақ, т
            </label>

            <div
              className={`argo-range ${
                weightInvalid
                  ? "range-invalid"
                  : ""
              }`}
            >

              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                placeholder={t(
                  "filters.minWeight",
                )}
                className={rangeInputClass(
                  weightInvalid,
                )}
                value={
                  draft.min_weight
                }
                onChange={(e) =>
                  handleRangeChange(
                    "weight",
                    "min",
                    e.target.value,
                  )
                }
              />

              <span>—</span>

              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                placeholder={t(
                  "filters.maxWeight",
                )}
                className={rangeInputClass(
                  weightInvalid,
                )}
                value={
                  draft.max_weight
                }
                onChange={(e) =>
                  handleRangeChange(
                    "weight",
                    "max",
                    e.target.value,
                  )
                }
              />

            </div>

            {weightInvalid && (
              <div className="argo-range-error">
                Минимум максималдан үлкен
                болмауы керек
              </div>
            )}

          </div>

          {/* =================================================
              VOLUME
          ================================================== */}

          <div className="argo-field">

            <label>
              Көлем, м³
            </label>

            <div
              className={`argo-range ${
                volumeInvalid
                  ? "range-invalid"
                  : ""
              }`}
            >

              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                placeholder={t(
                  "filters.minVolume",
                )}
                className={rangeInputClass(
                  volumeInvalid,
                )}
                value={
                  draft.min_volume
                }
                onChange={(e) =>
                  handleRangeChange(
                    "volume",
                    "min",
                    e.target.value,
                  )
                }
              />

              <span>—</span>

              <input
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                placeholder={t(
                  "filters.maxVolume",
                )}
                className={rangeInputClass(
                  volumeInvalid,
                )}
                value={
                  draft.max_volume
                }
                onChange={(e) =>
                  handleRangeChange(
                    "volume",
                    "max",
                    e.target.value,
                  )
                }
              />

            </div>

            {volumeInvalid && (
              <div className="argo-range-error">
                Минимум максималдан үлкен
                болмауы керек
              </div>
            )}

          </div>

          {/* =================================================
              PRICE
          ================================================== */}

          <div className="argo-field">

            <label>
              Баға, ₸
            </label>

            <div
              className={`argo-range ${
                priceInvalid
                  ? "range-invalid"
                  : ""
              }`}
            >

              <input
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                placeholder={t(
                  "filters.minPrice",
                )}
                className={rangeInputClass(
                  priceInvalid,
                )}
                value={
                  draft.min_price
                }
                onChange={(e) =>
                  handleRangeChange(
                    "price",
                    "min",
                    e.target.value,
                  )
                }
              />

              <span>—</span>

              <input
                type="number"
                min="0"
                step="1000"
                inputMode="numeric"
                placeholder={t(
                  "filters.maxPrice",
                )}
                className={rangeInputClass(
                  priceInvalid,
                )}
                value={
                  draft.max_price
                }
                onChange={(e) =>
                  handleRangeChange(
                    "price",
                    "max",
                    e.target.value,
                  )
                }
              />

            </div>

            {priceInvalid && (
              <div className="argo-range-error">
                Минимум максималдан үлкен
                болмауы керек
              </div>
            )}

          </div>

          {/* SORT */}

          <div className="argo-field">

            <label>
              Сұрыптау
            </label>

            <select
              value={
                value.sort ?? "new"
              }
              onChange={(e) =>
                set({
                  sort:
                    e.target.value as
                      OrderFilters["sort"],
                })
              }
            >

              <option value="new">
                Ең жаңалары
              </option>

              <option value="price_high">
                Бағасы жоғарыдан
              </option>

              <option value="price_low">
                Бағасы төменнен
              </option>

              <option value="weight">
                Салмағы бойынша
              </option>

              <option value="volume">
                Көлемі бойынша
              </option>

            </select>

          </div>

          {/* BOTTOM */}

          <div className="argo-filter-bottom">

            <label className="argo-check">

              <input
                type="checkbox"
                checked={Boolean(
                  value.negotiable,
                )}
                onChange={(e) =>
                  set({
                    negotiable:
                      e.target.checked,
                  })
                }
              />

              <span>
                Бағасы келісімді
              </span>

            </label>

            <button
              type="button"
              className="argo-clear"
              onClick={() => {
                setDraft(EMPTY_DRAFT);
                onClear();
              }}
            >
              Тазалау
            </button>

          </div>

        </div>
      )}

      {/* =====================================================
          STYLES
      ====================================================== */}

      <style>{`

        .argo-filter {
          width: 100%;
          box-sizing: border-box;
          background: #1a1c28;
          border: 1px solid rgba(255,255,255,.055);
          border-radius: 18px;
          padding: 18px;
          color: #fff;
          box-shadow:
            0 14px 34px rgba(0,0,0,.12);
        }

        /* ROUTE */

        .argo-route {
          display: grid;
          grid-template-columns:
            minmax(0,1fr)
            34px
            minmax(0,1fr);
          align-items: center;
          gap: 10px;
        }

        .argo-route-field {
          min-width: 0;
          background:
            rgba(255,255,255,.045);
          border:
            1px solid rgba(255,255,255,.075);
          border-radius: 12px;
          padding: 10px 13px 9px;
          transition:
            border-color .18s ease,
            background .18s ease;
        }

        .argo-route-field:hover {
          background:
            rgba(255,255,255,.055);
        }

        .argo-route-field:focus-within {
          border-color:
            rgba(192,224,64,.38);
          background:
            rgba(255,255,255,.06);
        }

        .argo-route-label {
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color:
            rgba(255,255,255,.42);
          margin-bottom: 6px;
        }

        .argo-route-field select {
          display: block;
          width: 100%;
          min-width: 0;
          height: 20px;
          border: 0;
          outline: 0;
          background: transparent;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          padding: 0;
          cursor: pointer;
        }

        .argo-route-field select option,
        .argo-field select option {
          background: #1a1c28;
          color: #fff;
        }

        /* ARROW */

        .argo-route-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          color:
            rgba(255,255,255,.30);
          font-size: 18px;
          user-select: none;
        }

        /* ADVANCED */

        .argo-advanced-trigger {
          width: 100%;
          margin-top: 13px;
          padding: 8px 0 3px;
          border: 0;
          background: transparent;
          color:
            rgba(255,255,255,.48);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .1em;
          transition: color .18s ease;
        }

        .argo-advanced-trigger:hover,
        .argo-advanced-trigger.is-open {
          color: #c0e040;
        }

        .argo-chevron {
          display: inline-flex;
          font-size: 13px;
          transition:
            transform .2s ease;
        }

        .argo-chevron.up {
          transform: rotate(180deg);
        }

        /* ADVANCED PANEL */

        .argo-advanced {
          margin-top: 14px;
          padding-top: 16px;
          border-top:
            1px solid rgba(255,255,255,.065);

          display: grid;

          grid-template-columns:
            repeat(2,minmax(0,1fr));

          gap: 13px;
        }

        .argo-field {
          min-width: 0;
        }

        .argo-field > label {
          display: block;
          margin-bottom: 7px;
          color:
            rgba(255,255,255,.48);
          font-size: 11px;
          font-weight: 600;
        }

        /* INPUTS */

        .argo-field select,
        .argo-range-input {
          width: 100%;
          height: 40px;
          box-sizing: border-box;

          border-radius: 9px;

          border:
            1px solid rgba(255,255,255,.075);

          background:
            rgba(255,255,255,.045);

          color: #fff;

          outline: none;

          padding: 0 11px;

          font-size: 13px;

          transition:
            border-color .18s ease,
            background .18s ease,
            box-shadow .18s ease;
        }

        .argo-field select {
          cursor: pointer;
        }

        .argo-field select:focus,
        .argo-range-input:focus {
          border-color:
            rgba(192,224,64,.38);

          background:
            rgba(255,255,255,.06);
        }

        /* =====================================================
           INVALID INPUT
        ====================================================== */

        .argo-range-input.invalid {
          border-color:
            #ff4d4d !important;

          background:
            rgba(255,55,55,.08) !important;

          box-shadow:
            0 0 0 1px
            rgba(255,77,77,.12),
            0 0 14px
            rgba(255,77,77,.08);
        }

        .argo-range-input.invalid:focus {
          border-color:
            #ff4d4d !important;

          box-shadow:
            0 0 0 2px
            rgba(255,77,77,.14),
            0 0 14px
            rgba(255,77,77,.08);
        }

        /* RANGE */

        .argo-range {
          display: grid;

          grid-template-columns:
            minmax(0,1fr)
            18px
            minmax(0,1fr);

          align-items: center;

          gap: 5px;
        }

        .argo-range span {
          text-align: center;

          color:
            rgba(255,255,255,.25);

          font-size: 12px;
        }

        /* ERROR */

        .argo-range-error {
          margin-top: 6px;

          color: #ff6262;

          font-size: 10px;

          font-weight: 600;

          line-height: 1.3;
        }

        /* NUMBER INPUT */

        .argo-range-input::-webkit-outer-spin-button,
        .argo-range-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .argo-range-input[type="number"] {
          appearance: textfield;
          -moz-appearance: textfield;
        }

        /* DATE */

        .argo-date-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }

        .argo-date-tabs button {
          border:
            1px solid rgba(255,255,255,.07);

          background:
            rgba(255,255,255,.04);

          color:
            rgba(255,255,255,.50);

          border-radius: 8px;

          padding: 9px 11px;

          font-size: 11px;

          cursor: pointer;

          transition: all .18s ease;
        }

        .argo-date-tabs button:hover {
          color: #fff;

          border-color:
            rgba(255,255,255,.14);
        }

        .argo-date-tabs button.active {
          background:
            rgba(192,224,64,.08);

          border-color:
            rgba(192,224,64,.42);

          color: #c0e040;
        }

        /* BOTTOM */

        .argo-filter-bottom {
          grid-column: 1 / -1;

          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 12px;

          padding-top: 2px;
        }

        .argo-check {
          display: inline-flex;

          align-items: center;

          gap: 8px;

          color:
            rgba(255,255,255,.58);

          font-size: 12px;

          cursor: pointer;

          user-select: none;
        }

        .argo-check input {
          appearance: none;

          width: 15px;
          height: 15px;

          flex: 0 0 15px;

          margin: 0;

          border-radius: 4px;

          border:
            1px solid rgba(255,255,255,.18);

          background:
            rgba(255,255,255,.035);

          cursor: pointer;

          position: relative;
        }

        .argo-check input:checked {
          background: #c0e040;
          border-color: #c0e040;
        }

        .argo-check input:checked::after {
          content: "";

          position: absolute;

          width: 4px;
          height: 7px;

          border-right:
            2px solid #1a1c28;

          border-bottom:
            2px solid #1a1c28;

          transform: rotate(45deg);

          left: 4px;
          top: 2px;
        }

        /* CLEAR */

        .argo-clear {
          border: 0;

          background: transparent;

          color:
            rgba(255,255,255,.36);

          font-size: 11px;

          cursor: pointer;

          padding: 5px 0;

          transition:
            color .18s ease;
        }

        .argo-clear:hover {
          color: #c0e040;
        }

        /* TABLET */

        @media (max-width: 700px) {

          .argo-filter {
            padding: 14px;
            border-radius: 15px;
          }

          .argo-advanced {
            grid-template-columns: 1fr;
          }

          .argo-filter-bottom {
            grid-column: auto;
          }
        }

        /* MOBILE */

        @media (max-width: 520px) {

          .argo-route {
            grid-template-columns: 1fr;
            gap: 6px;
          }

          .argo-route-arrow {
            height: 12px;
            font-size: 14px;
            transform: rotate(90deg);
          }

          .argo-route-field {
            width: 100%;
            box-sizing: border-box;
            padding: 10px 12px;
          }

          .argo-route-field select {
            font-size: 13px;
          }

          .argo-advanced-trigger {
            margin-top: 11px;
          }

          .argo-advanced {
            gap: 12px;
          }

          .argo-range {
            grid-template-columns:
              minmax(0,1fr)
              14px
              minmax(0,1fr);

            gap: 4px;
          }

          .argo-filter-bottom {
            align-items: center;
            flex-direction: row;
          }

          .argo-clear {
            flex: 0 0 auto;
          }
        }

        /* VERY SMALL PHONE */

        @media (max-width: 360px) {

          .argo-filter {
            padding: 12px;
          }

          .argo-route-field {
            padding: 9px 10px;
          }

          .argo-route-field select {
            font-size: 12px;
          }

          .argo-range-input {
            padding: 0 8px;
            font-size: 12px;
          }

          .argo-date-tabs button {
            padding: 8px 9px;
          }

          .argo-filter-bottom {
            gap: 8px;
          }

          .argo-check {
            font-size: 11px;
          }

        }

      `}</style>
    </div>
  );
}