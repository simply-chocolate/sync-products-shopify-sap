import { AxiosError } from 'axios'
import { getAuthorizedClient } from './POST-login'
import { sendTeamsMessage } from '../teams_notifier/SEND-teamsMessage'

//TODO: See if this needs to be exported, or if we can do it in some other way

export async function updateProductSap(itemCode: string, syncWebFieldValue: 'Y' | 'N', syncDate: Date, userErrors?: string[]) {
  const authClient = await getAuthorizedClient()

  try {
    await authClient.patch(`Items('${itemCode}')`, {
      U_CCF_Sync_Web: syncWebFieldValue,
      U_CCF_Web_Sync_Date: syncDate,
    })
    return
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
