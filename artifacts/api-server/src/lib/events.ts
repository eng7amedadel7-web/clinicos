import { EventEmitter } from "events";

export type ClinicEventType =
  // Inbox
  | "inbox.message_received"
  | "inbox.message_sent"
  | "inbox.handoff_requested"
  | "inbox.mode_changed"
  | "inbox.note_added"
  | "inbox.snoozed"
  | "inbox.unsnoozed"
  | "inbox.outcome_set"
  // Appointments & Calendar
  | "appointment.booked"
  | "appointment.updated"
  | "appointment.cancelled"
  | "appointment.checked_in"
  | "appointment.called"
  | "appointment.completed"
  // Patients
  | "patient.created"
  | "patient.updated"
  | "patient.deleted"
  // Operations & Recovery
  | "operations.waitlist_updated"
  | "operations.followup_updated"
  | "operations.noshow_updated"
  // Queue
  | "queue.ticket_created"
  | "queue.link_issued"
  | "queue.ticket_updated"
  // Voice Agent
  | "voice.call_started"
  | "voice.call_completed"
  | "voice.knowledge_updated"
  // Settings & Templates
  | "settings.updated"
  | "template.created"
  | "template.updated"
  | "template.deleted"
  // System / Generic Invalidation
  | "system.invalidate";

export type ClinicEventPayload = {
  type: ClinicEventType;
  clinicId: string;
  data: Record<string, unknown>;
  at: string;
};

class ClinicEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(500);
  }

  emitClinicEvent(clinicId: string, type: ClinicEventType, data: Record<string, unknown> = {}) {
    if (!clinicId) return;
    const payload: ClinicEventPayload = {
      type,
      clinicId,
      data,
      at: new Date().toISOString(),
    };
    this.emit(`clinic:${clinicId}`, payload);
    this.emit("any", payload);
  }

  subscribeClinic(clinicId: string, handler: (event: ClinicEventPayload) => void) {
    const channel = `clinic:${clinicId}`;
    this.on(channel, handler);
    return () => {
      this.off(channel, handler);
    };
  }
}

export const clinicEvents = new ClinicEventBus();

