import { createClient } from '../__generated__/genql'

export const shopifyClient = createClient({
  url: 'https://simply-chocolate-copenhagen.myshopify.com/admin/api/2023-07/graphql.json',
  headers: {
    'X-Shopify-Access-Token': process.env.SHOPIFY_TOKEN,
  },
})
