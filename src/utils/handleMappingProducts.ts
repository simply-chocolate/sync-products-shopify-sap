import { AxiosError } from 'axios'
import { PcnProduct, getPCNProducts } from '../pcn-api-wrapper/GET-products'
import { createPCNProducts } from '../pcn-api-wrapper/POST-product'
import { getProducts } from '../sap-api-wrapper/GET-products'
import { updateMetaFields } from '../shopify-api-wrapper/UPDATE-metadata'
import { shopifyClient } from '../shopify-api-wrapper/shopifyClient'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage'
import { isSapProductIsMissingInfo } from './handleCheckingItemData'
import { returnType } from './returnTypes'
import { sleep } from './sleep'

export async function mapProducts(): Promise<returnType> {
  let pcnProductsToUpdate: PcnProduct[] = []

  let sapProducts = await getProducts()
  if (typeof sapProducts === 'undefined') {
    return { type: 'error', error: 'sapProducts is undefined' }
  }

  // Define function for a getting a page of shopify Products from Gql
  async function getShopifyProductsPage(curser?: string) {
    // handle throttling errors like https://chat.openai.com/c/c6a3d0be-6663-4b85-825b-c4b17965194f
    return await shopifyClient.query({
      products: {
        __args: { first: 180, after: curser },
        pageInfo: {
          hasNextPage: true,
          endCursor: true,
        },
        nodes: {
          id: true,
          variants: {
            __args: { first: 10, after: curser },
            pageInfo: {
              hasNextPage: true,
              endCursor: true,
            },
            nodes: {
              id: true,
              sku: true,
              barcode: true,
              inventoryItem: {
                id: true,
              },
            },
          },
        },
      },
    })
  }

  // Define the type of "allShopifyProducts" using the return type of the function that returns the single page
  let allShopifyProducts: Awaited<ReturnType<typeof getShopifyProductsPage>>[] = []
  while (true) {
    try {
      allShopifyProducts.push(await getShopifyProductsPage(allShopifyProducts.at(-1)?.products.pageInfo.endCursor))
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.data.errors.message === 'Throttled') {
          await sleep(20000)
          continue
        } else if (error.response != null) {
          await sendTeamsMessage('[1n2j3k1] Error getting shopify products', `**Error**: ${JSON.stringify(error.response.data.errors)}`)
        }
      }
      return { type: 'error', error: '[smdfkls!] Error getting shopify products' }
    }
    if (!allShopifyProducts.at(-1)?.products.pageInfo.hasNextPage) break
    await sleep(20000)
  }

  // Goes through the sapProducts to check if it needs to create or update a product
  for (let sapProduct of sapProducts.value) {
    let productBarcodeCollection = sapProduct.ItemBarCodeCollection.find((e) => String(e.UoMEntry) === sapProduct.U_CCF_Web_SalesUOM)

    if (productBarcodeCollection == null) {
      await sendTeamsMessage('[894u198] Product Missing Barcode Collection', `SAP Product: ${sapProduct.ItemCode}. Check if WebSales UOM is chosen.`)
      continue
    }

    let shopifyProductId = ''
    let shopifyVariantId = ''
    let shopifyInventoryItemId = ''
    let variantWeight = 0
    for (let itemUoM of sapProduct.ItemUnitOfMeasurementCollection) {
      if (itemUoM.UoMType !== 'iutSales') continue
      if (String(itemUoM.UoMEntry) != sapProduct.U_CCF_Web_SalesUOM) continue
      variantWeight = itemUoM.Weight1
      break
    }

    let barcodeExistsInShopify = false
    for (const { products } of allShopifyProducts) {
      if (barcodeExistsInShopify) break

      for (const { variants, id } of products.nodes) {
        if (barcodeExistsInShopify) break

        for (const variant of variants.nodes) {
          barcodeExistsInShopify = variant.barcode === productBarcodeCollection.Barcode
          if (barcodeExistsInShopify) {
            shopifyProductId = id
            shopifyVariantId = variant.id
            shopifyInventoryItemId = variant.inventoryItem.id
          }
        }
      }
    }

    if (barcodeExistsInShopify) {
      const updateShopifyProductRes = await shopifyClient.mutation({
        productVariantUpdate: {
          __args: {
            input: {
              id: shopifyVariantId,
              weight: variantWeight * 1000,
              weightUnit: 'GRAMS',
              requiresShipping: true,
              harmonizedSystemCode: '1806.90',
            },
          },
          userErrors: {
            field: true,
            message: true,
          },
          product: {
            id: true,
            variants: {
              __args: {
                first: 10,
              },
              nodes: {
                id: true,
                barcode: true,
                sku: true,
                weight: true,
              },
            },
          },
        },
      })
      if (updateShopifyProductRes.productVariantUpdate?.userErrors.length !== 0) {
        await sendTeamsMessage(
          '[32n4mkl2] Error updating product',
          `SAP Product: ${sapProduct.ItemCode}.<BR>
          Shopify Product: ${shopifyProductId}.<BR>
          **Error**: ${JSON.stringify(updateShopifyProductRes.productVariantUpdate?.userErrors)}`
        )

        continue
      }
      await sleep(5000) // Sleep for 5 seconds to avoid throttling
      if (!isSapProductIsMissingInfo(sapProduct)) {
        await updateMetaFields(shopifyProductId, sapProduct, shopifyInventoryItemId)
      } else {
        continue
      }
      pcnProductsToUpdate.push({
        articleno: productBarcodeCollection.Barcode,
        description: sapProduct.ItemName,
        barcode: productBarcodeCollection.Barcode,
        barcode2: '',
      })
    } else {
      const productRes = await shopifyClient.mutation({
        // https://shopify.dev/docs/api/admin-graphql/2023-01/mutations/productCreate
        productCreate: {
          __args: {
            input: {
              title: sapProduct.ItemName,
              status: 'DRAFT',
              variants: [
                {
                  barcode: productBarcodeCollection.Barcode,
                  sku: productBarcodeCollection.Barcode,
                  weight: variantWeight * 1000,
                  weightUnit: 'GRAMS',
                  requiresShipping: true,
                  harmonizedSystemCode: '1806.90',
                  inventoryItem: {
                    tracked: true,
                  },
                },
              ],
            },
          },
          userErrors: {
            field: true,
            message: true,
          },
          product: {
            id: true,
            title: true,
          },
        },
      })
      // Other gql mutations needed
      // https://shopify.dev/docs/api/admin-graphql/2023-01/mutations/inventoryItemUpdate

      // Then checks if the product creation was successful. If it was, tries to update metafields
      if (productRes.productCreate?.userErrors.length !== 0) {
        await sendTeamsMessage(
          '[12njkl1] Error creating product',
          `SAP Product: ${sapProduct.ItemCode}.<BR>
          **Error**: ${JSON.stringify(productRes.productCreate?.userErrors)}`
        )
        continue
      } else if (typeof productRes.productCreate.product === 'undefined') break
      else if (typeof productRes.productCreate.product.id === 'undefined') break
      else {
        if (!isSapProductIsMissingInfo(sapProduct)) {
          await updateMetaFields(productRes.productCreate.product.id, sapProduct, shopifyInventoryItemId)
        } else {
          continue
        }
        pcnProductsToUpdate.push({
          articleno: productBarcodeCollection.Barcode,
          description: sapProduct.ItemName,
          barcode: productBarcodeCollection.Barcode,
          barcode2: '',
        })
      }
    }
  }

  if (pcnProductsToUpdate.length !== 0) {
    await createPCNProducts(pcnProductsToUpdate)
  }

  return {
    type: 'success',
    data: 'We did it without errors or something',
  }
}
