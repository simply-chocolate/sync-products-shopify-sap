import { AxiosError } from 'axios'
import { PcnProduct, getPCNProducts } from '../pcn-api-wrapper/GET-products'
import { createPCNProducts } from '../pcn-api-wrapper/POST-product'
import { getProducts } from '../sap-api-wrapper/GET-products'
import { updateMetaFields, updateShopifyInventoryItem } from '../shopify-api-wrapper/UPDATE-metadata'
import { shopifyClient } from '../shopify-api-wrapper/shopifyClient'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage'
import { isSapProductIsMissingInfo } from './handleCheckingItemData'
import { returnType } from './returnTypes'
import { sleep } from './sleep'
import { getAllShopifyProducts } from '../shopify-api-wrapper/BULK-getAllProducts'

export async function mapProducts(): Promise<returnType> {
  let pcnProductsToUpdate: PcnProduct[] = []

  let sapProducts = await getProducts()
  if (typeof sapProducts === 'undefined') {
    return { type: 'error', error: 'sapProducts is undefined' }
  }

  const allShopifyProducts = await getAllShopifyProducts()
  if (typeof allShopifyProducts === 'undefined') {
    return { type: 'error', error: 'allShopifyProducts is undefined' }
  }
  // Goes through the sapProducts to check if it needs to create or update a product
  for (let sapProduct of sapProducts.value) {
    let productBarcode = sapProduct.ItemBarCodeCollection.find((e) => String(e.UoMEntry) === sapProduct.U_CCF_Web_SalesUOM)

    if (productBarcode == null) {
      await sendTeamsMessage('[894u198] Product Missing Barcode', `SAP Product: ${sapProduct.ItemCode}. Check if WebSales UOM is chosen.`)
      continue
    }
    type shopifyProduct = {
      productId: string
      variantId: string
      inventoryItemId: string
    }
    let shopifyProductsArray: shopifyProduct[] = []
    let variantWeight = 0
    let barcodeExistsInShopify = false
    const productIds = Object.keys(allShopifyProducts)

    for (let itemUoM of sapProduct.ItemUnitOfMeasurementCollection) {
      if (itemUoM.UoMType !== 'iutSales') continue
      if (String(itemUoM.UoMEntry) != sapProduct.U_CCF_Web_SalesUOM) continue
      variantWeight = itemUoM.Weight1
      break
    }

    for (const productId of productIds) {
      const product = allShopifyProducts[productId]

      for (const variant of product.variants) {
        barcodeExistsInShopify = variant.sku === productBarcode.Barcode
        if (barcodeExistsInShopify) {
          shopifyProductsArray.push({
            productId: productId,
            variantId: variant.id,
            inventoryItemId: variant.inventoryItem.id,
          })
        }
      }
    }
    if (shopifyProductsArray.length !== 0) {
      for (const shopifyProduct of shopifyProductsArray) {
        const shopifyProductId = shopifyProduct.productId
        const shopifyVariantId = shopifyProduct.variantId
        const shopifyInventoryItemId = shopifyProduct.inventoryItemId

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
          await updateShopifyInventoryItem(shopifyInventoryItemId, sapProduct, shopifyProductId)
          await updateMetaFields(shopifyProductId, sapProduct, false)
        } else {
          continue
        }
        pcnProductsToUpdate.push({
          articleno: productBarcode.Barcode,
          description: sapProduct.ItemName,
          barcode: productBarcode.Barcode,
          barcode2: '',
        })
      }
    } else {
      // If the product doesn't exist in Shopify, it will create it

      const productRes = await shopifyClient.mutation({
        // https://shopify.dev/docs/api/admin-graphql/2023-01/mutations/productCreate
        productCreate: {
          __args: {
            input: {
              title: sapProduct.ItemName,
              status: 'DRAFT',
              variants: [
                {
                  barcode: productBarcode.Barcode,
                  sku: productBarcode.Barcode,
                  weight: variantWeight * 1000,
                  weightUnit: 'GRAMS',
                  requiresShipping: true,
                  harmonizedSystemCode: '1806.90',
                  inventoryItem: {
                    tracked: true,
                    //countryOfOrigin: 'DK',
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
          await updateMetaFields(productRes.productCreate.product.id, sapProduct, true)
        } else {
          continue
        }
        pcnProductsToUpdate.push({
          articleno: productBarcode.Barcode,
          description: sapProduct.ItemName,
          barcode: productBarcode.Barcode,
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
