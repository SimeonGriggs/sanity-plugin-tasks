import React, {useRef, useState} from 'react'
import {Box, Text, Flex, Inline, Button, Spinner, Stack, Card} from '@sanity/ui'
import {motion} from 'framer-motion'

import type {Task, Filter, FilterCount} from '../types'
import useListeningQuery from '../hooks/useListeningQuery'
import useProjectUsers from '../hooks/useProjectUsers'
import TaskItem from './TaskItem'

type TaskViewProps = {
  document: any
  documentId: string
  options: any
  schemaType: any
}

const FILTERS: Filter[] = [`All`, `Mine`, `Unassigned`, `Complete`, `Incomplete`]

export default function TaskView(props: TaskViewProps) {
  const {documentId} = props
  const view = useRef<HTMLDivElement>()

  const users = useProjectUsers()
  const me = users.find((user) => user.isCurrentUser)

  const [currentFilter, setCurrentFilter] = useState<Filter>(FILTERS[0])

  const taskId = `task.${documentId}`
  const query = `*[_id == $taskId][0].tasks|order(complete)`
  const {data: tasks, loading, error} = useListeningQuery<Task[]>(query, {taskId})

  const [openTaskKey, setOpenTaskKey] = useState(``)

  if (loading) {
    return (
      <Flex align="center" justify="center" padding={5}>
        <Spinner />
      </Flex>
    )
  }

  if (error) {
    return (
      <Card padding={2} shadow={1} tone="critical">
        <Text>Error</Text>
      </Card>
    )
  }

  const allTasksAreComplete = tasks?.length ? tasks.every((task) => task.complete) : false
  const someTasksAreMine = tasks?.length ? tasks.some((task) => task.userId === me?.id) : false

  const defaultTaskCounts = {
    All: tasks?.length,
    Mine: 0,
    Unassigned: 0,
    Complete: 0,
    Incomplete: 0,
  }

  const taskCounts: FilterCount = tasks?.length
    ? tasks.reduce((acc: FilterCount, cur: Task) => {
        const currentCount = {...acc}

        if (cur.userId === me?.id) currentCount.Mine += 1
        if (!cur.userId) currentCount.Unassigned += 1
        if (cur.complete) currentCount.Complete += 1
        if (!cur.complete) currentCount.Incomplete += 1

        return currentCount
      }, defaultTaskCounts)
    : defaultTaskCounts

  return (
    // @ts-ignore TODO: Satisfy ref
    <Stack padding={4} space={0} ref={view}>
      <Card marginBottom={2}>
        <Inline space={1}>
          {FILTERS.map((filter) => (
            <Button
              key={filter}
              mode="bleed"
              fontSize={1}
              text={taskCounts[filter] ? `${filter} (${taskCounts[filter]})` : filter}
              disabled={
                (filter === 'Complete' && allTasksAreComplete) ||
                (filter === 'Incomplete' && allTasksAreComplete) ||
                (filter === 'Mine' && !someTasksAreMine)
              }
              onClick={() => setCurrentFilter(filter)}
              selected={filter === currentFilter}
              tone={filter === currentFilter ? `positive` : undefined}
            />
          ))}
        </Inline>
      </Card>
      <Box paddingBottom={2} />
      {tasks?.length > 0
        ? tasks
            .filter((task) => {
              switch (currentFilter) {
                case 'All':
                  return true
                case 'Mine':
                  return task.userId === me?.id
                case 'Unassigned':
                  return !task.userId
                case 'Complete':
                  return task.complete
                case 'Incomplete':
                  return !task.complete
                default:
                  return true
              }
            })
            .map((task) => (
              <motion.div key={task._key} layout>
                <TaskItem
                  onUserAssignmentOpen={() => (task._key ? setOpenTaskKey(task._key) : null)}
                  onUserAssignmentClose={() => setOpenTaskKey(``)}
                  userAssignmentOpen={openTaskKey === task._key}
                  user={users.find((u) => u.id === task.userId)}
                  userList={users}
                  documentId={documentId}
                  {...task}
                />
              </motion.div>
            ))
        : null}
      <Card borderBottom>
        <TaskItem
          onUserAssignmentOpen={() => setOpenTaskKey(`__NEW__`)}
          onUserAssignmentClose={() => setOpenTaskKey(``)}
          userAssignmentOpen={openTaskKey === `__NEW__`}
          user={currentFilter === 'Mine' && me?.id ? me : null}
          userList={users}
          documentId={documentId}
        />
      </Card>
    </Stack>
  )
}
