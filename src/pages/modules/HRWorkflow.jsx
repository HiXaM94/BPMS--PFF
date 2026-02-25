import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Play, Square, CheckCircle2, AlertTriangle, Bell, ArrowRight,
  RotateCcw, Save, Users, Briefcase, Palmtree, Target,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { useLanguage } from '../../contexts/LanguageContext';
import { cacheService } from '../../services/CacheService';

/* ─── Custom Node Components ─── */

function StartNode({ data }) {
  return (
    <div className="px-5 py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg border-2 border-emerald-400 min-w-[140px] text-center">
      <div className="flex items-center justify-center gap-2">
        <Play size={16} />
        <span className="font-bold text-sm">{data.label}</span>
      </div>
    </div>
  );
}

function EndNode({ data }) {
  return (
    <div className="px-5 py-3 rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg border-2 border-red-400 min-w-[140px] text-center">
      <div className="flex items-center justify-center gap-2">
        <Square size={16} />
        <span className="font-bold text-sm">{data.label}</span>
      </div>
    </div>
  );
}

function ActionNode({ data }) {
  return (
    <div className="px-5 py-3 rounded-xl bg-white shadow-lg border-2 border-brand-300 min-w-[180px]">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center">
          <ArrowRight size={14} className="text-brand-600" />
        </div>
        <span className="font-bold text-sm text-gray-900">{data.label}</span>
      </div>
      {data.description && (
        <p className="text-[11px] text-gray-500 ml-8">{data.description}</p>
      )}
    </div>
  );
}

function ApprovalNode({ data }) {
  return (
    <div className="px-5 py-3 rounded-xl bg-white shadow-lg border-2 border-amber-300 min-w-[180px]">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
          <CheckCircle2 size={14} className="text-amber-600" />
        </div>
        <span className="font-bold text-sm text-gray-900">{data.label}</span>
      </div>
      {data.approver && (
        <p className="text-[11px] text-gray-500 ml-8">Approver: {data.approver}</p>
      )}
    </div>
  );
}

function ConditionNode({ data }) {
  return (
    <div className="px-5 py-3 rounded-xl bg-white shadow-lg border-2 border-purple-300 min-w-[180px] rotate-0">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center">
          <AlertTriangle size={14} className="text-purple-600" />
        </div>
        <span className="font-bold text-sm text-gray-900">{data.label}</span>
      </div>
      {data.condition && (
        <p className="text-[11px] text-gray-500 ml-8">{data.condition}</p>
      )}
    </div>
  );
}

function NotificationNode({ data }) {
  return (
    <div className="px-5 py-3 rounded-xl bg-white shadow-lg border-2 border-blue-300 min-w-[180px]">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
          <Bell size={14} className="text-blue-600" />
        </div>
        <span className="font-bold text-sm text-gray-900">{data.label}</span>
      </div>
      {data.channel && (
        <p className="text-[11px] text-gray-500 ml-8">Via: {data.channel}</p>
      )}
    </div>
  );
}

const nodeTypes = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  approval: ApprovalNode,
  condition: ConditionNode,
  notification: NotificationNode,
};

/* ─── Workflow Templates ─── */

const defaultEdgeOpts = {
  animated: true,
  style: { strokeWidth: 2, stroke: '#6366f1' },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6366f1' },
};

