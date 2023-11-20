import dotenv from 'dotenv'
dotenv.config()

import { checkEnvs } from './utils/handleCheckingEnvs'
import { mapProducts } from './utils/handleMappingProducts'
import { logoutSap } from './sap-api-wrapper/POST-logout'
import { updateEuTaxCollection } from './utils/handleEuTaxCollection'

async function main() {
  let result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Running the pre Cron job')
    try {
      await updateEuTaxCollection()
      await mapProducts()
      console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the initial run')
      await logoutSap()
    } catch (error) {
      console.log(error)
    }
  }

  return
}

main()
