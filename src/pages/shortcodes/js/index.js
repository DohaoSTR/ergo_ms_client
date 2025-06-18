import ContainerBlock from '../components/ContainerBlock.vue'
import ButtonBlock from '../components/ButtonBlock.vue'
import UnknownShortcode from '../components/UnknownShortcode.vue'
import HeaderBlock from '../components/HeaderBlock.vue'
import FooterBlock from '../components/FooterBlock.vue'
import CategoryMenuBlock from '../components/CategoryMenuBlock.vue'
import ImageBlock from '../components/ImageBlock.vue'
import GridSectionBlock from '../components/GridSectionBlock.vue'
import PageCardBlock from '../components/PageCardBlock.vue'
import HeadingBlock from '../components/HeadingBlock.vue'
import TextBlock from '../components/TextBlock.vue'

export const componentMap = {
  Container: ContainerBlock,
  Button: ButtonBlock,
  Header: HeaderBlock,
  Footer: FooterBlock,
  CategoryMenu: CategoryMenuBlock,
  Heading: HeadingBlock,
  Image: ImageBlock,
  Grid: GridSectionBlock,
  PageCardBlock: PageCardBlock,
  Text: TextBlock,
}

export const defaultRenderer = UnknownShortcode
