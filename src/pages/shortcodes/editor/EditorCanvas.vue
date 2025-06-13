<template>
  <div class="card shadow-sm mb-4">
    <div class="card-header bg-primary text-white d-flex align-items-center">
      <ListTree class="me-2" />
      <h5 class="mb-0">Рабочая область</h5>
      <div class="ms-auto d-flex gap-2">
        <button class="btn btn-sm btn-success text-white" @click="loadFromDb">
          Загрузить из БД (page=1)
        </button>
        <button class="btn btn-sm btn-primary" @click="saveToDb" :disabled="isSaving">
          <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
          Сохранить в БД
        </button>
        <!-- Кнопка для скрытия/отображения debug-блока -->
        <button class="btn btn-sm btn-outline-warning" @click="showDebug = !showDebug">
          {{ showDebug ? 'Скрыть отладку' : 'Отладка для опытных' }}
        </button>
      </div>
    </div>
    <div class="card-body p-0 position-relative">
      <!-- Drag & Drop дерево -->
      <Draggable
        v-model="internalTree"
        :key="treeKey"
        :external-data-handler="externalDataHandler"
        :on-external-drag-over="() => true"
        :eachDroppable="eachDroppable"
        tree-line
        value-key="uid"
        class="drop-area overflow-auto p-3"
      >
        <template #default="{ node, stat }">
          <div>
            <OpenIcon
              v-if="stat.children.length"
              :open="stat.open"
              class="me-2 text-primary"
              @click="stat.open = !stat.open"
            />
            <div
              class="d-flex justify-content-between align-items-center p-2 mb-2 bg-white rounded shadow-sm"
            >
              <div>
                <b>{{ node.template_name }}</b
                ><br />
                <small class="text-muted">{{ node.component_type }}</small>
              </div>
              <div class="btn-group btn-group-sm">
                <button
                  class="btn btn-outline-secondary"
                  @click="$emit('open-settings', node)"
                  title="Настроить компонент"
                >
                  ⚙️
                </button>
                <button
                  class="btn btn-outline-danger"
                  @click="removeNode(node.uid)"
                  title="Удалить компонент"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </template>
      </Draggable>

      <!-- Debug-блок (деревья, плоское, сравнение) отображается только если showDebug === true -->
      <div v-if="showDebug">
        <div class="row mt-4">
          <div class="col-12 col-md-4">
            <h6>Исходное дерево:</h6>
            <pre class="bg-white border rounded p-2" style="max-height: 320px; overflow: auto"
              >{{ JSON.stringify(internalTree, null, 2) }}
            </pre>
          </div>
          <div class="col-12 col-md-4">
            <h6>Flat-дерево (Линейное дерево):</h6>
            <pre class="bg-white border rounded p-2" style="max-height: 320px; overflow: auto"
              >{{ JSON.stringify(flatTree, null, 2) }}
            </pre>
          </div>
          <div class="col-12 col-md-4">
            <h6>Реверсивно-восстановленное дерево:</h6>
            <pre class="bg-white border rounded p-2" style="max-height: 320px; overflow: auto"
              >{{ JSON.stringify(rebuiltTree, null, 2) }}
            </pre>
          </div>
        </div>
        <div class="mt-3">
          <h6>Различия (Изначальное дерево vs Восстановленное дерево):</h6>
          <pre class="bg-white border rounded p-2" style="max-height: 220px; overflow: auto"
            >{{ diffResult || 'Нет различий!' }}
          </pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ListTree } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import { Draggable, OpenIcon } from '@he-tree/vue'
import { v4 as uuidv4 } from 'uuid'
import { shortcodesService } from '@/js/api/services/shortcodes'

// Модель данных, для привязки свойств
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const treeKey = ref(0)
function forceTreeRerender() {
  treeKey.value++
}

function removeNode(uid) {
  // Проверяем, не последний ли элемент на корневом уровне
  if (internalTree.value.length === 1 && internalTree.value[0].uid === uid) {
    alert('Нельзя удалить последний компонент! В дереве должен быть хотя бы один элемент.')
    return
  }
  function deepRemove(arr) {
    return arr
      .filter((node) => node.uid !== uid)
      .map((node) => ({
        ...node,
        children: node.children ? deepRemove(node.children) : [],
      }))
  }
  const newTree = deepRemove(internalTree.value)
  emit('update:modelValue', Array.isArray(newTree) ? newTree : [])
  forceTreeRerender()
}

const emit = defineEmits(['update:modelValue', 'open-settings'])

