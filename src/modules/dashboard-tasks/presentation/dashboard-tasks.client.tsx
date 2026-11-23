"use client";

import {
  CalendarOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  formatTaskDate,
  parseDashboardTasks,
  sortDashboardTasks,
  type DashboardTask,
} from "../domain/dashboard-task";
import styles from "./dashboard-tasks.module.css";

// The tasks are explicitly device-local until a per-user server API is available.
const TASKS_STORAGE_KEY = "sael:dashboard:tasks:v1";
const MAX_TASKS = 250;

export function DashboardTasks() {
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [publicationId, setPublicationId] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [view, setView] = useState<"pending" | "all">("pending");
  const [feedback, setFeedback] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      setTasks(parseDashboardTasks(window.localStorage.getItem(TASKS_STORAGE_KEY)));
    } catch {
      setStorageError(true);
    }
    setLoaded(true);

    function onStorage(event: StorageEvent) {
      if (event.key === TASKS_STORAGE_KEY) {
        setTasks(parseDashboardTasks(event.newValue));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded || storageError) return;
    try {
      window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      setStorageError(true);
    }
  }, [tasks, loaded, storageError]);

  const pendingCount = tasks.filter((task) => !task.done).length;
  const completedCount = tasks.length - pendingCount;
  const visibleTasks = sortDashboardTasks(
    view === "pending" ? tasks.filter((task) => !task.done) : tasks,
  );

  function clearForm(): void {
    setTitle("");
    setPublicationId("");
    setNotes("");
    setDueDate("");
    setEditingId(null);
    setShowForm(false);
  }

  function openForm(): void {
    clearForm();
    setShowForm(true);
    setFeedback("");
    window.requestAnimationFrame(() => titleRef.current?.focus());
  }

  function saveTask(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const nextTitle = title.trim();
    if (!nextTitle) return;
    if (!editingId && tasks.length >= MAX_TASKS) {
      setFeedback("Llegaste al máximo de tareas guardadas. Eliminá alguna para continuar.");
      return;
    }

    const now = new Date().toISOString();
    if (editingId) {
      setTasks((current) => current.map((task) =>
        task.id === editingId
          ? {
              ...task,
              title: nextTitle,
              publicationId: publicationId.trim(),
              notes: notes.trim(),
              dueDate: dueDate || null,
              updatedAt: now,
            }
          : task,
      ));
      setFeedback("Tarea actualizada.");
    } else {
      const task: DashboardTask = {
        id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : "task-" + Date.now() + "-" + Math.random().toString(36).slice(2),
        title: nextTitle,
        publicationId: publicationId.trim(),
        notes: notes.trim(),
        dueDate: dueDate || null,
        done: false,
        createdAt: now,
        updatedAt: now,
      };
      setTasks((current) => [task, ...current]);
      setView("pending");
      setFeedback("Tarea agendada.");
    }

    clearForm();
  }

  function editTask(task: DashboardTask): void {
    setEditingId(task.id);
    setTitle(task.title);
    setPublicationId(task.publicationId);
    setNotes(task.notes);
    setDueDate(task.dueDate ?? "");
    setShowForm(true);
    setFeedback("");
    window.requestAnimationFrame(() => titleRef.current?.focus());
  }

  function toggleDone(id: string): void {
    setTasks((current) => current.map((task) => task.id === id
      ? { ...task, done: !task.done, updatedAt: new Date().toISOString() }
      : task,
    ));
    setFeedback("");
  }

  function deleteTask(id: string): void {
    if (!window.confirm("¿Querés eliminar esta tarea de tu agenda?")) return;
    setTasks((current) => current.filter((task) => task.id !== id));
    if (editingId === id) clearForm();
    setFeedback("Tarea eliminada.");
  }

  async function copyPublicationId(value: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback("Número de publicación copiado.");
    } catch {
      setFeedback("No se pudo copiar. Seleccioná el número para copiarlo.");
    }
  }

  return (
    <section className={styles.card} aria-labelledby="dashboard-tasks-title">
      <div className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}>ORGANIZACIÓN DIARIA</span>
          <h2 id="dashboard-tasks-title">Tareas pendientes</h2>
          <p>Anotá lo que falta hacer y a qué publicación corresponde.</p>
        </div>
        <span className={styles.counter} aria-label={pendingCount + " tareas pendientes"}>
          <span className={styles.counterDot} aria-hidden="true" />
          {pendingCount} pendiente{pendingCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters} role="group" aria-label="Filtrar tareas">
          <button
            type="button"
            className={view === "pending" ? styles.filterActive : styles.filter}
            aria-pressed={view === "pending"}
            onClick={() => setView("pending")}
          >
            Pendientes
          </button>
          <button
            type="button"
            className={view === "all" ? styles.filterActive : styles.filter}
            aria-pressed={view === "all"}
            onClick={() => setView("all")}
          >
            Todas {completedCount > 0 ? "(" + tasks.length + ")" : ""}
          </button>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={showForm ? clearForm : openForm}
          aria-expanded={showForm}
        >
          <PlusOutlined aria-hidden="true" /> {showForm ? "Cerrar" : "Nueva tarea"}
        </button>
      </div>

      {showForm ? (
        <form className={styles.form} onSubmit={saveTask} aria-label={editingId ? "Editar tarea" : "Agendar nueva tarea"}>
          <label className={styles.fullField}>
            <span>¿Qué tenés que hacer? *</span>
            <input
              ref={titleRef}
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ej.: agregar la remera nueva a la publicación"
            />
          </label>
          <div className={styles.formRow}>
            <label>
              <span>N.º de publicación o Family ID</span>
              <input
                maxLength={80}
                value={publicationId}
                onChange={(event) => setPublicationId(event.target.value)}
                placeholder="Ej.: MLA123456789 o 8992..."
              />
            </label>
            <label>
              <span>Fecha (opcional)</span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
          </div>
          <label className={styles.fullField}>
            <span>Detalle (opcional)</span>
            <textarea
              maxLength={500}
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej.: agregar color chocolate, talle M y XL"
            />
          </label>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={clearForm}>Cancelar</button>
            <button type="submit" className={styles.saveButton}>
              <CheckCircleOutlined aria-hidden="true" />
              {editingId ? "Guardar cambios" : "Agendar tarea"}
            </button>
          </div>
        </form>
      ) : null}

      {feedback ? <p className={styles.feedback} role="status">{feedback}</p> : null}
      {storageError ? (
        <p className={styles.warning} role="alert">
          No se pudo guardar la agenda en este navegador. Revisá el espacio o los permisos de almacenamiento.
        </p>
      ) : null}

      <div className={styles.taskList} aria-label="Listado de tareas">
        {!loaded ? (
          <p className={styles.loading}>Cargando tareas…</p>
        ) : visibleTasks.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon} aria-hidden="true"><CheckCircleOutlined /></span>
            <strong>{view === "pending" ? "No tenés tareas pendientes" : "Todavía no agendaste tareas"}</strong>
            <span>Agendá, por ejemplo, una remera nueva y el número de la publicación donde la vas a agregar.</span>
          </div>
        ) : visibleTasks.map((task) => (
          <article key={task.id} className={task.done ? styles.taskDone : styles.task}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleDone(task.id)}
                aria-label={(task.done ? "Volver a pendiente: " : "Completar tarea: ") + task.title}
              />
              <span className={styles.customCheckbox} aria-hidden="true">
                {task.done ? <CheckCircleOutlined /> : null}
              </span>
            </label>
            <div className={styles.taskContent}>
              <strong className={styles.taskTitle}>{task.title}</strong>
              <div className={styles.taskMeta}>
                {task.publicationId ? (
                  <div className={styles.publicationGroup}>
                    <span className={styles.publicationNumber} title="Número de publicación o Family ID">
                      {task.publicationId}
                    </span>
                    <button
                      type="button"
                      aria-label={"Copiar número " + task.publicationId}
                      className={styles.copyButton}
                      onClick={() => void copyPublicationId(task.publicationId)}
                      title="Copiar número"
                    >
                      <CopyOutlined />
                    </button>
                  </div>
                ) : null}
                {task.dueDate ? (
                  <span className={styles.dueDate}>
                    <CalendarOutlined aria-hidden="true" /> {formatTaskDate(task.dueDate)}
                  </span>
                ) : null}
              </div>
              {task.notes ? <p className={styles.taskNotes}>{task.notes}</p> : null}
            </div>
            <div className={styles.taskActions}>
              <button
                type="button"
                aria-label={"Editar tarea: " + task.title}
                title="Editar"
                onClick={() => editTask(task)}
              ><EditOutlined /></button>
              <button
                type="button"
                aria-label={"Eliminar tarea: " + task.title}
                title="Eliminar"
                onClick={() => deleteTask(task.id)}
              ><DeleteOutlined /></button>
            </div>
          </article>
        ))}
      </div>
      <p className={styles.privacyNote}>
        Se guardan en este navegador, incluso al actualizar la página. Por ahora no se sincronizan con otros dispositivos.
      </p>
    </section>
  );
}
