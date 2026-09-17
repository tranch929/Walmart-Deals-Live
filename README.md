# Walmart Deal Finder Live

A simple Walmart deal-search tool deployed on Vercel.

## Features
- Search by item/department keyword
- Choose common local Walmart store numbers or enter another store
- Minimum and maximum price
- Minimum discount percentage
- Up to 5 result pages
- Walmart-seller-only filter
- Stock/availability labels when the source provides them
- Checked timestamp
- Direct **Verify at Walmart** link
- Mobile-friendly layout

## Required Vercel environment variable
Create an environment variable named exactly:

`SERPAPI_KEY`

Put your SerpApi API key in the value. Enable it for Production, Preview, and Development if desired, then redeploy.

Do not place the API key in index.html or commit it to GitHub.

## Important
Walmart prices and inventory change frequently. Store-specific availability may be unknown when the search source does not return it. Always verify the item on Walmart before traveling to a store.