<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    v-loading="formLoading"
    label-width="0px"
    :inline-message="true"
    :disabled="disabled"
  >
    <el-table :data="formData" show-summary :summary-method="getSummaries" class="-mt-10px">
      <el-table-column label="序号" type="index" align="center" width="60" />
      <el-table-column label="调出仓库" min-width="140">
        <template #default="{ row, $index }">
          <el-form-item
            :prop="`${$index}.fromWarehouseId`"
            :rules="formRules.fromWarehouseId"
            class="mb-0px!"
          >
            <el-select
              v-model="row.fromWarehouseId"
              clearable
              filterable
              placeholder="选择调出仓库"
              @change="() => onFromWarehouseChange(row)"
            >
              <el-option
                v-for="item in getFromWarehouseOptions(row)"
                :key="item.id"
                :label="formatWarehouseOptionLabel(item)"
                :value="item.id"
                :disabled="item.disabled"
              />
            </el-select>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="调入仓库" min-width="140">
        <template #default="{ row, $index }">
          <el-form-item
            :prop="`${$index}.toWarehouseId`"
            :rules="formRules.toWarehouseId"
            class="mb-0px!"
          >
            <el-select
              v-model="row.toWarehouseId"
              clearable
              filterable
              placeholder="选择调入仓库"
              @change="() => onToWarehouseChange(row)"
            >
              <el-option
                v-for="item in getToWarehouseOptions(row)"
                :key="item.id"
                :label="formatWarehouseOptionLabel(item)"
                :value="item.id"
                :disabled="item.disabled"
              />
            </el-select>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="产品名称" min-width="180">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.productId`" :rules="formRules.productId" class="mb-0px!">
            <el-select
              v-model="row.productId"
              clearable
              filterable
              :disabled="disabled || !canSelectProduct"
              :placeholder="disabled ? '请选择产品' : canSelectProduct ? '请选择产品' : '请先选择调出和调入单位'"
              @change="(value) => onChangeProduct(value, row)"
            >
              <el-option
                v-for="item in productList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="调出批次" min-width="180">
        <template #default="{ row, $index }">
          <template v-if="showFromBatchSelector(row)">
            <div v-if="disabled" class="text-gray-600">
              {{ getBatchDisplayLabel(row.fromBatchName, row.fromPurchaseInItemId) }}
            </div>
            <el-form-item
              v-else
              :prop="`${$index}.fromPurchaseInItemId`"
              :rules="formRules.fromPurchaseInItemId"
              class="mb-0px!"
            >
              <el-select
                v-model="row.fromPurchaseInItemId"
                clearable
                filterable
                :placeholder="getFromBatchPlaceholder(row)"
                @focus="() => loadFromStocks(row)"
                @change="() => onFromBatchChange(row)"
              >
                <el-option
                  v-for="item in getFromBatchOptions(row)"
                  :key="item.purchaseInItemId"
                  :label="formatBatchOption(item)"
                  :value="item.purchaseInItemId"
                />
              </el-select>
            </el-form-item>
          </template>
          <div v-else class="text-gray-400 text-center">—</div>
        </template>
      </el-table-column>
      <el-table-column label="调入批次" min-width="180">
        <template #default="{ row, $index }">
          <template v-if="showToBatchSelector(row)">
            <div v-if="disabled" class="text-gray-600">
              {{ getBatchDisplayLabel(row.toBatchName, row.toPurchaseInItemId) }}
            </div>
            <el-form-item
              v-else
              :prop="`${$index}.toPurchaseInItemId`"
              :rules="formRules.toPurchaseInItemId"
              class="mb-0px!"
            >
              <el-select
                v-model="row.toPurchaseInItemId"
                clearable
                filterable
                :allow-create="true"
                default-first-option
                :placeholder="getToBatchPlaceholder(row)"
                @focus="() => loadToStocks(row)"
                @change="(value) => onToBatchChange(value, row)"
              >
                <el-option
                  v-for="item in getToBatchOptions(row)"
                  :key="item.purchaseInItemId"
                  :label="formatBatchOption(item)"
                  :value="item.purchaseInItemId"
                />
              </el-select>
            </el-form-item>
          </template>
          <div v-else class="text-gray-400 text-center">—</div>
        </template>
      </el-table-column>
      <el-table-column label="库存" min-width="90">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.stockCount" :formatter="erpCountInputFormatter" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="条码" min-width="150">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.productBarCode" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="单位" min-width="80">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.productUnitName" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="数量" min-width="120">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.count`" :rules="formRules.count" class="mb-0px!">
            <el-input-number
              v-model="row.count"
              controls-position="right"
              :min="1"
              :step="1"
              :precision="0"
              class="!w-100%"
              @change="() => syncCountWithUniqueCodes(row)"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="产品单价" min-width="120">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input-number
              v-model="row.productPrice"
              controls-position="right"
              :min="0"
              :precision="2"
              class="!w-100%"
              @change="() => refreshRowAmount(row)"
            />
            <div v-if="row.originPurchasePrice" class="text-xs text-gray-400 mt-1">
              参考价：{{ erpPriceInputFormatter(row.originPurchasePrice) }}
            </div>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="合计金额" min-width="120">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.totalPrice" :formatter="erpPriceInputFormatter" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="一物一码" min-width="150">
        <template #default="{ row }">
          <el-button
            v-if="!disabled && (row.manageTypeFrom === 30 || row.manageTypeTo === 30)"
            type="primary"
            link
            @click="openUniqueCodeDialog(row)"
          >
            {{ row.uniqueCodes?.length ? `编辑(${row.uniqueCodes.length})` : '填写一物一码' }}
          </el-button>
          <div
            v-else-if="disabled && row.uniqueCodes?.length"
            class="text-primary cursor-pointer"
            @click="openUniqueCodeDialog(row)"
          >
            查看{{ row.uniqueCodes.length }}个
          </div>
          <span v-else class="text-gray-400">—</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.remark`" class="mb-0px!">
            <el-input v-model="row.remark" placeholder="请输入备注" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="60" v-if="!disabled">
        <template #default="{ $index }">
          <el-button @click="handleDelete($index)" link>—</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-form>

  <el-row justify="center" class="mt-3" v-if="!disabled">
    <el-button @click="handleAdd" round :disabled="!canSelectProduct">+ 添加调拨产品</el-button>
    <el-button type="primary" round @click="showBatchParseDialog" :disabled="!canParseUniqueCodes">
      解析一物一码
    </el-button>
  </el-row>

  <!-- 一物一码编辑对话框 -->
  <el-dialog
    v-model="uniqueCodeDialogVisible"
    :title="disabled ? '查看一物一码' : '编辑一物一码'"
    width="600px"
    :close-on-click-modal="false"
  >
    <div v-if="currentEditRow">
      <p class="text-gray-600 mb-2">
        产品：{{ currentEditRow.productName || currentEditRow.productId }}
        <span v-if="currentEditRow.manageTypeFrom === 30 || currentEditRow.manageTypeTo === 30">
          | 需要数量：{{ expectedUniqueCodeCount }}
        </span>
      </p>
      <el-input
        v-model="uniqueCodeInput"
        type="textarea"
        :rows="10"
        :readonly="disabled"
        placeholder="每行一个一物一码，可直接扫码录入"
      />
      <p class="text-sm text-gray-500 mt-2">
        当前共 {{ currentUniqueCodeCount }} 个一物一码
      </p>
    </div>
    <template #footer>
      <el-button @click="uniqueCodeDialogVisible = false">关 闭</el-button>
      <el-button
        v-if="!disabled"
        type="primary"
        @click="confirmUniqueCodes"
      >
        确 定
      </el-button>
    </template>
  </el-dialog>

  <!-- 批量解析一物一码 -->
  <el-dialog
    v-model="batchParseDialogVisible"
    title="批量解析一物一码"
    width="600px"
    :close-on-click-modal="false"
  >
    <p class="text-gray-600 mb-2">
      请输入需要解析的一物一码列表，每行一个，支持连续扫码。解析后将自动拆分调拨明细。
    </p>
    <el-input
      v-model="batchParseText"
      type="textarea"
      :rows="12"
      placeholder="每行输入一个一物一码"
    />
    <p class="mt-2 text-sm text-gray-500">
      已输入 <strong>{{ batchParseCount }}</strong> 个一物一码
    </p>
    <template #footer>
      <el-button @click="batchParseDialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleBatchParse" :loading="batchParseLoading">
        解析并添加
      </el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ProductApi, type ProductVO } from '@/api/erp/product/product'
import { WarehouseApi, type WarehouseVO } from '@/api/erp/stock/warehouse'
import { StockApi } from '@/api/erp/stock/stock'
import {
  StockMoveApi,
  type StockMoveItemVO as StockMoveItemBaseVO,
  type StockMoveItemParseRespVO
} from '@/api/erp/stock/move'
import {
  erpCountInputFormatter,
  erpPriceInputFormatter,
  erpPriceMultiply,
  getSumValue
} from '@/utils'
import { useMessage } from '@/hooks/web/useMessage'

const message = useMessage()

type StockMoveItemVO = StockMoveItemBaseVO & {
  toBatchOptions?: Array<{ purchaseInItemId?: number; batchName?: string; stockCount?: number }>
}

const props = defineProps<{
  items: StockMoveItemVO[]
  disabled: boolean
  deptId?: number
  toDeptId?: number
}>()

const formLoading = ref(false)
const formRef = ref()
const formData = ref<StockMoveItemVO[]>([])
const skipNextCrossReset = ref(true)

type WarehouseOption = WarehouseVO & { disabled?: boolean; stockCount?: number }

const fromWarehouseOptions = ref<WarehouseOption[]>([])
const toWarehouseOptions = ref<WarehouseOption[]>([])
const productList = ref<ProductVO[]>([])
const productStrategyFrom = ref<Record<number, number>>({})
const productStrategyTo = ref<Record<number, number>>({})
const productSourceFrom = ref<ProductVO[]>([])
const productSourceTo = ref<ProductVO[]>([])

const formRules = reactive({
  fromWarehouseId: [{ required: true, message: '调出仓库不能为空', trigger: 'change' }],
  toWarehouseId: [{ required: true, message: '调入仓库不能为空', trigger: 'change' }],
  productId: [{ required: true, message: '产品不能为空', trigger: 'change' }],
  count: [
    { required: true, message: '数量不能为空', trigger: ['blur', 'change'] },
    {
      validator: (_rule: any, value: any, callback: (err?: Error) => void) => {
        const num = Number(value)
        if (!Number.isInteger(num) || num <= 0) {
          callback(new Error('数量必须为正整数'))
          return
        }
        callback()
      },
      trigger: ['blur', 'change']
    }
  ],
  fromPurchaseInItemId: [{ required: true, message: '调出批次不能为空', trigger: 'change' }],
  toPurchaseInItemId: [{ required: true, message: '调入批次不能为空', trigger: 'change' }]
})

const isCrossDept = computed(
  () =>
    props.deptId != null &&
    props.toDeptId != null &&
    props.deptId !== props.toDeptId
)

function syncIntraDeptTarget(row: StockMoveItemVO | undefined) {
  if (!row || props.deptId == null || props.toDeptId == null || isCrossDept.value) {
    return
  }
  row.manageTypeTo = row.manageTypeFrom
  const requiresBatch = row.manageTypeTo === 20 || row.manageTypeTo === 30
  if (requiresBatch) {
    row.toPurchaseInItemId = row.fromPurchaseInItemId
    row.toBatchName = row.fromBatchName
  } else {
    row.toPurchaseInItemId = undefined
    row.toBatchName = undefined
  }
}

function handleAdd() {
  formData.value.push({
    fromWarehouseId: undefined,
    toWarehouseId: undefined,
    productId: undefined,
    productPrice: 0,
    count: 1,
    totalPrice: 0,
    remark: '',
    uniqueCodes: [],
    fromPurchaseInItemId: undefined,
    toPurchaseInItemId: undefined,
    fromStocks: undefined,
    fromAvailableStocks: undefined,
    fromBatchWarehouses: undefined
  })
  const created = formData.value[formData.value.length - 1]
  syncIntraDeptTarget(created)
}

watch(
  () => props.items,
  (val) => {
    formData.value = val || []
    skipNextCrossReset.value = true
    if ((!val || val.length === 0) && !props.disabled) {
      handleAdd()
    }
    if (formData.value.length > 0) {
      formData.value.forEach((row) => {
        if (row.productId) {
          const baseFallback = row.manageTypeFrom ?? row.manageTypeTo ?? 10
          row.manageTypeFrom = getManageTypeFromStrategy('from', row.productId, baseFallback)
          row.manageTypeTo = getManageTypeFromStrategy('to', row.productId, row.manageTypeTo ?? baseFallback)
        }
        syncIntraDeptTarget(row)
      })
    }
  },
  { immediate: true }
)

watch(
  formData,
  (rows) => {
    rows.forEach((row) => {
      refreshRowAmount(row)
      syncIntraDeptTarget(row)
    })
  },
  { deep: true }
)

watch(
  isCrossDept,
  (cross, oldCross) => {
    if (props.disabled) {
      return
    }
    const initializing = oldCross === undefined
    const skipReset = skipNextCrossReset.value && cross
    formData.value.forEach((row) => {
      if (cross) {
        if (!initializing && !skipReset && (row.manageTypeTo === 20 || row.manageTypeTo === 30)) {
          row.toPurchaseInItemId = undefined
          row.toBatchName = undefined
        }
        row.toStocks = undefined
        row.toBatchOptions = undefined
      } else {
        syncIntraDeptTarget(row)
        row.toStocks = undefined
        row.toBatchOptions = undefined
      }
    })
    if (skipReset && cross) {
      skipNextCrossReset.value = false
    } else if (!cross) {
      skipNextCrossReset.value = true
    }
  },
  { immediate: true }
)

const canParseUniqueCodes = computed(() => {
  return Boolean(props.deptId && props.toDeptId && !props.disabled)
})

const canSelectProduct = computed(() => {
  if (props.disabled) {
    return true
  }
  return Boolean(props.deptId && props.toDeptId)
})

const refreshProductOptions = () => {
  if (!canSelectProduct.value) {
    productList.value = []
    return
  }
  if (productSourceFrom.value.length > 0) {
    productList.value = productSourceFrom.value.slice()
    return
  }
  if (productSourceTo.value.length > 0) {
    productList.value = productSourceTo.value.slice()
    return
  }
  productList.value = []
}

const loadDeptStrategy = async (type: 'from' | 'to', deptId?: number) => {
  if (!deptId) {
    if (type === 'from') {
      productStrategyFrom.value = {}
      productSourceFrom.value = []
    } else {
      productStrategyTo.value = {}
      productSourceTo.value = []
    }
    refreshProductOptions()
    return
  }

  try {
    const list = await ProductApi.getProductSimpleList({ deptId })
    const strategyMap: Record<number, number> = {}
    ;(list || []).forEach((item) => {
      if (!item || item.id == null) {
        return
      }
      strategyMap[item.id] = item.batchManage ?? 10
    })

    if (type === 'from') {
      productStrategyFrom.value = strategyMap
      productSourceFrom.value = list || []
    } else {
      productStrategyTo.value = strategyMap
      productSourceTo.value = list || []
    }
  } catch (error) {
    console.error('加载产品策略失败', error)
    if (type === 'from') {
      productStrategyFrom.value = {}
      productSourceFrom.value = []
    } else {
      productStrategyTo.value = {}
      productSourceTo.value = []
    }
  } finally {
    refreshProductOptions()
  }
}

const findProductInfo = (productId?: number) => {
  if (!productId) {
    return undefined
  }
  return (
    productSourceFrom.value.find((item) => item.id === productId) ||
    productSourceTo.value.find((item) => item.id === productId) ||
    productList.value.find((item) => item.id === productId)
  )
}

const getManageTypeFromStrategy = (type: 'from' | 'to', productId?: number, fallback = 10) => {
  if (!productId) {
    return fallback
  }
  const map = type === 'from' ? productStrategyFrom.value : productStrategyTo.value
  const result = map?.[productId]
  return result == null ? fallback : result
}

const showFromBatchSelector = (row: StockMoveItemVO) => {
  return row && (row.manageTypeFrom === 20 || row.manageTypeFrom === 30)
}
const showToBatchSelector = (row: StockMoveItemVO) => {
  return row && isCrossDept.value && (row.manageTypeTo === 20 || row.manageTypeTo === 30)
}

const getFromBatchPlaceholder = (row: StockMoveItemVO) => {
  if (!props.deptId) return '请先选择调出单位'
  if (!row?.productId) return '请先选择产品'
  if (!hasAnyFromBatch(row)) return '暂无可用批次'
  return '选择调出批次'
}

const getToBatchPlaceholder = (row: StockMoveItemVO) => {
  if (!isCrossDept.value) return '同单位调拨无需选择'
  if (!props.toDeptId) return '请先选择调入单位'
  if (!row?.productId) return '请先选择产品'
  const batches = Array.isArray(row?.toBatchOptions) ? row.toBatchOptions : []
  if (batches.length === 0) return '暂无历史批次，可新建批次'
  return '请选择调入批次（允许库存为 0）'
}

const formatBatchOption = (item: any) => {
  const name = item.batchName || `批次${item.purchaseInItemId}`
  const rawCount = Number(item.stockCount ?? 0)
  const hasCount = Number.isFinite(rawCount)
  return hasCount ? `${name} (库存:${erpCountInputFormatter(rawCount)})` : name
}

const getBatchDisplayLabel = (batchName?: string, purchaseInItemId?: number) => {
  if (batchName && String(batchName).trim()) {
    return batchName
  }
  const batchId = toNumberOrUndefined(purchaseInItemId)
  if (batchId != null) {
    return `批次ID: ${batchId}`
  }
  return '—'
}

const ensureWarehouseOptionIncluded = (options: any[], warehouseId?: number, warehouseName?: string) => {
  if (!warehouseId) {
    return
  }
  if (!options.some((item) => item.id === warehouseId)) {
    options.push({
      id: warehouseId,
      name: warehouseName ? String(warehouseName) : String(warehouseId)
    })
  }
}

const formatWarehouseOptionLabel = (item: any) => {
  if (!item) {
    return ''
  }
  const name = item.name ?? `仓库${item.id}`
  const count = item.stockCount
  return count != null ? `${name} (库存:${erpCountInputFormatter(count)})` : name
}

const toNumberOrUndefined = (value: any): number | undefined => {
  const num = Number(value)
  return Number.isFinite(num) ? num : undefined
}

const toPositiveInteger = (value: any): number | undefined => {
  const num = Math.floor(Number(value))
  if (!Number.isFinite(num) || num <= 0) {
    return undefined
  }
  return num
}

const getRawFromStocks = (row: StockMoveItemVO): any[] => {
  if (!row) {
    return []
  }
  if (Array.isArray((row as any).fromAvailableStocks)) {
    return (row as any).fromAvailableStocks
  }
  if (Array.isArray(row.fromStocks)) {
    return row.fromStocks
  }
  return []
}

const buildFromBatchAggregates = (row: StockMoveItemVO, warehouseId?: number | null) => {
  const stocks = getRawFromStocks(row)
  if (!stocks || stocks.length === 0) {
    return []
  }
  const targetWarehouseId = warehouseId == null ? undefined : warehouseId
  const source = targetWarehouseId == null
    ? stocks
    : stocks.filter((stock: any) => toNumberOrUndefined(stock?.warehouseId) === targetWarehouseId)

  const batchMap = new Map<number, { purchaseInItemId: number; batchName?: string; stockCount: number }>()
  source.forEach((stock: any) => {
    const batchId = toNumberOrUndefined(stock?.purchaseInItemId)
    if (batchId == null) {
      return
    }
    const count = Number(stock?.stockCount ?? 0)
    if (!Number.isFinite(count) || count <= 0) {
      return
    }
    const existed = batchMap.get(batchId) || {
      purchaseInItemId: batchId,
      batchName: stock?.batchName,
      stockCount: 0
    }
    existed.stockCount = (Number(existed.stockCount) || 0) + count
    if (!existed.batchName && stock?.batchName) {
      existed.batchName = stock.batchName
    }
    batchMap.set(batchId, existed)
  })
  return Array.from(batchMap.values()).filter((item) => (Number(item.stockCount) || 0) > 0)
}

const hasAnyFromBatch = (row: StockMoveItemVO) => {
  return buildFromBatchAggregates(row).length > 0
}

const buildFromWarehouseStats = (row: StockMoveItemVO) => {
  const stocks = getRawFromStocks(row)
  const totalByWarehouse = new Map<number, number>()
  const batchByWarehouse = new Map<string, number>()

  stocks.forEach((stock: any) => {
    const warehouseId = toNumberOrUndefined(stock?.warehouseId)
    if (warehouseId == null) {
      return
    }
    const count = Number(stock?.stockCount ?? 0)
    if (!Number.isFinite(count) || count <= 0) {
      return
    }
    totalByWarehouse.set(warehouseId, (totalByWarehouse.get(warehouseId) || 0) + count)
    const batchId = toNumberOrUndefined(stock?.purchaseInItemId)
    if (batchId != null) {
      const key = `${warehouseId}-${batchId}`
      batchByWarehouse.set(key, (batchByWarehouse.get(key) || 0) + count)
    }
  })

  return { totalByWarehouse, batchByWarehouse }
}

const getBatchWarehouses = (row: StockMoveItemVO, batchId?: number | null) => {
  const targetBatchId = toNumberOrUndefined(batchId)
  if (targetBatchId == null) {
    return []
  }
  return getRawFromStocks(row).filter(
    (stock: any) => toNumberOrUndefined(stock?.purchaseInItemId) === targetBatchId
  )
}

const refreshFromBatchWarehouses = (row: StockMoveItemVO) => {
  const batchId = toNumberOrUndefined(row.fromPurchaseInItemId)
  if (batchId == null) {
    row.fromBatchWarehouses = undefined
    return
  }
  row.fromBatchWarehouses = getBatchWarehouses(row, batchId)
}

const getFromWarehouseOptions = (row: StockMoveItemVO) => {
  const options = Array.isArray(fromWarehouseOptions.value)
    ? fromWarehouseOptions.value.map((item) => ({ ...item }))
    : []
  ensureWarehouseOptionIncluded(options, row?.fromWarehouseId, row?.fromWarehouseName)
  const stocks = getRawFromStocks(row)
  if (!stocks || stocks.length === 0) {
    return options
  }
  const requireManaged = row && (row.manageTypeFrom === 20 || row.manageTypeFrom === 30)
  const selectedBatchId = toNumberOrUndefined(row?.fromPurchaseInItemId)
  const currentWarehouseId = toNumberOrUndefined(row?.fromWarehouseId)
  const { totalByWarehouse, batchByWarehouse } = buildFromWarehouseStats(row)
  return options.map((item) => {
    const wid = toNumberOrUndefined((item as any)?.id)
    if (wid == null) {
      return { ...item }
    }
    const totalCount = Number(totalByWarehouse.get(wid) ?? 0)
    const batchCount =
      selectedBatchId == null
        ? totalCount
        : Number(batchByWarehouse.get(`${wid}-${selectedBatchId}`) ?? 0)
    const stockCount = selectedBatchId == null ? totalCount : batchCount
    const disabledByBatch =
      selectedBatchId != null && stockCount <= 0 && wid !== currentWarehouseId
    const disabledByStock =
      requireManaged && stockCount <= 0 && wid !== currentWarehouseId
    return {
      ...item,
      stockCount,
      disabled: disabledByBatch || disabledByStock
    }
  })
}

const getToWarehouseOptions = (row: StockMoveItemVO) => {
  const options = Array.isArray(toWarehouseOptions.value)
    ? toWarehouseOptions.value.map((item) => ({ ...item }))
    : []
  ensureWarehouseOptionIncluded(options, row?.toWarehouseId, row?.toWarehouseName)
  const stocks = row?.toStocks
  if (!stocks || stocks.length === 0) {
    return options.map((item) => ({
      ...item,
      stockCount: undefined,
      disabled: item.disabled ?? false
    }))
  }
  const batchId = toNumberOrUndefined(row?.toPurchaseInItemId)
  return options.map((item) => {
    const relatedStocks = stocks.filter((stock: any) => stock.warehouseId === item.id)
    const totalCount = relatedStocks.reduce((sum: number, stock: any) => {
      return sum + Number(stock.stockCount || 0)
    }, 0)
    const batchCount = batchId
      ? relatedStocks
          .filter((stock: any) => stock.purchaseInItemId === batchId)
          .reduce((sum: number, stock: any) => sum + Number(stock.stockCount || 0), 0)
      : totalCount
    const disabled = item.disabled ?? false
    return {
      ...item,
      stockCount: batchId ? batchCount : totalCount,
      disabled
    }
  })
}

const getFromBatchOptions = (row: StockMoveItemVO) => {
  if (!row) {
    return []
  }
  const warehouseId = toNumberOrUndefined(row.fromWarehouseId)
  const options = buildFromBatchAggregates(row, warehouseId)
  const selectedId = toNumberOrUndefined(row.fromPurchaseInItemId)
  if (selectedId != null && !options.some((item: any) => toNumberOrUndefined(item.purchaseInItemId) === selectedId)) {
    options.push({
      purchaseInItemId: selectedId,
      batchName: row.fromBatchName,
      stockCount: Number(row.stockCount ?? 0)
    })
  }
  return options
}

const getToBatchOptions = (row: StockMoveItemVO) => {
  let options = Array.isArray(row?.toBatchOptions) ? row.toBatchOptions.slice() : []
  const selectedId = toNumberOrUndefined(row?.toPurchaseInItemId)
  if (selectedId != null && !options.some((item: any) => toNumberOrUndefined(item?.purchaseInItemId) === selectedId)) {
    options.push({
      purchaseInItemId: selectedId,
      batchName: row?.toBatchName,
      stockCount: undefined
    })
  }
  return options
}

const loadFromStocks = async (row: StockMoveItemVO) => {
  if (!props.deptId || !row.productId) {
    return
  }
  try {
    const stockList =
      (await StockApi.getProductStockForOperation(row.productId, props.deptId)) || []
    row.fromAvailableStocks = stockList
    row.fromStocks = stockList
    refreshFromBatchWarehouses(row)
    const batchId = toNumberOrUndefined(row.fromPurchaseInItemId)
    const currentWarehouseId = toNumberOrUndefined(row.fromWarehouseId)
    if (batchId != null && currentWarehouseId != null) {
      const match = (row.fromBatchWarehouses || []).find(
        (item: any) => toNumberOrUndefined(item?.warehouseId) === currentWarehouseId
      )
      if (match) {
        row.stockCount = Number(match.stockCount ?? 0)
      }
    }
  } catch (error) {
    console.error('加载调出批次失败', error)
    row.fromAvailableStocks = []
    row.fromStocks = []
    row.fromBatchWarehouses = undefined
  }
}

const loadToStocks = async (row: StockMoveItemVO) => {
  if (!props.toDeptId || !row.productId) {
    return
  }
  try {
    const [stockList, batchList] = await Promise.all([
      StockApi.getProductStockForOperation(row.productId, props.toDeptId),
      StockApi.getProductBatchList(row.productId, props.toDeptId)
    ])
    row.toStocks = stockList || []
    row.toBatchOptions = (batchList || []).map((item: any) => ({
      purchaseInItemId: item.purchaseInItemId,
      batchName: item.batchName,
      stockCount: Number(item.stockCount) || 0
    }))
  } catch (error) {
    console.error('加载调入批次失败', error)
    row.toStocks = []
    row.toBatchOptions = []
  }
}

const onFromWarehouseChange = (row: StockMoveItemVO) => {
  if (row.manageTypeFrom === 20 || row.manageTypeFrom === 30) {
    // 仓库变更后校验批次是否仍可用
    const selectedBatchId = toNumberOrUndefined(row.fromPurchaseInItemId)
    if (
      selectedBatchId != null &&
      !getFromBatchOptions(row).some(
        (item: any) => toNumberOrUndefined(item.purchaseInItemId) === selectedBatchId
      )
    ) {
      row.fromPurchaseInItemId = undefined
      row.fromBatchName = undefined
      row.fromBatchWarehouses = undefined
      row.stockCount = 0
    } else {
      refreshFromBatchWarehouses(row)
      const currentWarehouseId = toNumberOrUndefined(row.fromWarehouseId)
      if (currentWarehouseId != null && Array.isArray(row.fromBatchWarehouses)) {
        const match = row.fromBatchWarehouses.find(
          (item: any) => toNumberOrUndefined(item?.warehouseId) === currentWarehouseId
        )
        if (match) {
          row.stockCount = Number(match.stockCount ?? 0)
          if (!row.fromBatchName && match.batchName) {
            row.fromBatchName = match.batchName
          }
        } else {
          row.stockCount = 0
        }
      }
    }
  } else {
    row.fromBatchWarehouses = undefined
  }
  refreshRowStock(row)
  syncIntraDeptTarget(row)
}

const onToWarehouseChange = (row: StockMoveItemVO) => {
  if (row.manageTypeTo !== 20 && row.manageTypeTo !== 30) {
    return
  }
  const options = getToBatchOptions(row)
  const currentBatchId = toNumberOrUndefined(row.toPurchaseInItemId)
  if (
    currentBatchId != null &&
    options.length > 0 &&
    !options.some((item: any) => item.purchaseInItemId === currentBatchId)
  ) {
    row.toBatchName = undefined
  }
}

const onFromBatchChange = (row: StockMoveItemVO) => {
  const batchId = toNumberOrUndefined(row.fromPurchaseInItemId)
  if (batchId == null) {
    row.fromBatchName = undefined
    row.stockCount = 0
    row.fromBatchWarehouses = undefined
    if (row.manageTypeFrom === 30 || row.manageTypeTo === 30) {
      row.uniqueCodes = []
    }
    syncIntraDeptTarget(row)
    return
  }

  const batchWarehouses = getBatchWarehouses(row, batchId)
  row.fromBatchWarehouses = batchWarehouses

  const firstWarehouse = batchWarehouses[0]
  if (firstWarehouse?.batchName) {
    row.fromBatchName = firstWarehouse.batchName
  } else if (batchWarehouses.length === 0) {
    row.fromBatchName = undefined
  }

  const currentWarehouseId = toNumberOrUndefined(row.fromWarehouseId)
  let match =
    currentWarehouseId != null
      ? batchWarehouses.find(
          (item: any) => toNumberOrUndefined(item?.warehouseId) === currentWarehouseId
        )
      : undefined

  if (!match && batchWarehouses.length === 1) {
    const auto = batchWarehouses[0]
    const autoWarehouseId = toNumberOrUndefined(auto?.warehouseId)
    if (autoWarehouseId != null) {
      row.fromWarehouseId = autoWarehouseId
      match = auto
    }
  } else if (!match && currentWarehouseId != null && batchWarehouses.length > 1) {
    row.fromWarehouseId = undefined
  }

  if (match) {
    row.fromBatchName = match.batchName ?? row.fromBatchName
    row.stockCount = Number(match.stockCount ?? 0)
  } else {
    if (batchWarehouses.length === 0) {
      row.fromBatchName = undefined
    }
    row.stockCount = 0
  }

  const maxCount = toPositiveInteger(row.stockCount)
  if (maxCount && Number(row.count ?? 0) > maxCount) {
    row.count = maxCount
  } else {
    const normalized = toPositiveInteger(row.count)
    row.count = normalized ?? row.count
  }
  if (!maxCount && row.stockCount != null) {
    row.count = undefined
  }
  if (row.manageTypeFrom === 30 || row.manageTypeTo === 30) {
    row.uniqueCodes = []
  }
  syncIntraDeptTarget(row)
}

const onToBatchChange = (value: any, row: StockMoveItemVO) => {
  const normalizedId = toNumberOrUndefined(value)
  if (value != null && normalizedId == null) {
    message.warning('批次编号必须为数字')
    row.toPurchaseInItemId = undefined
    row.toBatchName = undefined
    return
  }
  row.toPurchaseInItemId = normalizedId ?? undefined
  const options = getToBatchOptions(row)
  const match = options.find(
    (item: any) => toNumberOrUndefined(item.purchaseInItemId) === toNumberOrUndefined(row.toPurchaseInItemId)
  )
  if (match) {
    row.toBatchName = match.batchName
  } else {
    row.toBatchName = undefined
  }
  if (row.manageTypeFrom === 30 || row.manageTypeTo === 30) {
    row.uniqueCodes = []
  }
}

const refreshRowStock = async (row: StockMoveItemVO) => {
  if (!row.productId || !row.fromWarehouseId) {
    row.stockCount = 0
    return
  }
  try {
    const stock = await StockApi.getStock2(row.productId, row.fromWarehouseId, row.fromPurchaseInItemId)
    row.stockCount = stock ? stock.count : 0
  } catch (error) {
    row.stockCount = 0
  }
}

const onChangeProduct = async (productId: number, row: StockMoveItemVO) => {
  const product = productList.value.find((item) => item.id === productId)
  if (!product) {
    return
  }
  row.productName = product.name
  row.productBarCode = product.barCode
  row.productUnitName = product.unitName
  row.productPrice = product.minPrice ?? 0
  row.originPurchasePrice = product.purchasePrice ?? 0
  const fallbackManageType = product.batchManage ?? 10
  row.manageTypeFrom = getManageTypeFromStrategy('from', productId, fallbackManageType)
  row.manageTypeTo = getManageTypeFromStrategy('to', productId, fallbackManageType)
  row.fromPurchaseInItemId = undefined
  row.toPurchaseInItemId = undefined
  row.fromBatchName = undefined
  row.toBatchName = undefined
  row.uniqueCodes = []
  row.stockCount = 0
  row.fromStocks = undefined
  row.fromAvailableStocks = undefined
  row.fromBatchWarehouses = undefined
  row.toStocks = undefined
  row.toBatchOptions = undefined
  syncIntraDeptTarget(row)
  await Promise.all([loadFromStocks(row), loadToStocks(row)])
  refreshRowAmount(row)
}

const handleDelete = (index: number) => {
  formData.value.splice(index, 1)
}

const getSummaries = (param: any) => {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (['count', 'totalPrice'].includes(column.property)) {
      const sum = getSumValue(data.map((item: any) => Number(item[column.property] || 0)))
      sums[index] =
        column.property === 'count' ? erpCountInputFormatter(sum) : erpPriceInputFormatter(sum)
    } else {
      sums[index] = ''
    }
  })
  return sums
}

const refreshRowAmount = (row: StockMoveItemVO) => {
  row.totalPrice = erpPriceMultiply(row.productPrice || 0, row.count || 0)
}

const buildRowKey = (row: Partial<StockMoveItemVO>) => {
  const productId = row.productId ?? 'null'
  const fromWarehouseId = row.fromWarehouseId ?? 'null'
  const fromBatchId = row.fromPurchaseInItemId ?? 'null'
  const manageFrom = row.manageTypeFrom ?? 'null'
  const manageTo = row.manageTypeTo ?? 'null'
  return `${productId}__${fromWarehouseId}__${fromBatchId}__${manageFrom}__${manageTo}`
}

const describeParsedItem = (item: StockMoveItemParseRespVO) => {
  const name = item.productName || `产品${item.productId ?? ''}`
  const batch = item.fromBatchName ? `/${item.fromBatchName}` : ''
  const warehouse = item.fromWarehouseName ? `/${item.fromWarehouseName}` : ''
  return `${name}${batch}${warehouse}`
}

const ensureVirtualFromBatchOption = (row: StockMoveItemVO) => {
  if (!row.fromPurchaseInItemId || !row.fromBatchName) {
    return
  }
  const stocks = Array.isArray((row as any).fromAvailableStocks)
    ? [...(row as any).fromAvailableStocks]
    : Array.isArray(row.fromStocks)
    ? [...row.fromStocks]
    : []
  const exists = stocks.some(
    (item: any) =>
      item &&
      toNumberOrUndefined(item.purchaseInItemId) === toNumberOrUndefined(row.fromPurchaseInItemId) &&
      toNumberOrUndefined(item.warehouseId) === toNumberOrUndefined(row.fromWarehouseId)
  )
  if (!exists) {
    stocks.push({
      purchaseInItemId: row.fromPurchaseInItemId,
      batchName: row.fromBatchName,
      warehouseId: row.fromWarehouseId,
      stockCount: row.stockCount ?? row.count ?? 0
    })
  }
  row.fromAvailableStocks = stocks
  row.fromStocks = stocks
  refreshFromBatchWarehouses(row)
}

const uniqueCodeDialogVisible = ref(false)
const currentEditRow = ref<StockMoveItemVO | null>(null)
const uniqueCodeInput = ref('')

const expectedUniqueCodeCount = computed(() => {
  if (!currentEditRow.value) return 0
  return Number(currentEditRow.value.count || 0)
})

const currentUniqueCodeCount = computed(() => {
  if (!uniqueCodeInput.value) return 0
  return uniqueCodeInput.value
    .split('\n')
    .map((code) => code.trim())
    .filter((code) => !!code).length
})

const openUniqueCodeDialog = (row: StockMoveItemVO) => {
  currentEditRow.value = row
  uniqueCodeInput.value = (row.uniqueCodes || []).join('\n')
  uniqueCodeDialogVisible.value = true
}

const confirmUniqueCodes = () => {
  if (!currentEditRow.value) return
  const codes = uniqueCodeInput.value
    .split('\n')
    .map((code) => code.trim())
    .filter((code) => !!code)
  const deduped = Array.from(new Set(codes))

  if ((currentEditRow.value.manageTypeFrom === 30 || currentEditRow.value.manageTypeTo === 30) &&
    deduped.length !== expectedUniqueCodeCount.value) {
    message.error(`需要 ${expectedUniqueCodeCount.value} 个一物一码，当前输入 ${deduped.length} 个`)
    return
  }

  currentEditRow.value.uniqueCodes = deduped
  if (currentEditRow.value.manageTypeFrom === 30 || currentEditRow.value.manageTypeTo === 30) {
    currentEditRow.value.count = deduped.length
  }
  refreshRowAmount(currentEditRow.value)
  uniqueCodeDialogVisible.value = false
}

const syncCountWithUniqueCodes = (row: StockMoveItemVO) => {
  if (row.manageTypeFrom === 30 || row.manageTypeTo === 30) {
    const codes = row.uniqueCodes || []
    const countValue = Number(row.count ?? 0)
    if (codes.length > 0 && countValue !== codes.length) {
      row.uniqueCodes = countValue > 0 ? codes.slice(0, countValue) : []
    }
    if ((!row.uniqueCodes || row.uniqueCodes.length === 0) && countValue > 0) {
      // 保持数量但提示用户填写编码
    }
  }
  const normalized = toPositiveInteger(row.count)
  if (normalized != null) {
    row.count = normalized
  }
  refreshRowAmount(row)
}

const batchParseDialogVisible = ref(false)
const batchParseText = ref('')
const batchParseLoading = ref(false)

const batchParseCount = computed(() => {
  if (!batchParseText.value) return 0
  return batchParseText.value
    .split('\n')
    .map((code) => code.trim())
    .filter((code) => !!code).length
})

const showBatchParseDialog = () => {
  if (!props.deptId || !props.toDeptId) {
    message.warning('请先选择调出和调入单位')
    return
  }
  batchParseText.value = ''
  batchParseDialogVisible.value = true
}

/**
 * 批量解析一物一码并添加到调拨单
 *
 * 该方法处理用户批量输入的一物一码，完成以下工作：
 * 1. 对输入的一物一码进行去重处理
 * 2. 调用后端API解析一物一码（查询归属产品、仓库、批次等信息）
 * 3. 将解析结果通过 addParsedRows 方法智能合并到表单中
 *
 * @async
 */
const handleBatchParse = async () => {
  // ========== 第一步：前置校验 ==========
  // 1.1 检查调出单位和调入单位是否已选择
  if (!props.deptId || !props.toDeptId) {
    message.warning('请先选择调出和调入单位')
    return
  }

  // 1.2 解析用户输入的一物一码列表（按行分隔，去除空白）
  const rawCodes = batchParseText.value
    .split('\n')
    .map((code) => code.trim())
    .filter((code) => !!code)

  // 1.3 检查是否有输入
  if (rawCodes.length === 0) {
    message.warning('请先输入一物一码')
    return
  }

  // ========== 第二步：输入去重处理 ==========
  // 2.1 对输入中的重复一物一码进行去重（提高后端查询效率）
  const seenInputCodes = new Set<string>()
  const duplicateInputCodes: string[] = []  // 记录重复的码（用于提示用户）
  const codes: string[] = []                 // 去重后的码列表

  rawCodes.forEach((code) => {
    if (seenInputCodes.has(code)) {
      duplicateInputCodes.push(code)
      return
    }
    seenInputCodes.add(code)
    codes.push(code)
  })

  // 2.2 如果去重后为空，提示用户
  if (codes.length === 0) {
    message.warning('输入的一物一码均为重复项，请检查后再试')
    return
  }

  // 2.3 如果存在重复，提示用户已自动去重
  if (duplicateInputCodes.length > 0) {
    message.info(`输入中存在重复一物一码，已自动去重：${Array.from(new Set(duplicateInputCodes)).join('、')}`)
  }

  // ========== 第三步：调用后端API解析一物一码 ==========
  batchParseLoading.value = true
  try {
    // 3.1 调用后端接口，解析一物一码的归属信息
    const resp = await StockMoveApi.parseUniqueCodesForStockMove({
      codes,
      deptId: props.deptId,
      toDeptId: props.toDeptId
    })

    // 3.2 检查解析结果
    if (!resp || resp.length === 0) {
      message.warning('未解析到有效的调拨行')
      return
    }

    // 3.3 将解析结果添加到表单（智能合并）
    const processed = addParsedRows(resp)

    // 3.4 如果成功处理，关闭对话框
    if (processed) {
      batchParseDialogVisible.value = false
    }
  } catch (error: any) {
    console.error('解析一物一码失败', error)
    message.error(error?.message || '解析一物一码失败，请检查输入')
  } finally {
    batchParseLoading.value = false
  }
}

/**
 * 添加解析后的调拨明细行（支持智能合并）
 *
 * 该方法是前端最复杂的逻辑之一，主要完成以下工作：
 * 1. 检测一物一码的重复性（与表单中已有数据对比）
 * 2. 智能合并相同产品、仓库、批次、管理类型的调拨行
 * 3. 处理一物一码管理和非一物一码管理两种场景的数据聚合
 * 4. 提供详细的用户反馈（新增、合并、重复、跳过）
 *
 * @param items 后端解析返回的调拨明细列表
 * @returns {boolean} 是否成功添加或合并了数据
 */
const addParsedRows = (items: StockMoveItemParseRespVO[]) => {
  // ========== 前置校验：空数据检查 ==========
  if (!items || items.length === 0) {
    return false
  }

  // ========== 第一步：构建已有数据的索引 ==========
  // 1.1 构建一物一码去重集合（用于快速检测重复）
  const existingCodeSet = new Set<string>()

  // 1.2 构建调拨行索引Map（用于智能合并，Key = 产品+仓库+批次+管理类型）
  const existingRowMap = new Map<string, StockMoveItemVO>()

  // 1.3 遍历表单中已有的调拨行，建立索引
  formData.value.forEach((row) => {
    // 收集已有的一物一码
    if (Array.isArray(row.uniqueCodes)) {
      row.uniqueCodes.forEach((code) => {
        if (code) {
          existingCodeSet.add(code)
        }
      })
    }
    // 建立行的唯一标识（相同标识的行可以合并）
    existingRowMap.set(buildRowKey(row), row)
  })

  // ========== 第二步：准备统计变量 ==========
  // 2.1 重复码统计（用于用户反馈）
  const duplicateAcrossForm = new Set<string>()      // 与表单中已有数据重复的一物一码
  const duplicateWithinResponse = new Set<string>()  // 解析结果内部重复的一物一码
  const skippedGroups: string[] = []                  // 因一物一码全部重复而跳过的产品组

  // 2.2 操作统计
  let addedRowCount = 0    // 新增的调拨行数量
  let mergedRowCount = 0   // 合并到现有行的数量

  // ========== 第三步：逐项处理解析结果 ==========
  items.forEach((item) => {
    // 3.1 判断该项是否为一物一码管理
    const manageTypeUnique = item.manageTypeFrom === 30 || item.manageTypeTo === 30

    // 3.2 提取该项的一物一码列表
    const rawCodes = Array.isArray(item.uniqueCodes) ? item.uniqueCodes.filter((code) => !!code) : []

    // 3.3 检测一物一码重复性（多层去重）
    const withinRowSet = new Set<string>()  // 该项内部的去重集合
    const usableCodes: string[] = []         // 可用的一物一码列表（已去重）

    rawCodes.forEach((code) => {
      // 检测1：该项内部是否重复（同一个解析项中出现多次）
      if (withinRowSet.has(code)) {
        duplicateWithinResponse.add(code)
        return
      }
      withinRowSet.add(code)

      // 检测2：与表单中已有数据是否重复
      if (existingCodeSet.has(code)) {
        duplicateAcrossForm.add(code)
        return
      }

      // 通过所有检测，加入可用列表
      usableCodes.push(code)
    })

    // 3.4 判断是否跳过该项（一物一码管理模式下，所有码都重复则跳过）
    if (manageTypeUnique && rawCodes.length > 0 && usableCodes.length === 0) {
      skippedGroups.push(describeParsedItem(item))
      return
    }

    // 3.5 构建该项的唯一标识（用于查找是否有可合并的现有行）
    const targetKey = buildRowKey({
      productId: item.productId,
      fromWarehouseId: item.fromWarehouseId,
      fromPurchaseInItemId: item.fromPurchaseInItemId,
      manageTypeFrom: item.manageTypeFrom,
      manageTypeTo: item.manageTypeTo
    })

    // 3.6 查找是否存在可合并的现有行
    const targetRow = existingRowMap.get(targetKey)
    const priceBase = item.productPrice ?? 0

    // ===== 场景1：找到可合并的现有行 =====
    if (targetRow) {
      let changed = false

      if (manageTypeUnique) {
        // ===== 场景1.1：一物一码管理模式 - 追加一物一码 =====
        const targetCodeSet = new Set<string>(targetRow.uniqueCodes || [])
        const appended: string[] = []  // 成功追加的一物一码

        usableCodes.forEach((code) => {
          if (!targetCodeSet.has(code)) {
            targetCodeSet.add(code)
            appended.push(code)
          } else {
            // 与现有行内部重复（二次检测，理论上不应发生）
            duplicateAcrossForm.add(code)
          }
        })

        if (appended.length > 0) {
          // 更新一物一码列表和数量（一物一码模式下，数量 = 一物一码数量）
          targetRow.uniqueCodes = Array.from(targetCodeSet)
          targetRow.count = targetRow.uniqueCodes.length
          targetRow.totalPrice = erpPriceMultiply(targetRow.productPrice ?? priceBase, targetRow.count || 0)

          // 更新全局索引（防止后续重复）
          appended.forEach((code) => existingCodeSet.add(code))
          changed = true
        }
      } else {
        // ===== 场景1.2：非一物一码管理模式 - 累加数量 =====
        const addedCount = toPositiveInteger(item.count) ?? 0
        if (addedCount > 0) {
          const before = toPositiveInteger(targetRow.count) ?? 0
          targetRow.count = before + addedCount
          targetRow.totalPrice = erpPriceMultiply(targetRow.productPrice ?? priceBase, targetRow.count || 0)
          changed = true
        }

        // 即使非一物一码模式，也可能有一物一码（用于追踪或备注）
        if (usableCodes.length > 0) {
          const stash = Array.isArray(targetRow.uniqueCodes) ? targetRow.uniqueCodes : []
          usableCodes.forEach((code) => {
            stash.push(code)
            existingCodeSet.add(code)
          })
          targetRow.uniqueCodes = stash
          changed = true
        }
      }

      // 3.7 如果数据发生变更，补充产品信息并统计
      if (changed) {
        // 补充可能缺失的产品基础信息（以解析结果为准）
        if (!targetRow.productName && item.productName) targetRow.productName = item.productName
        if (!targetRow.productBarCode && item.productBarCode) targetRow.productBarCode = item.productBarCode
        if (!targetRow.productUnitName && item.productUnitName) targetRow.productUnitName = item.productUnitName
        if (targetRow.productPrice == null && item.productPrice != null) targetRow.productPrice = item.productPrice
        if (targetRow.originPurchasePrice == null && item.originPurchasePrice != null) {
          targetRow.originPurchasePrice = item.originPurchasePrice
        }
        if (!targetRow.fromBatchName && item.fromBatchName) targetRow.fromBatchName = item.fromBatchName

        if (targetRow.productId) {
          const baseFallback = targetRow.manageTypeFrom ?? targetRow.manageTypeTo ?? 10
          targetRow.manageTypeFrom = getManageTypeFromStrategy('from', targetRow.productId, baseFallback)
          targetRow.manageTypeTo = getManageTypeFromStrategy('to', targetRow.productId, targetRow.manageTypeTo ?? baseFallback)
        }

        // 确保批次选项可用（添加虚拟批次选项到下拉列表）
        ensureVirtualFromBatchOption(targetRow)

        // 同步同单位调拨的调入批次
        syncIntraDeptTarget(targetRow)

        // 更新索引
        existingRowMap.set(targetKey, targetRow)

        // 统计合并数量
        mergedRowCount += 1
      }
      return  // 处理完毕，继续下一项
    }

    // ===== 场景2：未找到可合并行，需要新建调拨行 =====

    // 3.8 计算调拨数量
    const countBaseRaw = manageTypeUnique ? usableCodes.length : Number(item.count || usableCodes.length || 0)
    const countBase = toPositiveInteger(countBaseRaw)

    // 3.9 如果数量为0，跳过该项
    if (!countBase) {
      skippedGroups.push(describeParsedItem(item))
      return
    }

    // 3.10 创建新的调拨行
    const row: StockMoveItemVO = {
      fromWarehouseId: item.fromWarehouseId,
      toWarehouseId: undefined,  // 调入仓库需要用户手动选择
      productId: item.productId,
      productPrice: priceBase,
      count: countBase,
      totalPrice: erpPriceMultiply(priceBase, countBase),
      remark: '',
      productName: item.productName,
      productBarCode: item.productBarCode,
      productUnitName: item.productUnitName,
      productUnitId: item.productUnitId,
      uniqueCodes: usableCodes.slice(),  // 复制可用的一物一码
      fromPurchaseInItemId: item.fromPurchaseInItemId,
      fromBatchName: item.fromBatchName,
      manageTypeFrom: item.manageTypeFrom,
      manageTypeTo: item.manageTypeTo,
      originPurchasePrice: item.originPurchasePrice
    }
    if (row.productId) {
      const baseFallback = row.manageTypeFrom ?? row.manageTypeTo ?? 10
      row.manageTypeFrom = getManageTypeFromStrategy('from', row.productId, baseFallback)
      row.manageTypeTo = getManageTypeFromStrategy('to', row.productId, row.manageTypeTo ?? baseFallback)
    }
    row.stockCount = Number(item.count || countBase || 0)

    // 3.11 确保批次选项可用
    ensureVirtualFromBatchOption(row)

    // 3.12 添加到表单数据
    formData.value.push(row)
    existingRowMap.set(targetKey, row)

    // 3.13 更新全局一物一码索引
    usableCodes.forEach((code) => existingCodeSet.add(code))

    // 3.14 统计新增数量
    addedRowCount += 1

    // 3.15 同步同单位调拨的调入批次
    syncIntraDeptTarget(row)

    // 3.16 异步加载调出和调入的批次选项
    loadFromStocks(row)
    loadToStocks(row)
  })

  // ========== 第四步：统计并反馈处理结果 ==========

  // 4.1 如果没有任何新增或合并，提示用户并给出详细原因
  if (addedRowCount === 0 && mergedRowCount === 0) {
    message.warning('未添加新的调拨行，请检查输入是否重复或无效')

    // 提供详细的重复信息
    if (duplicateAcrossForm.size > 0) {
      message.info(`以下一物一码已在当前单据中存在，已忽略：${Array.from(duplicateAcrossForm).join('、')}`)
    }
    if (duplicateWithinResponse.size > 0) {
      message.info(`解析结果中存在重复一物一码，已自动去重：${Array.from(duplicateWithinResponse).join('、')}`)
    }
    if (skippedGroups.length > 0) {
      message.info(`以下产品因一物一码全部重复未添加：${Array.from(new Set(skippedGroups)).join('；')}`)
    }

    return false  // 操作失败
  }

  // 4.2 成功添加或合并，提示用户
  message.success(`成功解析 ${items.length} 条调拨记录，新增 ${addedRowCount} 行，合并 ${mergedRowCount} 行`)

  // 4.3 如果有重复或跳过的情况，也提示用户
  if (duplicateAcrossForm.size > 0) {
    message.info(`以下一物一码已在当前单据中存在，已忽略：${Array.from(duplicateAcrossForm).join('、')}`)
  }
  if (duplicateWithinResponse.size > 0) {
    message.info(`解析结果中存在重复一物一码，已自动去重：${Array.from(duplicateWithinResponse).join('、')}`)
  }
  if (skippedGroups.length > 0) {
    message.info(`以下产品因一物一码全部重复未添加：${Array.from(new Set(skippedGroups)).join('；')}`)
  }

  return true  // 操作成功
}

const throwValidationError = (msg: string) => {
  message.error(msg)
  throw new Error(msg)
}

const validate = async () => {
  if (!props.deptId || !props.toDeptId) {
    throwValidationError('请先选择调出单位和调入单位')
  }
  await formRef.value.validate()
  for (const row of formData.value) {
    if (!row.productId) {
      throwValidationError('存在未选择产品的调拨行')
    }
    if (!row.fromWarehouseId) {
      throwValidationError('存在未选择调出仓库的调拨行')
    }
    if (!row.toWarehouseId) {
      throwValidationError('存在未选择调入仓库的调拨行')
    }
    const countValue = Number(row.count ?? 0)
    if (!Number.isInteger(countValue) || countValue <= 0) {
      throwValidationError('调拨数量必须为正整数')
    }
    if (row.manageTypeFrom === 30 || row.manageTypeTo === 30) {
      const uniqueCodes = row.uniqueCodes ?? []
      if (uniqueCodes.length === 0) {
        throwValidationError('一物一码管理的行必须填写一物一码')
      }
      if (uniqueCodes.length !== countValue) {
        throwValidationError('一物一码数量必须与调拨数量一致')
      }
    }
    if ((row.manageTypeFrom === 20 || row.manageTypeFrom === 30) && !row.fromPurchaseInItemId) {
      throwValidationError('批次管理的调出行必须选择调出批次')
    }
    if (
      isCrossDept.value &&
      (row.manageTypeTo === 20 || row.manageTypeTo === 30) &&
      !row.toPurchaseInItemId
    ) {
      throwValidationError('批次管理的调入行必须选择调入批次')
    }
  }
}

const resetWarehouseList = async (isReset: boolean, type: 'from' | 'to', deptId?: number) => {
  if (type === 'from') {
    if (!deptId) {
      fromWarehouseOptions.value = []
      await loadDeptStrategy('from', undefined)
    } else {
      const [warehouses] = await Promise.all([
        WarehouseApi.getWarehouseSimpleListByDeptId(deptId),
        loadDeptStrategy('from', deptId)
      ])
      fromWarehouseOptions.value = warehouses
    }
  } else {
    if (!deptId) {
      toWarehouseOptions.value = []
      await loadDeptStrategy('to', undefined)
    } else {
      const [warehouses] = await Promise.all([
        WarehouseApi.getWarehouseSimpleListByDeptId(deptId),
        loadDeptStrategy('to', deptId)
      ])
      toWarehouseOptions.value = warehouses
    }
  }

  if (!isReset) {
    if (type === 'to') {
      formData.value.forEach((row) => {
        if (!row.productId) {
          return
        }
        const product = findProductInfo(row.productId)
        const fallback = row.manageTypeTo ?? product?.batchManage ?? 10
        const nextType = getManageTypeFromStrategy('to', row.productId, fallback)
        if (row.manageTypeTo !== nextType) {
          row.manageTypeTo = nextType
          if (!isCrossDept.value) {
            syncIntraDeptTarget(row)
          }
        }
      })
    }
    return
  }

  formData.value.forEach((row) => {
    if (type === 'from') {
      row.fromWarehouseId = undefined
      row.fromPurchaseInItemId = undefined
      row.fromBatchName = undefined
      row.fromStocks = undefined
      row.fromAvailableStocks = undefined
      row.fromBatchWarehouses = undefined
      row.stockCount = 0
      row.productId = undefined
      row.productName = undefined
      row.productBarCode = undefined
      row.productUnitName = undefined
      row.productUnitId = undefined
      row.productPrice = 0
      row.originPurchasePrice = undefined
      row.count = undefined
      row.totalPrice = 0
      row.uniqueCodes = []
      row.manageTypeFrom = undefined
      row.manageTypeTo = undefined
      row.toWarehouseId = undefined
      row.toPurchaseInItemId = undefined
      row.toBatchName = undefined
      row.toStocks = undefined
      row.toBatchOptions = undefined
      row.remark = ''
    } else {
      row.toWarehouseId = undefined
      row.toPurchaseInItemId = undefined
      row.toBatchName = undefined
      row.toStocks = undefined
      row.toBatchOptions = undefined
      if (row.productId) {
        const product = findProductInfo(row.productId)
        const fallback = row.manageTypeTo ?? product?.batchManage ?? 10
        row.manageTypeTo = getManageTypeFromStrategy('to', row.productId, fallback)
      } else {
        row.manageTypeTo = undefined
      }
      row.uniqueCodes = []
    }
    refreshRowAmount(row)
    syncIntraDeptTarget(row)
  })

  if (type === 'from' && !props.disabled && formData.value.length === 0) {
    handleAdd()
  }
}

onMounted(async () => {
  if (props.deptId) {
    await resetWarehouseList(false, 'from', props.deptId)
  } else {
    await loadDeptStrategy('from', undefined)
  }
  if (props.toDeptId) {
    await resetWarehouseList(false, 'to', props.toDeptId)
  } else {
    await loadDeptStrategy('to', undefined)
  }
  if (!props.disabled && formData.value.length === 0) {
    handleAdd()
  }
})

defineExpose({
  validate,
  resetWarehouseList,
  showBatchParseDialog
})
</script>
