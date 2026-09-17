export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const key = process.env.SERPAPI_KEY;
  if (!key) return res.status(500).json({ error: 'SERPAPI_KEY is not set in Vercel Environment Variables.' });

  const q = String(req.query.q || 'clearance').trim();
  const store = String(req.query.store || '').replace(/\D/g, '');
  const min = Number(req.query.min || 0);
  const max = Number(req.query.max || 10000);
  const discount = Math.max(0, Number(req.query.discount || 0));
  const pages = Math.min(5, Math.max(1, Number(req.query.pages || 1)));
  const sort = ['price_low','price_high','best_seller','best_match','rating_high','new'].includes(req.query.sort) ? req.query.sort : 'price_low';
  const walmartOnly = String(req.query.walmartOnly || 'true') !== 'false';

  try {
    const requests = Array.from({ length: pages }, (_, i) => {
      const p = new URLSearchParams({ engine:'walmart', query:q, api_key:key, page:String(i + 1), sort, min_price:String(min), max_price:String(max), walmart_domain:'walmart.com' });
      if (store) p.set('store_id', store);
      return fetch(`https://serpapi.com/search.json?${p}`).then(async r => {
        const data = await r.json();
        if (!r.ok || data.error) throw new Error(data.error || `SerpApi returned ${r.status}`);
        return data;
      });
    });

    const data = await Promise.all(requests);
    const seen = new Set();
    const checkedAt = new Date().toISOString();
    const items = data.flatMap(d => d.organic_results || []).map(x => {
      const offer = x.primary_offer || {};
      const price = Number(offer.offer_price ?? offer.min_price ?? 0);
      const was = Number(offer.was_price ?? 0);
      const savings = was > price && price > 0 ? was - price : 0;
      const pct = was > price && was > 0 ? Math.round((savings / was) * 100) : 0;
      const seller = x.seller_name || x.seller || '';
      const qty = x.quantity;
      return {
        id: String(x.us_item_id || x.product_id || x.position || ''),
        title: x.title || 'Walmart item', image: x.thumbnail || x.image || '',
        price, wasPrice: was || null, savings, discountPct: pct,
        seller, upc: x.upc || '', productId: x.product_id || '',
        url: x.product_page_url || (x.us_item_id ? `https://www.walmart.com/ip/${x.us_item_id}` : 'https://www.walmart.com/'),
        stock: qty === 0 ? 'Out of stock' : Number(qty) > 0 ? `In stock${qty ? ` (${qty})` : ''}` : 'Availability unknown',
        checkedAt
      };
    }).filter(x => x.price >= min && x.price <= max)
      .filter(x => x.discountPct >= discount)
      .filter(x => !walmartOnly || !x.seller || /walmart/i.test(x.seller))
      .filter(x => { const k = x.id || x.url; if (seen.has(k)) return false; seen.add(k); return true; });

    return res.status(200).json({ items, checkedAt, store: store || null, query:q, total:items.length });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Search failed' });
  }
}