import dotenv from 'dotenv'
dotenv.config()

import { checkEnvs } from './utils/handleCheckingEnvs'
import { mapProducts } from './utils/handleMappingProducts'
import { logoutSap } from './sap-api-wrapper/POST-logout'

async function main() {
  //TODO: Create a function for handling env loading (Check all env fields and see if they have a value. Also if their typing is correct)
  let result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    //process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Running the pre Cron job')
    await mapProducts()
    console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the initial run')
    await logoutSap()

    let hour = '7'
    let minute = '0'

    console.log(`Starting the Cron Scheduler to run every day at ${hour}:${minute}`)

    var CronJob = require('cron').CronJob
    var job = new CronJob(
      `0 ${minute} ${hour} * * *`,
      async function () {
        console.log(new Date(new Date().getTime()).toLocaleString() + ': Running the Cron job')
        await mapProducts()
        console.log(new Date(new Date().getTime()).toLocaleString() + ': Finished the Cron job ')
        await logoutSap()
      },
      null,
      true,
      'Europe/Copenhagen'
    )
  }

  return
}

main()