// Состояние для отображения debug-блока
const showDebug = ref(false)

// Флаг сохранения (loader)
const isSaving = ref(false)

// Двунаправленное дерево
const internalTree = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// Drag & Drop: проверка на разрешённость вложенности
const eachDroppable = (targetStat) => targetStat.data.allow_children === true

// Обработка внешнего перетаскивания
const externalDataHandler = (event) => {
  const tpl = JSON.parse(event.dataTransfer.getData('application/json'))
  return assignUidsRecursively({
    ...tpl,
    template: tpl.template ?? tpl.id,
    template_name: tpl.template_name ?? tpl.name,
  })
}

// Рекурсивное присваивание уникальных uid для каждого узла дерева
function assignUidsRecursively(node) {
  return {
    ...node,
    uid: uuidv4(),
    children: node.children ? node.children.map(assignUidsRecursively) : [],
  }
}

// Прямое дерево: "выпрямляем" дерево в список объектов с parent, position и т.д.
function flattenTree(tree, parent = null) {
  let result = []
  tree.forEach((node, idx) => {
    const { children, ...rest } = node
    const nodeWithTemplate = {
      ...rest,
      template: rest.template ?? rest.id,
      parent: parent ? parent.uid : null,
      position: idx,
    }
    result.push(nodeWithTemplate)
    if (children && children.length > 0) {
      result = result.concat(flattenTree(children, node))
    }
  })
  return result
}
const flatTree = computed(() => flattenTree(internalTree.value))

// === Восстанавливаем дерево из плоской структуры-структуры ===
function rebuildTree(flat) {
  if (!Array.isArray(flat)) return []
  const map = {}
  const roots = []
  // Создаём копии узлов без детей
  flat.forEach((item) => (map[item.uid] = { ...item, children: [] }))
  // Связываем детей с родителями
  flat.forEach((item) => {
    if (item.parent) {
      // Добавляем как дочерний элемент к родителю
      map[item.parent]?.children.push(map[item.uid])
    } else {
      // Корневые узлы
      roots.push(map[item.uid])
    }
  })
  return roots
}
const rebuiltTree = computed(() => rebuildTree(flatTree.value))

// Проверка по алгоритму на различия: сравниваем исходное дерево и восстановленное дерево по полям
function simpleDiff(a, b, path = '') {
  let out = []
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      out = out.concat(simpleDiff(a[i], b[i], `${path}.${i}`))
    }
    return out
  }
  if (typeof a === 'object' && typeof b === 'object' && a && b) {
    for (const k of Object.keys(a)) {
      if (['parent', 'position', 'uid'].includes(k)) continue
      if (!(k in b)) out.push(`${path}.${k}: Нет во втором`)
      else out = out.concat(simpleDiff(a[k], b[k], `${path}.${k}`))
    }
    for (const k of Object.keys(b)) {
      if (['parent', 'position', 'uid'].includes(k)) continue
      if (!(k in a)) out.push(`${path}.${k}: Нет в первом`)
    }
    return out
  }
  if (a !== b) return [`${path}: "${a}" != "${b}"`]
  return []
}
const diffResult = computed(() => simpleDiff(internalTree.value, rebuiltTree.value).join('\n'))

// Подгрузка дерева из БД
async function loadFromDb() {
  try {
    const resp = await shortcodesService.getInstancesTree({ page: 1 })
    let data = resp.data || resp
    emit('update:modelValue', data)
    forceTreeRerender()
  } catch (e) {
    alert('Ошибка загрузки: ' + (e?.message || e))
  }
}

// Сохранение дерева в БД
async function saveToDb() {
  isSaving.value = true
  try {
    // РЕАЛИЗАЦИЯ ТОЛЬКО ДЛЯ Page.ID = 1, нужна мне для тестирования
    const data = flatTree.value.map((node) => ({ ...node, page: 1 }))
    await shortcodesService.bulkCreateInstances(data)
    await loadFromDb()
  } catch (e) {
    alert('Ошибка сохранения: ' + (e?.message || e))
  } finally {
    isSaving.value = false
  }
}
</script>

<style scoped>
.drop-area {
  min-height: 150px;
  border: 2px dashed var(--bs-primary);
  border-radius: 0.375rem;
  background-color: var(--bs-light);
  transition: background-color 0.2s ease;
}
.drop-area:hover {
  background-color: rgba(var(--bs-primary-rgb), 0.1);
}
.placeholder-text {
  font-style: italic;
  user-select: none;
  font-weight: bold;
}
</style>
