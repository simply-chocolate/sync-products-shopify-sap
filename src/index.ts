import dotenv from 'dotenv'
dotenv.config()

import { checkEnvs } from './utils/handleCheckingEnvs'
import { mapProducts } from './utils/handleMappingProducts'

async function main() {
  //TODO: Create a function for handling env loading (Check all env fields and see if they have a value. Also if their typing is correct)
  let result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    const timestamp = new Date(new Date().getTime()).toLocaleString()
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    console.log(timestamp + ': Running the pre Cron job')
    await mapProducts()
    console.log(timestamp + ': Finished the initial run')

    let hour = '7'
    let minute = '0'
    console.log(`Starting the Cron Scheduler to run every day at ${hour}:${minute}`)
    var CronJob = require('cron').CronJob
    var job = new CronJob(
      `0 ${minute} ${hour} * * *`,
      async function () {
        const timestamp = new Date(new Date().getTime()).toLocaleString()

        console.log(timestamp + ': Running the Cron job')
        await mapProducts()
        console.log(timestamp + ': Finished the Cron job ')
      },
      null,
      true,
      'Europe/Copenhagen'
    )
  }

  return
}

main()
