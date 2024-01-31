import axios from 'axios'
import { sleep } from '../utils/sleep'
import { shopifyClient } from './shopifyClient'
import JSONL from 'jsonl-parse-stringify'

export type Products = {
  [key: string]: Product
}
type Product = {
  id: string
  title: string
  variants: Variant[]
  tags: string
}
type Variant = {
  id: string
  sku: string
  barcode: string
  inventoryItem: {
    id: string
  }
  __parentId: string
}

export async function getAllShopifyProducts(): Promise<Products | undefined> {
  // Create the bulk operation for getting all products and get the ID
  let bulkOperation = await shopifyClient.mutation({
    bulkOperationRunQuery: {
      __args: {
        query: `query {
          products {
            edges {
              cursor
              node {
                id
                title
                tags
                variants {
                  edges {
                    cursor
                    node {
                      id
                      sku
                      barcode
                      inventoryItem {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }`,
      },
      bulkOperation: {
        id: true,
      },
      userErrors: {
        field: true,
        message: true,
      },
    },
  })
  if (bulkOperation.bulkOperationRunQuery == undefined) {
    console.log('Error creating bulk operation: bulkOperation.bulkOperationRunQuery is undefined')
    return
  }
  if (bulkOperation.bulkOperationRunQuery.userErrors.length !== 0) {
    let errorMsgs = ''
    for (const errorMsg of bulkOperation.bulkOperationRunQuery.userErrors) {
      errorMsgs += errorMsg.message + '\n'
    }
    console.log('Error creating bulk operation: ' + errorMsgs)
    return
  }
  if (bulkOperation.bulkOperationRunQuery.bulkOperation?.id === undefined) {
    console.log('Error creating bulk operation: bulkOperation.id is undefined')
    return
  }

  let bulkOperationId = bulkOperation.bulkOperationRunQuery.bulkOperation.id
  let bulkOperationStatus
  while (true) {
    await sleep(10 * 1000)
    bulkOperationStatus = await shopifyClient.query({
      currentBulkOperation: {
        id: true,
        status: true,
        errorCode: true,
        createdAt: true,
        completedAt: true,
        objectCount: true,
        fileSize: true,
        url: true,
      },
    })
    if (bulkOperationStatus.currentBulkOperation?.id === undefined) {
      console.log('Error getting bulk operation status: bulkOperationStatus.currentBulkOperation.id is undefined')
      return
    }
    if (bulkOperationStatus.currentBulkOperation.id == bulkOperationId) {
      if (bulkOperationStatus.currentBulkOperation.status === 'COMPLETED') {
        break
      } else if (bulkOperationStatus.currentBulkOperation.status === 'FAILED') {
        console.log('Error getting bulk operation status: ' + bulkOperationStatus.currentBulkOperation.errorCode)
        return
      }
    }
  }

  // Use the URL to HTTP GET the file
  const response = await axios.get(bulkOperationStatus.currentBulkOperation.url)

  function isVariant(v: unknown): v is Variant {
    return typeof v === 'object' && v != null && 'id' in v && typeof v.id === 'string' && /^gid:\/\/shopify\/ProductVariant\/\d+$/i.test(v.id)
  }

  const parasedData: (Omit<Product, 'variants'> | Variant)[] = JSONL.parse(response.data)

  const products: Products = {}
  for (const e of parasedData) {
    if (!isVariant(e)) {
      products[e.id] = { ...e, variants: [] }
    }
  }
  for (const e of parasedData) {
    try {
      if (isVariant(e)) {
        products[e.__parentId].variants.push(e)
      }
    } catch (error) {
      console.log('Error parsing bulk operation data: ' + error)
      return
    }
  }

  return products
}
