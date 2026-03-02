import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Activity,
  Server,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Globe,
  BarChart3,
  Star,
  Palmtree
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MiniChart from '../../components/ui/MiniChart';
import { adminData } from '../../data/mockData';
import { supabase, isSupabaseReady } from '../../services/supabase';
import { cacheService } from '../../services/CacheService';

/* ─── Asset-style cards with colored backgrounds matching template ─── */
const assetCards = [
  {
    label: 'Active Companies',
    value: '12',
    sub: '245 employees',
    change: '+0.14%',
    positive: true,
    bg: 'bg-[#edf6ff]',
    darkBg: 'dark:bg-blue-500/10',
    icon: Building2,
    iconBg: 'bg-[#2a85ff]',
  },
  {
    label: 'Total Users',
    value: '1,846',
    sub: '89 active today',
    change: '+0.31%',
    positive: true,
    bg: 'bg-brand-50',
    darkBg: 'dark:bg-brand-500/10',
    icon: Users,
    iconBg: 'bg-[#8e55ea]',
  },
  {
    label: 'Uptime',
    value: '99.8%',
    sub: '346 processes',
    change: '+0.27%',
    positive: true,
    bg: 'bg-[#eafaf0]',
    darkBg: 'dark:bg-emerald-500/10',
    icon: Activity,
    iconBg: 'bg-[#83bf6e]',
  },
];

/* ─── Market-style table data ─── */
const orgTableData = [
  { id: 1, name: 'TechCorp International', tag: 'TECH', plan: 'Enterprise', users: '245', growth: '+13.38%', positive: true, status: 'active' },
  { id: 2, name: 'FinServe Global', tag: 'FIN', plan: 'Business', users: '189', growth: '+11.19%', positive: true, status: 'active' },
  { id: 3, name: 'MediCare Plus', tag: 'MED', plan: 'Enterprise', users: '156', growth: '+7.57%', positive: true, status: 'active' },
  { id: 4, name: 'EduLearn Academy', tag: 'EDU', plan: 'Starter', users: '112', growth: '-6.80%', positive: false, status: 'trial' },
  { id: 5, name: 'RetailMax Holdings', tag: 'RET', plan: 'Business', users: '198', growth: '+3.22%', positive: true, status: 'active' },
];

const orgAvatarColors = [
  'from-[#2a85ff] to-[#6cb4ff]',
  'from-[#ff6a55] to-[#ff9a7b]',
  'from-[#83bf6e] to-[#a8d99a]',
  'from-[#8e55ea] to-[#b38cf5]',
  'from-[#ff9a55] to-[#ffbe7b]',
];

