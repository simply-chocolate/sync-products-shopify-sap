import dotenv from 'dotenv'
dotenv.config()

import { checkEnvs } from './utils/handleCheckingEnvs'
import { mapProducts } from './utils/handleMappingProducts'
import { time } from 'console'

async function main() {
  //TODO: Create a function for handling env loading (Check all env fields and see if they have a value. Also if their typing is correct)
  let result = checkEnvs()

  if (result.type == 'error') {
    console.log(result.error)
  } else {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    console.log('Running the pre Cron job' + new Date().getTime())
    await mapProducts()
    console.log('Finished the initial run' + new Date().getTime())

    let hour = '6'
    let minute = '30'
    console.log(`Starting the Cron Scheduler to run every day at ${hour}:${minute}`)
    var CronJob = require('cron').CronJob
    var job = new CronJob(
      `* ${minute} ${hour} * * *`,
      async function () {
        console.log('Running the Cron job' + new Date().getTime())
        await mapProducts()
        console.log('Finished the Cron job' + new Date().getTime())
      },
      null,
      true,
      'Europe/Copenhagen'
    )
  }

  return
}

main()
