import PropTypes from 'prop-types'
import React, {useEffect, useRef} from 'react'
import {Box, Text, Menu, MenuItem, TextInput, Flex, Badge} from '@sanity/ui'
import {AddCircleIcon, RemoveCircleIcon, RestoreIcon} from '@sanity/icons'

import {User} from '../../types'
import {UserAvatar} from 'sanity/_unstable'

function searchUsers(users: User[], searchString: string): User[] {
  return users.filter((user) => {
    const displayName = (user.displayName || '').toLowerCase()
    if (displayName.startsWith(searchString)) return true
    const givenName = (user.givenName || '').toLowerCase()
    if (givenName.startsWith(searchString)) return true
    const middleName = (user.middleName || '').toLowerCase()
    if (middleName.startsWith(searchString)) return true
    const familyName = (user.familyName || '').toLowerCase()
    if (familyName.startsWith(searchString)) return true

    return false
  })
}

type UserAssignmentMenuProps = {
  value: string[]
  userList: User[]
  onAdd: any
  onRemove: any
  onClear: any
  open: boolean
}

export default function UserAssignmentMenu(props: UserAssignmentMenuProps) {
  const {value = [], userList = [], onAdd, onRemove, onClear, open} = props
  const [searchString, setSearchString] = React.useState('')
  const searchResults = searchUsers(userList || [], searchString)

  const me = userList.find((u) => u.isCurrentUser)
  const meAssigned = me && value.includes(me.id)

  // Focus input on open
  // TODO: Fix focus, it gets immediately taken away
  const input = useRef<HTMLInputElement>()
  useEffect(() => {
    if (open && input?.current) {
      input.current.focus()
    }
  }, [open])

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchString(event.target.value)
  }

  const handleAssignment = (isChecked: boolean, user: User) => {
    if (!isChecked) {
      if (onAdd) onAdd(user.id)
    } else if (onRemove) onRemove(user.id)
  }

  const handleAssignMyself = () => {
    if (me && onAdd) onAdd(me.id)
  }

  const handleUnassignMyself = () => {
    if (me && onRemove) onRemove(me.id)
  }

  const handleClearAssigneesClick = () => {
    if (onClear) onClear()
  }

  return (
    <Menu style={{maxHeight: 300}}>
      {meAssigned ? (
        <MenuItem
          tone="caution"
          disabled={!me}
          onClick={handleUnassignMyself}
          icon={RemoveCircleIcon}
          text="Unassign myself"
        />
      ) : (
        <MenuItem
          tone="positive"
          onClick={handleAssignMyself}
          icon={AddCircleIcon}
          text="Assign myself"
        />
      )}

      <MenuItem
        tone="critical"
        disabled={value.length === 0}
        onClick={handleClearAssigneesClick}
        icon={RestoreIcon}
        text="Clear assignees"
      />

      <Box padding={1}>
        <TextInput
          // @ts-ignore TODO: Satisfy ref
          ref={input}
          onChange={handleSearchChange}
          placeholder="Search members"
          value={searchString}
        />
      </Box>

      {searchString && searchResults?.length === 0 && <MenuItem disabled text="No matches" />}

      {searchResults &&
        searchResults.map((user) => (
          <MenuItem
            key={user.id}
            selected={value.indexOf(user.id) > -1}
            onClick={() => handleAssignment(value.indexOf(user.id) > -1, user)}
          >
            <Flex align="center">
              <UserAvatar user={user} size={1} />
              <Box paddingX={2} flex={1}>
                <Text>{user.displayName}</Text>
              </Box>
              {user.isCurrentUser && (
                <Badge fontSize={1} tone="positive" mode="outline">
                  Me
                </Badge>
              )}
            </Flex>
          </MenuItem>
        ))}
    </Menu>
  )
}
