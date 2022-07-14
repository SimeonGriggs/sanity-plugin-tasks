import {createPlugin} from 'sanity'

import taskGroup from './schema/taskGroup'
import TaskViewComponent from './components/TaskView'

interface TasksConfig {
  /* nothing here yet */
}

export const tasks = createPlugin<TasksConfig | void>((config = {}) => {
  return {
    name: 'sanity-plugin-tasks',
    schema: {
      types: [taskGroup],
    },
  }
})

export const TaskView = TaskViewComponent
