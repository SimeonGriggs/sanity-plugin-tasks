import type {Rule, SanityDocument, ValidationContext} from 'sanity'

export const validation = (R: Rule) =>
  R.custom((value: SanityDocument, context: ValidationContext) => {
    const {_id} = value
    const {client} = context

    return client
      .fetch(`*[_id == "task.${_id.replace(`drafts.`, ``)}"][0].tasks[!complete]`)
      .then((res) =>
        // eslint-disable-next-line no-nested-ternary
        res?.length
          ? res.length === 1
            ? `There is 1 outstanding task`
            : `There are ${res.length} outstanding tasks`
          : true
      )
  })
