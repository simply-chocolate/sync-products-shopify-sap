import { extractStringEnvVar } from '../utils/handleCheckingEnvs'

const { IncomingWebhook } = require('ms-teams-webhook')

const url = extractStringEnvVar('TEAMS_WEBHOOK_URL')

const webhook = new IncomingWebhook(url)

export async function sendTeamsMessage(title: string, body: string, summary?: string) {
  await webhook.send({
    '@type': 'MessageCard',
    title: title,
    summary: summary,
    text: body,
  })
}
