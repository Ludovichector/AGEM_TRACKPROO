"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, DragOverEvent,
  PointerSensor, useSensor, useSensors, closestCenter, closestCorners, KeyboardSensor,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock, MessageSquare, Paperclip, CheckSquare, ShieldAlert, Plus } from "lucide-react";
import { formatDate } from "@/lib/format";
import { ROLE_COLORS } from "@/lib/permissions";
import type { TaskPriority, Role } from "@prisma/client";
import { toast } from "sonner";
import { moveTask } from "@/app/(dashboard)/tasks/actions";
import { TaskCreationModal } from "./TaskCreationModal";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  LOW: "var(--text-muted)",
  MEDIUM: "var(--status-info)",
  HIGH: "var(--status-warning)",
  URGENT: "var(--status-danger)",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Faible",
  MEDIUM: "Moyen",
  HIGH: "Élevé",
  URGENT: "Urgent",
};

interface Task {
  id: string;
  title: string;
  description: string | null;
  position: number;
  priority: TaskPriority;
  dueDate: string | null;
  labels: string[];
  progressPct: number;
  assignee: { id: string; fullName: string; role: Role } | null;
  commentCount: number;
  attachmentCount: number;
  checklistTotal: number;
  columnId: string; // Ajouté pour faciliter la gestion locale
}

interface Column {
  id: string;
  name: string;
  position: number;
  color: string | null;
  tasks: Task[];
}

interface Board {
  id: string;
  name: string;
  description: string | null;
  columns: Column[];
}

interface UserSummary {
  id: string;
  fullName: string;
  role: Role;
}

