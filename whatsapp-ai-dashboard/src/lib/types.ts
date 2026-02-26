export type LeadStatus = "Hot" | "Warm" | "Cold";

export interface Conversation {
  id: number;
  customerName: string;
  initials: string;
  lastMessage: string;
  platform: string;
  leadStatus: LeadStatus;
  time: string;
  phone: string;
}

export interface HotLead {
  id: number;
  name: string;
  initials: string;
  budget: string;
  service: string;
  lastMessage: string;
  contacted: boolean;
  time: string;
}
