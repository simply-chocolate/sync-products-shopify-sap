import { AxiosError } from 'axios'
import { getAuthorizedClient } from './POST-login'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage'

type SapItemsData = {
  value: SapItemData[]
}

export type SapItemData = {
  ItemCode: string
  ItemName: string
  ItemsGroupCode: number
  U_CCF_Web_SalesUOM: string
  U_CCF_Web_Sync_Date: Date

  U_BOYX_varedel: string

  U_BOYX_Energi: number
  U_BOYX_Energik: number
  U_BOYX_fedt: number
  U_BOYX_fedtsyre: number
  U_BOYX_Kulhydrat: number
  U_BOYX_sukkerarter: number
  U_BOYX_Protein: number
  U_BOYX_salt: number
  U_BOYX_Gluten1: string
  U_BOYX_Lactose: string
  U_BOXY_Vegetar: string
  U_BOXY_Vegan: string

  ItemBarCodeCollection: {
    Barcode: string
    UoMEntry: number
  }[]
  ItemUnitOfMeasurementCollection: {
    UoMType: string // Needs to be iutSales
    UoMEntry: number
    Weight1: number // Weight in Kilos
  }[]
}

export async function getProducts(): Promise<SapItemsData | void> {
  const authClient = await getAuthorizedClient()

  try {
    const res = await authClient.get<SapItemsData>('Items', {
      params: {
        $select: [
          'ItemCode',
          'ItemName',
          'U_CCF_Web_SalesUOM',
          'U_BOYX_varedel',
          'U_BOYX_Energi',
          'U_BOYX_Energik',
          'U_BOYX_fedt',
          'U_BOYX_fedtsyre',
          'U_BOYX_Kulhydrat',
          'U_BOYX_sukkerarter',
          'U_BOYX_Protein',
          'U_BOYX_salt',
          'ItemBarCodeCollection',
          'ItemUnitOfMeasurementCollection',
          'U_BOYX_Gluten1',
          'U_BOYX_Lactose',
          'U_BOXY_Vegetar',
          'U_BOXY_Vegan',
          'U_CCF_Web_Sync_Date',
          'ItemsGroupCode',
        ].join(','),
        $filter: "U_CCF_Sync_Web eq 'Y'",
      },
    })

    return res.data
  } catch (error) {
    if (error instanceof AxiosError) {
      sendTeamsMessage(
        'getProducts SAP request failed',
        `**Code**: ${error.response?.data.error.code}<BR>
          **Error Message**: ${error.response?.data.error.message.value}<BR>`
      )
    }
  }
}
