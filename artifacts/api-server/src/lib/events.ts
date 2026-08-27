import { EventEmitter } from "events";

export type ClinicEventType =
  | "inbox.message_received"
  | "inbox.message_sent"
  | "inbox.handoff_requested"
  | "inbox.mode_changed"
  | "queue.ticket_created"
  | "appointment.booked";

export type ClinicEventPayload = {
  type: ClinicEventType;
  clinicId: string;
  data: Record<string, unknown>;
  at: string;
};

class ClinicEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(200);
  }

  emitClinicEvent(clinicId: string, type: ClinicEventType, data: Record<string, unknown> = {}) {
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
