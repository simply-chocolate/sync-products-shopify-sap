import dotenv from 'dotenv'
dotenv.config()

import { checkEnvs } from './utils/handleCheckingEnvs'
import { mapProducts } from './utils/handleMappingProducts'
import { logoutSap } from './sap-api-wrapper/POST-logout'
import { updateEuTaxCollection } from './utils/handleEuTaxCollection'
import { sendTeamsMessage } from './teams_notifier/SEND-teamsMessage'
import { getAllShopifyProducts } from './shopify-api-wrapper/BULK-getAllProducts'

async function main() {
  let result = checkEnvs()
  // origin
  if (result.type == 'error') {
    console.log(result.error)
  } else {
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Started the script')
    try {
      let mapProductsResult = await mapProducts()
      if (mapProductsResult.type === 'error') {
        sendTeamsMessage('Error mapping products', `**Error**: ${mapProductsResult.error}`)
      }

      let updateEuTaxCollectionresult = await updateEuTaxCollection()
      if (updateEuTaxCollectionresult.type === 'error') {
        sendTeamsMessage('Error updating EU Tax Collection', `**Error**: ${updateEuTaxCollectionresult.error}`)
      }

      console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the script')
      await logoutSap()
    } catch (error) {
      console.dir(error, { depth: Infinity })
    }
  }

  return
}

main()
