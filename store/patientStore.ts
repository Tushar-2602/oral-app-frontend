import { create } from 'zustand';

export type Patient = {
  patientId: string;
  name: string;
  age: string;
  gender: string;
  hospital: string;
  qrData: string;
  description: string
};

type PatientStore = {
  patient: Patient;
  setPatient: (data: Partial<Patient>) => void;
  clearPatient: () => void;
};

const initialPatient: Patient = {
  patientId: '',
  name: '',
  age: '',
  gender: '',
  hospital: '',
  qrData: '',
  description: ''
};

export const usePatientStore = create<PatientStore>((set) => ({
  patient: initialPatient,
  setPatient: (data) =>
    set((state) => ({ patient: { ...state.patient, ...data } })),
  clearPatient: () => set({ patient: initialPatient }),
}));