"use client";
import AddOrEditAutomationSkeleton from "./add-or-edit-automation-loader";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { MdDeleteOutline, MdOutlineModeEditOutline } from "react-icons/md";
import { APP_CONSTANTS } from "@/app_constants";
import { AiOutlinePlus } from "react-icons/ai";
import { TbLayoutDistributeHorizontal } from "react-icons/tb";
import { MdDeleteSweep } from "react-icons/md";
import Image from "next/image";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Connection,
  Handle,
  Position,
  Panel,
  type ReactFlowInstance,
} from "reactflow";
import { FaSave, FaPlay, FaPlus } from "react-icons/fa";
import api from "@/libs/axios";
import Loader from "@/components/ui-elements/Loader";
import "reactflow/dist/style.css";
import AppIconButton from "@/components/ui-elements/AppIconButton";
import AppTextInput from "@/components/ui-elements/AppTextInput";
import AppModal from "@/components/ui-elements/AppModal";
import { PiX, PiMagnifyingGlass, PiArrowSquareOut } from "react-icons/pi";
import { TbSettingsAutomation } from "react-icons/tb";
import { useQuery, useMutation } from "@tanstack/react-query";
import AppButton from "@/components/ui-elements/AppButton";
import { toast } from "react-toastify";

import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const quill_dark_style = `
  .ql-toolbar { background: var(--bg-3) !important; border-color: var(--border-1) !important; border-radius: 10px 10px 0 0; }
  .ql-container { background: var(--bg-2) !important; border-color: var(--border-1) !important; border-radius: 0 0 10px 10px; font-size: 13px; }
  .ql-editor { color: var(--text-1) !important; min-height: 160px; }
  .ql-editor.ql-blank::before { color: var(--text-4) !important; font-style: normal; }
  .ql-stroke { stroke: var(--text-3) !important; }
  .ql-fill { fill: var(--text-3) !important; }
  .ql-picker-label { color: var(--text-3) !important; }
  .ql-picker-options { background: var(--bg-3) !important; border-color: var(--border-1) !important; }
  .ql-toolbar button:hover .ql-stroke, .ql-toolbar button.ql-active .ql-stroke { stroke: var(--accent) !important; }
  .ql-toolbar button:hover .ql-fill, .ql-toolbar button.ql-active .ql-fill { fill: var(--accent) !important; }
`;
type NodeConfig = {
  to?: string[];
  cc?: string[];
  subject?: string;
  body?: string;
  message?: string;
};

type NodeData = {
  label: string;
  nodeType: "email" | "whatsapp";
  icon: string;
  color: string;
  config?: NodeConfig;
};

type CatalogueItem = {
  label: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
  category: string;
  nodeType: "email" | "whatsapp";
};

type ModalState = {
  id: string;
  type: "email" | "whatsapp";
  config?: NodeConfig;
} | null;

type NodeCallbacks = {
  deleteNode: (id: string) => void;
  onEdit: (id: string, type: "email" | "whatsapp") => void;
};
function hasCycle(edges: { source: string; target: string }[]): boolean {
  const adj = new Map<string, string[]>();
  for (const { source, target } of edges) {
    if (!adj.has(source)) adj.set(source, []);
    adj.get(source)!.push(target);
  }
  const visited = new Set<string>();
  const stack = new Set<string>();
  function dfs(node: string): boolean {
    visited.add(node);
    stack.add(node);
    for (const n of adj.get(node) ?? []) {
      if (!visited.has(n) && dfs(n)) return true;
      if (stack.has(n)) return true;
    }
    stack.delete(node);
    return false;
  }
  for (const node of adj.keys()) {
    if (!visited.has(node) && dfs(node)) return true;
  }
  return false;
}
async function SaveAutomation(nodes: any[], edges: any[], project_id: string) {
  const res = await api.post("/automations", {
    project_id,
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      config: n.data.config ?? {},
      position: n.position,
    })),
    edges: edges.map((e) => ({
      source: e.source,
      target: e.target,
    })),
  });
  return res.data;
}

