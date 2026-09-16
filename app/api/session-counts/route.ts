import { getReservationsDb } from '../../../db/reservations';

function toErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '예상하지 못한 오류가 발생했습니다.';

  if (message.includes('no such table') || message.includes('reservations')) {
    return '예약 테이블을 아직 사용할 수 없습니다. 잠시 후 다시 시도해주세요.';
  }

  return message;
}

export async function GET() {
  try {
    const db = getReservationsDb();
    const { results } = await db
      .prepare(
        `SELECT session, COUNT(*) as count
         FROM reservations
         WHERE status != 'cancelled'
         GROUP BY session`
      )
      .all<{ session: string; count: number }>();

    const counts: Record<string, number> = {};
    for (const row of results ?? []) {
      counts[row.session] = row.count;
    }

    return Response.json({ counts });
  } catch (error) {
    // Public endpoint: degrade to empty counts rather than surfacing DB errors.
    return Response.json({ counts: {}, error: toErrorMessage(error) });
  }
}
