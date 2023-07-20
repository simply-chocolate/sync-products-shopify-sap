export type returnType =
  | {
      type: 'success'
      data: string
    }
  | {
      type: 'error'
      error: string
    }
