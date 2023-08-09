import { getAuthorizedClient } from './POST-login'

export async function logoutSap() {
  const authClient = await getAuthorizedClient()
  if (!authClient) return
  authClient.post('Logout')
}
