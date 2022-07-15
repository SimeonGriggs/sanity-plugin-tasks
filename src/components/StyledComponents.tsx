import styled from 'styled-components'
import {Button, Box, Avatar} from '@sanity/ui'

// Make unassigned user button a little smaller
export const NewAvatar = styled(Avatar)`
  opacity: 0.75;
  transform: scale(0.55);
`

// Required to avoid layout shift as image loads in
export const AvatarWrapper = styled(Box)`
  width: 35px;
  height: 35px;
`

export const CircleButton = styled(Button)`
  border-radius: 50%;
`
