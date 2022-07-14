export type User = {
  createdAt: string
  displayName: string
  email: string
  familyName: string
  givenName: string
  id: string
  imageUrl: string
  isCurrentUser: boolean
  middleName: string
  projectId: string
  provider: string
  sanityUserId: string
  updatedAt: string
}

export type Task = {
  _key?: string
  _type?: 'task'
  complete?: boolean
  title?: string
  userId?: string
  due?: string
}

export type TaskGroup = {
  _id: string
  _type: 'sanity.taskGroup'
  documentId: string
}

export type Filter = `All` | `Mine` | `Unassigned` | `Complete` | `Incomplete`
export type FilterCount = Record<Filter, number>
