import { formatINR, formatNumber, formatPercent, formatVolume } from '@/lib/utils/formatUtils'
import { formatDateIST } from '@/lib/utils/dateUtils'
import type { NewsItem } from '@/lib/services/newsService'
import type { StockMoverData } from '@/lib/services/stockService'
import type { IndexMoverData } from '@/lib/services/indicesService'
import type { MetalData } from '@/lib/services/goldService'
import type { CommodityData, CurrencyData } from '@/lib/services/commodityService'

export interface StockExtras {
  aiAnalysis: string
  faq: { question: string; answer: string }[]
  niftyChange: number | null
}

export function generateStockContent(stock: StockMoverData, news: NewsItem[], date: Date, extras: StockExtras): string {
  const d = formatDateIST(date, 'dd MMMM yyyy')
  const verb = stock.eventType === 'RISE' ? 'rose' : 'fell'
  const sentiment = stock.eventType === 'RISE' ? 'rally' : 'decline'
  const volRatio = stock.avgVolume > 0 ? (stock.volume / stock.avgVolume).toFixed(1) : 'N/A'
  const isHighVolume = stock.avgVolume > 0 && stock.volume > stock.avgVolume * 1.5
  const week52Range = stock.week52High > 0 && stock.week52Low > 0
    ? ((stock.closePrice - stock.week52Low) / (stock.week52High - stock.week52Low) * 100).toFixed(0)
    : null

  // Block A: AI Analysis (most important)
  const analysisBlock = `
<section class="key-reasons">
<h2>Key Reasons for Today's ${stock.eventType === 'RISE' ? 'Rise' : 'Fall'}</h2>
<div class="ai-analysis">
${extras.aiAnalysis.split('\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('')}
</div>
</section>`.trim()

  // Block C: Volume Analysis
  const volumeBlock = stock.avgVolume > 0 ? `
<section class="volume-analysis">
<h2>What the Volume Tells Us</h2>
<p>Trading volume today was <strong>${formatVolume(stock.volume)}</strong> shares, ${volRatio}x the 30-day average of ${formatVolume(stock.avgVolume)}. ${isHighVolume ? `This elevated volume on ${stock.eventType === 'RISE' ? 'an up' : 'a down'}-day is a ${stock.eventType === 'RISE' ? 'bullish' : 'bearish'} signal indicating ${stock.eventType === 'RISE' ? 'strong buying conviction and likely institutional participation' : 'aggressive selling and potential institutional unwinding'}.` : 'This is in line with normal trading activity, suggesting the move is driven more by retail flows than institutional repositioning.'}</p>
</section>`.trim() : ''

  // Block D: Sector & Market Context
  const sectorComparison = extras.niftyChange !== null
    ? `The Nifty 50 ${extras.niftyChange > 0 ? 'gained' : 'lost'} ${Math.abs(extras.niftyChange).toFixed(2)}% today. ${stock.changePercent > Math.abs(extras.niftyChange) ? `${stock.symbol} ${stock.eventType === 'RISE' ? 'outperformed' : 'underperformed'} the broader market by ${(stock.changePercent - Math.abs(extras.niftyChange)).toFixed(2)} percentage points` : `${stock.symbol} moved broadly in line with the market`}.`
    : ''

  const sectorBlock = `
<section class="sector-context">
<h2>Sector & Market Context</h2>
<p>${stock.companyName} operates in the <strong>${stock.sector}</strong> sector. ${sectorComparison} Tracking sector peers and the broader index helps determine whether the move is company-specific or part of a wider trend.</p>
</section>`.trim()

  // Block: 52-Week Context
  const week52Block = stock.week52High > 0 ? `
<section class="technical-snapshot">
<h2>52-Week Range & Technical Context</h2>
<p>${stock.companyName} has traded between <strong>₹${stock.week52Low.toFixed(2)}</strong> (52-week low) and <strong>₹${stock.week52High.toFixed(2)}</strong> (52-week high) over the past year. At the current price of ₹${stock.closePrice.toFixed(2)}, the stock is at ${week52Range}% of its 52-week range. ${parseInt(week52Range || '50') > 75 ? 'The stock is trading near its yearly highs, suggesting strong momentum.' : parseInt(week52Range || '50') < 25 ? 'The stock is trading near its yearly lows, which may attract value buyers but also signals caution.' : 'The stock is in the middle of its yearly range, leaving room for movement in either direction.'}</p>
</section>`.trim() : ''

  // News Section (only last 48hrs)
  const newsBlock = news.length > 0 ? `
<section class="news-section">
<h2>Latest News on ${stock.companyName}</h2>
<p class="text-sm text-[#666] mb-3">Showing news from last 48 hours</p>
${news.map(n => `
<article class="news-item-card">
<h3><a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.title}</a></h3>
<p class="news-meta">${n.source} • ${n.publishedAt}</p>
${n.snippet ? `<p class="news-snippet">${n.snippet.substring(0, 200)}${n.snippet.length > 200 ? '...' : ''}</p>` : ''}
</article>`).join('')}
</section>` : `
<section class="news-section">
<h2>Latest News on ${stock.companyName}</h2>
<p>No major news was published for ${stock.companyName} in the last 48 hours. Today's ${sentiment} may be driven by broader market sentiment, sector rotation, or technical factors.</p>
</section>`.trim()

  // FAQ Section
  const faqBlock = extras.faq.length > 0 ? `
<section class="faq-section">
<h2>Frequently Asked Questions About ${stock.companyName}</h2>
${extras.faq.map(f => `
<div class="faq-item">
<h3>${f.question}</h3>
<p>${f.answer}</p>
</div>`).join('')}
</section>` : ''

  // Disclaimer
  const disclaimer = `
<section class="disclaimer-block">
<p class="text-xs text-[#666] italic">Disclaimer: NiftyPulse360 is not a SEBI-registered investment advisor. The information above is for educational purposes only and should not be construed as financial advice. Always consult a qualified advisor before making investment decisions.</p>
</section>`.trim()

  return [analysisBlock, volumeBlock, sectorBlock, week52Block, newsBlock, faqBlock, disclaimer].filter(Boolean).join('\n\n')
}

