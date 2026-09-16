import { env } from 'cloudflare:workers';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

export type Reservation = {
  id: number;
  name: string;
  phone: string;
  instagram: string;
  gender: string;
  session: string;
  level: string;
  party: string;
  companion_name: string;
  pass_type: string;
  status: ReservationStatus;
  source: string;
  created_at: string;
};

type RuntimeEnv = {
  DB?: D1Database;
};

export function getReservationsDb() {
  const db = (env as RuntimeEnv).DB;

  if (!db) {
    throw new Error('예약 데이터베이스 연결을 사용할 수 없습니다.');
  }

  return db;
}

export function normalizeStatus(status: unknown): ReservationStatus | null {
  if (status === 'pending' || status === 'confirmed' || status === 'cancelled') {
    return status;
  }

  return null;
}