function getOrgColumns(toggleFavorite, favorites) {
  return [
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-9 h-9 rounded-xl
                           bg-gradient-to-br ${orgAvatarColors[(row.id - 1) % orgAvatarColors.length]}
                           text-white text-[10px] font-bold shrink-0 shadow-sm`}>
            {row.tag}
          </div>
          <div>
            <span className="font-semibold text-text-primary block text-sm">{val}</span>
            <span className="text-[11px] text-text-tertiary">{row.tag}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'users',
      label: 'Users',
      cellClassName: 'font-semibold text-text-primary text-sm',
    },
    {
      key: 'growth',
      label: 'Change',
      render: (val, row) => (
        <span className={`text-sm font-medium ${row.positive ? 'text-[#83bf6e]' : 'text-[#ff6a55]'}`}>
          {val}
        </span>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      render: (val) => (
        <span className="text-sm text-text-secondary">{val}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const map = { active: 'success', trial: 'warning', suspended: 'danger' };
        return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
      },
    },
    {
      key: 'watch',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(row.id); }}
          className={`transition-colors cursor-pointer ${favorites.includes(row.id) ? 'text-[#fbbf24]' : 'text-text-tertiary hover:text-[#fbbf24]'}`}
        >
          <Star size={16} fill={favorites.includes(row.id) ? '#fbbf24' : 'none'} />
        </button>
      ),
    },
  ];
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState(assetCards);
  const [orgs, setOrgs] = useState(orgTableData);
  const [totalUsers, setTotalUsers] = useState('1,846');
  const [systemLogs, setSystemLogs] = useState(adminData.systemLogs);
  const [timeRange, setTimeRange] = useState('1Y');
  const [chartData, setChartData] = useState(adminData.monthlyUsers || []);
  const [orgPeriod, setOrgPeriod] = useState('month');
  const [orgSort, setOrgSort] = useState('growing');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('flowly_fav_orgs') || '[]'); } catch { return []; }
  });
  const [globalLeave, setGlobalLeave] = useState(adminData.globalLeaveRequests || []);

  const leaveColumns = [
    { key: 'employeeName', label: 'Employee', cellClassName: 'font-semibold text-text-primary text-sm' },
    { key: 'org', label: 'Organization', cellClassName: 'text-text-tertiary text-xs font-bold uppercase' },
    { key: 'type', label: 'Type', render: (val) => <StatusBadge variant="neutral" size="sm">{val}</StatusBadge> },
    { key: 'dates', label: 'Period', cellClassName: 'text-text-secondary text-xs' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const map = { approved: 'success', pending: 'warning', rejected: 'danger' };
        return <StatusBadge variant={map[val] || 'neutral'} dot size="sm">{val}</StatusBadge>;
      },
    },
  ];

  // ── Toggle favorite org ──
  const toggleFavorite = useCallback((orgId) => {
    setFavorites(prev => {
      const next = prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId];
      localStorage.setItem('flowly_fav_orgs', JSON.stringify(next));
      return next;
    });
  }, []);

  // ── Build chart data based on time range ──
  const getChartSlice = useCallback((range, fullData) => {
    const months = { '3M': 3, '6M': 6, '1Y': 12, 'YTD': new Date().getMonth() + 1, 'ALL': fullData.length };
    const count = months[range] || 12;
    return fullData.slice(-count);
  }, []);

  // ── Fetch chart data from Supabase or use mock ──
  const fetchChartData = useCallback(async (range) => {
    if (!isSupabaseReady) {
      const raw = adminData.monthlyUsers || [];
      const arr = Array.isArray(raw) && typeof raw[0] === 'object' ? raw : raw.map((v, i) => ({ label: `M${i+1}`, value: v }));
      setChartData(getChartSlice(range, arr));
      return;
    }
    const data = await cacheService.getOrSet(`admin:chart:${range}`, async () => {
      const months = { '3M': 3, '6M': 6, '1Y': 12, 'YTD': new Date().getMonth() + 1, 'ALL': 24 };
      const count = months[range] || 12;
      const since = new Date();
      since.setMonth(since.getMonth() - count);
      const { data: rows } = await supabase.from('users')
        .select('created_at')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: true });
      if (!rows || rows.length === 0) return null;
      // Bucket into months
      const buckets = {};
      rows.forEach(r => {
        const d = new Date(r.created_at);
        const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        buckets[key] = (buckets[key] || 0) + 1;
      });
      // Cumulative
      let cum = 0;
      return Object.entries(buckets).map(([label, value]) => { cum += value; return { label, value: cum }; });
    }, 120);
    if (data) {
      setChartData(data);
    } else {
      const raw = adminData.monthlyUsers || [];
      const arr = Array.isArray(raw) && typeof raw[0] === 'object' ? raw : raw.map((v, i) => ({ label: `M${i+1}`, value: v }));
      setChartData(getChartSlice(range, arr));
    }
  }, [getChartSlice]);

  // ── Fetch orgs with period/sort filters ──
  const fetchOrgs = useCallback(async () => {
    if (!isSupabaseReady) {
      let sorted = [...orgTableData];
      if (orgSort === 'users') sorted.sort((a, b) => parseInt(b.users) - parseInt(a.users));
      if (orgSort === 'newest') sorted.sort((a, b) => b.id - a.id);
      setOrgs(sorted);
      return;
    }
    const since = new Date();
    if (orgPeriod === 'month') since.setMonth(since.getMonth() - 1);
    else if (orgPeriod === 'quarter') since.setMonth(since.getMonth() - 3);
    else since.setFullYear(since.getFullYear() - 1);

    const { data } = await supabase.from('entreprises')
      .select('id, name, status, plan, created_at')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);
    if (!data || data.length === 0) return;
    setOrgs(data.map((e) => ({
      id: e.id,
      name: e.name,
      tag: e.name.slice(0, 4).toUpperCase(),
      plan: e.plan || 'Business',
      users: '-',
      growth: '',
      positive: true,
      status: e.status || 'active',
    })));
  }, [orgPeriod, orgSort]);

  // ── Initial data load ──
  useEffect(() => {
    fetchChartData(timeRange);

    if (!isSupabaseReady) return;

    // Counts
    cacheService.getOrSet('admin:counts', async () => {
      const [ents, users] = await Promise.all([
        supabase.from('entreprises').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
      ]);
      return { entCount: ents.count ?? 0, userCount: users.count ?? 0 };
    }, 120).then(({ entCount, userCount }) => {
      setTotalUsers(userCount.toLocaleString());
      setCards(prev => [
        { ...prev[0], value: entCount.toString(), sub: `${userCount} employees` },
        { ...prev[1], value: userCount.toLocaleString(), sub: 'registered users' },
        prev[2],
      ]);
    });

    // System logs
    cacheService.getOrSet('admin:logs', async () => {
      const { data } = await supabase.from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);
      return data;
    }, 60).then((data) => {
      if (!data || data.length === 0) return;
      setSystemLogs(data.map(l => ({
        id: l.id,
        severity: l.severity || l.level || 'info',
        event: l.event || l.action || l.message || 'System event',
        details: l.details || '',
        time: new Date(l.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      })));
    });
  }, [fetchChartData, timeRange]);

  // ── Refetch orgs when filters change ──
  useEffect(() => { fetchOrgs(); }, [fetchOrgs]);

  return (
    <div className="space-y-6">
      {/* Header — clean like template */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Overview
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.location.href = '/modules/vacation'}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Palmtree size={16} />
            Vacation Management
          </button>
          <button
            onClick={() => window.location.href = '/modules/TaskPerformance'}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Activity size={16} />
            Task & Performance
          </button>
        </div>
      </div>

      {/* Top Row: Portfolio card + Asset cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Portfolio-style summary card */}
        <div className="lg:col-span-5 bg-surface-primary rounded-2xl border border-border-secondary p-6
                        animate-fade-in">
          <h2 className="text-sm font-semibold text-text-secondary mb-1">System Usage</h2>
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-3xl font-bold text-text-primary tracking-tight">{totalUsers}</span>
            <span className="text-xs font-medium text-text-tertiary">total users</span>
          </div>
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#eafaf0] dark:bg-emerald-500/10 mb-4">
            <ArrowUpRight size={12} className="text-[#83bf6e]" />
            <span className="text-xs font-semibold text-[#83bf6e]">+12.4%</span>
          </div>

          {/* Mini chart */}
          <div className="mt-2">
            <MiniChart
              data={chartData}
              label="Monthly active users"
              height={80}
              colorFrom="#2a85ff"
              colorTo="#6cb4ff"
            />
          </div>

          {/* Time range tabs */}
          <div className="flex items-center gap-1 mt-4">
            {['3M', '6M', '1Y', 'YTD', 'ALL'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setTimeRange(tab); fetchChartData(tab); }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer
                  ${tab === timeRange
                    ? 'bg-text-primary text-text-inverse'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Asset-style cards column — stretches to match System Usage height */}
        <div className="lg:col-span-7 flex flex-col">
          <h2 className="text-sm font-semibold text-text-secondary mb-3">Quick Stats</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            {cards.map((card, i) => (
              <div
                key={i}
                className={`${card.bg} ${card.darkBg} rounded-2xl p-5 animate-fade-in
                            hover:-translate-y-0.5 transition-transform duration-200
                            flex flex-col justify-between`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div>
                  <span className="text-xl font-bold text-text-primary block">{card.value}</span>
                  <span className="text-xs text-text-tertiary">{card.sub}</span>
                </div>

                {/* Bottom row: icon + change */}
                <div className="flex items-center justify-between mt-auto pt-4">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-xl ${card.iconBg} shadow-sm`}>
                    <card.icon size={14} className="text-white" />
                  </div>
                  <div className="flex items-center gap-0.5">
                    {card.positive
                      ? <ArrowUpRight size={12} className="text-[#83bf6e]" />
                      : <ArrowDownRight size={12} className="text-[#ff6a55]" />
                    }
                    <span className={`text-xs font-medium ${card.positive ? 'text-[#83bf6e]' : 'text-[#ff6a55]'}`}>
                      {card.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {/* Global Leave Stats Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-border-secondary animate-fade-in flex flex-col justify-between"
              style={{ animationDelay: '240ms' }}>
              <div>
                <span className="text-sm font-semibold text-text-secondary block mb-2 uppercase tracking-wider">Global Leave</span>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <span className="text-xl font-bold text-text-primary block">
                      {globalLeave.filter(r => r.status === 'pending').length}
                    </span>
                    <span className="text-[10px] text-text-tertiary uppercase font-bold">Pending</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-xl font-bold text-text-primary block">
                      {globalLeave.filter(r => r.status === 'approved').length}
                    </span>
                    <span className="text-[10px] text-text-tertiary uppercase font-bold">Approved</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border-secondary flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-text-secondary">Normal Load</span>
                </div>
                <Palmtree size={14} className="text-text-tertiary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Vacation Requests Table */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden animate-fade-in"
        style={{ animationDelay: '350ms' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-text-primary">Cross-Organization Leave Activity</h2>
            <StatusBadge variant="info" size="sm">Demo Data</StatusBadge>
          </div>
          <button onClick={() => window.location.href = '/modules/vacation'}
            className="text-xs font-medium text-brand-500 hover:text-brand-600 transition-colors">
            Configure Policies
          </button>
        </div>
        <DataTable columns={leaveColumns} data={globalLeave} />
      </div>

      {/* Bottom Row: Organizations table + Promo card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Organizations Table — styled like the "Market" table */}
        <div className="lg:col-span-8 bg-surface-primary rounded-2xl border border-border-secondary
                        overflow-hidden animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-5 pt-5 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text-primary">Organizations</h2>
              <span className="text-xs text-text-tertiary">overview</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={orgPeriod}
                onChange={e => setOrgPeriod(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-secondary
                                 border border-border-secondary text-text-secondary cursor-pointer
                                 focus:outline-none">
                <option value="month">This month</option>
                <option value="quarter">This quarter</option>
                <option value="year">This year</option>
              </select>
              <select
                value={orgSort}
                onChange={e => setOrgSort(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-secondary
                                 border border-border-secondary text-text-secondary cursor-pointer
                                 focus:outline-none">
                <option value="growing">Top growing</option>
                <option value="users">Most users</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
          <DataTable columns={getOrgColumns(toggleFavorite, favorites)} data={orgs} emptyMessage="No organizations found" />
        </div>

        {/* Promo / CTA Card — dark card matching template */}
        <div className="lg:col-span-4 bg-[#1a1d1f] rounded-2xl p-6 flex flex-col justify-between
                        min-h-[280px] animate-fade-in relative overflow-hidden"
          style={{ animationDelay: '400ms' }}>
          {/* Decorative geometric lines */}
          <div className="absolute -bottom-8 -right-8 w-40 h-40 border border-white/5 rounded-2xl
                          rotate-12" />
          <div className="absolute -bottom-4 -right-4 w-32 h-32 border border-white/10 rounded-2xl
                          rotate-12" />
          <div className="absolute top-4 right-4 w-16 h-16 border border-white/5 rounded-xl
                          -rotate-6" />

          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white leading-tight mb-2">
              Automate <span className="inline-block px-2 py-0.5 rounded-md bg-white/10 text-white text-sm font-semibold mx-0.5">free</span> processes
              <br />with Flowly!
            </h3>
            <p className="text-sm text-[#6f767e] mt-3 leading-relaxed">
              Streamline your business processes and manage workflows effortlessly.
            </p>
          </div>

          <button
            onClick={() => navigate('/enterprise')}
            className="relative z-10 mt-6 self-start px-5 py-2.5 rounded-xl bg-white text-[#1a1d1f]
                             text-sm font-semibold hover:bg-gray-100 transition-colors cursor-pointer
                             shadow-lg shadow-black/20">
            Get Started
          </button>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-surface-primary rounded-2xl border border-border-secondary p-5
                      animate-fade-in" style={{ animationDelay: '500ms' }}>
        <h2 className="text-sm font-bold text-text-primary mb-4">System Logs</h2>
        <div className="space-y-3">
          {systemLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 group">
              <StatusBadge variant={{ success: 'success', warning: 'warning', danger: 'danger', info: 'info' }[log.severity]} size="sm" dot>
                {log.severity}
              </StatusBadge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{log.event}</p>
                <p className="text-xs text-text-tertiary">{log.details}</p>
              </div>
              <span className="text-[11px] text-text-tertiary whitespace-nowrap">{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
