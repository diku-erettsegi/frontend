import { formatMoney } from './api';
import './price-display.css';

export function DiscountBadge({ percent, maximum = false }: { percent: number; maximum?: boolean }) {
  if (percent <= 0) return null;
  return <div className={`offer-percent${maximum ? ' offer-percent-max' : ''}`}>
    {maximum && <span>Akár</span>}<strong>−{percent}%</strong><span className="sr-only"> kedvezmény</span>
  </div>;
}

interface PriceDisplayProps {
  total: number;
  baseTotal?: number | null;
  perLesson?: number | null;
  lessonCount?: number;
  compact?: boolean;
}

// Display supplied amounts only. Saved quotes must never be recalculated from today's prices.
export function PriceDisplay({ total, baseTotal, perLesson, lessonCount, compact = false }: PriceDisplayProps) {
  const discounted = baseTotal != null && baseTotal > total;
  const basePerLesson = baseTotal != null && lessonCount ? baseTotal / lessonCount : null;
  const amount = formatMoney(total).replace(/\sFt$/, '').replace(/\u00a0/g, ' ');
  return <div className={`price-display${compact ? ' price-display--compact' : ''}${discounted ? ' is-discounted' : ''}`}>
    {discounted && <p className="offer-original">Alapdíj: <s>{formatMoney(baseTotal)}</s></p>}
    <p className="offer-price">{amount} <span>Ft</span></p>
    <p className="offer-unit">{lessonCount ? `a teljes, ${lessonCount} tanórás képzés` : 'teljes képzési díj'}</p>
    {discounted && <p className="offer-saving">{formatMoney(baseTotal - total)} megtakarítás</p>}
    {perLesson != null && <p className="offer-hourly">
      {discounted && basePerLesson != null && <><s><span className="sr-only">Alap tanóradíj: </span>{formatMoney(basePerLesson)}</s> helyett </>}
      <strong>{formatMoney(perLesson)} / tanóra</strong><span>Egy tanóra 45 perc.</span>
    </p>}
  </div>;
}
