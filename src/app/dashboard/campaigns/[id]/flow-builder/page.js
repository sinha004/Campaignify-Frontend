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
  trigger: 'bg-green-50 border-green-500',
  sendEmail: 'bg-blue-50 border-blue-500',
  wait: 'bg-yellow-50 border-yellow-500',
  condition: 'bg-purple-50 border-purple-500',
  getSegmentData: 'bg-cyan-50 border-cyan-500',
  parseCSV: 'bg-orange-50 border-orange-500',
  httpRequest: 'bg-red-50 border-red-500',
  code: 'bg-gray-50 border-gray-700',
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

// Base custom node component with handles
function CustomNode({ data, type, selected }) {
  const Icon = nodeIcons[type] || Play;
  const style = nodeStyles[type] || 'bg-gray-50 border-gray-500';
  const isCondition = type === 'condition';
  const isTrigger = type === 'trigger';

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 shadow-md min-w-[180px] ${style} ${
        selected ? 'ring-2 ring-[#526bb0] ring-offset-2' : ''
      }`}
    >
      {/* Input handle - not shown for trigger nodes */}
      {!isTrigger && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}
      
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-black" />
        <span className="font-medium text-sm text-black">{data.label || type}</span>
      </div>
      {data.description && (
        <p className="text-xs text-black mt-1 truncate">{data.description}</p>
      )}

      {/* Output handles */}
      {isCondition ? (
        <>
          {/* True branch */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!w-3 !h-3 !bg-green-500 !border-2 !border-white !left-1/3"
            style={{ left: '30%' }}
          />
          {/* False branch */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!w-3 !h-3 !bg-red-500 !border-2 !border-white"
            style={{ left: '70%' }}
          />
          <div className="flex justify-between text-xs mt-2 px-2">
            <span className="text-green-600">True</span>
            <span className="text-red-600">False</span>
          </div>
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-gray-400 !border-2 !border-white"
        />
      )}
    </div>
  );
}

// Create node type components
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

// Node palette configuration
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

// Node property schemas
const nodePropertySchemas = {
  trigger: {
    fields: [
      { name: 'webhookPath', label: 'Webhook Path (auto-generated)', type: 'readonly' },
      { name: 'httpMethod', label: 'HTTP Method', type: 'select', options: ['POST', 'GET'], defaultValue: 'POST' },
    ],
  },
  sendEmail: {
    fields: [
      {
        name: 'to',
        label: 'To',
        type: 'text',
        placeholder: '{{email}}',
        helpText:
          'Use {{email}} to send to each contact in the selected segment.',
      },
      {
        name: 'subject',
        label: 'Subject',
        type: 'text',
        placeholder: 'Email subject',
        helpText:
          'You can personalise with variables like {{name}} in the subject.',
      },
      {
        name: 'body',
        label: 'Body',
        type: 'textarea',
        placeholder: 'Email content...',
        helpText:
          'Use {{name}} and {{email}} anywhere in the content to insert recipient data.',
      },
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
      {
        name: 'field',
        label: 'Field',
        type: 'text',
        placeholder: '{{hasReply}}',
        helpText:
          'Use a variable from previous nodes, e.g. {{hasReply}} or {{opens}}.',
      },
      { name: 'operator', label: 'Operator', type: 'select', options: ['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan'] },
      {
        name: 'value',
        label: 'Value',
        type: 'text',
        placeholder: 'value to compare',
        helpText: 'The value you want to compare the field against.',
      },
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
      { name: 'jsCode', label: 'JavaScript Code', type: 'code', placeholder: `// Access input data with $input.all() or $input.first()
// Example: Check if email was replied
const items = $input.all();
const labelIds = items[0].json.labelIds || [];

// Check if INBOX label exists (means reply received)
const hasReply = labelIds.some(label => label === 'INBOX');

// Return data for next node
return items.map(item => ({
  json: { ...item.json, hasReply }
}));` },
    ],
  },
};

// Webhook URL Field with Copy Button
function WebhookUrlField({ label, url }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div>
      <p className="text-xs text-blue-700 font-medium">{label}:</p>
      <div className="flex items-center gap-1 mt-1">
        <p className="flex-1 text-xs text-blue-900 break-all font-mono bg-white px-2 py-1.5 rounded-lg">
          {url}
        </p>
        <button
          onClick={handleCopy}
          className="p-1.5 bg-white hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
          title={copied ? 'Copied!' : 'Copy URL'}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-600" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-blue-600" />
          )}
        </button>
      </div>
    </div>
  );
}

// Property Editor Panel
function PropertyEditor({ selectedNode, onUpdate, onClose }) {
  const [properties, setProperties] = useState(selectedNode?.data?.properties || {});
  const [label, setLabel] = useState(selectedNode?.data?.label || '');
  
  useEffect(() => {
    setProperties(selectedNode?.data?.properties || {});
    setLabel(selectedNode?.data?.label || '');
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 bg-white border-l border-gray-100 p-4 flex-shrink-0 h-full">
        <div className="text-center text-[#86868b] py-8">
          <div className="w-12 h-12 bg-[#f5f5f7] rounded-xl flex items-center justify-center mx-auto mb-3">
            <Settings className="w-6 h-6 text-[#86868b]" />
          </div>
          <p className="text-sm">Select a node to edit its properties</p>
        </div>
      </div>
    );
  }

  const schema = nodePropertySchemas[selectedNode.type] || { fields: [] };

  const handleChange = (fieldName, value) => {
    setProperties((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSave = () => {
    onUpdate(selectedNode.id, {
      ...selectedNode.data,
      label,
      properties,
    });
  };

  return (
    <div className="w-80 bg-white border-l border-gray-100 flex flex-col flex-shrink-0 h-full">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
        <h3 className="font-semibold text-[#1d1d1f]">Node Properties</h3>
        <button onClick={onClose} className="text-[#86868b] hover:text-[#1d1d1f] transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {/* Node Label */}
        <div>
          <label className="block text-xs font-medium text-[#86868b] mb-1.5">
            Node Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none text-[#1d1d1f] placeholder:text-[#86868b] text-sm"
            placeholder="Enter node label"
          />
        </div>

        {/* Webhook URLs for trigger nodes */}
        {selectedNode.type === 'trigger' && properties.webhookPath && (
          <div className="bg-blue-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-medium text-blue-700">Webhook URLs (after deployment):</p>
            <WebhookUrlField 
              label="Test URL" 
              url={`http://localhost:5678/webhook-test/${properties.webhookPath}`} 
            />
            <WebhookUrlField 
              label="Production URL" 
              url={`http://localhost:5678/webhook/${properties.webhookPath}`} 
            />
          </div>
        )}

        {/* Dynamic Fields */}
        {schema.fields.map((field) => (
          <div key={field.name}>
            <label className="block text-xs font-medium text-[#86868b] mb-1.5">
              {field.label}
            </label>
            {field.helpText && (
              <p className="text-xs text-[#86868b]/70 mb-1.5">
                {field.helpText}
              </p>
            )}
            
            {field.type === 'text' && (
              <input
                type="text"
                value={properties[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none text-[#1d1d1f] placeholder:text-[#86868b] text-sm"
              />
            )}
            
            {field.type === 'number' && (
              <input
                type="number"
                value={properties[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none text-[#1d1d1f] placeholder:text-[#86868b] text-sm"
              />
            )}
            
            {field.type === 'textarea' && (
              <textarea
                value={properties[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={3}
                className="w-full px-3 py-2 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none text-[#1d1d1f] placeholder:text-[#86868b] text-sm"
              />
            )}
            
            {field.type === 'select' && (
              <select
                value={properties[field.name] || field.options[0]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className="w-full px-3 py-2 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none text-[#1d1d1f] text-sm"
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt} className="text-[#1d1d1f]">{opt}</option>
                ))}
              </select>
            )}
            
            {field.type === 'checkbox' && (
              <input
                type="checkbox"
                checked={properties[field.name] || false}
                onChange={(e) => handleChange(field.name, e.target.checked)}
                className="w-5 h-5 text-[#526bb0] border-gray-300 rounded focus:ring-[#526bb0]"
              />
            )}
            
            {field.type === 'code' && (
              <textarea
                value={properties[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                rows={12}
                className="w-full px-3 py-2 bg-[#f5f5f7] border-0 rounded-xl focus:ring-2 focus:ring-[#526bb0] outline-none text-[#1d1d1f] placeholder:text-[#86868b] font-mono text-xs"
                spellCheck={false}
              />
            )}
            
            {field.type === 'readonly' && (
              <input
                type="text"
                value={properties[field.name] || ''}
                readOnly
                className="w-full px-3 py-2 bg-gray-100 rounded-xl text-[#86868b] cursor-not-allowed text-sm"
              />
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
        <button
          onClick={handleSave}
          className="w-full bg-[#526bb0] text-white py-2.5 rounded-xl font-medium hover:bg-[#01adbd] transition-colors text-sm"
        >
          Apply Changes
        </button>
      </div>
    </div>
  );
}

// Node Palette Sidebar
function NodePalette({ onDragStart }) {
  return (
    <div className="w-64 bg-white border-r border-gray-100 flex-shrink-0 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-[#1d1d1f]">Node Types</h3>
        <p className="text-xs text-[#86868b] mt-1">Drag nodes to the canvas</p>
      </div>
      
      {nodeCategories.map((category) => (
        <div key={category.name} className="p-4 border-b border-gray-50">
          <h4 className="text-xs font-medium text-[#86868b] uppercase tracking-wider mb-3">
            {category.name}
          </h4>
          <div className="space-y-2">
            {category.nodes.map((node) => {
              const Icon = nodeIcons[node.type];
              const style = nodeStyles[node.type];
              return (
                <div
                  key={node.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, node)}
                  className={`p-3 rounded-xl border-2 cursor-grab active:cursor-grabbing ${style} hover:shadow-md transition-all`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-black" />
                    <span className="text-sm font-medium text-black">{node.label}</span>
                  </div>
                  <p className="text-xs text-black/70 mt-1">{node.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Flow Builder Canvas
function FlowBuilderCanvas({ campaignId, initialFlow, onSave, onDeploy }) {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow?.edges || []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showPropertyEditor, setShowPropertyEditor] = useState(false);
  const { screenToFlowPosition } = useReactFlow();

  // Handle connections between nodes
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: true,
            style: { strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setShowPropertyEditor(true);
  }, []);

  // Handle drag start for palette items
  const onDragStart = useCallback((event, nodeData) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  }, []);

  // Handle drop from palette
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) return;

      const nodeData = JSON.parse(data);
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Set default properties based on node type
      let defaultProperties = {};
      if (nodeData.type === 'trigger') {
        defaultProperties = {
          webhookPath: `campaign-${campaignId}`,
          httpMethod: 'POST',
        };
      } else if (nodeData.type === 'wait') {
        defaultProperties = {
          amount: '1',
          unit: 'minutes',
        };
      }

      const newNode = {
        id: uuidv4(),
        type: nodeData.type,
        position,
        data: {
          label: nodeData.label,
          description: nodeData.description,
          properties: defaultProperties,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [screenToFlowPosition, setNodes, campaignId]
  );

  // Update node data
  const updateNodeData = useCallback(
    (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: newData }
            : node
        )
      );
      setSelectedNode((prev) =>
        prev?.id === nodeId ? { ...prev, data: newData } : prev
      );
    },
    [setNodes]
  );

  // Delete selected node
  const deleteSelectedNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            edge.source !== selectedNode.id && edge.target !== selectedNode.id
        )
      );
      setSelectedNode(null);
      setShowPropertyEditor(false);
    }
  }, [selectedNode, setNodes, setEdges]);

  // Save flow
  const handleSave = async () => {
    const flowData = { nodes, edges };
    await onSave(flowData);
  };

  // Deploy flow
  const handleDeploy = async () => {
    const flowData = { nodes, edges };
    await onDeploy(flowData);
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Node Palette */}
      <NodePalette onDragStart={onDragStart} />

      {/* Canvas */}
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
          fitView
          deleteKeyCode={['Backspace', 'Delete']}
          className="bg-[#f5f5f7]"
        >
          <Background variant="dots" gap={16} size={1} color="#d1d5db" />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const colors = {
                trigger: '#10B981',
                sendEmail: '#3B82F6',
                wait: '#F59E0B',
                condition: '#8B5CF6',
                getSegmentData: '#06B6D4',
                parseCSV: '#F97316',
                httpRequest: '#EF4444',
                code: '#374151',
              };
              return colors[node.type] || '#6B7280';
            }}
          />
        </ReactFlow>

        {/* Toolbar */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {selectedNode && (
            <button
              onClick={deleteSelectedNode}
              className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 flex items-center gap-2 text-[#1d1d1f] transition-colors text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={handleDeploy}
            className="bg-[#526bb0] text-white px-4 py-2 rounded-xl shadow-sm hover:bg-[#01adbd] flex items-center gap-2 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            Deploy to n8n
          </button>
        </div>
      </div>

      {/* Property Editor */}
      {showPropertyEditor && (
        <PropertyEditor
          selectedNode={selectedNode}
          onUpdate={updateNodeData}
          onClose={() => {
            setShowPropertyEditor(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
}

// Main Page Component
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
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
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
      setSuccessMessage('Flow saved successfully!');
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
      // First save the flow
      await api.patch(`/campaigns/${params.id}/flow`, { flowData });
      
      // Then deploy to n8n
      const response = await api.post(`/campaigns/${params.id}/deploy-flow`);
      const webhookUrl = response.data.webhookUrl || '';
      setSuccessMessage(
        `Flow deployed and activated! Workflow ID: ${response.data.n8nWorkflowId}` +
        (webhookUrl ? `\nWebhook URL: ${webhookUrl}` : '')
      );
      setTimeout(() => setSuccessMessage(null), 8000);
      
      // Refresh campaign data
      await fetchCampaignAndFlow();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deploy flow');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#526bb0] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#86868b]">Loading flow builder...</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-[#fbfbfd] p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-[#1d1d1f] text-lg mb-4">{error}</p>
            <button
              onClick={() => router.push('/dashboard/campaigns')}
              className="text-[#526bb0] hover:text-[#01adbd] font-medium"
            >
              ← Back to Campaigns
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#fbfbfd] overflow-hidden">
      {/* Header */}
      <div className="glass border-b border-gray-200/50 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/dashboard/campaigns/${params.id}`)}
            className="text-[#526bb0] hover:text-[#01adbd] transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-5 w-px bg-gray-300" />
          <div>
            <h1 className="text-sm font-semibold text-[#1d1d1f]">
              Flow Builder: {campaign?.name}
            </h1>
            <p className="text-xs text-[#86868b]">
              Design your campaign workflow
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {campaign?.n8nWorkflowId && (
            <span className="text-xs text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full">
              ✓ Deployed to n8n
            </span>
          )}
          {saving && (
            <span className="text-xs text-[#86868b]">Saving...</span>
          )}
          <span className="text-sm font-semibold text-[#1d1d1f]">Campaignify</span>
        </div>
      </div>

      {/* Messages */}
      {(error || successMessage) && (
        <div className={`px-6 py-3 flex-shrink-0 ${error ? 'bg-red-50 border-b border-red-100' : 'bg-green-50 border-b border-green-100'}`}>
          <p className={`text-sm font-medium ${error ? 'text-red-700' : 'text-green-700'}`}>
            {error || successMessage}
          </p>
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
