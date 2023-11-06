// collectionsToJoin: ['gid://shopify/Collection/285550477519'], // EU Tax Collection
import { AxiosError } from 'axios'
import { shopifyClient } from '../shopify-api-wrapper/shopifyClient'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage'
import { returnType } from './returnTypes'
import { sleep } from './sleep'

export async function updateEuTaxCollection(): Promise<returnType> {
  // Define function for a getting a page of shopify Products from Gql
  // handle throttling errors like https://chat.openai.com/c/c6a3d0be-6663-4b85-825b-c4b17965194f
  async function getProductsInEUTaxCollection(curser?: string) {
    return await shopifyClient.query({
      collection: {
        __args: { id: 'gid://shopify/Collection/285550477519' },
        products: {
          __args: { first: 180, after: curser },
          pageInfo: {
            hasNextPage: true,
            endCursor: true,
          },
          nodes: {
            id: true,
            title: true,
            tags: true,
          },
        },
      },
      products: {
        __args: { first: 180, after: curser },
        pageInfo: {
          hasNextPage: true,
          endCursor: true,
        },
        nodes: {
          id: true,

          title: true,
          tags: true,
        },
      },
    })
  }

  // Define the type of "allShopifyProducts" using the return type of the function that returns the single page
  let allProductsInEUTaxCollection: Awaited<ReturnType<typeof getProductsInEUTaxCollection>>[] = []
  let allProducts: Awaited<ReturnType<typeof getProductsInEUTaxCollection>>[] = []

  while (true) {
    try {
      allProductsInEUTaxCollection.push(await getProductsInEUTaxCollection(allProductsInEUTaxCollection.at(-1)?.collection?.products.pageInfo.endCursor))
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.data.errors.message === 'Throttled') {
          await sleep(20000)
          continue
        } else if (error.response != null) {
          await sendTeamsMessage('[1n2j3k1] Error getting shopify products', `**Error**: ${JSON.stringify(error.response.data.errors)}`)
        }
      }
      return { type: 'error', error: '[12klldsfml]: Error getting shopify products' + error }
    }
    if (!allProductsInEUTaxCollection.at(-1)?.collection?.products.pageInfo.hasNextPage) break
    await sleep(20000)
  }

  while (true) {
    try {
      allProducts.push(await getProductsInEUTaxCollection(allProducts.at(-1)?.products.pageInfo.endCursor))
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.data.errors.message === 'Throttled') {
          await sleep(20000)
          continue
        } else if (error.response != null) {
          console.log('Error getting shopify products, error.response.data.errors: ', error.response.data.errors)
          await sendTeamsMessage('[1n2j3k1] Error getting shopify products', `**Error**: ${JSON.stringify(error.response.data.errors)}`)
        }
      }
      return { type: 'error', error: '[asdmakl!!]: Error getting shopify products' + error }
    }
    if (!allProducts.at(-1)?.products.pageInfo.hasNextPage) break
    await sleep(20000)
  }

  let updatedProducts = ''

  if (allProductsInEUTaxCollection.length === 0) {
    console.log('No products in EU Tax Collection')
  }
  if (allProducts.length === 0) {
    console.log('No products in all products')
  }

  for (const { products } of allProducts) {
    for (const product of products.nodes) {
      if (allProductsInEUTaxCollection.find((e) => e.collection?.products.nodes.some((p) => p.id === product.id))) {
        if (!product.tags.includes('nonfood')) {
          continue
        } else {
          const updateProductDataResult = await updateProductData('leave', product)
          if (updateProductDataResult.type === 'error') {
            return updateProductDataResult
          }
          updatedProducts += updateProductDataResult.data
        }
        // Check if the current product already exists in the EU Tax Collection
      }
      if (product.tags.includes('nonfood')) {
        continue
      }
      const updateProductDataResult = await updateProductData('join', product)
      if (updateProductDataResult.type === 'error') {
        return updateProductDataResult
      }
      updatedProducts += updateProductDataResult.data
    }
  }
  if (updatedProducts === '') {
    updatedProducts = 'No products updated'
  }
  sendTeamsMessage('Updated products in EU Tax Collection', updatedProducts)

  return {
    type: 'success',
    data: 'We did it without errors or something',
  }
}

async function updateProductData(action: 'join' | 'leave', product: { id: string; title: string }): Promise<returnType> {
  const productId = product.id.split('/')[4]
  const productTitle = product.title.split('|')[0]
  if (action === 'join') {
    const productUpdateResponse = await shopifyClient.mutation({
      productUpdate: {
        __args: {
          input: {
            id: product.id,
            collectionsToJoin: ['gid://shopify/Collection/285550477519'], // EU Tax Collection
          },
        },
        userErrors: {
          field: true,
          message: true,
        },
      },
    })
    if (productUpdateResponse.productUpdate?.userErrors.length !== 0) {
      return {
        type: 'error',
        error: `**Error**: ${JSON.stringify(productUpdateResponse.productUpdate?.userErrors)}`,
      }
    }
    return {
      type: 'success',
      data: `**${action}** ${productTitle}: https://admin.shopify.com/store/simply-chocolate-copenhagen/products/${productId}<BR>`,
    }
  }
  const productUpdateResponse = await shopifyClient.mutation({
    productUpdate: {
      __args: {
        input: {
          id: product.id,
          collectionsToLeave: ['gid://shopify/Collection/285550477519'], // EU Tax Collection
        },
      },
      userErrors: {
        field: true,
        message: true,
      },
    },
  })
  if (productUpdateResponse.productUpdate?.userErrors.length !== 0) {
    return {
      type: 'error',
      error: `**Error**: ${JSON.stringify(productUpdateResponse.productUpdate?.userErrors)}`,
    }
  } else {
    return {
      type: 'success',
      data: `**${action}** ${productTitle}: https://admin.shopify.com/store/simply-chocolate-copenhagen/products/${productId}<BR>`,
    }
  }
}
