import { PcnProduct } from '../pcn-api-wrapper/GET-products'
import { PcnImportProductsSuccesResponse } from '../pcn-api-wrapper/POST-product'
import { extractStringEnvVar } from '../utils/handleCheckingEnvs'

const { IncomingWebhook } = require('ms-teams-webhook')

const url = extractStringEnvVar('TEAMS_WEBHOOK_URL')

const webhook = new IncomingWebhook(url)

export async function sendCreatedProductsInPCNTeamsMessage(
  pcnProducts: PcnProduct[],
  responseFromApi: PcnImportProductsSuccesResponse
) {
  let body = `**${responseFromApi.new} new** products in PCN. **${responseFromApi.updated}  updated** products and **${responseFromApi.skipped} skipped** products.<BR>`

  for (let product of pcnProducts) {
    body +=
      '**Artikelnummer:** ' + product.articleno + ' -- **Product Name:** ' + product.description + '<BR>'
  }
  await webhook.send({
    '@type': 'MessageCard',
    title: 'Products successfully created in PCN',
    summary: `We've successfully created some products in PCN`,
    text: body,
  })
}
