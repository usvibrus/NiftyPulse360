import { format, subDays } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const IST = 'Asia/Kolkata'

export function nowIST(): Date {
  return toZonedTime(new Date(), IST)
}

export function todayIST(): string {
  return format(nowIST(), 'yyyy-MM-dd')
}

export function formatDateIST(date: Date, fmt: string = 'yyyy-MM-dd'): string {
  return format(toZonedTime(date, IST), fmt)
}

export function yesterdayIST(): Date {
  return subDays(nowIST(), 1)
}

export function startOfDayIST(date: Date): Date {
  const zoned = toZonedTime(date, IST)
  zoned.setHours(0, 0, 0, 0)
  return zoned
}