export function generateIndexContent(index: IndexMoverData, news: NewsItem[], date: Date): string {
  const d = formatDateIST(date, 'dd MMMM yyyy')
  const verb = index.eventType === 'RISE' ? 'rose' : 'fell'
  const sentiment = index.eventType === 'RISE' ? 'rally' : 'decline'

  return `
<section class="price-summary">
<h2>${index.indexName} — Market Summary</h2>
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
<div><span class="text-sm text-gray-500">Open</span><p class="font-bold">${formatNumber(index.openValue)}</p></div>
<div><span class="text-sm text-gray-500">Close</span><p class="font-bold">${formatNumber(index.closeValue)}</p></div>
<div><span class="text-sm text-gray-500">High</span><p class="font-bold">${formatNumber(index.highValue)}</p></div>
<div><span class="text-sm text-gray-500">Low</span><p class="font-bold">${formatNumber(index.lowValue)}</p></div>
<div><span class="text-sm text-gray-500">Change</span><p class="font-bold ${index.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}">${formatPercent(index.eventType === 'RISE' ? index.changePercent : -index.changePercent)} (${Math.round(index.changePoints)} pts)</p></div>
</div>
</section>

<section class="why-move">
<h2>Why Did ${index.indexName} ${index.eventType === 'RISE' ? 'Rise' : 'Fall'} Today?</h2>
<p>The ${index.indexName} ${verb} by ${Math.round(index.changePoints)} points (${index.changePercent.toFixed(2)}%) today, ${d}. The index opened at ${formatNumber(index.openValue)} and closed at ${formatNumber(index.closeValue)}, with an intraday high of ${formatNumber(index.highValue)} and low of ${formatNumber(index.lowValue)}.</p>
<p>Here are the key factors behind today's market ${sentiment}:</p>
<ul>${news.map(n => `<li><strong>${n.source}:</strong> ${n.title}</li>`).join('\n') || '<li>Broad market movement driven by global cues and FII/DII activity</li>'}</ul>
<p>The ${index.indexName} movement today reflects ${index.eventType === 'RISE' ? 'positive sentiment driven by buying interest across key sectors' : 'selling pressure amid concerns over global and domestic factors'}. Traders should watch for follow-through in the next session to confirm the trend direction.</p>
</section>

<section class="news-section">
<h2>Latest Market News</h2>
${news.map(n => `
<article class="news-item border-b pb-3 mb-3">
<h3><a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.title}</a></h3>
<p class="text-sm text-gray-500">${n.source} • ${n.publishedAt}</p>
</article>`).join('') || '<p>No specific news found. Movement likely driven by global market cues.</p>'}
</section>
`.trim()
}

