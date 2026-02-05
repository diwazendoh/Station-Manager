
export interface Task {
  id: string;
  description: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

export type MonitoringInterval = 'Q1' | 'Q2' | 'None';

export interface RoomData {
  id: string;
  roomNumber: string;
  status: 'active' | 'inactive';
  diagnosis: string;
  doctors: string;
  ivFluid: string;
  ivFluidOther: string;
  regulation: string;
  sideDrips: string;
  contraptions: string[];
  contraptionsOther: string;
  precautions: string[];
  otherPrecaution: string;
  monitoring: MonitoringInterval;
  ioRequired: boolean;
  tasks: Task[];
  lastUpdated: string;
}

export type ViewState = 'dashboard' | 'directory' | 'room-detail';

export interface AppState {
  rooms: RoomData[];
  selectedRoomId: string | null;
  currentView: ViewState;
}
