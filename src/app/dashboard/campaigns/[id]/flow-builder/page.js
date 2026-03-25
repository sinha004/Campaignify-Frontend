'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import {
  Play,
  Mail,
  Clock,
  GitBranch,
  Database,
  FileSpreadsheet,
  Globe,
  Save,
  Upload,
  ArrowLeft,
  Trash2,
  Settings,
  X,
  Code,
  Copy,
  Check,
} from 'lucide-react';

// Custom Node Components
const nodeStyles = {
  trigger: 'bg-emerald-50 border-emerald-400',
  sendEmail: 'bg-blue-50 border-blue-400',
  wait: 'bg-amber-50 border-amber-400',
  condition: 'bg-purple-50 border-purple-400',
  getSegmentData: 'bg-cyan-50 border-cyan-400',
  parseCSV: 'bg-orange-50 border-orange-400',
  httpRequest: 'bg-red-50 border-red-400',
  code: 'bg-gray-100 border-gray-400',
};

const nodeIcons = {
  trigger: Play,
  sendEmail: Mail,
  wait: Clock,
  condition: GitBranch,
  getSegmentData: Database,
  parseCSV: FileSpreadsheet,
  httpRequest: Globe,
  code: Code,
};

function CustomNode({ data, type, selected }) {
  const Icon = nodeIcons[type] || Play;
  const style = nodeStyles[type] || 'bg-gray-50 border-gray-400';
  const isCondition = type === 'condition';
  const isTrigger = type === 'trigger';

  return (
    <div
      className={`px-3.5 py-2.5 rounded-lg border-2 min-w-[170px] ${style} ${
        selected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
      }`}
    >
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-2.5 !h-2.5 !bg-gray-400 !border-2 !border-white"
        />
      )}

      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-700" />
        <span className="font-medium text-xs text-gray-800">{data.label || type}</span>
      </div>
      {data.description && (
        <p className="text-[10px] text-gray-500 mt-0.5 truncate">{data.description}</p>
      )}

      {isCondition ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-white"
            style={{ left: '30%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-white"
            style={{ left: '70%' }}
          />
          <div className="flex justify-between text-[10px] mt-1.5 px-1">
            <span className="text-emerald-600">True</span>
            <span className="text-red-600">False</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-2.5 !h-2.5 !bg-gray-400 !border-2 !border-white"
        />
      )}
    </div>
  );
}

const TriggerNode = (props) => <CustomNode {...props} type="trigger" />;
const SendEmailNode = (props) => <CustomNode {...props} type="sendEmail" />;
const WaitNode = (props) => <CustomNode {...props} type="wait" />;
const ConditionNode = (props) => <CustomNode {...props} type="condition" />;
const GetSegmentDataNode = (props) => <CustomNode {...props} type="getSegmentData" />;
const ParseCSVNode = (props) => <CustomNode {...props} type="parseCSV" />;
const HTTPRequestNode = (props) => <CustomNode {...props} type="httpRequest" />;
const CodeNode = (props) => <CustomNode {...props} type="code" />;

const nodeTypes = {
  trigger: TriggerNode,
  sendEmail: SendEmailNode,
  wait: WaitNode,
  condition: ConditionNode,
  getSegmentData: GetSegmentDataNode,
  parseCSV: ParseCSVNode,
  httpRequest: HTTPRequestNode,
  code: CodeNode,
};

const nodeCategories = [
  {
    name: 'Triggers',
    nodes: [
      { type: 'trigger', label: 'Webhook Trigger', description: 'Start workflow with webhook' },
    ],
  },
  {
    name: 'Actions',
    nodes: [
      { type: 'sendEmail', label: 'Send Email', description: 'Send email to recipient' },
      { type: 'httpRequest', label: 'HTTP Request', description: 'Make API calls' },
    ],
  },
  {
    name: 'Logic',
    nodes: [
      { type: 'wait', label: 'Wait', description: 'Delay execution' },
      { type: 'condition', label: 'Condition', description: 'Branch logic' },
      { type: 'code', label: 'Code', description: 'Run JavaScript code' },
    ],
  },
];

