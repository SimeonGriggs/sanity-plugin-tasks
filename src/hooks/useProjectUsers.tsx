import {useState, useEffect} from 'react'
import {useClient, useWorkspace} from 'sanity'

import {User} from '../types'

type UserRole = {
  name: string
  title: string
}

type UserResponse = {
  isRobot: boolean
  projectUserId: string
  roles: UserRole[]
}

// Custom hook to fetch user details
// Built-in hook doesn't fetch all user details
export default function useProjectUsers(): User[] {
  const currentUser = useWorkspace().currentUser
  const client = useClient()
  const [users, setUsers] = useState([])

  useEffect(() => {
    const {apiHost, apiVersion, projectId} = client.config()

    async function getUser(id: string) {
      const url = `${apiHost}/v${apiVersion}/projects/${projectId}/users/${id}`
      const data = await fetch(url, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .catch((err) => err)

      return data
    }

    async function getUsersWithRoles() {
      const url = `${apiHost}/v${apiVersion}/projects/${projectId}/acl`

      const data = await fetch(url, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then(async (res) =>
          Promise.all(
            res.map(async (user: UserResponse) => ({
              isCurrentUser: user.projectUserId === currentUser.id,
              ...(await getUser(user.projectUserId)),
            }))
          )
        )
        .catch((err) => err)

      setUsers(data)
    }

    if (!users.length) {
      getUsersWithRoles()
    }
  }, [client, currentUser.id, users.length])

  return users
}
