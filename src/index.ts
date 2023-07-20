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
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
    await mapProducts()

    var CronJob = require('cron').CronJob
    var job = new CronJob(
      '* 30 6 * * *',
      async function () {
        await mapProducts()
      },
      null,
      true,
      'Europe/Copenhagen'
    )
  }

  return
}

main()
