<template>
  <div class="join-builder" ref="container" @dragover.prevent="onExternalDrop" @drop.prevent="onExternalDrop">
    <VueFlow class="flow-canvas" :nodes="nodes" :edges="edges" @edge-click="handleEdgeClick" fit-view :nodes-connectable="false" :edges-connectable="false" :defaultEdgeOptions="{ sourcePosition: Position.Bottom, targetPosition: Position.Top }">
      <template #node-tableNode="{ id, data }">
        <Handle type="target" position="top" style="background:transparent; width:0; height:0;"/>
        <div class="table-node" :class="{ 'primary-node': data.primary }">
          <TableIcon class="node-icon" />
          <span class="node-label">{{ data.label }}</span>
          <button v-if="!data.primary" class="node-remove" @click.stop="removeNode(id)">✕</button>
        </div>
        <Handle type="source" position="bottom" style="background:transparent; width:0; height:0;"/>
      </template>
      <template #edge-label="{ edge }">
        <div class="custom-label" @click.stop="openSettingsFor(edge)">
          {{ edge.data.joinType }}
        </div>
      </template>
    </VueFlow>
  </div>
</template>

<script setup>
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import { ref, watch } from 'vue'
import { VueFlow, useVueFlow, Position, Handle } from '@vue-flow/core'
import { Table as TableIcon } from 'lucide-vue-next'

const props = defineProps({
  selectedTables: { type: Array, default: () => [] },
  relations:      { type: Array, default: () => [] }
})
const emit = defineEmits(['update:selectedTables', 'update:relations', 'drop-table'])

const container = ref(null)
const { findEdge, updateEdgeData, removeNodes } = useVueFlow()

const nodes = ref([])
const edges = ref([])

watch(
  () => props.selectedTables,
  (tables) => {
    const prev = [...nodes.value]
    nodes.value = tables.map((tbl, idx) => {
      const key = (tbl.id || `${tbl.schema}.${tbl.table}`).toString()
      const existing = prev.find((n) => n.id === key)
      return {
        id: key,
        type: 'tableNode',
        position: existing?.position || { x: 150, y: idx * 100 + 50 },
        data: { label: tbl.display_name || tbl.alias || tbl.name || tbl.table_ref || key, primary: idx === 0 },
        draggable: idx !== 0
      }
    })
  },
  { immediate: true, deep: true }
)

watch(() => props.relations, rels => {
  edges.value = rels.map(r => ({
    id:     `${r.source}-${r.target}`,
    source: r.source,
    target: r.target,
    type:   'smoothstep',
    label:  r.joinType,
    data:   { joinType: r.joinType },

    style:       { strokeWidth: 2 },
    labelBgStyle:{
      fill: 'rgba(0,0,0,0.6)',
    },

    labelStyle: {
      fill:   '#fff',
      fontSize: '12px',
      fontWeight: 600
    },
  }))
}, { immediate: true, deep: true })

const joinTypes = ['inner', 'left', 'right', 'full']

function handleEdgeClick(edge) {
  if (!edge?.id) return
  const found = findEdge(edge.id)
  if (!found) return

  const next = joinTypes[(joinTypes.indexOf(found.data.joinType) + 1) % joinTypes.length]
  updateEdgeData(edge.id, { joinType: next })
  found.label = next

  emit('update:relations',
    props.relations.map(r =>
      `${r.source}-${r.target}` === edge.id
        ? { ...r, joinType: next }
        : r
    )
  )
}

function openSettingsFor(edge) {
  selectedEdge.value = edge
  isSettingsModalOpen.value = true
}

function removeNode(id) {
  if (props.selectedTables[0]?.id === id) {
    emit('update:selectedTables', [])
    emit('update:relations', [])
    removeNodes(nodes.value.map((n) => n.id))
    return
  }
  removeNodes(id)
  emit(
    'update:selectedTables',
    props.selectedTables.filter((tbl) => {
      const key = (tbl.id || `${tbl.schema}.${tbl.table}`).toString()
      return key !== id
    })
  )
  emit(
    'update:relations',
    props.relations.filter((r) => r.source !== id && r.target !== id)
  )
}

function onExternalDrop(evt) {
  if (!evt.dataTransfer) return
  const raw = evt.dataTransfer.getData('application/json')
  if (!raw) return

  const table = JSON.parse(raw)
  const key   = String(table.id ?? `${table.schema}.${table.table}`)

  // Проверка на дубликаты
  if (props.selectedTables.some(
    t => String(t.id ?? `${t.schema}.${t.table}`) === key
  )) return

  // Формируем новые таблицы и связи
  const newTables = [...props.selectedTables, table]
  let newRelations = [...props.relations]
  if (newTables.length > 1) {
    const source = String(newTables[0].id)
    newRelations = [
      ...newRelations,
      { source, target: key, joinType: 'inner' }
    ]
  }
  emit('drop-table', table)
  emit('update:selectedTables', newTables)
  emit('update:relations',     newRelations)
}


</script>

<style scoped>
.join-builder {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.flow-canvas {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
.table-node {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background: #2b2b2a;
  border: 1px solid #444;
  border-radius: 6px;
  color: #eee;
  font-size: 14px;
}
.table-node.primary-node {
  background: #333;
  border-color: #e53935;
  cursor: default;
}
.node-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}
.node-label {
  flex-grow: 1;
}
.node-remove {
  background: none;
  border: none;
  color: #f66;
  cursor: pointer;
  padding: 0 4px;
}
.node-remove:hover {
  color: #faa;
}
.custom-label {
  position: absolute;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.6);
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 3px;
  cursor: pointer;
  user-select: none;
}
</style>