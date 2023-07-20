// Check if a product exists in PCN Database

import { AxiosError } from 'axios'
import { sendCreatedProductsInPCNTeamsMessage } from '../teams_notifier/SEND-createdProductsInPCN'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage'
import { extractStringEnvVar } from '../utils/handleCheckingEnvs'
import { PcnProduct } from './GET-products'
import { baseClient } from './utils'

export type PcnImportProductsSuccesResponse = {
  status: string
  msg: string
  new: number
  updated: number
  skipped: number
}

export async function createPCNProducts(products: PcnProduct[]) {
  const url = extractStringEnvVar('PCN_ADRESS')
  try {
    const res = await baseClient.post<PcnImportProductsSuccesResponse>(`${url}importproducts`, {
      cid: extractStringEnvVar('PCN_CID'),
      olsuser: extractStringEnvVar('PCN_OLSUSER'),
      olspass: extractStringEnvVar('PCN_OLSPASS'),
      products: products,
    })

    sendCreatedProductsInPCNTeamsMessage(products, res.data)

    return
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'create/update product in PCN request failed',
        `**Status**: ${error.response?.data.status}<BR>
        **Error Message**: ${error.response?.data.msg}<BR>
        **Request Body**: ${JSON.stringify(error.config?.data)}<BR>`
      )
    }
  }
}
