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
  RotateCcw, Save, Users, Briefcase, Palmtree, Target, Loader2, Zap,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { cacheService } from '../../services/CacheService';
import { supabase, isSupabaseReady } from '../../services/supabase';
import { auditService } from '../../services/AuditService';

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

function ActionNode({ data, selected }) {
  const isExecuting = data?.executing;
  return (
    <div className={`px-5 py-3 rounded-xl shadow-lg border-2 min-w-[180px] transition-all duration-300 ${
      isExecuting 
        ? 'bg-emerald-50 border-emerald-500 shadow-emerald-200 animate-pulse' 
        : selected 
          ? 'bg-brand-50 border-brand-500' 
          : 'bg-white border-brand-300'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
          isExecuting ? 'bg-emerald-500' : 'bg-brand-100'
        }`}>
          <ArrowRight size={14} className={isExecuting ? 'text-white' : 'text-brand-600'} />
        </div>
        <span className={`font-bold text-sm ${isExecuting ? 'text-emerald-700' : 'text-gray-900'}`}>
          {data.label}
        </span>
        {isExecuting && <Loader2 size={12} className="animate-spin text-emerald-600" />}
      </div>
      {data.description && (
        <p className={`text-[11px] ml-8 ${isExecuting ? 'text-emerald-600' : 'text-gray-500'}`}>
          {data.description}
        </p>
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
    <div className="px-5 py-3 rounded-xl bg-white shadow-lg border-2 border-brand-300 min-w-[180px] rotate-0">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-brand-100 flex items-center justify-center">
          <AlertTriangle size={14} className="text-brand-600" />
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

/** Build workflow templates with i18n labels. Called inside component so t() is available. */
function buildWorkflows(t) {
  return {
  onboarding: {
    nodes: [
      { id: 'start', type: 'start', position: { x: 60, y: 200 }, data: { label: t('workflow.nodeNewHire') } },
      { id: 'create-account', type: 'action', position: { x: 260, y: 80 }, data: { label: t('workflow.nodeCreateAccount'), description: t('workflow.nodeCreateAccountDesc') } },
      { id: 'assign-manager', type: 'action', position: { x: 260, y: 220 }, data: { label: t('workflow.nodeAssignManager'), description: t('workflow.nodeAssignManagerDesc') } },
      { id: 'collect-docs', type: 'action', position: { x: 260, y: 360 }, data: { label: t('workflow.nodeCollectDocs'), description: 'CNSS, CIN, Diploma, RIB' } },
      { id: 'verify-docs', type: 'approval', position: { x: 520, y: 220 }, data: { label: t('workflow.nodeVerifyDocs'), approver: t('workflow.approverHR') } },
      { id: 'docs-ok', type: 'condition', position: { x: 760, y: 220 }, data: { label: t('workflow.nodeDocsValid'), condition: t('workflow.condAllApproved') } },
      { id: 'notify-team', type: 'notification', position: { x: 1000, y: 120 }, data: { label: t('workflow.nodeNotifyTeam'), channel: 'Email + App' } },
      { id: 'schedule-training', type: 'action', position: { x: 1000, y: 300 }, data: { label: t('workflow.nodeScheduleTraining'), description: t('workflow.nodeScheduleTrainingDesc') } },
      { id: 'request-resubmit', type: 'notification', position: { x: 760, y: 400 }, data: { label: t('workflow.nodeResubmit'), channel: 'Email' } },
      { id: 'end', type: 'end', position: { x: 1250, y: 200 }, data: { label: t('workflow.nodeOnboarded') } },
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
      { id: 'start', type: 'start', position: { x: 60, y: 180 }, data: { label: t('workflow.nodeLeaveRequest') } },
      { id: 'check-balance', type: 'condition', position: { x: 280, y: 180 }, data: { label: t('workflow.nodeCheckBalance'), condition: t('workflow.condBalanceSufficient') } },
      { id: 'auto-reject', type: 'notification', position: { x: 280, y: 370 }, data: { label: t('workflow.nodeAutoReject'), channel: 'Email + App' } },
      { id: 'manager-review', type: 'approval', position: { x: 530, y: 100 }, data: { label: t('workflow.nodeManagerReview'), approver: t('workflow.approverManager') } },
      { id: 'hr-review', type: 'approval', position: { x: 530, y: 280 }, data: { label: t('workflow.nodeHRReview'), approver: t('workflow.approverHR') } },
      { id: 'check-coverage', type: 'condition', position: { x: 780, y: 180 }, data: { label: t('workflow.nodeTeamCoverage'), condition: t('workflow.condCoverage70') } },
      { id: 'approved', type: 'action', position: { x: 1020, y: 100 }, data: { label: t('workflow.nodeApproveLeave'), description: t('workflow.nodeDeductBalance') } },
      { id: 'waitlist', type: 'action', position: { x: 1020, y: 300 }, data: { label: t('workflow.nodeWaitlist'), description: t('workflow.nodeWaitlistDesc') } },
      { id: 'notify-all', type: 'notification', position: { x: 1250, y: 180 }, data: { label: t('workflow.nodeNotifyAll'), channel: 'Email + Calendar' } },
      { id: 'end', type: 'end', position: { x: 1470, y: 180 }, data: { label: t('workflow.nodeComplete') } },
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
      { id: 'start', type: 'start', position: { x: 60, y: 200 }, data: { label: t('workflow.nodeJobOpening') } },
      { id: 'post-job', type: 'action', position: { x: 280, y: 200 }, data: { label: t('workflow.nodePostJob'), description: t('workflow.nodePostJobDesc') } },
      { id: 'screen-apps', type: 'action', position: { x: 500, y: 200 }, data: { label: t('workflow.nodeScreenApps'), description: t('workflow.nodeScreenAppsDesc') } },
      { id: 'hr-screen', type: 'approval', position: { x: 720, y: 100 }, data: { label: t('workflow.nodeHRScreen'), approver: t('workflow.approverRecruiter') } },
      { id: 'tech-interview', type: 'approval', position: { x: 720, y: 300 }, data: { label: t('workflow.nodeTechInterview'), approver: t('workflow.approverTechLead') } },
      { id: 'qualified', type: 'condition', position: { x: 950, y: 200 }, data: { label: t('workflow.nodeQualified'), condition: t('workflow.condScore70') } },
      { id: 'final-interview', type: 'approval', position: { x: 1180, y: 120 }, data: { label: t('workflow.nodeFinalInterview'), approver: t('workflow.approverDeptHead') } },
      { id: 'reject-notify', type: 'notification', position: { x: 1180, y: 340 }, data: { label: t('workflow.nodeRejection'), channel: 'Email' } },
      { id: 'offer', type: 'action', position: { x: 1400, y: 120 }, data: { label: t('workflow.nodeSendOffer'), description: t('workflow.nodeSendOfferDesc') } },
      { id: 'end', type: 'end', position: { x: 1600, y: 200 }, data: { label: t('workflow.nodeHired') } },
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
      { id: 'start', type: 'start', position: { x: 60, y: 180 }, data: { label: t('workflow.nodeReviewCycle') } },
      { id: 'self-eval', type: 'action', position: { x: 280, y: 180 }, data: { label: t('workflow.nodeSelfEval'), description: t('workflow.nodeSelfEvalDesc') } },
      { id: 'manager-eval', type: 'action', position: { x: 500, y: 100 }, data: { label: t('workflow.nodeManagerEval'), description: t('workflow.nodeManagerEvalDesc') } },
      { id: 'peer-review', type: 'action', position: { x: 500, y: 280 }, data: { label: t('workflow.nodePeerReview'), description: t('workflow.nodePeerReviewDesc') } },
      { id: 'calibration', type: 'approval', position: { x: 730, y: 180 }, data: { label: t('workflow.nodeCalibration'), approver: t('workflow.approverCalibration') } },
      { id: 'rating-ok', type: 'condition', position: { x: 960, y: 180 }, data: { label: t('workflow.nodeRatingFinalized'), condition: t('workflow.condScoresAligned') } },
      { id: 'notify-employee', type: 'notification', position: { x: 1190, y: 100 }, data: { label: t('workflow.nodeNotifyEmployee'), channel: 'Email + Meeting invite' } },
      { id: 'revision', type: 'action', position: { x: 960, y: 360 }, data: { label: t('workflow.nodeRequestRevision'), description: t('workflow.nodeRequestRevisionDesc') } },
      { id: 'end', type: 'end', position: { x: 1400, y: 180 }, data: { label: t('workflow.nodeReviewComplete') } },
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
}

/* ─── Main Component ─── */

export default function HRWorkflow() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const [activeWorkflow, setActiveWorkflow] = useState('onboarding');
  const [saved, setSaved] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);

  const workflows = useMemo(() => buildWorkflows(t), [t]);
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

  const handleSave = async () => {
    // 1. Cache locally
    cacheService.set(`workflow:${activeWorkflow}`, { nodes, edges }, 600);
    // 2. Persist to Supabase if available
    if (isSupabaseReady && profile?.entreprise_id) {
      try {
        await supabase.from('hr_workflows').upsert({
          entreprise_id: profile.entreprise_id,
          workflow_key: activeWorkflow,
          nodes_json: nodes,
          edges_json: edges,
          updated_by: profile.id,
        }, { onConflict: 'entreprise_id,workflow_key' });
        auditService.log('WORKFLOW_SAVED', 'hr_workflow', null, null, { workflow_key: activeWorkflow, nodeCount: nodes.length, edgeCount: edges.length }).catch(() => {});
      } catch (err) {
        console.error('[HRWorkflow] Supabase save failed:', err.message);
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExecute = async () => {
    setExecuting(true);
    setExecutionLog([]);
    setCurrentNode(null);

    // Find start node
    const startNode = nodes.find(n => n.type === 'start');
    if (!startNode) {
      setExecutionLog([{ type: 'error', message: 'No start node found in workflow' }]);
      setExecuting(false);
      return;
    }

    // Log workflow execution start
    await auditService.log('WORKFLOW_EXECUTION_STARTED', 'hr_workflow', null, null, { 
      workflow_key: activeWorkflow,
      started_by: profile.id
    });

    // Execute workflow nodes
    const executedNodes = new Set();
    const nodeQueue = [startNode];

    while (nodeQueue.length > 0) {
      const currentNode = nodeQueue.shift();
      if (executedNodes.has(currentNode.id)) continue;
      
      executedNodes.add(currentNode.id);
      setCurrentNode(currentNode.id);

      // Update node to show it's executing
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === currentNode.id 
            ? { ...node, data: { ...node.data, executing: true } }
            : node
        )
      );

      // Add execution log
      const logEntry = {
        type: 'info',
        timestamp: new Date().toLocaleTimeString(),
        message: `Executing: ${currentNode.data.label}`,
        nodeType: currentNode.type
      };
      setExecutionLog(prev => [...prev, logEntry]);

      // Simulate node execution with delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reset node executing state
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === currentNode.id 
            ? { ...node, data: { ...node.data, executing: false } }
            : node
        )
      );

      // Handle different node types
      switch (currentNode.type) {
        case 'action':
          // Execute action
          setExecutionLog(prev => [...prev, {
            type: 'success',
            timestamp: new Date().toLocaleTimeString(),
            message: `✓ Action completed: ${currentNode.data.label}`
          }]);
          break;

        case 'approval':
          // Simulate approval
          setExecutionLog(prev => [...prev, {
            type: 'warning',
            timestamp: new Date().toLocaleTimeString(),
            message: `⏳ Awaiting approval: ${currentNode.data.approver || 'Manager'}`
          }]);
          await new Promise(resolve => setTimeout(resolve, 500));
          setExecutionLog(prev => [...prev, {
            type: 'success',
            timestamp: new Date().toLocaleTimeString(),
            message: `✓ Approved by: ${currentNode.data.approver || 'Manager'}`
          }]);
          break;

        case 'condition':
          // Simulate condition evaluation
          setExecutionLog(prev => [...prev, {
            type: 'info',
            timestamp: new Date().toLocaleTimeString(),
            message: `🔍 Evaluating: ${currentNode.data.condition}`
          }]);
          break;

        case 'notification':
          // Send notification
          setExecutionLog(prev => [...prev, {
            type: 'success',
            timestamp: new Date().toLocaleTimeString(),
            message: `📧 Notification sent: ${currentNode.data.label}`
          }]);
          break;

        case 'end':
          // Workflow completed
          setExecutionLog(prev => [...prev, {
            type: 'success',
            timestamp: new Date().toLocaleTimeString(),
            message: `🎉 Workflow completed successfully!`
          }]);
          break;
      }

      // Find next nodes
      const nextEdges = edges.filter(e => e.source === currentNode.id);
      for (const edge of nextEdges) {
        const nextNode = nodes.find(n => n.id === edge.target);
        if (nextNode && !executedNodes.has(nextNode.id)) {
          nodeQueue.push(nextNode);
        }
      }
    }

    // Log workflow execution completion
    await auditService.log('WORKFLOW_EXECUTION_COMPLETED', 'hr_workflow', null, null, { 
      workflow_key: activeWorkflow,
      executed_by: profile.id,
      nodes_executed: executedNodes.size
    });

    setCurrentNode(null);
    setExecuting(false);
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
              onClick={handleExecute}
              disabled={executing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                         ${executing
                           ? 'bg-gray-400 text-white cursor-not-allowed'
                           : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg'}`}
            >
              {executing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
              {executing ? 'Executing...' : 'Execute Workflow'}
            </button>
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
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-brand-400" /> {t('workflow.condition')}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-blue-400" /> {t('workflow.notification')}</div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Execution Log Panel */}
      {(executing || executionLog.length > 0) && (
        <div className="bg-surface-primary rounded-2xl border border-border-secondary p-4 max-h-64 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Zap size={16} className={executing ? 'text-emerald-500 animate-pulse' : 'text-gray-400'} />
              Execution Log
            </h3>
            {executionLog.length > 0 && (
              <button
                onClick={() => setExecutionLog([])}
                className="text-xs text-text-secondary hover:text-text-primary"
              >
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
            {executionLog.map((log, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-2 rounded ${
                  log.type === 'error' ? 'bg-red-50 text-red-700' :
                  log.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                  log.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                  'bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-gray-400 mt-0.5">{log.timestamp}</span>
                <span className="flex-1">{log.message}</span>
              </div>
            ))}
            {executing && (
              <div className="flex items-center gap-2 p-2 rounded bg-blue-50 text-blue-700">
                <Loader2 size={12} className="animate-spin" />
                <span>Executing workflow...</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