const workflows = {
  onboarding: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 60, y: 200 }, data: { label: 'New Hire' } },
      { id: 'create-account', type: 'action', position: { x: 260, y: 80 }, data: { label: 'Create Account', description: 'IT creates user credentials' } },
      { id: 'assign-manager', type: 'action', position: { x: 260, y: 220 }, data: { label: 'Assign Manager', description: 'HR assigns reporting line' } },
      { id: 'collect-docs', type: 'action', position: { x: 260, y: 360 }, data: { label: 'Collect Documents', description: 'CNSS, CIN, Diploma, RIB' } },
      { id: 'verify-docs', type: 'approval', position: { x: 520, y: 220 }, data: { label: 'Verify Documents', approver: 'HR Manager' } },
      { id: 'docs-ok', type: 'condition', position: { x: 760, y: 220 }, data: { label: 'Documents Valid?', condition: 'All docs approved' } },
      { id: 'notify-team', type: 'notification', position: { x: 1000, y: 120 }, data: { label: 'Notify Team', channel: 'Email + App' } },
      { id: 'schedule-training', type: 'action', position: { x: 1000, y: 300 }, data: { label: 'Schedule Training', description: 'First week orientation' } },
      { id: 'request-resubmit', type: 'notification', position: { x: 760, y: 400 }, data: { label: 'Request Resubmit', channel: 'Email' } },
      { id: 'end', type: 'end', position: { x: 1250, y: 200 }, data: { label: 'Onboarded' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'create-account' },
      { id: 'e2', source: 'start', target: 'assign-manager' },
      { id: 'e3', source: 'start', target: 'collect-docs' },
      { id: 'e4', source: 'create-account', target: 'verify-docs' },
      { id: 'e5', source: 'assign-manager', target: 'verify-docs' },
      { id: 'e6', source: 'collect-docs', target: 'verify-docs' },
      { id: 'e7', source: 'verify-docs', target: 'docs-ok' },
      { id: 'e8', source: 'docs-ok', target: 'notify-team', label: 'Yes' },
      { id: 'e9', source: 'docs-ok', target: 'schedule-training', label: 'Yes' },
      { id: 'e10', source: 'docs-ok', target: 'request-resubmit', label: 'No' },
      { id: 'e11', source: 'request-resubmit', target: 'collect-docs', style: { stroke: '#ef4444' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' } },
      { id: 'e12', source: 'notify-team', target: 'end' },
      { id: 'e13', source: 'schedule-training', target: 'end' },
    ],
  },
  leaveApproval: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 60, y: 180 }, data: { label: 'Leave Request' } },
      { id: 'check-balance', type: 'condition', position: { x: 280, y: 180 }, data: { label: 'Check Balance', condition: 'Days remaining ≥ requested' } },
      { id: 'auto-reject', type: 'notification', position: { x: 280, y: 370 }, data: { label: 'Auto-Reject', channel: 'Email + App' } },
      { id: 'manager-review', type: 'approval', position: { x: 530, y: 100 }, data: { label: 'Manager Review', approver: 'Direct Manager' } },
      { id: 'hr-review', type: 'approval', position: { x: 530, y: 280 }, data: { label: 'HR Review', approver: 'HR Manager' } },
      { id: 'check-coverage', type: 'condition', position: { x: 780, y: 180 }, data: { label: 'Team Coverage OK?', condition: '≥ 70% team present' } },
      { id: 'approved', type: 'action', position: { x: 1020, y: 100 }, data: { label: 'Approve Leave', description: 'Deduct from balance' } },
      { id: 'waitlist', type: 'action', position: { x: 1020, y: 300 }, data: { label: 'Add to Waitlist', description: 'Notify when slot opens' } },
      { id: 'notify-all', type: 'notification', position: { x: 1250, y: 180 }, data: { label: 'Notify All Parties', channel: 'Email + Calendar' } },
      { id: 'end', type: 'end', position: { x: 1470, y: 180 }, data: { label: 'Complete' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'check-balance' },
      { id: 'e2', source: 'check-balance', target: 'manager-review', label: 'Sufficient' },
      { id: 'e3', source: 'check-balance', target: 'auto-reject', label: 'Insufficient', style: { stroke: '#ef4444' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' } },
      { id: 'e4', source: 'manager-review', target: 'hr-review' },
      { id: 'e5', source: 'hr-review', target: 'check-coverage' },
      { id: 'e6', source: 'check-coverage', target: 'approved', label: 'Yes' },
      { id: 'e7', source: 'check-coverage', target: 'waitlist', label: 'No' },
      { id: 'e8', source: 'approved', target: 'notify-all' },
      { id: 'e9', source: 'waitlist', target: 'notify-all' },
      { id: 'e10', source: 'notify-all', target: 'end' },
    ],
  },
  recruitment: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 60, y: 200 }, data: { label: 'Job Opening' } },
      { id: 'post-job', type: 'action', position: { x: 280, y: 200 }, data: { label: 'Post Job', description: 'Internal + external boards' } },
      { id: 'screen-apps', type: 'action', position: { x: 500, y: 200 }, data: { label: 'Screen Applications', description: 'AI-assisted scoring' } },
      { id: 'hr-screen', type: 'approval', position: { x: 720, y: 100 }, data: { label: 'HR Screen Call', approver: 'HR Recruiter' } },
      { id: 'tech-interview', type: 'approval', position: { x: 720, y: 300 }, data: { label: 'Technical Interview', approver: 'Tech Lead' } },
      { id: 'qualified', type: 'condition', position: { x: 950, y: 200 }, data: { label: 'Qualified?', condition: 'Score ≥ 70/100' } },
      { id: 'final-interview', type: 'approval', position: { x: 1180, y: 120 }, data: { label: 'Final Interview', approver: 'Department Head' } },
      { id: 'reject-notify', type: 'notification', position: { x: 1180, y: 340 }, data: { label: 'Rejection Email', channel: 'Email' } },
      { id: 'offer', type: 'action', position: { x: 1400, y: 120 }, data: { label: 'Send Offer', description: 'Generate & send contract' } },
      { id: 'end', type: 'end', position: { x: 1600, y: 200 }, data: { label: 'Hired / Closed' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'post-job' },
      { id: 'e2', source: 'post-job', target: 'screen-apps' },
      { id: 'e3', source: 'screen-apps', target: 'hr-screen' },
      { id: 'e4', source: 'screen-apps', target: 'tech-interview' },
      { id: 'e5', source: 'hr-screen', target: 'qualified' },
      { id: 'e6', source: 'tech-interview', target: 'qualified' },
      { id: 'e7', source: 'qualified', target: 'final-interview', label: 'Yes' },
      { id: 'e8', source: 'qualified', target: 'reject-notify', label: 'No', style: { stroke: '#ef4444' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' } },
      { id: 'e9', source: 'final-interview', target: 'offer' },
      { id: 'e10', source: 'offer', target: 'end' },
      { id: 'e11', source: 'reject-notify', target: 'end' },
    ],
  },
  performanceReview: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 60, y: 180 }, data: { label: 'Review Cycle' } },
      { id: 'self-eval', type: 'action', position: { x: 280, y: 180 }, data: { label: 'Self-Evaluation', description: 'Employee fills form' } },
      { id: 'manager-eval', type: 'action', position: { x: 500, y: 100 }, data: { label: 'Manager Evaluation', description: 'Rate performance KPIs' } },
      { id: 'peer-review', type: 'action', position: { x: 500, y: 280 }, data: { label: 'Peer Review', description: '360° feedback' } },
      { id: 'calibration', type: 'approval', position: { x: 730, y: 180 }, data: { label: 'Calibration Meeting', approver: 'HR + Department Heads' } },
      { id: 'rating-ok', type: 'condition', position: { x: 960, y: 180 }, data: { label: 'Rating Finalized?', condition: 'All scores aligned' } },
      { id: 'notify-employee', type: 'notification', position: { x: 1190, y: 100 }, data: { label: 'Notify Employee', channel: 'Email + Meeting invite' } },
      { id: 'revision', type: 'action', position: { x: 960, y: 360 }, data: { label: 'Request Revision', description: 'Adjust scores' } },
      { id: 'end', type: 'end', position: { x: 1400, y: 180 }, data: { label: 'Review Complete' } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'self-eval' },
      { id: 'e2', source: 'self-eval', target: 'manager-eval' },
      { id: 'e3', source: 'self-eval', target: 'peer-review' },
      { id: 'e4', source: 'manager-eval', target: 'calibration' },
      { id: 'e5', source: 'peer-review', target: 'calibration' },
      { id: 'e6', source: 'calibration', target: 'rating-ok' },
      { id: 'e7', source: 'rating-ok', target: 'notify-employee', label: 'Yes' },
      { id: 'e8', source: 'rating-ok', target: 'revision', label: 'No' },
      { id: 'e9', source: 'revision', target: 'calibration', style: { stroke: '#f59e0b' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' } },
      { id: 'e10', source: 'notify-employee', target: 'end' },
    ],
  },
};

