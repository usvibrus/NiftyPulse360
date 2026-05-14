import { formatINR, formatNumber, formatPercent, formatVolume } from '@/lib/utils/formatUtils'
import { formatDateIST } from '@/lib/utils/dateUtils'
import type { NewsItem } from '@/lib/services/newsService'
import type { StockMoverData } from '@/lib/services/stockService'
import type { IndexMoverData } from '@/lib/services/indicesService'
import type { MetalData } from '@/lib/services/goldService'
import type { CommodityData, CurrencyData } from '@/lib/services/commodityService'

export function generateStockContent(stock: StockMoverData, news: NewsItem[], date: Date): string {
  const d = formatDateIST(date, 'dd MMMM yyyy')
  const verb = stock.eventType === 'RISE' ? 'rose' : 'fell'
  const sentiment = stock.eventType === 'RISE' ? 'rally' : 'decline'

  const reasons = news.length > 0
    ? news.map(n => `<li><strong>${n.source}:</strong> ${n.title}</li>`).join('\n')
    : `<li>Market-wide ${sentiment} driven by sector momentum</li><li>Institutional activity and volume surge observed</li><li>Technical breakout/breakdown on daily charts</li>`

  return `
<section class="price-summary">
<h2>${stock.companyName} (${stock.symbol}) — Price Summary</h2>
<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
<div><span class="text-sm text-gray-500">Open</span><p class="font-bold">${formatINR(stock.openPrice)}</p></div>
<div><span class="text-sm text-gray-500">Close</span><p class="font-bold">${formatINR(stock.closePrice)}</p></div>
<div><span class="text-sm text-gray-500">High</span><p class="font-bold">${formatINR(stock.highPrice)}</p></div>
<div><span class="text-sm text-gray-500">Low</span><p class="font-bold">${formatINR(stock.lowPrice)}</p></div>
<div><span class="text-sm text-gray-500">Change</span><p class="font-bold ${stock.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}">${formatPercent(stock.eventType === 'RISE' ? stock.changePercent : -stock.changePercent)}</p></div>
<div><span class="text-sm text-gray-500">Volume</span><p class="font-bold">${formatVolume(stock.volume)}</p></div>
<div><span class="text-sm text-gray-500">Exchange</span><p class="font-bold">${stock.exchange}</p></div>
<div><span class="text-sm text-gray-500">Sector</span><p class="font-bold">${stock.sector}</p></div>
</div>
</section>

<section class="why-move">
<h2>Why Did ${stock.companyName} Share Price ${stock.eventType === 'RISE' ? 'Rise' : 'Fall'} Today?</h2>
<p>${stock.companyName} (${stock.symbol}) shares ${verb} sharply by ${stock.changePercent.toFixed(2)}% on the ${stock.exchange} today, ${d}. The stock opened at ${formatINR(stock.openPrice)} and closed at ${formatINR(stock.closePrice)}, hitting a high of ${formatINR(stock.highPrice)} and a low of ${formatINR(stock.lowPrice)} during the trading session.</p>
<p>The total traded volume was ${formatVolume(stock.volume)} shares, indicating ${stock.volume > 1000000 ? 'strong' : 'moderate'} market participation. Here are the key reasons behind today's ${sentiment}:</p>
<ul>${reasons}</ul>
<p>Investors and traders should note that ${stock.companyName} operates in the ${stock.sector} sector. The ${stock.changePercent.toFixed(1)}% ${verb === 'rose' ? 'gain' : 'loss'} today ${stock.changePercent > 5 ? 'is a significant move that suggests strong momentum' : 'reflects ongoing market dynamics in this sector'}. Market participants are advised to track upcoming quarterly results and sector-specific developments for further price direction.</p>
<p>This sharp ${sentiment} in ${stock.symbol} shares has attracted attention from both retail and institutional investors. The price action suggests that the stock may continue to see elevated volatility in the near term as the market digests these developments.</p>
</section>

<section class="news-section">
<h2>Latest News About ${stock.companyName}</h2>
${news.length > 0 ? news.map(n => `
<article class="news-item border-b pb-3 mb-3">
<h3><a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.title}</a></h3>
<p class="text-sm text-gray-500">${n.source} • ${n.publishedAt}</p>
${n.snippet ? `<p class="text-gray-700">${n.snippet}</p>` : ''}
</article>`).join('') : '<p>No specific news articles found for this stock today. The movement may be driven by broader market trends or sector rotation.</p>'}
</section>
`.trim()
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
<p>Foreign Institutional Investors (FIIs) and Domestic Institutional Investors (DIIs) activity will be key to watch for understanding whether this ${sentiment} has legs or is a one-day event.</p>
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
<div><span class="text-sm text-gray-500">Per Ounce (USD)</span><p class="font-bold">$${metal.pricePerOunce.toFixed(2)}</p></div>
<div><span class="text-sm text-gray-500">Change</span><p class="font-bold ${metal.eventType === 'RISE' ? 'text-green-600' : 'text-red-600'}">${formatPercent(metal.eventType === 'RISE' ? metal.changePercent : -metal.changePercent)}</p></div>
</div>
</section>

<section class="why-move">
<h2>Why Did ${metalName} Price ${metal.eventType === 'RISE' ? 'Rise' : 'Fall'} Today?</h2>
<p>${metalName} prices in India ${verb} by ${metal.changePercent.toFixed(2)}% today, ${d}. The current price of ${metal.carat || 'pure'} ${metalName.toLowerCase()} is ${formatINR(metal.pricePerGram)} per gram and ${formatINR(metal.pricePerTola)} per tola (11.66 grams). In international markets, ${metalName.toLowerCase()} is trading at $${metal.pricePerOunce.toFixed(2)} per troy ounce.</p>
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