async function GetProjectById(id: string) {
  const res = await api.get(`/automations/project/${id}`);
  return res.data;
}
function FlowNode({
  id,
  data,
  selected,
  callbacks,
}: {
  id: string;
  data: NodeData;
  selected: boolean;
  callbacks: React.MutableRefObject<NodeCallbacks>;
}) {
  return (
    <div className="flex flex-col items-center group/node">
      <div
        className="
          absolute -top-7 left-1/2 -translate-x-1/2
          flex items-center gap-1 pb-2
          opacity-0 pointer-events-none
          group-hover/node:opacity-100 group-hover/node:pointer-events-auto
          transition-opacity duration-150
        "
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            callbacks.current.onEdit(id, data.nodeType);
          }}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-[var(--bg-3)] transition-colors"
        >
          <MdOutlineModeEditOutline
            size={12}
            style={{ color: "var(--text-3)" }}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            callbacks.current.deleteNode(id);
          }}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/10 transition-colors group/del"
        >
          <MdDeleteOutline
            size={12}
            className="text-[var(--text-3)] group-hover/del:text-red-400 transition-colors"
          />
        </button>
      </div>

      <div
        style={{
          background: "var(--bg-2)",
          borderColor: selected ? "var(--accent)" : "var(--border-2)",
          boxShadow: selected ? `0 0 0 2px ${data.color}33` : undefined,
          width: 72,
          height: 72,
        }}
        className="rounded-2xl border flex items-center justify-center relative"
      >
        <Image
          src={data.icon}
          alt={data.label}
          width={30}
          height={30}
          style={{ width: 30, height: "auto" }}
        />
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2 !h-2 !border-2"
          style={{ background: data.color, borderColor: "var(--bg-2)" }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2 !h-2 !border-2"
          style={{ background: data.color, borderColor: "var(--bg-2)" }}
        />
      </div>

      <p
        className="text-[11px] font-medium mt-1.5"
        style={{ color: "var(--text-3)" }}
      >
        {data.label}
      </p>
    </div>
  );
}
const nodeTypes = {
  flowNode: (props: any) => (
    <FlowNode {...props} callbacks={props.data.__callbacks} />
  ),
};

const CATALOGUE: CatalogueItem[] = [
  {
    label: "Send Email",
    description: "Send an email to a recipient",
    icon: APP_CONSTANTS.ICONS.gmail,
    color: "#EA4335",
    bg: "#EA433520",
    category: "Messaging",
    nodeType: "email",
  },
  {
    label: "Send WhatsApp",
    description: "Send a message via WhatsApp",
    icon: APP_CONSTANTS.ICONS.whatsapp,
    color: "#25D366",
    bg: "#25D36620",
    category: "Messaging",
    nodeType: "whatsapp",
  },
];

const CATEGORIES = ["All", "Messaging"];

type Props = { id: string };

