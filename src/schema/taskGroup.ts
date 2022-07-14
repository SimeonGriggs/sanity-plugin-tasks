import React from 'react'
import {CheckmarkCircleIcon, CircleIcon} from '@sanity/icons'
import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'sanity.taskGroup',
  title: 'Task Group',
  type: 'document',
  liveEdit: true,
  fields: [
    defineField({name: 'documentId', type: 'string'}),
    defineField({
      name: 'tasks',
      type: 'array',
      of: [
        defineField({
          name: 'task',
          title: 'title',
          type: 'object',
          fields: [
            defineField({name: 'title', type: 'string'}),
            defineField({
              name: 'userId',
              title: 'User ID',
              type: 'string',
              // inputComponent: UserSelectInput
            }),
            defineField({name: 'complete', type: 'boolean', initialValue: false}),
            defineField({name: 'due', type: 'datetime'}),
          ],
          preview: {
            select: {
              title: 'title',
              complete: 'complete',
              userId: 'userId',
              due: 'due',
            },
            // @ts-ignore: TODO: I don't know how to satisfy `prepare`
            prepare({
              title,
              userId,
              due,
              complete,
            }: {
              title: string
              userId?: string
              due?: string
              complete: boolean
            }) {
              return {
                title: title ?? `Untitled task`,
                subtitle: [userId, due ? `Due: ${due}` : null].filter(Boolean).join(`, `),
                media: React.createElement(complete ? CheckmarkCircleIcon : CircleIcon),
              }
            },
          },
        }),
      ],
    }),
  ],
})