const nodePropertySchemas = {
  trigger: {
    fields: [
      { name: 'webhookPath', label: 'Webhook Path (auto-generated)', type: 'readonly' },
      { name: 'httpMethod', label: 'HTTP Method', type: 'select', options: ['POST', 'GET'], defaultValue: 'POST' },
    ],
  },
  sendEmail: {
    fields: [
      { name: 'to', label: 'To', type: 'text', placeholder: '{{email}}', helpText: 'Use {{email}} to send to each contact.' },
      { name: 'subject', label: 'Subject', type: 'text', placeholder: 'Email subject', helpText: 'Personalize with {{name}}.' },
      { name: 'body', label: 'Body', type: 'textarea', placeholder: 'Email content...', helpText: 'Use {{name}} and {{email}} for personalization.' },
    ],
  },
  wait: {
    fields: [
      { name: 'amount', label: 'Duration', type: 'number', placeholder: '1' },
      { name: 'unit', label: 'Unit', type: 'select', options: ['seconds', 'minutes', 'hours', 'days'] },
    ],
  },
  condition: {
    fields: [
      { name: 'field', label: 'Field', type: 'text', placeholder: '{{hasReply}}', helpText: 'Variable from previous nodes.' },
      { name: 'operator', label: 'Operator', type: 'select', options: ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan'] },
      { name: 'value', label: 'Value', type: 'text', placeholder: 'value to compare', helpText: 'Value to compare against.' },
    ],
  },
  getSegmentData: {
    fields: [
      { name: 'bucket', label: 'S3 Bucket', type: 'text', placeholder: 'bucket-name' },
      { name: 'key', label: 'S3 Key', type: 'text', placeholder: 'path/to/file.csv' },
    ],
  },
  parseCSV: {
    fields: [
      { name: 'delimiter', label: 'Delimiter', type: 'text', placeholder: ',' },
      { name: 'hasHeader', label: 'Has Header Row', type: 'checkbox' },
    ],
  },
  httpRequest: {
    fields: [
      { name: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com' },
      { name: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
      { name: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Content-Type": "application/json"}' },
      { name: 'body', label: 'Body', type: 'textarea', placeholder: '{"key": "value"}' },
    ],
  },
  code: {
    fields: [
      { name: 'jsCode', label: 'JavaScript Code', type: 'code', placeholder: `// Access input data with $input.all()
const items = $input.all();
return items.map(item => ({
  json: { ...item.json }
}));` },
    ],
  },
};

function WebhookUrlField({ label, url }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { /* ignore */ }
  };

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-1">{label}:</p>
      <div className="flex items-center gap-1">
        <p className="flex-1 text-xs text-gray-700 break-all font-mono bg-white px-2 py-1.5 rounded border border-gray-200">
          {url}
        </p>
        <button onClick={handleCopy} className="p-1.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0" title={copied ? 'Copied!' : 'Copy'}>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </button>
      </div>
    </div>
  );
}

function PropertyEditor({ selectedNode, onUpdate, onClose }) {
  const [properties, setProperties] = useState(selectedNode?.data?.properties || {});
  const [label, setLabel] = useState(selectedNode?.data?.label || '');

  useEffect(() => {
    setProperties(selectedNode?.data?.properties || {});
    setLabel(selectedNode?.data?.label || '');
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 p-4 flex-shrink-0 h-full">
        <div className="text-center text-gray-400 py-8">
          <Settings className="w-5 h-5 mx-auto mb-2" />
          <p className="text-xs">Select a node to edit</p>
        </div>
      </div>
    );
  }

  const schema = nodePropertySchemas[selectedNode.type] || { fields: [] };
  const handleChange = (name, value) => setProperties((p) => ({ ...p, [name]: value }));
  const handleSave = () => onUpdate(selectedNode.id, { ...selectedNode.data, label, properties });

  const inputClass = "w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors";

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col flex-shrink-0 h-full">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-900">Properties</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 mb-1">Label</label>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} placeholder="Node label" />
        </div>

        {selectedNode.type === 'trigger' && properties.webhookPath && (
          <div className="bg-gray-50 rounded-lg p-2.5 space-y-2">
            <p className="text-[11px] font-medium text-gray-500">Webhook URLs:</p>
            <WebhookUrlField label="Test" url={`http://localhost:5678/webhook-test/${properties.webhookPath}`} />
            <WebhookUrlField label="Production" url={`http://localhost:5678/webhook/${properties.webhookPath}`} />
          </div>
        )}

        {schema.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">{field.label}</label>
            {field.helpText && <p className="text-[10px] text-gray-400 mb-1">{field.helpText}</p>}

            {field.type === 'text' && (
              <input type="text" value={properties[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} placeholder={field.placeholder} className={inputClass} />
            )}
            {field.type === 'number' && (
              <input type="number" value={properties[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} placeholder={field.placeholder} className={inputClass} />
            )}
            {field.type === 'textarea' && (
              <textarea value={properties[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} placeholder={field.placeholder} rows={3} className={inputClass} />
            )}
            {field.type === 'select' && (
              <select value={properties[field.name] || field.options[0]} onChange={(e) => handleChange(field.name, e.target.value)} className={inputClass}>
                {field.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}
            {field.type === 'checkbox' && (
              <input type="checkbox" checked={properties[field.name] || false} onChange={(e) => handleChange(field.name, e.target.checked)} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
            )}
            {field.type === 'code' && (
              <textarea value={properties[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)} placeholder={field.placeholder} rows={10} className={`${inputClass} font-mono text-[11px]`} spellCheck={false} />
            )}
            {field.type === 'readonly' && (
              <input type="text" value={properties[field.name] || ''} readOnly className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-400 cursor-not-allowed" />
            )}
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
        <button onClick={handleSave} className="w-full py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
          Apply
        </button>
      </div>
    </div>
  );
}

function NodePalette({ onDragStart }) {
  return (
    <div className="w-56 bg-white border-r border-gray-200 flex-shrink-0 h-full overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-xs font-semibold text-gray-900">Nodes</h3>
        <p className="text-[10px] text-gray-400 mt-0.5">Drag to canvas</p>
      </div>

      {nodeCategories.map((category) => (
        <div key={category.name} className="px-3 py-3 border-b border-gray-100">
          <h4 className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">{category.name}</h4>
          <div className="space-y-1.5">
            {category.nodes.map((node) => {
              const Icon = nodeIcons[node.type];
              const style = nodeStyles[node.type];
              return (
                <div
                  key={node.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, node)}
                  className={`p-2.5 rounded-lg border cursor-grab active:cursor-grabbing ${style} hover:shadow-sm transition-shadow`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-gray-700" />
                    <span className="text-xs font-medium text-gray-800">{node.label}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{node.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FlowBuilderCanvas({ campaignId, initialFlow, onSave, onDeploy }) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow?.edges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showPropertyEditor, setShowPropertyEditor] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  const isValidConnection = useCallback((c) => c.source !== c.target, []);

  const onConnect = useCallback((params) => {
    if (params.source === params.target) return;
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true, style: { strokeWidth: 2 } }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_, node) => { setSelectedNode(node); setShowPropertyEditor(true); }, []);

  const onDragStart = useCallback((e, nodeData) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/reactflow');
    if (!data) return;
    const nodeData = JSON.parse(data);
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    let defaultProperties = {};
    if (nodeData.type === 'trigger') defaultProperties = { webhookPath: `campaign-${campaignId}`, httpMethod: 'POST' };
    else if (nodeData.type === 'wait') defaultProperties = { amount: '1', unit: 'minutes' };

    setNodes((nds) => [...nds, {
      id: uuidv4(),
      type: nodeData.type,
      position,
      data: { label: nodeData.label, description: nodeData.description, properties: defaultProperties },
    }]);
  }, [screenToFlowPosition, setNodes, campaignId]);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data: newData } : n));
    setSelectedNode((prev) => prev?.id === nodeId ? { ...prev, data: newData } : prev);
  }, [setNodes]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
    setShowPropertyEditor(false);
  }, [selectedNode, setNodes, setEdges]);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <NodePalette onDragStart={onDragStart} />

      <div className="flex-1 relative min-w-0" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          isValidConnection={isValidConnection}
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          className="bg-gray-50"
        >
          <Background variant="dots" gap={16} size={1} color="#d1d5db" />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const colors = { trigger: '#10B981', sendEmail: '#3B82F6', wait: '#F59E0B', condition: '#8B5CF6', getSegmentData: '#06B6D4', parseCSV: '#F97316', httpRequest: '#EF4444', code: '#374151' };
              return colors[node.type] || '#6B7280';
            }}
          />
        </ReactFlow>

        {/* Toolbar */}
        <div className="absolute top-3 right-3 flex gap-2 z-10">
          {selectedNode && (
            <button onClick={deleteSelectedNode} className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-red-50 flex items-center gap-1.5 text-red-600 transition-colors text-xs font-medium">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
          <button onClick={() => onSave({ nodes, edges })} className="bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 text-gray-700 transition-colors text-xs font-medium">
            <Save className="w-3.5 h-3.5" /> Save
          </button>
          <button onClick={() => onDeploy({ nodes, edges })} className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 transition-colors text-xs font-medium">
            <Upload className="w-3.5 h-3.5" /> Deploy
          </button>
        </div>
      </div>

      {showPropertyEditor && (
        <PropertyEditor
          selectedNode={selectedNode}
          onUpdate={updateNodeData}
          onClose={() => { setShowPropertyEditor(false); setSelectedNode(null); }}
        />
      )}
    </div>
  );
}

export default function FlowBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [flowData, setFlowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchCampaignAndFlow();
  }, [isAuthenticated, authLoading, router, params.id]);

  const fetchCampaignAndFlow = async () => {
    try {
      const [campaignRes, flowRes] = await Promise.all([
        api.get(`/campaigns/${params.id}`),
        api.get(`/campaigns/${params.id}/flow`),
      ]);
      setCampaign(campaignRes.data);
      setFlowData(flowRes.data.flowData || { nodes: [], edges: [] });
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load campaign');
      setLoading(false);
    }
  };

  const handleSaveFlow = async (flowData) => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/campaigns/${params.id}/flow`, { flowData });
      setSuccessMessage('Flow saved!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save flow');
    } finally {
      setSaving(false);
    }
  };

  const handleDeployFlow = async (flowData) => {
    setSaving(true);
    setError(null);
    try {
      await api.patch(`/campaigns/${params.id}/flow`, { flowData });
      const response = await api.post(`/campaigns/${params.id}/deploy-flow`);
      const webhookUrl = response.data.webhookUrl || '';
      setSuccessMessage(
        `Deployed! Workflow ID: ${response.data.n8nWorkflowId}` +
        (webhookUrl ? ` | Webhook: ${webhookUrl}` : '')
      );
      setTimeout(() => setSuccessMessage(null), 8000);
      await fetchCampaignAndFlow();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deploy flow');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading flow builder...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-sm text-center">
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button onClick={() => router.push('/dashboard/campaigns')} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Back to Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/campaigns/${params.id}`)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div>
            <h1 className="text-xs font-semibold text-gray-900">Flow Builder: {campaign?.name}</h1>
            <p className="text-[10px] text-gray-400">Design your campaign workflow</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {campaign?.n8nWorkflowId && (
            <span className="text-[10px] text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full font-medium">
              <Check className="w-3 h-3" /> Deployed
            </span>
          )}
          {saving && <span className="text-[10px] text-gray-400">Saving...</span>}
        </div>
      </div>

      {/* Messages */}
      {(error || successMessage) && (
        <div className={`px-4 py-2 flex-shrink-0 text-xs font-medium ${error ? 'bg-red-50 border-b border-red-200 text-red-700' : 'bg-emerald-50 border-b border-emerald-200 text-emerald-700'}`}>
          {error || successMessage}
        </div>
      )}

      {/* Flow Builder */}
      <div className="flex-1 min-h-0">
        <ReactFlowProvider>
          <FlowBuilderCanvas
            campaignId={params.id}
            initialFlow={flowData}
            onSave={handleSaveFlow}
            onDeploy={handleDeployFlow}
          />
        </ReactFlowProvider>
      </div>
    </div>
  );
}
