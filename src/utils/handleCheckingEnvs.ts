import { returnType } from './returnTypes'
import dotenv from 'dotenv'

export function checkEnvs(): returnType {
  if (process.env.SHOPIFY_TOKEN === '') {
    return {
      type: 'error',
      error: 'Error loading env variable SHOPIFY_TOKEN',
    }
  }
  if (process.env.SAP_URL === '') {
    return {
      type: 'error',
      error: 'Error loading env variable SAP_URL',
    }
  }
  if (process.env.SAP_COMPANY === '') {
    return {
      type: 'error',
      error: 'Error loading env variable SAP_COMPANY',
    }
  }
  if (process.env.SAP_USERNAME === '') {
    return {
      type: 'error',
      error: 'Error loading env variable SAP_USERNAME',
    }
  }
  if (process.env.SAP_PASSWORD === '') {
    return {
      type: 'error',
      error: 'Error loading env variable SAP_PASSWORD',
    }
  }
  if (process.env.PCN_ADRESS === '') {
    return {
      type: 'error',
      error: 'Error loading env variable PCN_ADRESS',
    }
  }
  if (process.env.PCN_OLSUSER === '') {
    return {
      type: 'error',
      error: 'Error loading env variable PCN_OLSUSER',
    }
  }
  if (process.env.PCN_CID === '') {
    return {
      type: 'error',
      error: 'Error loading env variable PCN_CID',
    }
  }
  if (process.env.PCN_OLSPASS === '') {
    return {
      type: 'error',
      error: 'Error loading env variable PCN_OLSPASS',
    }
  }
  if (process.env.PCN_AUTH_UN === '') {
    return {
      type: 'error',
      error: 'Error loading env variable PCN_AUTH_UN',
    }
  }
  if (process.env.PCN_AUTH_PW === '') {
    return {
      type: 'error',
      error: 'Error loading env variable PCN_AUTH_PW',
    }
  }
  if (process.env.TEAMS_WEBHOOK_URL === '') {
    return {
      type: 'error',
      error: 'Error loading env variable TEAMS_WEBHOOK_URL',
    }
  }
  return {
    type: 'success',
    data: 'Environment variables successfully loaded',
  }
}

export function extractStringEnvVar(key: keyof NodeJS.ProcessEnv): string {
  const value = process.env[key]

  if (value === undefined) {
    const message = `The environment variable "${key}" cannot be "undefined".`
    throw new Error(message)
  }
  return value
}