/* ─── Main Component ─── */

export default function HRWorkflow() {
  const { t } = useLanguage();
  const [activeWorkflow, setActiveWorkflow] = useState('onboarding');
  const [saved, setSaved] = useState(false);

  const wf = workflows[activeWorkflow];
  const [nodes, setNodes, onNodesChange] = useNodesState(wf.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    wf.edges.map(e => ({ ...defaultEdgeOpts, ...e }))
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...defaultEdgeOpts, ...params }, eds)),
    [setEdges]
  );

  const switchWorkflow = (key) => {
    setActiveWorkflow(key);
    const w = workflows[key];
    setNodes(w.nodes);
    setEdges(w.edges.map(e => ({ ...defaultEdgeOpts, ...e })));
    setSaved(false);
  };

  const handleSave = () => {
    cacheService.set(`workflow:${activeWorkflow}`, { nodes, edges }, 600);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { key: 'onboarding', label: t('workflow.onboarding'), icon: Users },
    { key: 'leaveApproval', label: t('workflow.leaveApproval'), icon: Palmtree },
    { key: 'recruitment', label: t('workflow.recruitmentPipeline'), icon: Briefcase },
    { key: 'performanceReview', label: t('workflow.performanceReview'), icon: Target },
  ];

  return (
    <div className="space-y-4 animate-fade-in h-[calc(100vh-7rem)]">
      <PageHeader
        title={t('workflow.title')}
        subtitle={t('workflow.subtitle')}
        icon={Target}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                         ${saved
                           ? 'bg-emerald-500 text-white'
                           : 'bg-brand-500 text-white hover:bg-brand-600'}`}
            >
              {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {saved ? t('common.success') : t('workflow.saveWorkflow')}
            </button>
          </div>
        }
      />

      {/* Workflow Tabs */}
      <div className="flex gap-2 bg-surface-secondary p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => switchWorkflow(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap
                         ${activeWorkflow === tab.key
                           ? 'bg-surface-primary text-text-primary shadow-sm'
                           : 'text-text-secondary hover:text-text-primary'}`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 bg-surface-primary rounded-2xl border border-border-secondary overflow-hidden" style={{ height: 'calc(100% - 120px)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOpts}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Controls
            showInteractive={false}
            className="!bg-surface-primary !border-border-secondary !rounded-xl !shadow-lg"
          />
          <MiniMap
            nodeStrokeWidth={3}
            className="!bg-surface-secondary !rounded-xl !border-border-secondary"
            maskColor="rgba(0,0,0,0.1)"
          />
          <Background variant="dots" gap={20} size={1} color="#e5e7eb" />

          {/* Legend Panel */}
          <Panel position="top-right">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 p-3 shadow-sm space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500" /> {t('workflow.start')}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-red-500" /> {t('workflow.end')}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-brand-400" /> {t('workflow.action')}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-amber-400" /> {t('workflow.approval')}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-purple-400" /> {t('workflow.condition')}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-blue-400" /> {t('workflow.notification')}</div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
