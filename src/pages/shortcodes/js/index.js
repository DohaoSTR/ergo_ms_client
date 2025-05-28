import ContainerBlock from '../components/ContainerBlock.vue'
import ButtonBlock from '../components/ButtonBlock.vue'
import UnknownShortcode from '../components/UnknownShortcode.vue'

export const componentMap = {
  Container: ContainerBlock,
  Button: ButtonBlock,
}

export const defaultRenderer = UnknownShortcode
