'use client';

import { useEffect, useMemo, useState } from 'react';

type ViewMode = 'list' | 'grid' | 'map';
type Strategy = 'rental' | 'appreciation' | 'short_term_rental';

interface RawProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  listPrice: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number;
  hoaMonthly?: number;
  imageUrl?: string;
  images?: string[]; // optional; if not present, we'll fallback
  externalUrl?: string;
  latitude?: number;
  longitude?: number;
}

interface InvestmentMetrics {
  estimatedRent: number;
  annualExpenses: number;
  annualNOI: number;
  capRate: number;
  cashOnCash: number;
  projectedValueYearN: number;
}

interface ScoredProperty {
  property: RawProperty;
  metrics: InvestmentMetrics;
  score: number;
}

interface SearchFormState {
  zips: string; // comma-separated ZIPs
  minPrice: string;
  maxPrice: string;
  minBeds: string;
  minBaths: string;
  strategy: Strategy;
  timeHorizonYears: string;
  minCapRate: string;
  maxHoa: string;
}

const defaultForm: SearchFormState = {
  zips: '',
  minPrice: '',
  maxPrice: '',
  minBeds: '',
  minBaths: '',
  strategy: 'rental',
  timeHorizonYears: '5',
  minCapRate: '',
  maxHoa: '',
};

type SortKey = 'score' | 'capRate' | 'cashOnCash' | 'priceAsc' | 'priceDesc';

