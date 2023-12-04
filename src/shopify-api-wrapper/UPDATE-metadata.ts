import { Axios, AxiosError } from 'axios'
import { SapItemData } from '../sap-api-wrapper/GET-products'
import { updateProductSap } from '../sap-api-wrapper/UPDATE-product'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage'
import { productTypesObject } from '../utils/productTypeObject'
import { shopifyClient } from './shopifyClient'
import { GenqlError } from '../__generated__/genql'

export async function updateMetaFields(productId: string, sapProduct: SapItemData, shopifyInventoryItemId: string, productType?: string): Promise<void> {
  // https://shopify.dev/docs/api/admin-graphql/2023-01/mutations/metafieldsSet
  const metafieldsArray = [
    {
      ownerId: productId,
      key: 'list_of_ingredients',
      value: sapProduct.U_BOYX_varedel,
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'nut_energy_kj',
      type: 'number_decimal',
      value: String(sapProduct.U_BOYX_Energi).replace(',', '.'),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'nut_energy_kcal',
      type: 'number_decimal',
      value: String(sapProduct.U_BOYX_Energik).replace(',', '.'),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'nut_fat',
      type: 'number_decimal',
      value: String(sapProduct.U_BOYX_fedt).replace(',', '.'),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'nut_fatty_acids',
      type: 'number_decimal',
      value: String(sapProduct.U_BOYX_fedtsyre).replace(',', '.'),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'nut_carbohydrates',
      type: 'number_decimal',
      value: String(sapProduct.U_BOYX_Kulhydrat).replace(',', '.'),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'nut_sugar',
      type: 'number_decimal',
      value: String(sapProduct.U_BOYX_sukkerarter).replace(',', '.'),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'nut_protein',
      type: 'number_decimal',
      value: String(sapProduct.U_BOYX_Protein).replace(',', '.'),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'nut_salt',
      type: 'number_decimal',
      value: String(sapProduct.U_BOYX_salt).replace(',', '.'),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'vegan',
      value: String(sapProduct.U_BOXY_Vegan == null),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'vegetarian',
      value: String(sapProduct.U_BOXY_Vegetar == null),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'gluten_free',
      value: String(sapProduct.U_BOYX_Gluten1 == null),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'lactose_free',
      value: String(sapProduct.U_BOYX_Lactose == null),
      namespace: 'custom',
    },
    {
      ownerId: productId,
      key: 'product_type',
      value: productTypesObject[String(sapProduct.ItemsGroupCode)],
      namespace: 'custom',
    },
  ]

  try {
    const metaFieldsRes = await shopifyClient.mutation({
      metafieldsSet: {
        __args: {
          metafields: metafieldsArray,
        },
        userErrors: {
          field: true,
          message: true,
        },
        metafields: {
          description: true,
          value: true,
          key: true,
          updatedAt: true,
        },
      },
      inventoryItemUpdate: {
        __args: {
          id: shopifyInventoryItemId,
          input: {
            countryCodeOfOrigin: 'DK',
          },
        },
        userErrors: {
          field: true,
          message: true,
        },
      },
    })
    if (metaFieldsRes.metafieldsSet?.userErrors.length !== 0 && metaFieldsRes.metafieldsSet?.userErrors) {
      await sendTeamsMessage(
        '[1mkl235m] Error updating product meta fields',
        `SAP Product: ${sapProduct.ItemCode}.<BR>
      Shopify Product: ${productId}.<BR>
      **Error**: ${JSON.stringify(metaFieldsRes.metafieldsSet?.userErrors)}`
      )

      return
    } else if (metaFieldsRes.inventoryItemUpdate?.userErrors.length !== 0 && metaFieldsRes.inventoryItemUpdate?.userErrors) {
      await sendTeamsMessage(
        '[1mkl235m] Error updating product inventory item',
        `SAP Product: ${sapProduct.ItemCode}.<BR>
      Shopify Product: ${productId}.<BR>
      **Error**: ${JSON.stringify(metaFieldsRes.inventoryItemUpdate?.userErrors)}`
      )

      return
    } else {
      updateProductSap(sapProduct.ItemCode, 'N', new Date())
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      await sendTeamsMessage(
        '[1mkl235m] Request Error updating product meta fields',
        `SAP Product: ${sapProduct.ItemCode}.<BR>
      Shopify Product: ${productId}.<BR>
      **Error**: ${JSON.stringify(error)}
      **Body**: ${JSON.stringify(error.config)}`
      )
      return
    } else if (error instanceof GenqlError) {
      // TODO: Figure out a way to get the field with the error. In extensions theres an index to the field and I've made the fields into an array
      for (const errorE of error.errors) {
        await sendTeamsMessage(
          '[1mkl235m] GenQL Error updating product meta fields',
          `SAP Product: ${sapProduct.ItemCode}.<BR>
        Shopify Product: ${productId}.<BR>
        **Error**: ${JSON.stringify(errorE.extensions)}`
        )
      }
      return
    } else {
      console.log('Error is neither AxiosError or GenqlError: ', error)
    }
  }
}
