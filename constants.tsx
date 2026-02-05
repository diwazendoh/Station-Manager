
import React from 'react';
import { RoomData } from './types';

export const STORAGE_KEY = 'Z_STATION_MANAGER_DATA_V4';

export const getInitialRoomData = (): Omit<RoomData, 'id' | 'roomNumber' | 'lastUpdated'> => ({
  status: 'active',
  diagnosis: '',
  doctors: '',
  ivFluid: '',
  ivFluidOther: '',
  regulation: '',
  sideDrips: '',
  contraptions: [],
  contraptionsOther: '',
  precautions: [],
  otherPrecaution: '',
  monitoring: 'None' as const,
  ioRequired: false,
  tasks: [],
});

export const COMMON_PRECAUTIONS = [
  "NPO",
  "Strict Bed Rest",
  "Droplet Precaution",
  "Contact Precaution",
  "Airborne Precaution",
  "Left Arm Precaution",
  "Right Arm Precaution"
];

export const CONTRAPTION_OPTIONS = [
  "JP Drain",
  "IFC",
  "NGT",
  "Chest Tube",
  "Hemovac"
];

export const FLUID_OPTIONS = [
  "PNSS 1L",
  "D5LRS 1L",
  "D5NRSS 1L",
  "D50.3 NaCl 1L",
  "PLR 1L",
  "Other"
];

export const COLORS = {
  primary: 'green-700',
  secondary: 'green-50',
  accent: 'green-400',
  danger: 'rose-500',
  success: 'green-600',
  text: 'slate-900'
};
