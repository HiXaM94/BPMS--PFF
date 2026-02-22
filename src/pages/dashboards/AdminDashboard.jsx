import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import MiniChart from '../../components/ui/MiniChart';
import { adminData } from '../../data/mockData';
import { supabase, isSupabaseReady } from '../../services/supabase';

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
    bg: 'bg-[#f3ecfb]',
    darkBg: 'dark:bg-purple-500/10',
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

const orgColumns = [
  {
    key: 'name',
    label: 'Name',
    render: (val, row, idx) => (
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
    render: () => (
      <button className="text-text-tertiary hover:text-[#fbbf24] transition-colors cursor-pointer">
        <Star size={16} />
      </button>
    ),
  },
];

export default function AdminDashboard() {
  const [cards, setCards] = useState(assetCards);
  const [orgs, setOrgs]   = useState(orgTableData);
  const [totalUsers, setTotalUsers] = useState('1,846');
  const [systemLogs, setSystemLogs] = useState(adminData.systemLogs);

  useEffect(() => {
    if (!isSupabaseReady) return;

    // Counts
    Promise.all([
      supabase.from('entreprises').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ]).then(([ents, users]) => {
      const entCount  = ents.count ?? 0;
      const userCount = users.count ?? 0;
      setTotalUsers(userCount.toLocaleString());
      setCards(prev => [
        { ...prev[0], value: entCount.toString(),  sub: `${userCount} employees` },
        { ...prev[1], value: userCount.toLocaleString(), sub: 'registered users' },
        prev[2],
      ]);
    });

    // Organisations table
    supabase.from('entreprises')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setOrgs(data.map((e, i) => ({
          id: e.id,
          name: e.name,
          tag: e.name.slice(0, 4).toUpperCase(),
          plan: 'Business',
          users: '-',
          growth: '',
          positive: true,
          status: e.status || 'active',
        })));
      });

    // System logs
    supabase.from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (!data || data.length === 0) return;
        setSystemLogs(data.map(l => ({
          id: l.id,
          severity: l.level || 'info',
          event: l.action || l.message || 'System event',
          details: l.details || '',
          time: new Date(l.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        })));
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header — clean like template */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
          Overview
        </h1>
      </div>

      {/* Top Row: Portfolio card + Asset cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Portfolio-style summary card */}
        <div className="lg:col-span-5 bg-surface-primary rounded-2xl border border-border-secondary p-6
                        animate-fade-in">
          <h2 className="text-sm font-semibold text-text-secondary mb-1">Platform Usage</h2>
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
              data={adminData.monthlyUsers || [120, 180, 250, 310, 420, 580, 720, 860, 1020, 1280, 1540, 1846]}
              label="Monthly active users"
              height={80}
              colorFrom="#2a85ff"
              colorTo="#6cb4ff"
            />
          </div>

          {/* Time range tabs */}
          <div className="flex items-center gap-1 mt-4">
            {['3M', '6M', '1Y', 'YTD', 'ALL'].map((tab, i) => (
              <button
                key={tab}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer
                  ${i === 2
                    ? 'bg-text-primary text-text-inverse'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Asset-style cards column — stretches to match Platform Usage height */}
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
          </div>
        </div>
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
              <select className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-secondary
                                 border border-border-secondary text-text-secondary cursor-pointer
                                 focus:outline-none">
                <option>This month</option>
                <option>This quarter</option>
                <option>This year</option>
              </select>
              <select className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-secondary
                                 border border-border-secondary text-text-secondary cursor-pointer
                                 focus:outline-none">
                <option>Top growing</option>
                <option>Most users</option>
                <option>Newest</option>
              </select>
            </div>
          </div>
          <DataTable columns={orgColumns} data={orgs} emptyMessage="No organizations found" />
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
              <br />with BPMS Platform!
            </h3>
            <p className="text-sm text-[#6f767e] mt-3 leading-relaxed">
              Streamline your business processes and manage workflows effortlessly.
            </p>
          </div>

          <button className="relative z-10 mt-6 self-start px-5 py-2.5 rounded-xl bg-white text-[#1a1d1f]
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
