import axios, { AxiosError, AxiosInstance } from 'axios'
import { sleep } from '../utils/sleep'

type SuccessDataType = {
  status: number
  statusText: string
  headers: {
    'set-cookie': string[]
  }
  data: {
    'odata.metadata': string
    SessionId: string
    Version: string
    SessionTimeOut: number
  }
}

type ErrorDataType = {
  response: {
    data: {
      error: {
        message: {
          value: string
        }
      }
    }
  }
}

export async function getAuthorizedClient(): Promise<AxiosInstance> {
  for (let retryCount = 0; retryCount < 3; retryCount++) {
    try {
      const res = await axios<SuccessDataType | ErrorDataType>({
        method: 'post',
        baseURL: process.env.SAP_URL,
        url: 'Login',
        data: {
          CompanyDB: process.env.SAP_COMPANY,
          UserName: process.env.SAP_USERNAME,
          Password: process.env.SAP_PASSWORD,
        },
      })

      return axios.create({
        baseURL: process.env.SAP_URL,
        headers: {
          Cookie: res.headers['set-cookie']?.map((e) => e.split(';')[0]),
        },
      })
    } catch (error) {
      if (error instanceof AxiosError) {
        console.log('failed to get auth client')
      }
    }

    await sleep(1000)
  }

  throw new Error('unable to get authenticated SAP client')
}
