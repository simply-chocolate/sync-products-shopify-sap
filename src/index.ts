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

    let hour = '*'
    let minute = '0'

    console.log(`Starting the Cron Scheduler to run every day at ${hour}:${minute}`)

    var CronJob = require('cron').CronJob
    var job = new CronJob(
      `0 ${minute} ${hour} * * *`,
      async function () {
        try {
          console.log(new Date(new Date().getTime()).toLocaleString() + ': Running the Cron job')
          await mapProducts()
          await updateEuTaxCollection()
          console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the Cron job ')
          await logoutSap()
        } catch (error) {
          console.log(error)
        }
      },
      null,
      true,
      'Europe/Copenhagen'
    )
  }

  return
}

main()
