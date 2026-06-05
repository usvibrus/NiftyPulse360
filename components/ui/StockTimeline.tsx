'use client'

interface TimelineEvent {
  eventDate: string
  eventType: string
  changePercent: number
}

interface StockTimelineProps {
  events: TimelineEvent[]
  symbol: string
}

export default function StockTimeline({ events, symbol }: StockTimelineProps) {
  if (events.length === 0) return null

  const maxChange = Math.max(...events.map(e => Math.abs(e.changePercent)), 1)
  const rises = events.filter(e => e.eventType === 'RISE').length
  const total = events.length
  const winRate = total > 0 ? ((rises / total) * 100).toFixed(0) : '0'

  // Calculate streak
  let streak = 0
  const streakType = events[0]?.eventType || 'RISE'
  for (const e of events) {
    if (e.eventType === streakType) streak++
    else break
  }

  return (
    <div className="bg-white border border-[#E0E0E0] rounded p-4 mb-4">
      {/* Stats */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <div className="text-xs text-[#666]">Win Rate</div>
          <div className="font-bold text-[#1A1A1A]">{winRate}% ({rises}/{total} days up)</div>
        </div>
        <div>
          <div className="text-xs text-[#666]">Current Streak</div>
          <div className={`font-bold ${streakType === 'RISE' ? 'text-rise' : 'text-fall'}`}>
            {streak}-day {streakType === 'RISE' ? 'winning' : 'losing'} streak
          </div>
        </div>
        <div>
          <div className="text-xs text-[#666]">Days Tracked</div>
          <div className="font-bold text-[#1A1A1A]">{total}</div>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="text-xs text-[#666] mb-2">Last {Math.min(30, events.length)} trading days for {symbol}</div>
      <div className="flex items-end gap-[2px] h-16">
        {events.slice(0, 30).reverse().map((e, i) => {
          const height = Math.max(8, (Math.abs(e.changePercent) / maxChange) * 100)
          const isUp = e.eventType === 'RISE'
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-sm ${isUp ? 'bg-[#2E7D32]' : 'bg-[#C62828]'}`}
              style={{ height: `${height}%` }}
              title={`${e.eventDate}: ${isUp ? '+' : '-'}${e.changePercent.toFixed(2)}%`}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-[#999] mt-1">
        <span>Older</span>
        <span>Today</span>
      </div>
    </div>
  )
}