export default function InvestmentPropertyFinderPage() {
  const [form, setForm] = useState<SearchFormState>(defaultForm);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScoredProperty[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [selectedProperty, setSelectedProperty] = useState<ScoredProperty | null>(null);
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SearchFormState[]>([]);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Global assumptions (could be per-user later)
  const [assumptions, setAssumptions] = useState({
    taxRate: 0.012,
    insuranceRate: 0.004,
    maintenanceRate: 0.1,
    managementRate: 0.08,
    vacancyRate: 0.05,
    loanRate: 0.065,
    downPayment: 0.25,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);

    const zipList = form.zips
      .split(',')
      .map((z) => z.trim())
      .filter((z) => z.length > 0);

    if (zipList.length === 0) {
      setError('Please enter at least one ZIP code');
      setLoading(false);
      return;
    }

    try {
      const accumulated: ScoredProperty[] = [];

      // simple sequential calls for now
      for (const zip of zipList) {
        const payload = {
          zip,
          minPrice: form.minPrice ? Number(form.minPrice) : undefined,
          maxPrice: form.maxPrice ? Number(form.maxPrice) : undefined,
          minBeds: form.minBeds ? Number(form.minBeds) : undefined,
          minBaths: form.minBaths ? Number(form.minBaths) : undefined,
          strategy: form.strategy,
          timeHorizonYears: Number(form.timeHorizonYears || '5'),
        };

        const res = await fetch('/api/investment-properties/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Error searching properties');
        }
        accumulated.push(...json.results);
      }

      setResults(accumulated);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSorted = useMemo(() => {
    let arr = [...results];

    // client-side extra filters
    if (form.minCapRate) {
      const minCap = Number(form.minCapRate) / 100;
      arr = arr.filter((r) => r.metrics.capRate >= minCap);
    }
    if (form.maxHoa) {
      const maxHoaNum = Number(form.maxHoa);
      arr = arr.filter(
        (r) => (r.property.hoaMonthly || 0) <= maxHoaNum
      );
    }

    arr.sort((a, b) => {
      switch (sortKey) {
        case 'score':
          return b.score - a.score;
        case 'capRate':
          return b.metrics.capRate - a.metrics.capRate;
        case 'cashOnCash':
          return b.metrics.cashOnCash - a.metrics.cashOnCash;
        case 'priceAsc':
          return a.property.listPrice - b.property.listPrice;
        case 'priceDesc':
          return b.property.listPrice - a.property.listPrice;
        default:
          return 0;
      }
    });

    return arr;
  }, [results, form.minCapRate, form.maxHoa, sortKey]);

  const handleSaveSearch = () => {
    setSavedSearches((prev) => [...prev, form]);
  };

  const loadSavedSearch = (s: SearchFormState) => {
    setForm(s);
  };

  const anyCompare = compareIds.size > 0;
  const compareList = filteredSorted.filter((r) =>
    compareIds.has(r.property.id)
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header with condensed search summary */}
      <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Investment Property Finder</h1>
            <p className="text-xs text-slate-300">
              LargeKite Capital · Educational investment analytics
            </p>
          </div>
          <div className="hidden md:block text-xs text-right">
            {form.zips && (
              <div>
                ZIPs: <span className="font-semibold">{form.zips}</span>
              </div>
            )}
            {(form.minPrice || form.maxPrice) && (
              <div>
                Price: {form.minPrice && `$${Number(form.minPrice).toLocaleString()}+`}
                {form.maxPrice && ` – $${Number(form.maxPrice).toLocaleString()}`}
              </div>
            )}
            <div>
              Horizon: <span className="font-semibold">{form.timeHorizonYears} yrs</span> ·
              Strategy:{' '}
              <span className="capitalize font-semibold">
                {form.strategy.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* View + Compare actions */}
          <div className="flex items-center gap-2">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            {anyCompare && (
              <button
                className="hidden sm:inline-flex px-3 py-1.5 text-xs rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => setShowCompareModal(true)}
              >
                Compare ({compareIds.size})
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Search & filters */}
        <section className="bg-white rounded-xl shadow-sm p-4 md:p-5 space-y-4">
          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ZIP Codes (comma separated)
              </label>
              <input
                name="zips"
                value={form.zips}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="e.g. 63011, 63021, 63141"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Min Price
              </label>
              <input
                name="minPrice"
                value={form.minPrice}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="200000"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Max Price
              </label>
              <input
                name="maxPrice"
                value={form.maxPrice}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="450000"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Min Beds
              </label>
              <input
                name="minBeds"
                value={form.minBeds}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Min Baths
              </label>
              <input
                name="minBaths"
                value={form.minBaths}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Strategy
              </label>
              <select
                name="strategy"
                value={form.strategy}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="rental">Buy & Hold Rental</option>
                <option value="appreciation">Appreciation Focused</option>
                <option value="short_term_rental">Short-Term Rental</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Time Horizon (years)
              </label>
              <select
                name="timeHorizonYears"
                value={form.timeHorizonYears}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Min Cap Rate (%)
              </label>
              <input
                name="minCapRate"
                value={form.minCapRate}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Max HOA ($/mo)
              </label>
              <input
                name="maxHoa"
                value={form.maxHoa}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="250"
              />
            </div>

            <div className="flex items-end gap-2 md:col-span-2">
              <button
                type="submit"
                className="inline-flex justify-center w-full md:w-auto px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-sm font-semibold text-white disabled:opacity-60"
                disabled={loading}
              >
                {loading ? 'Searching…' : 'Find Properties'}
              </button>
              <button
                type="button"
                onClick={handleSaveSearch}
                className="hidden md:inline-flex px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Save search
              </button>
              <button
                type="button"
                onClick={() => setShowAssumptions(true)}
                className="ml-auto px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit assumptions
              </button>
            </div>
          </form>

          {savedSearches.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">
                Saved searches
              </p>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((s, idx) => (
                  <button
                    key={idx}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs text-slate-700"
                    onClick={() => loadSavedSearch(s)}
                  >
                    {s.zips || 'ZIPs'} · {s.timeHorizonYears}y ·{' '}
                    {s.strategy.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-2 text-[11px] text-slate-400">
            This tool provides educational estimates only and is not personalized financial
            advice. Actual returns may differ. Please verify all assumptions and consult
            a qualified advisor before making investment decisions.
          </p>
        </section>

        {/* Sort + summary + compare (secondary bar) */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <SortPills sortKey={sortKey} setSortKey={setSortKey} />
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>{filteredSorted.length} properties</span>
            {anyCompare && (
              <button
                className="inline-flex px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700"
                onClick={() => setShowCompareModal(true)}
              >
                Compare {compareIds.size}
              </button>
            )}
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-sm text-red-700 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Results */}
        <section>
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-slate-100 animate-pulse rounded-xl"
                />
              ))}
            </div>
          )}

          {!loading && filteredSorted.length === 0 && !error && (
            <p className="text-sm text-slate-500">
              No results yet. Enter ZIPs and filters above, then click{' '}
              <span className="font-semibold">Find Properties</span>.
            </p>
          )}

          {!loading && filteredSorted.length > 0 && (
            <>
              {viewMode !== 'map' && (
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid gap-4 md:grid-cols-2'
                      : 'space-y-4'
                  }
                >
                  {filteredSorted.map((item) => (
                    <PropertyCard
                      key={item.property.id}
                      data={item}
                      viewMode={viewMode}
                      onSelect={() => setSelectedProperty(item)}
                      onToggleCompare={() => toggleCompare(item.property.id)}
                      isCompared={compareIds.has(item.property.id)}
                    />
                  ))}
                </div>
              )}

              {viewMode === 'map' && (
                <div className="grid md:grid-cols-[2fr,3fr] gap-4">
                  <div className="h-[360px] md:h-[480px] bg-slate-200 rounded-xl flex items-center justify-center text-sm text-slate-600">
                    {/* Placeholder for real map / heatmap integration */}
                    Map / Heatmap view coming soon
                  </div>
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2">
                    {filteredSorted.map((item) => (
                      <PropertyCard
                        key={item.property.id}
                        data={item}
                        viewMode="list"
                        compact
                        onSelect={() => setSelectedProperty(item)}
                        onToggleCompare={() => toggleCompare(item.property.id)}
                        isCompared={compareIds.has(item.property.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Detail drawer */}
      {selectedProperty && (
        <PropertyDetailDrawer
          item={selectedProperty}
          horizon={Number(form.timeHorizonYears || '5')}
          strategy={form.strategy}
          assumptions={assumptions}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      {/* Assumption editor */}
      {showAssumptions && (
        <AssumptionModal
          assumptions={assumptions}
          onChange={setAssumptions}
          onClose={() => setShowAssumptions(false)}
        />
      )}

      {/* Compare modal */}
      {showCompareModal && compareList.length > 0 && (
        <CompareModal
          items={compareList}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}

/* ---------- UI subcomponents ---------- */

function ViewToggle({
  viewMode,
  setViewMode,
}: {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
}) {
  const btn = (mode: ViewMode, label: string) => (
    <button
      key={mode}
      onClick={() => setViewMode(mode)}
      className={[
        'px-2.5 py-1 rounded-full text-xs font-medium border',
        viewMode === mode
          ? 'bg-white text-slate-900 border-white'
          : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700',
      ].join(' ')}
    >
      {label}
    </button>
  );
  return (
    <div className="flex gap-1">
      {btn('list', 'List')}
      {btn('grid', 'Grid')}
      {btn('map', 'Map')}
    </div>
  );
}

function SortPills({
  sortKey,
  setSortKey,
}: {
  sortKey: SortKey;
  setSortKey: (k: SortKey) => void;
}) {
  const options: { key: SortKey; label: string }[] = [
    { key: 'score', label: 'Top score' },
    { key: 'capRate', label: 'Highest cap rate' },
    { key: 'cashOnCash', label: 'Highest cash-on-cash' },
    { key: 'priceAsc', label: 'Lowest price' },
    { key: 'priceDesc', label: 'Highest price' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => setSortKey(o.key)}
          className={[
            'px-3 py-1.5 rounded-full text-xs border',
            sortKey === o.key
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PropertyCard({
  data,
  viewMode,
  compact,
  onSelect,
  onToggleCompare,
  isCompared,
}: {
  data: ScoredProperty;
  viewMode: ViewMode;
  compact?: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
  isCompared: boolean;
}) {
  const { property, metrics, score } = data;

  const images =
    property.images && property.images.length > 0
      ? property.images
      : property.imageUrl
      ? [property.imageUrl]
      : [];

  const scoreColor =
    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-500';

  const AIInsight = (() => {
    const { capRate, cashOnCash } = metrics;
    if (capRate >= 0.08) {
      return 'Strong cap rate relative to typical single-family rentals; worth deeper due diligence.';
    }
    if (cashOnCash >= 0.10) {
      return 'Attractive cash-on-cash projection given current assumptions.';
    }
    return 'Solid but not standout—may compete with alternatives depending on risk tolerance.';
  })();

  return (
    <article
      className={[
        'group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col',
        compact ? 'md:flex-row' : '',
      ].join(' ')}
      onClick={onSelect}
    >
      {/* Image / carousel area */}
      {images.length > 0 && (
        <div
          className={[
            'relative',
            compact ? 'md:w-40 md:flex-shrink-0 h-32' : 'h-40',
          ].join(' ')}
        >
          <div className="w-full h-full overflow-x-auto flex gap-1 snap-x snap-mandatory">
            {images.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={property.address}
                className="w-full h-full object-cover flex-shrink-0 snap-center"
              />
            ))}
          </div>
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <div
              className={`rounded-full ${scoreColor} text-white text-[10px] px-2 py-1 font-semibold shadow-sm`}
            >
              Score {score}
            </div>
          </div>
          {property.hoaMonthly != null && (
            <div className="absolute bottom-2 left-2 text-[10px] px-2 py-1 rounded-full bg-black/60 text-white">
              HOA ${Math.round(property.hoaMonthly).toLocaleString()}/mo
            </div>
          )}
          <button
            type="button"
            className="absolute top-2 right-2 text-[11px] bg-white/90 rounded-full px-2 py-1 shadow-sm text-slate-700 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
          >
            {isCompared ? '✓ Compared' : 'Compare'}
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 p-3 md:p-4 flex flex-col gap-2">
        <div className="flex justify-between gap-2">
          <div>
            <h2 className="text-sm md:text-base font-semibold text-slate-900">
              {property.address}
            </h2>
            <p className="text-xs text-slate-500">
              {property.city}, {property.state} {property.zip}
            </p>
            {property.yearBuilt && (
              <p className="text-[11px] text-slate-400">
                Built {property.yearBuilt}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm md:text-lg font-bold text-slate-900">
              ${property.listPrice.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500">
              {property.beds ?? '?'} bd · {property.baths ?? '?'} ba ·{' '}
              {property.sqft ? `${property.sqft.toLocaleString()} sqft` : '? sqft'}
            </div>
          </div>
        </div>

        {/* Metrics bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] md:text-xs">
          <MetricPill
            label="Cap rate"
            value={`${(metrics.capRate * 100).toFixed(1)}%`}
          />
          <MetricPill
            label="Cash-on-cash"
            value={`${(metrics.cashOnCash * 100).toFixed(1)}%`}
          />
          <MetricPill
            label="Est. rent"
            value={`$${Math.round(metrics.estimatedRent).toLocaleString()}/mo`}
          />
          <MetricPill
            label="Proj. value"
            value={`$${Math.round(
              metrics.projectedValueYearN
            ).toLocaleString()}`}
          />
        </div>

        {/* AI-ish insight */}
        <p className="text-[11px] text-slate-500 line-clamp-2">
          <span className="font-semibold text-slate-700">AI Insight: </span>
          {AIInsight}
        </p>

        {/* Footer actions */}
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className="text-slate-400 group-hover:text-sky-600">
            View details & projections →
          </span>
          {property.externalUrl && (
            <a
              href={property.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              View listing
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5 flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-xs font-semibold text-slate-800">{value}</span>
    </div>
  );
}

/* -------- Detail drawer -------- */

function PropertyDetailDrawer({
  item,
  horizon,
  strategy,
  assumptions,
  onClose,
}: {
  item: ScoredProperty;
  horizon: number;
  strategy: Strategy;
  assumptions: {
    taxRate: number;
    insuranceRate: number;
    maintenanceRate: number;
    managementRate: number;
    vacancyRate: number;
    loanRate: number;
    downPayment: number;
  };
  onClose: () => void;
}) {
  const { property, metrics, score } = item;

  // Simple projection series for chart
  const projectionPoints = useMemo(() => {
    const years = Array.from({ length: horizon + 1 }, (_, i) => i);
    const annualGrowth = Math.pow(
      metrics.projectedValueYearN / property.listPrice,
      1 / (horizon || 1)
    );
    return years.map((year) => ({
      year,
      value: Math.round(property.listPrice * Math.pow(annualGrowth, year)),
    }));
  }, [horizon, metrics.projectedValueYearN, property.listPrice]);

  const maxVal =
    projectionPoints.length > 0
      ? Math.max(...projectionPoints.map((p) => p.value))
      : property.listPrice;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-xl h-full bg-white shadow-xl flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {property.address}
            </h2>
            <p className="text-xs text-slate-500">
              {property.city}, {property.state} {property.zip}
            </p>
          </div>
          <button
            className="text-xs text-slate-500 hover:text-slate-800"
            onClick={onClose}
          >
            Close ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Big image */}
          {property.imageUrl && (
            <img
              src={property.imageUrl}
              alt={property.address}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          {/* Headline stats */}
          <div className="flex justify-between items-start gap-2">
            <div>
              <div className="text-lg font-bold text-slate-900">
                ${property.listPrice.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                {property.beds ?? '?'} bd · {property.baths ?? '?'} ba ·{' '}
                {property.sqft
                  ? `${property.sqft.toLocaleString()} sqft`
                  : '? sqft'}
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center justify-center rounded-full bg-slate-900 text-white text-[11px] px-3 py-1 font-semibold">
                Investment score {score}/100
              </div>
              <div className="mt-1 text-[11px] text-slate-500">
                Strategy: {strategy.replace(/_/g, ' ')} · {horizon} years
              </div>
            </div>
          </div>

          {/* ROI breakdown */}
          <section className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs">
            <h3 className="text-xs font-semibold text-slate-700">
              Cash flow & return snapshot
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <MetricPill label="Est. rent" value={`$${Math.round(metrics.estimatedRent).toLocaleString()}/mo`} />
              <MetricPill
                label="Annual NOI"
                value={`$${Math.round(metrics.annualNOI).toLocaleString()}`}
              />
              <MetricPill
                label="Cap rate"
                value={`${(metrics.capRate * 100).toFixed(1)}%`}
              />
              <MetricPill
                label="Cash-on-cash"
                value={`${(metrics.cashOnCash * 100).toFixed(1)}%`}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Includes estimated taxes ({(assumptions.taxRate * 100).toFixed(
                1
              )}
              %), insurance ({(assumptions.insuranceRate * 100).toFixed(1)}
              %), maintenance ({(assumptions.maintenanceRate * 100).toFixed(0)}%
              of rent), management (
              {(assumptions.managementRate * 100).toFixed(0)}% of rent), and
              HOA where applicable.
            </p>
          </section>

          {/* Projection chart */}
          <section className="bg-white border border-slate-100 rounded-lg p-3 text-xs">
            <h3 className="text-xs font-semibold text-slate-700 mb-2">
              10-year value projection (simple model)
            </h3>
            <div className="w-full h-40 bg-slate-50 rounded-md flex items-center justify-center">
              {/* Simple SVG line chart */}
              <svg viewBox="0 0 100 40" className="w-full h-full">
                {projectionPoints.map((pt, idx) => {
                  if (idx === 0) return null;
                  const prev = projectionPoints[idx - 1];
                  const x1 = (prev.year / horizon) * 90 + 5;
                  const x2 = (pt.year / horizon) * 90 + 5;
                  const y1 =
                    35 -
                    ((prev.value - property.listPrice) /
                      (maxVal - property.listPrice || 1)) *
                      30;
                  const y2 =
                    35 -
                    ((pt.value - property.listPrice) /
                      (maxVal - property.listPrice || 1)) *
                      30;
                  return (
                    <line
                      key={idx}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#0f766e"
                      strokeWidth="0.6"
                    />
                  );
                })}
              </svg>
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-slate-500">
              <span>Year 0: ${property.listPrice.toLocaleString()}</span>
              <span>
                Year {horizon}:{' '}
                ${Math.round(metrics.projectedValueYearN).toLocaleString()}
              </span>
            </div>
          </section>

          {/* Map preview placeholder */}
          <section className="bg-slate-50 rounded-lg p-3 text-xs">
            <h3 className="text-xs font-semibold text-slate-700 mb-1">
              Neighborhood snapshot
            </h3>
            <div className="h-32 bg-slate-200 rounded-md flex items-center justify-center text-[11px] text-slate-600">
              Map / heatmap integration placeholder
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Future enhancement: overlay heatmap of average investment score and rent
              performance for surrounding blocks.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

/* -------- Assumption modal -------- */

function AssumptionModal({
  assumptions,
  onChange,
  onClose,
}: {
  assumptions: {
    taxRate: number;
    insuranceRate: number;
    maintenanceRate: number;
    managementRate: number;
    vacancyRate: number;
    loanRate: number;
    downPayment: number;
  };
  onChange: (a: typeof assumptions) => void;
  onClose: () => void;
}) {
  const handleField = (field: keyof typeof assumptions, value: string) => {
    const num = Number(value) / (field.includes('Rate') || field === 'loanRate'
      ? 100
      : 1);
    onChange({ ...assumptions, [field]: isNaN(num) ? assumptions[field] : num });
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-md bg-white rounded-xl shadow-lg p-4 space-y-3 text-xs">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-semibold text-slate-900">
            Edit investment assumptions
          </h3>
          <button
            className="text-[11px] text-slate-500 hover:text-slate-800"
            onClick={onClose}
          >
            Close ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Property tax rate (%)"
            value={(assumptions.taxRate * 100).toString()}
            onChange={(v) => handleField('taxRate', v)}
          />
          <Field
            label="Insurance rate (%)"
            value={(assumptions.insuranceRate * 100).toString()}
            onChange={(v) => handleField('insuranceRate', v)}
          />
          <Field
            label="Maintenance (% of rent)"
            value={(assumptions.maintenanceRate * 100).toString()}
            onChange={(v) => handleField('maintenanceRate', v)}
          />
          <Field
            label="Mgmt (% of rent)"
            value={(assumptions.managementRate * 100).toString()}
            onChange={(v) => handleField('managementRate', v)}
          />
          <Field
            label="Vacancy rate (%)"
            value={(assumptions.vacancyRate * 100).toString()}
            onChange={(v) => handleField('vacancyRate', v)}
          />
          <Field
            label="Loan rate (%)"
            value={(assumptions.loanRate * 100).toString()}
            onChange={(v) => handleField('loanRate', v)}
          />
          <Field
            label="Down payment (%)"
            value={(assumptions.downPayment * 100).toString()}
            onChange={(v) => handleField('downPayment', v)}
          />
        </div>
        <p className="text-[11px] text-slate-500">
          Changes apply to future calculations for new searches. They won&apos;t retroactively
          change any printed or exported reports.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-slate-200 rounded-lg px-2 py-1 text-[11px]"
      />
    </div>
  );
}

/* -------- Compare modal -------- */

function CompareModal({
  items,
  onClose,
}: {
  items: ScoredProperty[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-4xl bg-white rounded-xl shadow-lg p-4 overflow-x-auto text-xs">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Compare properties ({items.length})
          </h3>
          <button
            className="text-[11px] text-slate-500 hover:text-slate-800"
            onClick={onClose}
          >
            Close ✕
          </button>
        </div>
        <table className="min-w-full border border-slate-100 text-[11px]">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 border-b border-r border-slate-100 text-left">
                Metric
              </th>
              {items.map((it) => (
                <th
                  key={it.property.id}
                  className="p-2 border-b border-r border-slate-100 text-left"
                >
                  <div className="font-semibold text-slate-800">
                    {it.property.address}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    ${it.property.listPrice.toLocaleString()}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                label: 'Beds / baths',
                render: (it: ScoredProperty) =>
                  `${it.property.beds ?? '?'} bd / ${it.property.baths ?? '?'} ba`,
              },
              {
                label: 'Sqft',
                render: (it: ScoredProperty) =>
                  it.property.sqft
                    ? `${it.property.sqft.toLocaleString()}`
                    : '?',
              },
              {
                label: 'Year built',
                render: (it: ScoredProperty) => it.property.yearBuilt ?? '?',
              },
              {
                label: 'Cap rate',
                render: (it: ScoredProperty) =>
                  `${(it.metrics.capRate * 100).toFixed(1)}%`,
              },
              {
                label: 'Cash-on-cash',
                render: (it: ScoredProperty) =>
                  `${(it.metrics.cashOnCash * 100).toFixed(1)}%`,
              },
              {
                label: 'Est. rent',
                render: (it: ScoredProperty) =>
                  `$${Math.round(it.metrics.estimatedRent).toLocaleString()}/mo`,
              },
              {
                label: 'Annual NOI',
                render: (it: ScoredProperty) =>
                  `$${Math.round(it.metrics.annualNOI).toLocaleString()}`,
              },
              {
                label: 'Projected value (horizon)',
                render: (it: ScoredProperty) =>
                  `$${Math.round(
                    it.metrics.projectedValueYearN
                  ).toLocaleString()}`,
              },
              {
                label: 'Score',
                render: (it: ScoredProperty) => it.score,
              },
            ].map((row) => (
              <tr key={row.label} className="odd:bg-white even:bg-slate-50/40">
                <td className="p-2 border-r border-slate-100 font-semibold text-slate-700">
                  {row.label}
                </td>
                {items.map((it) => (
                  <td
                    key={it.property.id + row.label}
                    className="p-2 border-r border-slate-100 text-slate-700"
                  >
                    {row.render(it) as any}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
