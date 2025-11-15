'use client';

import { useMemo, useState } from 'react';
import { colors } from '@/app/lib/theme';

type ViewMode = 'list' | 'grid' | 'map';
type Strategy = 'rental' | 'appreciation' | 'short_term_rental';
type SortKey = 'score' | 'capRate' | 'cashOnCash' | 'priceAsc' | 'priceDesc';

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
  images?: string[];
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
  zips: string;
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

  const [assumptions, setAssumptions] = useState({
    taxRate: 0.012,
    insuranceRate: 0.004,
    maintenanceRate: 0.1,
    managementRate: 0.08,
    vacancyRate: 0.05,
    loanRate: 0.065,
    downPayment: 0.25,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    if (!zipList.length) {
      setError('Please enter at least one ZIP code');
      setLoading(false);
      return;
    }

    try {
      const accumulated: ScoredProperty[] = [];

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
        if (!res.ok) throw new Error(json.error || 'Search failed');
        accumulated.push(...json.results);
      }

      setResults(accumulated);
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSorted = useMemo(() => {
    let arr = [...results];

    if (form.minCapRate) {
      const minCap = Number(form.minCapRate) / 100;
      arr = arr.filter((r) => r.metrics.capRate >= minCap);
    }
    if (form.maxHoa) {
      const maxHoa = Number(form.maxHoa);
      arr = arr.filter((r) => (r.property.hoaMonthly || 0) <= maxHoa);
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

  const handleSaveSearch = () => setSavedSearches((prev) => [...prev, form]);
  const loadSavedSearch = (s: SearchFormState) => setForm(s);

  const anyCompare = compareIds.size > 0;
  const compareList = filteredSorted.filter((r) => compareIds.has(r.property.id));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER WITH CONSISTENT HORIZONTAL PADDING */}
      <header
        className="sticky top-0 z-30 text-slate-50 shadow-md"
        style={{ backgroundColor: colors.brandNavy }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              LargeKite Capital · Investment Finder
            </h1>
            <p className="text-[11px] text-slate-300">
              Data-driven screening by ZIP, price, and time horizon.
            </p>
          </div>

          <div className="hidden md:block text-[11px] text-right text-slate-200">
            {form.zips && (
              <div>
                ZIPs:{' '}
                <span className="font-semibold" style={{ color: colors.brandTeal }}>
                  {form.zips}
                </span>
              </div>
            )}
            {(form.minPrice || form.maxPrice) && (
              <div>
                Price:
                {form.minPrice && ` $${Number(form.minPrice).toLocaleString()}+`}
                {form.maxPrice && ` – $${Number(form.maxPrice).toLocaleString()}`}
              </div>
            )}
            <div>
              {form.timeHorizonYears} yrs ·{' '}
              {form.strategy.replace(/_/g, ' ')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            {anyCompare && (
              <button
                className="hidden sm:inline-flex px-3 py-1.5 text-[11px] rounded-full text-white"
                style={{ backgroundColor: colors.brandTeal }}
                onClick={() => setShowCompareModal(true)}
              >
                Compare ({compareIds.size})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WITH CONSISTENT HORIZONTAL PADDING */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* SEARCH PANEL */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-4">
          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <FieldLabel>ZIP Codes</FieldLabel>
              <input
                name="zips"
                value={form.zips}
                onChange={handleChange}
                placeholder="e.g. 63011, 63021, 63141"
                className="input-base"
              />
            </div>

            <InputField
              name="minPrice"
              label="Min Price"
              placeholder="200000"
              form={form}
              handleChange={handleChange}
            />
            <InputField
              name="maxPrice"
              label="Max Price"
              placeholder="450000"
              form={form}
              handleChange={handleChange}
            />

            <InputField
              name="minBeds"
              label="Min Beds"
              form={form}
              handleChange={handleChange}
            />
            <InputField
              name="minBaths"
              label="Min Baths"
              form={form}
              handleChange={handleChange}
            />

            <SelectField
              name="strategy"
              label="Strategy"
              form={form}
              handleChange={handleChange}
              options={[
                { value: 'rental', label: 'Buy & Hold Rental' },
                { value: 'appreciation', label: 'Appreciation Focused' },
                { value: 'short_term_rental', label: 'Short-Term Rental' },
              ]}
            />

            <SelectField
              name="timeHorizonYears"
              label="Horizon (yrs)"
              form={form}
              handleChange={handleChange}
              options={[
                { value: '3', label: '3' },
                { value: '5', label: '5' },
                { value: '10', label: '10' },
              ]}
            />

            <InputField
              name="minCapRate"
              label="Min Cap Rate (%)"
              placeholder="5"
              form={form}
              handleChange={handleChange}
            />
            <InputField
              name="maxHoa"
              label="Max HOA ($/mo)"
              placeholder="250"
              form={form}
              handleChange={handleChange}
            />

            <div className="flex items-end gap-2 md:col-span-2">
              <button
                type="submit"
                className="btn-primary w-full md:w-auto"
                disabled={loading}
              >
                {loading ? 'Searching…' : 'Find Properties'}
              </button>

              <button
                type="button"
                onClick={handleSaveSearch}
                className="btn-ghost hidden md:inline-flex"
              >
                Save search
              </button>

              <button
                type="button"
                onClick={() => setShowAssumptions(true)}
                className="btn-ghost ml-auto"
              >
                Edit assumptions
         

You’re right to call that out — the page got big and a bit inconsistent.

Here’s what I’ve done in this version:

- Added **consistent padding** on the left (and right) using the same container pattern (`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`) for both header and main.
- Standardized input styles via `.input-base` and buttons via `.btn-primary` / `.btn-ghost`.
- Kept your colors coming from a central `theme.ts`.

Below is a **cleaned-up, complete, copy-paste-able** `page.tsx` that fixes the left padding issue and standardizes styles.

---

### ✅ `app/tools/investment-property-finder/page.tsx`

```tsx
'use client';

import { useMemo, useState } from 'react';
import { colors } from '@/app/lib/theme';
import { exportInvestmentPdf } from '@/app/lib/pdf/investmentReport';

type ViewMode = 'list' | 'grid' | 'map';
type Strategy = 'rental' | 'appreciation' | 'short_term_rental';
type SortKey = 'score' | 'capRate' | 'cashOnCash' | 'priceAsc' | 'priceDesc';

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
  images?: string[];
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
  zips: string;
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

    if (!zipList.length) {
      setError('Please enter at least one ZIP code');
      setLoading(false);
      return;
    }

    try {
      const accumulated: ScoredProperty[] = [];

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
        if (!res.ok) throw new Error(json.error || 'Search failed');
        accumulated.push(...json.results);
      }

      setResults(accumulated);
    } catch (err: any) {
      setError(err.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSorted = useMemo(() => {
    let arr = [...results];

    if (form.minCapRate) {
      const minCap = Number(form.minCapRate) / 100;
      arr = arr.filter((r) => r.metrics.capRate >= minCap);
    }
    if (form.maxHoa) {
      const maxHoa = Number(form.maxHoa);
      arr = arr.filter((r) => (r.property.hoaMonthly || 0) <= maxHoa);
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

  const handleSaveSearch = () => setSavedSearches((p) => [...p, form]);
  const loadSavedSearch = (s: SearchFormState) => setForm(s);

  const anyCompare = compareIds.size > 0;
  const compareList = filteredSorted.filter((r) => compareIds.has(r.property.id));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER with consistent left padding */}
      <header
        className="sticky top-0 z-30 text-slate-50 shadow-md"
        style={{ backgroundColor: colors.brandNavy }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              LargeKite Capital · Investment Finder
            </h1>
            <p className="text-[11px] text-slate-300">
              Data-driven screening by ZIP, price, and time horizon.
            </p>
          </div>

          <div className="hidden md:block text-[11px] text-right text-slate-200">
            {form.zips && (
              <div>
                ZIPs:{' '}
                <span className="font-semibold" style={{ color: colors.brandTeal }}>
                  {form.zips}
                </span>
              </div>
            )}
            {(form.minPrice || form.maxPrice) && (
              <div>
                Price:
                {form.minPrice && ` $${Number(form.minPrice).toLocaleString()}+`}
                {form.maxPrice && ` – $${Number(form.maxPrice).toLocaleString()}`}
              </div>
            )}
            <div>
              {form.timeHorizonYears} yrs · {form.strategy.replace(/_/g, ' ')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            {anyCompare && (
              <button
                className="btn-primary hidden sm:inline-flex px-3 py-1.5 text-[11px]"
                onClick={() => setShowCompareModal(true)}
              >
                Compare ({compareIds.size})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN with same horizontal padding */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* SEARCH PANEL */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 sm:p-5 space-y-4">
          <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <FieldLabel>ZIP Codes</FieldLabel>
              <input
                name="zips"
                value={form.zips}
                onChange={handleChange}
                placeholder="e.g. 63011, 63021, 63141"
                className="input-base"
              />
            </div>

            <InputField
              name="minPrice"
              label="Min Price"
              placeholder="200000"
              form={form}
              handleChange={handleChange}
            />
            <InputField
              name="maxPrice"
              label="Max Price"
              placeholder="450000"
              form={form}
              handleChange={handleChange}
            />

            <InputField
              name="minBeds"
              label="Min Beds"
              form={form}
              handleChange={handleChange}
            />
            <InputField
              name="minBaths"
              label="Min Baths"
              form={form}
              handleChange={handleChange}
            />

            <SelectField
              name="strategy"
              label="Strategy"
              form={form}
              handleChange={handleChange}
              options={[
                { value: 'rental', label: 'Buy & Hold Rental' },
                { value: 'appreciation', label: 'Appreciation Focused' },
                { value: 'short_term_rental', label: 'Short-Term Rental' },
              ]}
            />

            <SelectField
              name="timeHorizonYears"
              label="Horizon (yrs)"
              form={form}
              handleChange={handleChange}
              options={[
                { value: '3', label: '3' },
                { value: '5', label: '5' },
                { value: '10', label: '10' },
              ]}
            />

            <InputField
              name="minCapRate"
              label="Min Cap Rate (%)"
              placeholder="5"
              form={form}
              handleChange={handleChange}
            />
            <InputField
              name="maxHoa"
              label="Max HOA ($/mo)"
              placeholder="250"
              form={form}
              handleChange={handleChange}
            />

            <div className="flex items-end gap-2 md:col-span-2">
              <button
                type="submit"
                className="btn-primary w-full md:w-auto"
                disabled={loading}
              >
                {loading ? 'Searching…' : 'Find Properties'}
              </button>

              <button
                type="button"
                onClick={handleSaveSearch}
                className="btn-ghost hidden md:inline-flex"
              >
                Save search
              </button>

              <button
                type="button"
                onClick={() => setShowAssumptions(true)}
                className="btn-ghost ml-auto"
              >
                Edit assumptions
              </button>
            </div>
          </form>

          {savedSearches.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold text-slate-600 mb-2 uppercase">
                Saved searches
              </p>
              <div className="flex flex-wrap gap-2">
                {savedSearches.map((s, idx) => (
                  <button
                    key={idx}
                    className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700"
                    onClick={() => loadSavedSearch(s)}
                  >
                    {s.zips} · {s.timeHorizonYears}y ·{' '}
                    {s.strategy.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="mt-2 text-[10px] text-slate-400 leading-snug">
            This tool is for educational use only and is not personalized financial advice.
          </p>
        </section>

        {/* SORT / SUMMARY */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <SortPills sortKey={sortKey} setSortKey={setSortKey} />
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
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

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-sm text-red-700 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* RESULTS */}
        <section>
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-xl" />
              ))}
            </div>
          )}

          {!loading && filteredSorted.length === 0 && !error && (
            <p className="text-sm text-slate-500">
              No results yet. Enter filters above and click{' '}
              <span className="font-semibold" style={{ color: colors.brandTeal }}>
                Find Properties
              </span>
              .
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
                      onSelect={() => setSelectedProperty(item)}
                      onToggleCompare={() => toggleCompare(item.property.id)}
                      isCompared={compareIds.has(item.property.id)}
                      compact={false}
                    />
                  ))}
                </div>
              )}

              {viewMode === 'map' && (
                <div className="grid md:grid-cols-[2fr,3fr] gap-4">
                  <div className="h-[380px] bg-slate-200 rounded-xl flex items-center justify-center text-sm text-slate-600">
                    Map / Heatmap coming soon
                  </div>
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-2">
                    {filteredSorted.map((item) => (
                      <PropertyCard
                        key={item.property.id}
                        data={item}
                        onSelect={() => setSelectedProperty(item)}
                        onToggleCompare={() => toggleCompare(item.property.id)}
                        isCompared={compareIds.has(item.property.id)}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* MODALS / DRAWERS */}
      {selectedProperty && (
        <PropertyDetailDrawer
          item={selectedProperty}
          horizon={Number(form.timeHorizonYears || '5')}
          strategy={form.strategy}
          assumptions={assumptions}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      {showAssumptions && (
        <AssumptionModal
          assumptions={assumptions}
          onChange={setAssumptions}
          onClose={() => setShowAssumptions(false)}
        />
      )}

      {showCompareModal && compareList.length > 0 && (
        <CompareModal
          items={compareList}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </div>
  );
}

/* ---------- SMALL SHARED UI HELPERS ---------- */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
      {children}
    </label>
  );
}

function InputField({
  name,
  label,
  placeholder,
  form,
  handleChange,
}: any) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        className="input-base"
      />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  form,
  handleChange,
}: any) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        name={name}
        value={form[name]}
        onChange={handleChange}
        className="input-base"
      >
        {options.map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------- VIEW TOGGLE & SORT PILLS ---------- */

function ViewToggle({ viewMode, setViewMode }: any) {
  const Btn = (mode: ViewMode, label: string) => (
    <button
      key={mode}
      onClick={() => setViewMode(mode)}
      className={[
        'px-2.5 py-1 rounded-full text-[11px] font-medium border',
        viewMode === mode
          ? 'bg-white text-slate-900 border-white shadow-sm'
          : 'bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800',
      ].join(' ')}
    >
      {label}
    </button>
  );
  return (
    <div className="flex gap-1">
      {Btn('list', 'List')}
      {Btn('grid', 'Grid')}
      {Btn('map', 'Map')}
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
            'px-3 py-1.5 rounded-full text-[11px] border',
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

/* ---------- PROPERTY CARD ---------- */

function PropertyCard({
  data,
  onSelect,
  onToggleCompare,
  isCompared,
  compact,
}: any) {
  const { property, metrics, score } = data;
  const images =
    property.images?.length
      ? property.images
      : property.imageUrl
      ? [property.imageUrl]
      : [];

  const scoreColor =
    score >= 80
      ? 'bg-emerald-500'
      : score >= 60
      ? 'bg-amber-400'
      : 'bg-rose-500';

  const AIInsight = (() => {
    const { capRate, cashOnCash } = metrics;
    if (capRate >= 0.08) return 'Strong cap rate for SFH market.';
    if (cashOnCash >= 0.10) return 'Attractive cash-on-cash projection.';
    return 'Decent fundamentals; depends on investor objectives.';
  })();

  return (
    <article
      className={[
        'group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col',
        compact ? 'md:flex-row' : '',
      ].join(' ')}
      onClick={onSelect}
    >
      {images.length > 0 && (
        <div
          className={[
            'relative',
            compact ? 'md:w-40 h-32' : 'h-40',
          ].join(' ')}
        >
          <div className="w-full h-full overflow-x-auto flex gap-1 snap-x snap-mandatory scroll-smooth">
            {images.map((src: string, i: number) => (
              <img
                key={i}
                src={src}
                alt={property.address}
                className="w-full h-full object-cover flex-shrink-0 snap-center"
              />
            ))}
          </div>

          <div className="absolute top-2 left-2">
            <div
              className={`${scoreColor} text-white text-[10px] px-2 py-1 rounded-full font-semibold`}
            >
              Score {score}
            </div>
          </div>

          {property.hoaMonthly && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full">
              HOA ${Math.round(property.hoaMonthly)}/mo
            </div>
          )}

          <button
            type="button"
            className="absolute top-2 right-2 bg-white/90 px-2 py-1 text-[11px] rounded-full shadow-sm text-slate-700 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare();
            }}
          >
            {isCompared ? '✓ Compared' : 'Compare'}
          </button>
        </div>
      )}

      <div className="p-3 md:p-4 flex-1 flex flex-col gap-2">
        <div className="flex justify-between gap-2">
          <div>
            <h2 className="text-sm md:text-base font-semibold">
              {property.address}
            </h2>
            <p className="text-xs text-slate-500">
              {property.city}, {property.state} {property.zip}
            </p>
            {property.yearBuilt && (
              <p className="text-[11px] text-slate-400">Built {property.yearBuilt}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm md:text-lg font-semibold text-slate-900">
              ${property.listPrice.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500">
              {property.beds ?? '?'} bd · {property.baths ?? '?'} ba ·{' '}
              {property.sqft ? `${property.sqft.toLocaleString()} sqft` : '? sqft'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          <MetricPill
            label="Cap Rate"
            value={`${(metrics.capRate * 100).toFixed(1)}%`}
          />
          <MetricPill
            label="CoC"
            value={`${(metrics.cashOnCash * 100).toFixed(1)}%`}
          />
          <MetricPill
            label="Rent"
            value={`$${Math.round(metrics.estimatedRent)}/mo`}
          />
          <MetricPill
            label="Proj. Value"
            value={`$${Math.round(
              metrics.projectedValueYearN
            ).toLocaleString()}`}
          />
        </div>

        <p className="text-[11px] text-slate-500 line-clamp-2">
          <span className="font-semibold text-slate-700">AI Insight: </span>
          {AIInsight}
        </p>

        <div className="flex justify-between items-center text-[11px] mt-auto">
          <span className="text-slate-400 group-hover:text-sky-500">
            View details →
          </span>
          {property.externalUrl && (
            <a
              href={property.externalUrl}
              onClick={(e) => e.stopPropagation()}
              target="_blank"
              className="text-sky-500 hover:underline"
            >
              Listing
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function MetricPill({ label, value }: any) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5">
      <div className="text-[10px] text-slate-400 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-xs font-semibold text-slate-900">{value}</div>
    </div>
  );
}

/* ---------- DETAIL DRAWER ---------- */

function PropertyDetailDrawer({
  item,
  horizon,
  strategy,
  assumptions,
  onClose,
}: any) {
  const { property, metrics, score } = item;

  const projection = [];
  const start = property.listPrice;
  const end = metrics.projectedValueYearN;
  const growth = Math.pow(end / start, 1 / (horizon || 1));
  for (let y = 0; y <= horizon; y++) {
    projection.push({
      year: y,
      value: Math.round(start * Math.pow(growth, y)),
    });
  }
  const maxVal = Math.max(...projection.map((p: any) => p.value));

  const handleExportPdf = async () => {
    await exportInvestmentPdf({
      item,
      horizon,
      strategy,
      assumptions,
    });
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-xl h-full bg-white shadow-xl flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold">{property.address}</h2>
            <p className="text-xs text-slate-500">
              {property.city}, {property.state} {property.zip}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost text-[11px]" onClick={handleExportPdf}>
              Export PDF
            </button>
            <button
              className="text-[11px] text-slate-500 hover:text-slate-800"
              onClick={onClose}
            >
              ✕ Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {property.imageUrl && (
            <img
              src={property.imageUrl}
              alt={property.address}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          <div className="flex justify-between gap-2">
            <div>
              <div className="text-xl font-bold text-slate-900">
                ${property.listPrice.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-500">
                {property.beds ?? '?'} bd · {property.baths ?? '?'} ba ·{' '}
                {property.sqft ? `${property.sqft.toLocaleString()} sqft` : '? sqft'}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-slate-900 text-white text-[11px] px-3 py-1 rounded-full">
                Score {score}/100
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {strategy.replace(/_/g, ' ')} · {horizon} yrs
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2 text-xs">
            <h3 className="font-semibold text-slate-800">Cash Flow Snapshot</h3>
            <div className="grid grid-cols-2 gap-2">
              <MetricPill
                label="Rent"
                value={`$${Math.round(metrics.estimatedRent)}/mo`}
              />
              <MetricPill
                label="NOI"
                value={`$${Math.round(metrics.annualNOI).toLocaleString()}`}
              />
              <MetricPill
                label="Cap Rate"
                value={`${(metrics.capRate * 100).toFixed(1)}%`}
              />
              <MetricPill
                label="CoC"
                value={`${(metrics.cashOnCash * 100).toFixed(1)}%`}
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Includes tax {(assumptions.taxRate * 100).toFixed(1)}%, insurance{' '}
              {(assumptions.insuranceRate * 100).toFixed(1)}%, maintenance{' '}
              {(assumptions.maintenanceRate * 100).toFixed(1)}%, management{' '}
              {(assumptions.managementRate * 100).toFixed(1)}%.
            </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-slate-800">
              Value Projection
            </h3>
            <svg viewBox="0 0 100 40" className="w-full h-32 mt-2">
              {projection.map((p: any, i: number) => {
                if (i === 0) return null;
                const prev = projection[i - 1];
                const x1 = (prev.year / horizon) * 90 + 5;
                const x2 = (p.year / horizon) * 90 + 5;
                const y1 =
                  35 -
                  ((prev.value - start) / (maxVal - start || 1)) * 30;
                const y2 =
                  35 -
                  ((p.value - start) / (maxVal - start || 1)) * 30;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={colors.brandTeal}
                    strokeWidth={1}
                  />
                );
              })}
            </svg>
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>${start.toLocaleString()}</span>
              <span>
                Year {horizon}: ${metrics.projectedValueYearN.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs">
            <h3 className="font-semibold text-slate-800 mb-1">
              Neighborhood
            </h3>
            <div className="h-32 bg-slate-200 rounded-lg flex items-center justify-center text-[11px] text-slate-600">
              Map / heatmap coming soon
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- ASSUMPTION MODAL ---------- */

function AssumptionModal({
  assumptions,
  onChange,
  onClose,
}: any) {
  const setField = (key: keyof typeof assumptions, val: string) => {
    const num = Number(val) / 100;
    onChange({
      ...assumptions,
      [key]: isNaN(num) ? assumptions[key] : num,
    });
  };

  const fields: [keyof typeof assumptions, string][] = [
    ['taxRate', 'Tax Rate (%)'],
    ['insuranceRate', 'Insurance (%)'],
    ['maintenanceRate', 'Maintenance (%)'],
    ['managementRate', 'Management (%)'],
    ['vacancyRate', 'Vacancy (%)'],
    ['loanRate', 'Loan Rate (%)'],
    ['downPayment', 'Down Payment (%)'],
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 bg-white w-full max-w-md p-4 rounded-xl shadow-lg">
        <div className="flex justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Edit assumptions
          </h3>
          <button
            className="text-xs text-slate-500 hover:text-slate-800"
            onClick={onClose}
          >
            ✕ Close
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {fields.map(([key, label]) => (
            <div key={key}>
              <FieldLabel>{label}</FieldLabel>
              <input
                className="input-base text-[11px] py-1"
                value={(
                  assumptions[key as keyof typeof assumptions] * 100
                ).toString()}
                onChange={(e) => setField(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- COMPARE MODAL ---------- */

function CompareModal({ items, onClose }: any) {
  const rows = [
    {
      label: 'Price',
      render: (it: any) => `$${it.property.listPrice.toLocaleString()}`,
    },
    {
      label: 'Beds / Baths',
      render: (it: any) =>
        `${it.property.beds ?? '?'} bd / ${it.property.baths ?? '?'} ba`,
    },
    {
      label: 'Sqft',
      render: (it: any) => it.property.sqft?.toLocaleString() || '?',
    },
    {
      label: 'Cap Rate',
      render: (it: any) => `${(it.metrics.capRate * 100).toFixed(1)}%`,
    },
    {
      label: 'Cash-on-Cash',
      render: (it: any) =>
        `${(it.metrics.cashOnCash * 100).toFixed(1)}%`,
    },
    {
      label: 'Rent',
      render: (it: any) =>
        `$${Math.round(it.metrics.estimatedRent)}/mo`,
    },
    {
      label: 'NOI',
      render: (it: any) =>
        `$${Math.round(it.metrics.annualNOI).toLocaleString()}`,
    },
    {
      label: 'Projected Value',
      render: (it: any) =>
        `$${Math.round(
          it.metrics.projectedValueYearN
        ).toLocaleString()}`,
    },
    {
      label: 'Score',
      render: (it: any) => it.score,
    },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 bg-white w-full max-w-4xl rounded-xl shadow-lg p-4 overflow-x-auto">
        <div className="flex justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Compare properties ({items.length})
          </h3>
          <button
            className="text-xs text-slate-500 hover:text-slate-800"
            onClick={onClose}
          >
            ✕ Close
          </button>
        </div>
        <table className="min-w-full border border-slate-100 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-2 border-r border-slate-100 text-left">
                Metric
              </th>
              {items.map((it: any) => (
                <th
                  key={it.property.id}
                  className="p-2 border-r border-slate-100 text-left"
                >
                  {it.property.address}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className="odd:bg-white even:bg-slate-50/40"
              >
                <td className="p-2 border-r border-slate-100 font-semibold text-slate-700">
                  {row.label}
                </td>
                {items.map((it: any) => (
                  <td
                    key={it.property.id + row.label}
                    className="p-2 border-r border-slate-100"
                  >
                    {row.render(it)}
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

/* ---------- STANDARDIZED UTILITY CLASSES ---------- */
/* Tailwind plugin style: you can drop these into globals.css if you prefer,
   but using them as className strings keeps everything consistent. */

/* In your tailwind setup you can add:
   @layer components {
     .input-base { @apply w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/70; }
     .btn-primary { @apply inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-60; }
     .btn-ghost { @apply inline-flex items-center justify-center px-3 py-2 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-700 hover:bg-slate-50; }
   }
*/