export default function AddOrEditAutomation({ id }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [modal_type, setModalType] = useState<ModalState>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const rfInstance = useRef<ReactFlowInstance | null>(null);

  const callbacksRef = useRef<NodeCallbacks>({
    deleteNode: () => {},
    onEdit: () => {},
  });

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((ns) => ns.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
    },
    [setNodes, setEdges],
  );

  const handleEdit = useCallback(
    (nodeId: string, type: "email" | "whatsapp") => {
      const node = nodesRef.current.find((n) => n.id === nodeId);
      setModalType({ id: nodeId, type, config: node?.data?.config });
    },
    [],
  );

  callbacksRef.current.deleteNode = deleteNode;
  callbacksRef.current.onEdit = handleEdit;

  const handleModalSave = useCallback(
    (config: NodeConfig) => {
      if (!modal_type) return;
      setNodes((ns) =>
        ns.map((n) =>
          n.id === modal_type.id ? { ...n, data: { ...n.data, config } } : n,
        ),
      );
      setModalType(null);
    },
    [modal_type, setNodes],
  );

  const handleModalClose = useCallback(() => setModalType(null), []);

  const { mutate, isPending: isSaving } = useMutation({
    mutationFn: () => SaveAutomation(nodes, edges, id),
    onSuccess: (res: any) => {
      if (res && res.is_saved) {
        toast.success(res.msg);
      }
    },
  });

  const handleSave = useCallback(() => {
    if (nodes.length === 0) {
      toast.warning("Add at least one node before saving.");
      return;
    }

    const edgeList = edges.map((e) => ({ source: e.source, target: e.target }));

    const hasBranching = edgeList.some(
      (e, _, arr) => arr.filter((x) => x.source === e.source).length > 1,
    );
    if (hasBranching) {
      toast.error(
        "Each node can only connect to one next step. Please fix the branching connections.",
      );
      return;
    }

    if (hasCycle(edgeList)) {
      toast.error(
        "Your automation has a loop in it. Please remove the circular connection before saving.",
      );
      return;
    }

    mutate();
  }, [nodes, edges, mutate]);

  const onConnect = useCallback(
    (params: Connection) => {
      const alreadyConnected = edges.some((e) => e.source === params.source);
      if (alreadyConnected) {
        toast.warning(
          "This node already has a next step. Remove the existing connection first.",
        );
        return;
      }

      const wouldCycle = hasCycle([
        ...edges.map((e) => ({ source: e.source, target: e.target })),
        { source: params.source!, target: params.target! },
      ]);
      if (wouldCycle) {
        toast.error(
          "You can't connect this node here — it would create an infinite loop.",
        );
        return;
      }

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "var(--accent)", strokeWidth: 1.5 },
          },
          eds,
        ),
      );
    },
    [edges, setEdges],
  );

  const arrangeNodes = useCallback(() => {
    if (nodes.length === 0) return;

    const adj = new Map<string, string>();
    const hasIncoming = new Set<string>();

    for (const e of edges) {
      adj.set(e.source, e.target);
      hasIncoming.add(e.target);
    }

    const startNode = nodes.find((n) => !hasIncoming.has(n.id)) ?? nodes[0];

    const ordered: string[] = [];
    let current: string | undefined = startNode.id;
    while (current && !ordered.includes(current)) {
      ordered.push(current);
      current = adj.get(current);
    }

    const unvisited = nodes
      .filter((n) => !ordered.includes(n.id))
      .map((n) => n.id);
    ordered.push(...unvisited);

    const GAP_X = 160;
    const START_X = 100;
    const Y = 260;

    setNodes((ns) =>
      ns.map((n) => {
        const idx = ordered.indexOf(n.id);
        return { ...n, position: { x: START_X + idx * GAP_X, y: Y } };
      }),
    );
  }, [nodes, edges, setNodes]);

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return CATALOGUE.filter((item) => {
      const matchCat =
        activeCategory === "All" || item.category === activeCategory;
      const matchSearch =
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => GetProjectById(id),
    enabled: !!id,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (!data?.data) return;

    const { nodes: savedNodes, edges: savedEdges } = data.data;

    if (savedNodes?.length) {
      setNodes(
        savedNodes.map((n: any) => {
          const catalogueItem = CATALOGUE.find((c) => c.nodeType === n.type);
          return {
            id: n.id,
            type: "flowNode",
            position: n.position ?? {
              x: Math.random() * 400,
              y: Math.random() * 300,
            },
            data: {
              label: catalogueItem?.label ?? n.type,
              nodeType: n.type,
              icon: catalogueItem?.icon ?? "",
              color: catalogueItem?.color ?? "#888",
              config: n.config ?? {},
              __callbacks: callbacksRef,
            },
          };
        }),
      );
    }

    if (savedEdges?.length) {
      setEdges(
        savedEdges.map((e: any) => ({
          id: `${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          animated: true,
          style: { stroke: "var(--accent)", strokeWidth: 1.5 },
        })),
      );
    }
  }, [data]);

  // Add this ref right after the nodes/edges state declarations
  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const addNode = useCallback(
    (item: CatalogueItem) => {
      const nodeId = `node-${Date.now()}`;
      const pos = rfInstance.current?.screenToFlowPosition({
        x: (reactFlowWrapper.current?.clientWidth ?? 600) / 2,
        y: (reactFlowWrapper.current?.clientHeight ?? 400) / 2,
      }) ?? { x: 300, y: 200 };

      setNodes((ns) => [
        ...ns,
        {
          id: nodeId,
          type: "flowNode",
          position: pos,
          data: {
            label: item.label,
            nodeType: item.nodeType,
            icon: item.icon,
            color: item.color,
            __callbacks: callbacksRef,
          },
        },
      ]);
      setPanelOpen(false);
    },
    [setNodes],
  );

  const openPanel = useCallback(() => setPanelOpen(true), []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  if (isLoading) return <AddOrEditAutomationSkeleton />;

  return (
    <div className="flex h-full w-full relative overflow-hidden">
      <div ref={reactFlowWrapper} className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            rfInstance.current = instance;
          }}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />

          <Panel position="top-left">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border"
              style={{
                background: "var(--bg-2)",
                borderColor: "var(--border-1)",
              }}
            >
              <TbSettingsAutomation
                size={25}
                style={{ color: "var(--accent)" }}
              />
              <span
                className="text-[18px] font-semibold"
                style={{ color: "var(--text-1)" }}
              >
                {data && data.data && data.data.project_name}
              </span>
            </div>
          </Panel>

          <Panel position="top-right">
            <div className="flex items-center gap-2">
              <AppButton
                onClick={arrangeNodes}
                disabled={isSaving || nodes.length === 0}
              >
                <TbLayoutDistributeHorizontal size={14} /> Arrange
              </AppButton>
              <AppButton
                onClick={clearCanvas}
                disabled={isSaving || nodes.length === 0}
              >
                <MdDeleteSweep size={14} /> Clear
              </AppButton>
              <AppButton disabled={isSaving}>
                <FaPlay size={13} /> Run
              </AppButton>
              <AppButton disabled={isSaving} onClick={handleSave}>
                {isSaving ? (
                  <Loader />
                ) : (
                  <>
                    <FaSave size={13} /> Save
                  </>
                )}
              </AppButton>
              <AppButton onClick={openPanel} disabled={isSaving}>
                <FaPlus size={13} /> Add Node
              </AppButton>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {nodes.length <= 0 && !isLoading && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
          <AppIconButton
            size="lg"
            className="cursor-pointer"
            onClick={openPanel}
          >
            <AiOutlinePlus size={28} />
          </AppIconButton>
        </div>
      )}

      {panelOpen && (
        <div className="absolute inset-0 z-30" onClick={closePanel} />
      )}

      <div
        className={`
          absolute top-0 right-0 h-full z-40 flex flex-col border-l
          bg-[var(--bg-1)] border-[var(--border-1)]
          transition-[width,opacity,box-shadow] duration-300 ease-in-out overflow-hidden
          ${panelOpen ? "w-80 opacity-100 pointer-events-auto shadow-[rgba(0,0,0,0.4)_-8px_0_32px]" : "w-0 opacity-0 pointer-events-none shadow-none"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full overflow-hidden min-w-80">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 shrink-0">
            <h2 className="text-[15.5px] font-bold text-[var(--text-1)]">
              What happens next?
            </h2>
            <button
              onClick={closePanel}
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors text-[var(--text-4)] hover:bg-[var(--bg-3)]"
            >
              <PiX size={15} />
            </button>
          </div>

          <div className="px-4 pb-3 shrink-0">
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border bg-bg-2 border-border-1 transition-colors focus-within:border-accent">
              <PiMagnifyingGlass size={14} style={{ color: "var(--text-4)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search nodes..."
                className="flex-1 bg-transparent outline-none text-[12.5px] text-text-1"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{ color: "var(--text-4)" }}
                >
                  <PiX size={12} />
                </button>
              )}
            </div>
          </div>

          <div
            className="flex gap-1.5 px-4 pb-3 shrink-0 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all shrink-0"
                style={
                  activeCategory === cat
                    ? { background: "var(--accent)", color: "#fff" }
                    : { background: "var(--bg-3)", color: "var(--text-3)" }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          <div
            className="h-px mx-4 shrink-0"
            style={{ background: "var(--border-1)" }}
          />

          <div
            className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5"
            style={{ scrollbarWidth: "none" }}
          >
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <PiMagnifyingGlass
                  size={22}
                  style={{ color: "var(--text-4)" }}
                />
                <p className="text-[12px]" style={{ color: "var(--text-4)" }}>
                  No nodes found
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.label}
                  onClick={() => addNode(item)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all hover:bg-[--bg-3] group"
                >
                  <span
                    className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                    style={{ background: item.bg }}
                  >
                    <Image
                      src={item.icon}
                      alt={item.label}
                      width={22}
                      height={22}
                      style={{ width: 22, height: "auto" }}
                    />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-semibold"
                      style={{ color: "var(--text-1)" }}
                    >
                      {item.label}
                    </p>
                    <p
                      className="text-[11px] mt-0.5 leading-snug"
                      style={{ color: "var(--text-3)" }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <PiArrowSquareOut
                    size={13}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: "var(--text-4)" }}
                  />
                </button>
              ))
            )}
          </div>

          <div
            className="px-5 py-3 border-t shrink-0"
            style={{ borderColor: "var(--border-1)" }}
          >
            <p className="text-[11px]" style={{ color: "var(--text-4)" }}>
              {filtered.length} node{filtered.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </div>
      </div>

      {modal_type && modal_type.type === "email" && (
        <EmailModal
          key={modal_type.id}
          config={modal_type.config}
          onSave={handleModalSave}
          onClose={handleModalClose}
        />
      )}

      {modal_type && modal_type.type === "whatsapp" && (
        <WhatsAppModal
          key={modal_type.id}
          config={modal_type.config}
          onSave={handleModalSave}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

function useChips(initial: string | string[]) {
  const [chips, setChips] = useState<string[]>(() => {
    if (!initial) return [];
    if (Array.isArray(initial)) return initial;
    return initial
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  });
  const [input, setInput] = useState("");

  const add = useCallback((raw: string) => {
    const vals = raw
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    setChips((prev) => [...new Set([...prev, ...vals])]);
    setInput("");
  }, []);

  const remove = useCallback((idx: number) => {
    setChips((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === "Enter" || e.key === ",") && input.trim()) {
        e.preventDefault();
        add(input);
      } else if (e.key === "Backspace" && !input && chips.length) {
        setChips((prev) => prev.slice(0, -1));
      }
    },
    [input, chips, add],
  );

  return {
    chips,
    input,
    setInput,
    add,
    remove,
    onKeyDown,
    value: chips.join(", "),
  };
}

function ChipField({
  label,
  placeholder,
  chips,
  input,
  setInput,
  onKeyDown,
  remove,
  color = "white",
}: {
  label: string;
  placeholder: string;
  chips: string[];
  input: string;
  setInput: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  remove: (i: number) => void;
  color?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-[10.5px] font-semibold uppercase tracking-widest"
        style={{ color: "var(--text-3)" }}
      >
        {label}
      </label>
      <div
        className="flex flex-wrap gap-1.5 items-center min-h-[38px] px-2.5 py-1.5 rounded-xl border transition-colors focus-within:border-[var(--accent)]"
        style={{ background: "var(--bg-2)", borderColor: "var(--border-2)" }}
      >
        {chips.map((chip, i) => (
          <span
            key={i}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
            style={{ background: `${color}18`, color }}
          >
            {chip}
            <button
              type="button"
              onClick={() => remove(i)}
              className="opacity-60 hover:opacity-100 transition-opacity leading-none"
            >
              <PiX size={10} />
            </button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[120px] bg-transparent outline-none text-[12.5px]"
          style={{ color: "var(--text-1)" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={chips.length === 0 ? placeholder : ""}
        />
      </div>
      {chips.length === 0 && (
        <p className="text-[10px]" style={{ color: "var(--text-4)" }}>
          Press Enter or comma to add multiple
        </p>
      )}
    </div>
  );
}

function EmailModal({
  config,
  onSave,
  onClose,
}: {
  config?: NodeConfig;
  onSave: (c: NodeConfig) => void;
  onClose: () => void;
}) {
  const toChips = useChips(config?.to ?? "");
  const ccChips = useChips(config?.cc ?? "");
  const [subject, setSubject] = useState(config?.subject ?? "");
  const [body, setBody] = useState(config?.body ?? "");

  const handleSave = () => {
    const flush = (chips: string[], input: string) => {
      if (!input.trim()) return chips;
      const pending = input
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      return [...new Set([...chips, ...pending])];
    };

    onSave({
      to: flush(toChips.chips, toChips.input),
      cc: flush(ccChips.chips, ccChips.input),
      subject,
      body,
    });
  };

  return (
    <>
      <style>{quill_dark_style}</style>
      <AppModal
        open
        title="Send Email"
        onClose={onClose}
        width="90%"
        onSubmit={handleSave}
        submit_text="Save"
        variant="primary"
      >
        <div
          className=" grid grid-cols-2 gap-0 -m-5"
          style={{ minHeight: 540 }}
        >
          <div className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto">
            <ChipField
              label="To"
              placeholder="recipient@email.com"
              color="#f5f5f5"
              {...toChips}
            />

            <ChipField
              label="CC"
              placeholder="cc@email.com"
              color="#f5f5f5"
              {...ccChips}
            />

            <div className="flex flex-col gap-1.5">
              <label
                className="text-[10.5px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-3)" }}
              >
                Subject
              </label>
              <AppTextInput
                placeholder="Email subject…"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <label
                className="text-[10.5px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-3)" }}
              >
                Body
              </label>
              <ReactQuill
                theme="snow"
                value={body}
                onChange={setBody}
                placeholder="Write your email…"
                modules={{
                  toolbar: [
                    ["bold", "italic", "underline"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link"],
                    ["clean"],
                  ],
                }}
              />
            </div>
          </div>

          <div
            className=" p-5 flex flex-col"
            style={{ background: "var(--bg-1)" }}
          >
            <div className="flex flex-col gap-3 h-full">
              <div
                className="flex-1 rounded-xl border overflow-hidden flex flex-col"
                style={{
                  borderColor: "var(--border-1)",
                  background: "var(--bg-1)",
                }}
              >
                <div
                  className="px-4 py-3 border-b"
                  style={{
                    borderColor: "var(--border-1)",
                    background: "#EA433508",
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Image
                      src={APP_CONSTANTS.ICONS.gmail}
                      width={14}
                      height={14}
                      alt="gmail"
                      style={{ width: 14, height: "auto" }}
                    />
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--text-3)" }}
                    >
                      from:{" "}
                      <span style={{ color: "var(--text-1)" }}>
                        noreply@yourapp.com
                      </span>
                    </span>
                  </div>
                  {toChips.chips.length > 0 && (
                    <p
                      className="text-[10.5px] mb-1"
                      style={{ color: "var(--text-3)" }}
                    >
                      To:{" "}
                      <span style={{ color: "var(--text-2)" }}>
                        {toChips.chips.join(", ")}
                      </span>
                    </p>
                  )}
                  {ccChips.chips.length > 0 && (
                    <p
                      className="text-[10.5px] mb-1"
                      style={{ color: "var(--text-3)" }}
                    >
                      CC:{" "}
                      <span style={{ color: "var(--text-2)" }}>
                        {ccChips.chips.join(", ")}
                      </span>
                    </p>
                  )}
                  <p
                    className="text-[13px] font-semibold mt-2"
                    style={{ color: "var(--text-1)" }}
                  >
                    {subject || (
                      <span style={{ color: "var(--text-4)" }}>No subject</span>
                    )}
                  </p>
                </div>

                <div
                  className="flex-1 p-4 overflow-y-auto text-[12px] leading-relaxed"
                  style={{ color: "var(--text-2)" }}
                >
                  {body ? (
                    <div dangerouslySetInnerHTML={{ __html: body }} />
                  ) : (
                    <span style={{ color: "var(--text-4)" }}>
                      Your email body will appear here…
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppModal>
    </>
  );
}

function WhatsAppModal({
  config,
  onSave,
  onClose,
}: {
  config?: NodeConfig;
  onSave: (c: NodeConfig) => void;
  onClose: () => void;
}) {
  const toChips = useChips(config?.to ?? "");
  const [message, setMessage] = useState(config?.message ?? "");

  const handleSave = () => {
    const flush = (chips: string[], input: string) => {
      if (!input.trim()) return chips;
      const pending = input
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      return [...new Set([...chips, ...pending])];
    };

    onSave({ to: flush(toChips.chips, toChips.input), message });
  };

  return (
    <>
      <style>{quill_dark_style}</style>
      <AppModal
        open
        title="Send Whatsapp"
        onClose={onClose}
        width="90%"
        onSubmit={handleSave}
        submit_text="Save"
        variant="primary"
      >
        <div
          className=" grid grid-cols-2 gap-0 -m-5"
          style={{ minHeight: 500 }}
        >
          <div className="flex-1 flex flex-col gap-4 p-5">
            <ChipField
              label="To"
              placeholder="+91 9876543210"
              color="#f5f5f5"
              {...toChips}
            />

            <div className="flex flex-col gap-1.5 flex-1">
              <label
                className="text-[10.5px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--text-3)" }}
              >
                Message
              </label>
              <ReactQuill
                theme="snow"
                value={message}
                onChange={setMessage}
                placeholder="Write your message…"
                modules={{
                  toolbar: [["bold", "italic", "underline"], ["clean"]],
                }}
              />
            </div>
          </div>

          <div
            className="p-5 flex flex-col"
            style={{ background: "var(--bg-1)" }}
          >
            <div className="flex flex-col gap-3 h-full">
              <div className="flex items-center justify-between">
                <span
                  className="text-[10.5px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-3)" }}
                >
                  Preview
                </span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "#22c55e18", color: "#22c55e" }}
                >
                  Live
                </span>
              </div>

              <div
                className="flex-1 rounded-xl border overflow-hidden flex flex-col"
                style={{
                  borderColor: "var(--border-1)",
                  background: "#0d1418",
                }}
              >
                <div
                  className="flex items-center gap-2.5 px-3 py-2.5"
                  style={{ background: "#202c33" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "#25D36630" }}
                  >
                    <Image
                      src={APP_CONSTANTS.ICONS.whatsapp}
                      width={16}
                      height={16}
                      alt="wa"
                      style={{ width: 16, height: "auto" }}
                    />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-white">
                      {toChips.chips[0] || "Recipient"}
                    </p>
                    {toChips.chips.length > 1 && (
                      <p className="text-[10px]" style={{ color: "#8696a0" }}>
                        +{toChips.chips.length - 1} more
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className="flex-1 p-3 flex flex-col justify-end gap-2"
                  style={{ background: "#0b141a" }}
                >
                  {message ? (
                    <div
                      className="self-end max-w-[85%] rounded-xl rounded-br-sm px-3 py-2"
                      style={{ background: "#005c4b" }}
                    >
                      <div
                        className="text-[12px] leading-relaxed text-white"
                        dangerouslySetInnerHTML={{ __html: message }}
                      />
                      <p
                        className="text-[9px] text-right mt-1"
                        style={{ color: "#8696a0" }}
                      >
                        12:00 PM ✓✓
                      </p>
                    </div>
                  ) : (
                    <p
                      className="text-center text-[11px]"
                      style={{ color: "#8696a0" }}
                    >
                      Message preview will appear here…
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppModal>
    </>
  );
}
