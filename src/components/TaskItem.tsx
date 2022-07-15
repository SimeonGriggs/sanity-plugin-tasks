import React, {FocusEvent, useState, useCallback, useRef, useEffect} from 'react'
import {Button, TextInput, Label, Box, Popover, Flex, Card, CardTone} from '@sanity/ui'
import {TrashIcon, CheckmarkCircleIcon, CircleIcon} from '@sanity/icons'
import {formatRelative, isPast} from 'date-fns'
import {useClient} from 'sanity'
import {UserAvatar} from 'sanity/_unstable'
import {uuid} from '@sanity/uuid'

import type {User, Task} from '../types'
import UserAssignmentMenu from './UserAssignmentMenu'
import {NewAvatar, AvatarWrapper, CircleButton} from './StyledComponents'
import {useMemo} from 'react'

type TaskItemProps = Task & {
  onUserAssignmentOpen: () => void
  onUserAssignmentClose: () => void
  userAssignmentOpen: boolean
  documentId: string
  userList: User[]
  user?: User | null
}

const TASK_DEFAULTS = {
  _type: 'task',
  complete: false,
  userAssignmentOpen: false,
}

export default function TaskItem(props: TaskItemProps) {
  const isNewTask = !props?._key
  const {
    _key,
    _type,
    documentId,
    complete,
    due,
    userList,
    onUserAssignmentOpen,
    onUserAssignmentClose,
    userAssignmentOpen,
  } = {
    ...TASK_DEFAULTS,
    // @ts-ignore: Potentially overriding _key is deliberate
    _key: uuid().split(`-`).pop(),
    ...props,
  }

  const taskId = `task.${documentId}`

  const client = useClient()
  const input = useRef<HTMLInputElement>()

  // Tracked in local state for creating new items
  const [title, setTitle] = useState(props?.title ?? ``)
  const [user, setUser] = useState<User | null>(props?.user ?? null)

  // Update local state when props change (new task is saved)
  useEffect(() => {
    setTitle(props?.title ?? ``)
    setUser(props?.user ?? null)
    onUserAssignmentClose()
  }, [props.user, props.title])

  const [mutating, setMutating] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleUpdate = useCallback(
    async (event: FocusEvent<HTMLInputElement> | React.SyntheticEvent) => {
      if (!title || title === props.title) {
        return null
      }

      onUserAssignmentClose()
      event.preventDefault()
      setMutating(true)
      const userId = user?.id ?? ``

      if (isNewTask) {
        const newTaskGroup = {
          _id: taskId,
          _type: `sanity.taskGroup`,
          documentId,
        }

        await client.createIfNotExists(newTaskGroup)

        return client
          .patch(taskId)
          .setIfMissing({tasks: []})
          .insert('after', 'tasks[-1]', [{_key, _type, title, complete, userId}])
          .commit()
          .then(() => {
            setMutating(false)
            setTitle(``)

            if (input?.current) {
              input.current.focus()
            }
          })
          .catch((err) => {
            console.error(err)
          })
      }

      return client
        .patch(taskId)
        .set({[`tasks[_key == "${_key}"].title`]: title})
        .commit()
        .then(() => {
          setMutating(false)
        })
        .catch((err) => {
          console.error(err)
        })
    },
    [_key, _type, client, complete, documentId, isNewTask, props.title, taskId, title, user]
  )

  const handleToggle = useCallback(
    (_key: string, complete: boolean) =>
      client
        .patch(taskId)
        .set({[`tasks[_key == "${_key}"].complete`]: !complete})
        .commit()
        .then((res) => res)
        .catch((err) => {
          console.error(err)
          return err
        }),
    []
  )

  const handleDelete = useCallback(() => {
    setDeleting(true)
    onUserAssignmentClose()

    return client
      .patch(taskId)
      .unset([`tasks[_key == "${_key}"]`])
      .commit()
      .then((res) => res)
      .catch((err) => {
        console.error(err)
        return err
      })
  }, [_key, client, taskId])

  const onAssigneeAdd = useCallback(
    (id: string) => {
      onUserAssignmentClose()

      if (isNewTask) {
        if (input?.current) {
          input.current.focus()
        }
        const newUser = userList.find((u) => u.id === id) ?? null
        return setUser(newUser)
      }

      return client
        .patch(taskId)
        .set({[`tasks[_key == "${_key}"].userId`]: id})
        .commit()
        .then((res) => {
          return res
        })
        .catch((err) => {
          console.error(err)
          return err
        })
    },
    [_key, client, isNewTask, taskId, userList]
  )

  const onAssigneesClear = useCallback(() => {
    if (isNewTask) {
      onUserAssignmentClose()
      if (input?.current) {
        input.current.focus()
      }
      return setUser(null)
    }

    return client
      .patch(taskId)
      .unset([`tasks[_key == "${_key}"].userId`])
      .commit()
      .then((res) => res)
      .catch((err) => {
        console.error(err)
        return err
      })
  }, [_key, client, isNewTask, taskId])

  const onAssigneeRemove = useCallback(() => {
    if (isNewTask) {
      return setUser(null)
    }

    return client
      .patch(taskId)
      .unset([`tasks[_key == "${_key}"].userId`])
      .commit()
      .then((res) => res)
      .catch((err) => {
        console.error(err)
      })
  }, [_key, client, isNewTask, taskId])

  // New task should focus the input on render
  useEffect(() => {
    if (input?.current && isNewTask) {
      input.current.focus()
    }
  }, [input, isNewTask])

  const tone: CardTone = useMemo(() => {
    if (deleting) {
      return `critical`
    } else if (complete) {
      return `positive`
    } else if (due && isPast(new Date(due))) {
      return `caution`
    }

    return `default`
  }, [complete, deleting, due])

  return (
    <Card tone={tone} borderTop paddingY={1}>
      <Flex align="center" gap={2} paddingX={2}>
        <Popover
          tone="default"
          content={
            <UserAssignmentMenu
              value={user?.id ? [user.id] : []}
              userList={userList}
              onAdd={onAssigneeAdd}
              onClear={onAssigneesClear}
              onRemove={onAssigneeRemove}
              open={userAssignmentOpen}
            />
          }
          padding={0}
          placement="right"
          open={userAssignmentOpen}
          disabled={mutating || deleting}
        >
          <CircleButton
            disabled={mutating || deleting}
            padding={1}
            mode="bleed"
            onClick={() => onUserAssignmentOpen()}
          >
            {user?.id ? (
              <AvatarWrapper>
                <UserAvatar size={1} user={user} />
              </AvatarWrapper>
            ) : (
              <NewAvatar initials="+" color="green" size={1} />
            )}
          </CircleButton>
        </Popover>
        {isNewTask ? null : (
          <Flex paddingLeft={1}>
            <CircleButton
              tone="positive"
              mode="bleed"
              padding={0}
              disabled={Boolean(isNewTask) || mutating || deleting}
              onClick={() => (_key ? handleToggle(_key, complete) : null)}
            >
              <Flex align="center" justify="center">
                {complete ? (
                  <CheckmarkCircleIcon width={40} height={40} />
                ) : (
                  <CircleIcon width={40} height={40} />
                )}
              </Flex>
            </CircleButton>
          </Flex>
        )}
        <Box flex={1}>
          <form onSubmit={handleUpdate}>
            <TextInput
              // @ts-ignore TODO: Satisfy ref
              ref={input}
              onChange={(event) => setTitle(event.currentTarget.value)}
              onBlur={handleUpdate}
              padding={[3, 3, 3]}
              value={title}
              disabled={mutating || deleting}
              placeholder={isNewTask ? `New task` : ``}
              border={false}
            />
          </form>
        </Box>

        {due ? (
          <Label size={1} muted>
            {formatRelative(new Date(due), new Date())}
          </Label>
        ) : null}

        {isNewTask ? null : (
          <Button
            disabled={deleting}
            icon={TrashIcon}
            tone="critical"
            padding={2}
            mode="ghost"
            onClick={handleDelete}
          />
        )}
      </Flex>
    </Card>
  )
}