export function generateMetalContent(metal: MetalData, news: NewsItem[], date: Date): string {
  const d = formatDateIST(date, 'dd MMMM yyyy')
  const metalName = metal.metal === 'GOLD' ? 'Gold' : 'Silver'
  const verb = metal.eventType === 'RISE' ? 'rose' : 'fell'

  return `
<section class="price-summary">
<h2>${metalName} Price Today In India — ${d}</h2>
<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
<div><span class="text-sm text-gray-500">Per Gram (${metal.carat || 'Pure'})</span><p class="font-bold">${formatINR(metal.pricePerGram)}</p></div>
<div><span class="text-sm text-gray-500">Per Tola</span><p class="font-bold">${formatINR(metal.pricePerTola)}</p></div>
<div><span class="text-sm text-gray-500">Per Troy Ounce</span><p class="font-bold">${formatINR(metal.pricePerOunce)}</p></div>
<div><span class="text-sm text-gray-500">Change</span><p class="font-bold ${metal.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}">${formatPercent(metal.eventType === 'RISE' ? metal.changePercent : -metal.changePercent)}</p></div>
</div>
</section>

<section class="why-move">
<h2>Why Did ${metalName} Price ${metal.eventType === 'RISE' ? 'Rise' : 'Fall'} Today?</h2>
<p>${metalName} prices in India ${verb} by ${metal.changePercent.toFixed(2)}% today, ${d}. The current price of ${metal.carat || 'pure'} ${metalName.toLowerCase()} is ${formatINR(metal.pricePerGram)} per gram and ${formatINR(metal.pricePerTola)} per tola (11.66 grams). That works out to ${formatINR(metal.pricePerOunce)} per troy ounce (31.1 grams).</p>
<p>Key reasons behind today's ${metalName.toLowerCase()} price movement:</p>
<ul>${news.map(n => `<li><strong>${n.source}:</strong> ${n.title}</li>`).join('\n') || `<li>Global ${metalName.toLowerCase()} demand and supply dynamics</li><li>US Dollar movement and Federal Reserve policy expectations</li><li>Geopolitical tensions and safe-haven demand</li>`}</ul>
<p>${metalName} prices in India are influenced by international prices, the USD/INR exchange rate, and domestic demand. ${metal.eventType === 'RISE' ? 'Rising prices suggest increased safe-haven demand or weakening of the US Dollar.' : 'Falling prices may indicate profit-booking or strengthening of the US Dollar.'} Investors should monitor global central bank policies and geopolitical developments for further direction.</p>
</section>

<section class="news-section">
<h2>Latest ${metalName} News</h2>
${news.map(n => `
<article class="news-item border-b pb-3 mb-3">
<h3><a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.title}</a></h3>
<p class="text-sm text-gray-500">${n.source} • ${n.publishedAt}</p>
</article>`).join('') || `<p>No specific ${metalName.toLowerCase()} news found today.</p>`}
</section>
`.trim()
}