function TaskCard({ task, isOverlay = false, canEdit, users, onAssign }: { task: Task, isOverlay?: boolean, canEdit?: boolean, users?: UserSummary[], onAssign?: (taskId: string, userId: string) => void }) {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.title.toLowerCase().includes("terminé");

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-subtle)",
      }}
      {...attributes}
      {...listeners}
      className={`rounded-xl border p-3 cursor-grab active:cursor-grabbing transition-shadow ${isOverlay ? 'shadow-xl rotate-2 ring-2 ring-[var(--agem-gold)]' : 'hover:shadow-md'}`}
    >
      <div className="flex items-start gap-1.5 flex-wrap mb-2">
        <span
          className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-medium"
          style={{
            backgroundColor: `${PRIORITY_COLORS[task.priority]}15`,
            color: PRIORITY_COLORS[task.priority],
          }}
        >
          {PRIORITY_LABELS[task.priority]}
        </span>
        {task.labels.slice(0, 2).map((label) => (
          <span
            key={label}
            className="px-1.5 py-0.5 rounded-md text-xs"
            style={{ backgroundColor: "rgba(201,169,97,0.1)", color: "var(--agem-gold-dark)" }}
          >
            {label}
          </span>
        ))}
      </div>

      <p className="text-sm font-semibold leading-snug mb-3 text-[var(--text-primary)]">
        {task.title}
      </p>

      {task.checklistTotal > 0 && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${task.progressPct}%`,
                backgroundColor: "var(--status-success)",
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          {task.commentCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <MessageSquare className="w-3.5 h-3.5" />
              {task.commentCount}
            </span>
          )}
          {task.attachmentCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <Paperclip className="w-3.5 h-3.5" />
              {task.attachmentCount}
            </span>
          )}
          {task.dueDate && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: isOverdue ? "var(--status-danger)" : "var(--text-muted)" }}
            >
              <Clock className="w-3.5 h-3.5" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        <div className="relative">
          {task.assignee ? (
            <button
              onClick={() => canEdit && setShowAssignDropdown(!showAssignDropdown)}
              disabled={!canEdit}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-inner ${canEdit ? 'cursor-pointer hover:ring-2 hover:ring-[var(--agem-gold)]' : 'cursor-default'}`}
              style={{ backgroundColor: ROLE_COLORS[task.assignee.role] }}
              title={task.assignee.fullName}
            >
              {task.assignee.fullName.charAt(0)}
            </button>
          ) : (
            <button 
              onClick={() => canEdit && setShowAssignDropdown(!showAssignDropdown)}
              disabled={!canEdit}
              className={`w-7 h-7 rounded-full border border-dashed border-[var(--border-strong)] flex items-center justify-center bg-[var(--bg-elevated)] ${canEdit ? 'cursor-pointer hover:border-[var(--agem-gold)] hover:text-[var(--agem-gold)]' : 'cursor-default'}`} 
              title="Assigner"
            >
              <span className="text-xs text-[var(--text-muted)]">+</span>
            </button>
          )}

          {/* Assign Dropdown */}
          {showAssignDropdown && canEdit && users && (
            <div className="absolute right-0 bottom-8 w-48 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
              <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                <span className="text-xs font-bold text-[var(--text-primary)]">Assigner à</span>
              </div>
              <div className="p-1 space-y-1">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setShowAssignDropdown(false);
                      if (onAssign) onAssign(task.id, u.id);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors flex items-center gap-2"
                  >
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ROLE_COLORS[u.role] }} />
                    <span className="truncate">{u.fullName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ column, tasks, canEdit, users, onAssign }: { column: Column, tasks: Task[], canEdit: boolean, users: UserSummary[], onAssign: (taskId: string, userId: string) => void }) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: { type: "Column", column },
  });

  const isDoneColumn = column.name.toLowerCase() === "terminé";

  return (
    <div className="w-80 shrink-0 flex flex-col max-h-full">
      <div
        className="flex items-center justify-between px-4 py-3 rounded-2xl mb-3 border"
        style={{ 
          backgroundColor: isDoneColumn ? "rgba(16, 185, 129, 0.05)" : "var(--bg-elevated)",
          borderColor: isDoneColumn ? "rgba(16, 185, 129, 0.2)" : "var(--border-subtle)"
        }}
      >
        <div className="flex items-center gap-2">
          {column.color && (
            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: column.color }} />
          )}
          <span className="text-sm font-bold text-[var(--text-primary)]">
            {column.name}
          </span>
          {isDoneColumn && (
            <span title="Validation requise par un responsable">
              <ShieldAlert className="w-4 h-4 text-[var(--status-success)] ml-1" />
            </span>
          )}
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-lg"
          style={{ backgroundColor: "var(--bg-card)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}
        >
          {tasks.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto p-1 scrollbar-hide">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[150px]">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} canEdit={canEdit} users={users} onAssign={onAssign} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

interface TasksPageClientProps {
  boards: Board[];
  canCreate: boolean;
  canEdit: boolean;
  projectId: string;
  userId: string;
  users: UserSummary[];
}

export function TasksPageClient({ boards: initialBoards, canCreate, canEdit, users }: TasksPageClientProps) {
  const [activeBoardIdx, setActiveBoardIdx] = useState(0);
  const [boards, setBoards] = useState<Board[]>(() => {
    // Inject columnId into tasks for local state mapping
    return initialBoards.map(b => ({
      ...b,
      columns: b.columns.map(c => ({
        ...c,
        tasks: c.tasks.map(t => ({ ...t, columnId: c.id }))
      }))
    }));
  });
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeBoard = boards[activeBoardIdx];

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = activeBoard?.columns.flatMap(c => c.tasks).find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === "Task";
    const isOverTask = over.data.current?.type === "Task";
    const isOverColumn = over.data.current?.type === "Column";

    if (!isActiveTask) return;

    setBoards((prevBoards) => {
      const newBoards = [...prevBoards];
      const board = { ...newBoards[activeBoardIdx] };
      const columns = [...board.columns];

      let activeColumnIndex = columns.findIndex(c => c.tasks.some(t => t.id === activeId));
      let overColumnIndex = isOverTask 
        ? columns.findIndex(c => c.tasks.some(t => t.id === overId))
        : columns.findIndex(c => c.id === overId);

      if (activeColumnIndex === -1 || overColumnIndex === -1) return prevBoards;

      const activeColumn = { ...columns[activeColumnIndex] };
      const overColumn = { ...columns[overColumnIndex] };

      if (activeColumnIndex !== overColumnIndex) {
        const activeTasks = [...activeColumn.tasks];
        const overTasks = [...overColumn.tasks];
        
        const taskIndex = activeTasks.findIndex(t => t.id === activeId);
        const taskToMove = { ...activeTasks[taskIndex], columnId: overColumn.id };

        activeTasks.splice(taskIndex, 1);
        
        const overIndex = isOverTask 
          ? overTasks.findIndex(t => t.id === overId) 
          : overTasks.length;
          
        overTasks.splice(overIndex >= 0 ? overIndex : overTasks.length, 0, taskToMove);

        columns[activeColumnIndex] = { ...activeColumn, tasks: activeTasks };
        columns[overColumnIndex] = { ...overColumn, tasks: overTasks };
        board.columns = columns;
        newBoards[activeBoardIdx] = board;
        return newBoards;
      }

      return prevBoards;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeColumnIndex = activeBoard.columns.findIndex(c => c.tasks.some(t => t.id === activeId));
    if (activeColumnIndex === -1) return;

    const activeColumn = activeBoard.columns[activeColumnIndex];
    const taskIndex = activeColumn.tasks.findIndex(t => t.id === activeId);
    
    // Si c'est dans la même colonne, réorganiser
    if (activeColumnIndex === activeBoard.columns.findIndex(c => c.tasks.some(t => t.id === overId) || c.id === overId)) {
      const overIndex = activeColumn.tasks.findIndex(t => t.id === overId);
      if (taskIndex !== overIndex && overIndex !== -1) {
        setBoards(prev => {
          const nb = [...prev];
          const b = { ...nb[activeBoardIdx] };
          const cols = [...b.columns];
          cols[activeColumnIndex] = {
            ...cols[activeColumnIndex],
            tasks: arrayMove(cols[activeColumnIndex].tasks, taskIndex, overIndex)
          };
          b.columns = cols;
          nb[activeBoardIdx] = b;
          return nb;
        });

        startTransition(async () => {
          const res = await moveTask(activeId, activeColumn.id, overIndex);
          if (!res.success) {
            toast.error(res.error);
            // Reload page or state to revert
            window.location.reload();
          }
        });
      }
    } else {
      // Le DragOver a déjà géré le déplacement entre colonnes dans l'état local
      // Il faut juste envoyer au backend la nouvelle position
      const newColumn = activeBoard.columns.find(c => c.tasks.some(t => t.id === activeId));
      if (!newColumn) return;
      
      const newIndex = newColumn.tasks.findIndex(t => t.id === activeId);

      startTransition(async () => {
        const res = await moveTask(activeId, newColumn.id, newIndex);
        if (!res.success) {
          toast.error(res.error);
          // Revert local state by reloading page
          window.location.reload();
        } else {
          toast.success("Tâche mise à jour");
        }
      });
    }
  };

  const handleAssign = async (taskId: string, assigneeId: string) => {
    // Optimistic UI update
    setBoards(prev => {
      const nb = [...prev];
      const board = { ...nb[activeBoardIdx] };
      const cols = [...board.columns];
      for (let i = 0; i < cols.length; i++) {
        const tIndex = cols[i].tasks.findIndex(t => t.id === taskId);
        if (tIndex !== -1) {
          const user = users.find(u => u.id === assigneeId);
          if (user) {
            cols[i].tasks[tIndex] = { ...cols[i].tasks[tIndex], assignee: user };
          }
          break;
        }
      }
      board.columns = cols;
      nb[activeBoardIdx] = board;
      return nb;
    });

    const { assignTask } = await import("@/app/(dashboard)/tasks/actions");
    startTransition(async () => {
      const res = await assignTask(taskId, assigneeId);
      if (res.success) {
        toast.success("Tâche assignée avec succès");
      } else {
        toast.error(res.error);
        window.location.reload();
      }
    });
  };

  const handleCreateTask = async (data: { title: string; description: string; assigneeId: string | undefined; priority: TaskPriority; dueDate: string | undefined }) => {
    if (!activeBoard) return;
    
    const { createTask } = await import("@/app/(dashboard)/tasks/actions");
    
    startTransition(async () => {
      const res = await createTask({
        ...data,
        boardId: activeBoard.id,
      });

      if (res.success && res.task) {
        toast.success("Tâche créée avec succès !");
        setIsCreateModalOpen(false);
        // Optimistic UI : ajouter la tâche à la première colonne
        setBoards(prev => {
          const nb = [...prev];
          const board = { ...nb[activeBoardIdx] };
          const cols = [...board.columns];
          if (cols.length > 0) {
            cols[0].tasks.push(res.task as Task);
          }
          board.columns = cols;
          nb[activeBoardIdx] = board;
          return nb;
        });
      } else {
        toast.error(res.error || "Erreur lors de la création.");
      }
    });
  };

  if (boards.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full min-h-[60vh] bg-[var(--bg-canvas)]">
        <div className="w-20 h-20 bg-[var(--bg-elevated)] rounded-full flex items-center justify-center mb-4">
          <CheckSquare className="w-10 h-10 text-[var(--text-muted)]" />
        </div>
        <p className="text-lg font-bold text-[var(--text-primary)]">Aucun Kanban disponible</p>
        <p className="text-sm text-[var(--text-muted)] mt-1">Demandez à un administrateur de créer un tableau.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[var(--bg-canvas)]">
      {/* Header */}
      <div className="px-6 py-5 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] shrink-0 z-10 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--agem-gold)]/10 rounded-lg border border-[var(--agem-gold)]/20">
              <CheckSquare className="w-5 h-5 text-[var(--agem-gold-dark)]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
                Gestion des Tâches
              </h1>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                Vue Kanban
              </p>
            </div>
          </div>
          
          <div className="flex bg-[var(--bg-elevated)] p-1 rounded-xl border border-[var(--border-subtle)] mr-auto ml-4">
            {boards.map((board, idx) => (
              <button
                key={board.id}
                onClick={() => setActiveBoardIdx(idx)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeBoardIdx === idx 
                    ? "bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm border border-[var(--border-subtle)]" 
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
                }`}
              >
                {board.name}
              </button>
            ))}
          </div>

          {canCreate && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--agem-gold)] text-[var(--agem-black)] font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4" /> Nouvelle Tâche
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {activeBoard && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 h-full items-start">
              {activeBoard.columns.map((column) => (
                <KanbanColumn key={column.id} column={column} tasks={column.tasks} canEdit={canEdit} users={users} onAssign={handleAssign} />
              ))}
            </div>

            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.4" } } })
            }}>
              {activeTask && (
                <TaskCard task={activeTask} isOverlay />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <TaskCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTask}
        users={users}
        isPending={isPending}
      />
    </div>
  );
}
