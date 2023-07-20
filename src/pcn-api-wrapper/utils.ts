import axios from 'axios'
import { extractStringEnvVar } from '../utils/handleCheckingEnvs'

export const baseClient = axios.create({
  baseURL: process.env.PCN_ADRESS,
  auth: {
    username: extractStringEnvVar('PCN_AUTH_UN'),
    password: extractStringEnvVar('PCN_AUTH_PW'),
  },
})