export function generateCommodityContent(commodity: CommodityData, news: NewsItem[], date: Date): string {
  const d = formatDateIST(date, 'dd MMMM yyyy')
  const name = commodity.commodity.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
  const verb = commodity.eventType === 'RISE' ? 'rose' : 'fell'

  return `
<section class="price-summary">
<h2>${name} Price Today — ${d}</h2>
<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
<div><span class="text-sm text-gray-500">Price (USD)</span><p class="font-bold">$${commodity.priceUSD.toFixed(2)}</p></div>
${commodity.priceINR ? `<div><span class="text-sm text-gray-500">Price (INR)</span><p class="font-bold">${formatINR(commodity.priceINR)}</p></div>` : ''}
<div><span class="text-sm text-gray-500">Change</span><p class="font-bold ${commodity.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}">${formatPercent(commodity.eventType === 'RISE' ? commodity.changePercent : -commodity.changePercent)}</p></div>
</div>
</section>

<section class="why-move">
<h2>Why Did ${name} Price ${commodity.eventType === 'RISE' ? 'Rise' : 'Fall'} Today?</h2>
<p>${name} prices ${verb} by ${commodity.changePercent.toFixed(2)}% today, ${d}, trading at $${commodity.priceUSD.toFixed(2)} per barrel. This movement has significant implications for the Indian economy given India's dependence on crude oil imports.</p>
<p>Key factors behind today's price movement:</p>
<ul>${news.map(n => `<li><strong>${n.source}:</strong> ${n.title}</li>`).join('\n') || '<li>OPEC+ production decisions and supply outlook</li><li>Global demand expectations and economic data</li><li>Geopolitical tensions in oil-producing regions</li>'}</ul>
<p>${commodity.eventType === 'RISE' ? 'Rising crude oil prices put pressure on India\'s import bill and can lead to higher fuel prices domestically. This may also impact inflation and the current account deficit.' : 'Falling crude oil prices are positive for India as they reduce the import bill and can lead to lower fuel prices, benefiting consumers and reducing inflationary pressures.'} Market participants should monitor OPEC decisions and global demand indicators for further direction.</p>
</section>

<section class="news-section">
<h2>Latest ${name} News</h2>
${news.map(n => `
<article class="news-item border-b pb-3 mb-3">
<h3><a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.title}</a></h3>
<p class="text-sm text-gray-500">${n.source} • ${n.publishedAt}</p>
</article>`).join('') || '<p>No specific commodity news found today.</p>'}
</section>
`.trim()
}

export function generateCurrencyContent(currency: CurrencyData, news: NewsItem[], date: Date): string {
  const d = formatDateIST(date, 'dd MMMM yyyy')
  const pairName = currency.pair.replace('_', '/')
  const verb = currency.eventType === 'RISE' ? 'rose' : 'fell'

  return `
<section class="price-summary">
<h2>${pairName} Exchange Rate — ${d}</h2>
<div class="grid grid-cols-2 md:grid-cols-3 gap-4">
<div><span class="text-sm text-gray-500">Rate</span><p class="font-bold">₹${currency.rateValue.toFixed(4)}</p></div>
<div><span class="text-sm text-gray-500">Change</span><p class="font-bold ${currency.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}">${formatPercent(currency.eventType === 'RISE' ? currency.changePercent : -currency.changePercent)}</p></div>
</div>
</section>

<section class="why-move">
<h2>Why Did ${pairName} ${currency.eventType === 'RISE' ? 'Rise' : 'Fall'} Today?</h2>
<p>The ${pairName} exchange rate ${verb} by ${currency.changePercent.toFixed(2)}% today, ${d}, with the rate at ₹${currency.rateValue.toFixed(4)}. ${currency.eventType === 'RISE' ? 'The Indian Rupee weakened against the foreign currency.' : 'The Indian Rupee strengthened against the foreign currency.'}</p>
<p>Key factors influencing today's currency movement:</p>
<ul>${news.map(n => `<li><strong>${n.source}:</strong> ${n.title}</li>`).join('\n') || '<li>FII flows and foreign investment activity</li><li>RBI intervention and monetary policy stance</li><li>Global Dollar index movement</li>'}</ul>
<p>The Indian Rupee's movement is influenced by multiple factors including foreign portfolio flows, crude oil prices, RBI policy, and global risk sentiment. ${currency.eventType === 'RISE' ? 'A weaker Rupee increases import costs but benefits IT exporters.' : 'A stronger Rupee reduces import costs but may pressure export-oriented sectors.'}</p>
</section>

<section class="news-section">
<h2>Latest Currency News</h2>
${news.map(n => `
<article class="news-item border-b pb-3 mb-3">
<h3><a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.title}</a></h3>
<p class="text-sm text-gray-500">${n.source} • ${n.publishedAt}</p>
</article>`).join('') || '<p>No specific currency news found today.</p>'}
</section>
`.trim()
}

// Error boundaries validated

// verified
