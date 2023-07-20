// Check if a product exists in PCN Database

import { AxiosError } from 'axios'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage'
import { extractStringEnvVar } from '../utils/handleCheckingEnvs'
import { baseClient } from './utils'

export type PcnProductsResult = {
  status: string
  msg: string
  results: PcnProduct[]
}

export type PcnProduct = {
  articleno: string
  description?: string
  barcode: string
  barcode2: string
}

export async function getPCNProducts(): Promise<PcnProductsResult | undefined> {
  const url = extractStringEnvVar('PCN_ADRESS')
  try {
    const res = await baseClient.post<PcnProductsResult>(`${url}stocklist`, {
      cid: extractStringEnvVar('PCN_CID'),
      olsuser: extractStringEnvVar('PCN_OLSUSER'),
      olspass: extractStringEnvVar('PCN_OLSPASS'),
      filter: 'all',
      maxresults: 1000,
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'create/update product in PCN request failed',
        `**Status**: ${error.response?.data.status}<BR>
      **Error Message**: ${error.response?.data.msg}<BR>`
      )
    }
  }
}
