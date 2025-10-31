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
      <el-table-column label="仓库名称" min-width="125">
        <template #default="{ row, $index }">
          <!-- 详情模式：直接显示仓库名称，避免仅显示ID -->
          <div v-if="disabled">
            {{ row.warehouseName || row.warehouseId || '—' }}
          </div>
          <!-- 编辑模式：仓库下拉 -->
          <el-form-item
            v-else-if="$index > -1"
            :prop="`${$index}.warehouseId`"
            :rules="getWarehouseRules(row)"
            class="mb-0px!"
          >
            <el-select
              v-model="row.warehouseId"
              clearable
              filterable
              :placeholder="getWarehousePlaceholder(row)"
              @change="onChangeWarehouse($event, row)"
            >
              <el-option
                v-for="item in getAvailableWarehouses(row)"
                :key="item.id"
                :label="getWarehouseOptionLabel(item)"
                :value="item.id"
                :disabled="item.disabled === true"
              />
            </el-select>
          </el-form-item>
          <div v-else class="text-gray-400">—</div>
        </template>
      </el-table-column>
      <el-table-column label="产品名称" min-width="180">
        <template #default="{ row, $index }">
          <el-form-item v-if="$index > -1" :prop="`${$index}.productId`" :rules="formRules.productId" class="mb-0px!">
            <el-select
              v-model="row.productId"
              clearable
              filterable
              @change="onChangeProduct($event, row)"
              :disabled="!props.deptId"
              :placeholder="props.deptId ? '请选择产品' : '请先选择单位'"
            >
              <el-option
                v-for="item in productList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <div v-else class="text-gray-400">—</div>
        </template>
      </el-table-column>
      <el-table-column label="批次选择" min-width="200" v-if="showBatchSelection">
        <template #default="{ row, $index }">
          <!-- 详情模式：显示批次名称 -->
          <div v-if="disabled && (row.manageType === 20 || row.manageType === 30)">
            <span v-if="row.batchName">{{ row.batchName }}</span>
            <el-tag v-else-if="row.purchaseInItemId" type="warning" size="small">
              批次ID: {{ row.purchaseInItemId }}
            </el-tag>
            <span v-else class="text-gray-400">—</span>
          </div>
          <!-- 编辑模式：批次选择下拉框 -->
          <el-form-item
            v-else-if="$index > -1 && (row.manageType === 20 || row.manageType === 30)"
            :prop="`${$index}.purchaseInItemId`"
            :rules="formRules.purchaseInItemId"
            class="mb-0px!"
          >
            <el-select
              v-model="row.purchaseInItemId"
              clearable
              filterable
              :placeholder="getBatchPlaceholder(row)"
              @change="onChangeBatch($event, row)"
              @focus="loadBatchList(row)"
            >
              <el-option
                v-for="item in getUniqueBatches(row)"
                :key="item.purchaseInItemId"
                :label="`${item.batchName || '批次' + item.purchaseInItemId} (库存:${item.stockCount || 0})`"
                :value="item.purchaseInItemId"
                :disabled="!item.stockCount || item.stockCount <= 0"
              />
            </el-select>
          </el-form-item>
          <div v-else class="text-gray-400 text-center">—</div>
        </template>
      </el-table-column>
      <el-table-column label="一物一码选择" min-width="150" v-if="showUniqueCodeSelection">
        <template #default="{ row, $index }">
          <!-- 编辑模式 -->
          <el-form-item
            v-if="!disabled && row.manageType === 30"
            :prop="`${$index}.uniqueCodes`"
            :rules="getUniqueCodeRules(row)"
            class="mb-0px!"
          >
            <el-button @click="openUniqueCodeSelectionDialog(row)" type="primary" link>
              选择一物一码
            </el-button>
          </el-form-item>
          <!-- 详情模式 -->
          <div v-else-if="disabled && row.manageType === 30" class="mb-0px">
            <a
              href="javascript:void(0)"
              @click.prevent="openUniqueCodeSelectionDialog(row)"
              class="el-button el-button--info el-button--small is-link"
            >
              {{ row.uniqueCodes && row.uniqueCodes.length > 0 ? `查看${row.uniqueCodes.length}个` : '无一物一码' }}
            </a>
          </div>
          <div v-else class="text-gray-400 text-center">—</div>
        </template>
      </el-table-column>
      <el-table-column label="库存" min-width="100">
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
      <el-table-column label="数量" prop="count" fixed="right" min-width="140">
        <template #default="{ row, $index }">
          <el-form-item v-if="$index > -1" :prop="`${$index}.count`" :rules="formRules.count" class="mb-0px!">
            <el-input-number
              v-model="row.count"
              controls-position="right"
              :min="0.001"
              :max="row.stockCount || undefined"
              :precision="3"
              class="!w-100%"
            />
          </el-form-item>
          <div v-else class="text-gray-400">—</div>
        </template>
      </el-table-column>
      <el-table-column label="产品单价" fixed="right" min-width="120">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.productPrice`" class="mb-0px!">
            <el-input-number
              v-model="row.productPrice"
              controls-position="right"
              :min="0"
              :precision="2"
              class="!w-100%"
            />
            <div v-if="row.originPurchasePrice" class="text-xs text-gray-400 mt-1">
              参考价：{{ erpPriceInputFormatter(row.originPurchasePrice) }}
            </div>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="合计金额" prop="totalPrice" fixed="right" min-width="100">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.totalPrice`" class="mb-0px!">
            <el-input disabled v-model="row.totalPrice" :formatter="erpPriceInputFormatter" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.remark`" class="mb-0px!">
            <el-input v-model="row.remark" placeholder="请输入备注" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="60">
        <template #default="{ $index }">
          <el-button @click="handleDelete($index)" link>—</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-form>
  <el-row justify="center" class="mt-3" v-if="!disabled">
    <el-button @click="handleAdd" round>+ 添加出库产品</el-button>
    <el-button @click="showBatchInputDialog" type="primary" round v-if="props.bizType">
      批量输入一物一码
    </el-button>
  </el-row>

  <!-- 批量输入一物一码对话框 -->
  <el-dialog
    v-model="batchInputDialogVisible"
    title="批量输入一物一码"
    width="600px"
    :close-on-click-modal="false"
  >
    <div>
      <p class="mb-2 text-gray-600">
        请输入一物一码列表，每行一个，或使用扫码枪连续扫描
      </p>
      <el-input
        v-model="batchInputText"
        type="textarea"
        :rows="10"
        placeholder="请输入一物一码，每行一个"
        @keydown.enter="handleBatchInputEnter"
      />
      <p class="mt-2 text-sm text-gray-500">
        已输入 <strong>{{ batchInputLineCount }}</strong> 个一物一码
      </p>
    </div>
    <template #footer>
      <el-button @click="batchInputDialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="handleBatchInputConfirm" :loading="batchInputLoading">
        解析并添加
      </el-button>
    </template>
  </el-dialog>

  <!-- 一物一码选择对话框 -->
  <el-dialog
    v-model="uniqueCodeSelectionDialogVisible"
    title="选择一物一码"
    width="800px"
    :close-on-click-modal="false"
  >
    <div>
      <p class="mb-2">
        需要选择：<strong>{{ Math.floor(currentEditRow?.count || 0) }}</strong> 个
        | 已选择：<strong>{{ selectedUniqueCodes.length }}</strong> 个
      </p>
      <el-table
        ref="uniqueCodeTableRef"
        :data="availableUniqueCodes"
        @selection-change="handleSelectionChange"
        max-height="400"
        v-loading="uniqueCodeLoading"
      >
        <el-table-column
          type="selection"
          width="55"
          :selectable="() => !props.disabled"
        />
        <el-table-column prop="code" label="一物一码" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <template #footer>
      <el-button @click="uniqueCodeSelectionDialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="confirmUniqueCodeSelection">确 定</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ProductApi, ProductVO } from '@/api/erp/product/product'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'
import { StockApi } from '@/api/erp/stock/stock'
import { StockOutApi } from '@/api/erp/stock/out'
import { ErpUniqueCodeApi } from '@/api/erp/product/uniqueCode'
import {
  erpCountInputFormatter,
  erpPriceInputFormatter,
  erpPriceMultiply,
  getSumValue
} from '@/utils'

const props = defineProps<{
  items: any[]
  disabled: boolean
  bizType?: number
  deptId?: number
}>()
const message = useMessage() // 消息提示
const formLoading = ref(false) // 表单的加载中
const formData = ref<any[]>([])
const formRules = reactive({
  inId: [{ required: true, message: '出库编号不能为空', trigger: 'blur' }],
  warehouseId: [{ required: true, message: '仓库不能为空', trigger: 'change' }],
  productId: [{ required: true, message: '产品不能为空', trigger: 'blur' }],
  count: [{ required: true, message: '产品数量不能为空', trigger: 'blur' }],
  purchaseInItemId: [{ required: true, message: '批次不能为空', trigger: 'change' }]
})
const formRef = ref<any>() // 表单 Ref
const productList = ref<ProductVO[]>([]) // 产品列表
const warehouseList = ref<WarehouseVO[]>([]) // 仓库列表
const defaultWarehouse = ref<WarehouseVO | undefined>(undefined) // 默认仓库

// 批次和一物一码相关状态
const uniqueCodeSelectionDialogVisible = ref(false) // 一物一码选择对话框
const uniqueCodeLoading = ref(false) // 一物一码加载中
const currentEditRow = ref<any | null>(null) // 当前编辑行
const selectedUniqueCodes = ref<any[]>([]) // 已选择的一物一码
const availableUniqueCodes = ref<any[]>([]) // 可用的一物一码列表
const uniqueCodeTableRef = ref<any>() // 一物一码表格 Ref

// 批量输入一物一码相关状态
const batchInputDialogVisible = ref(false) // 批量输入对话框
const batchInputText = ref('') // 批量输入文本
const batchInputLoading = ref(false) // 批量输入加载中

// 计算已输入行数
const batchInputLineCount = computed(() => {
  if (!batchInputText.value) return 0
  return batchInputText.value.trim().split('\n').filter(line => line.trim()).length
})

// 行内库存派生数据：按产品+单位加载
// - availableStocks: 后端返回的该产品在当前单位下的所有仓库/批次库存明细
// - batchWarehouses: 选中批次后，该批次在各仓库的库存列表

/** 动态显示批次选择列 */
// 注意：其他出库是由用户手动选择产品后才有manageType，
// 所以这里始终显示列，在列内部根据每行的manageType判断是否显示具体控件
const showBatchSelection = computed(() => {
  return true // 始终显示批次列
})

/** 动态显示一物一码选择列 */
const showUniqueCodeSelection = computed(() => {
  return true // 始终显示一物一码列
})

/** 加载产品在单位下的库存明细（用于批次/仓库联动） */
const loadProductStock = async (row) => {
  if (!row?.productId || !props.deptId) {
    return
  }
  if (row.availableStocks !== undefined) {
    // 已经加载过，但若数据为空，尝试强制刷新一次（避免空缓存）
    if (Array.isArray(row.availableStocks) && row.availableStocks.length === 0) {
      // 继续向下刷新
    } else {
      return
    }
  }
  try {
    const stockList = await StockApi.getProductStockForOperation(row.productId, props.deptId)
    // 保存明细，批次/仓库均在其中
    row.availableStocks = stockList || []
  } catch (e) {
    console.error('加载库存明细失败', e)
    row.availableStocks = []
  }
}

/** 批次聚合：跨仓库累加该批次库存，仅保留库存>0 */
const getUniqueBatches = (row) => {
  if (!row?.availableStocks || row.availableStocks.length === 0) {
    return []
  }
  const source = row.warehouseId
    ? row.availableStocks.filter((s) => s.warehouseId === row.warehouseId)
    : row.availableStocks

  const batchMap = new Map()
  source.forEach((stock) => {
    const batchId = stock.purchaseInItemId
    if (!batchId) return
    const existed = batchMap.get(batchId) || { purchaseInItemId: batchId, batchName: stock.batchName, stockCount: 0 }
    existed.stockCount = (Number(existed.stockCount) || 0) + (Number(stock.stockCount) || 0)
    if (!existed.batchName && stock.batchName) existed.batchName = stock.batchName
    batchMap.set(batchId, existed)
  })
  return Array.from(batchMap.values()).filter(item => (item.stockCount || 0) > 0)
}

/** 批次选择占位文案 */
const getBatchPlaceholder = (row) => {
  if (!props.deptId || !row?.productId) return '请先选择单位和产品'
  if (!row?.availableStocks || row.availableStocks.length === 0) return '暂无可用批次'
  return '请选择批次'
}

/** 获取可用的仓库列表（按产品+单位；选了批次则仅显示该批次有货的仓库） */
const getAvailableWarehouses = (row): any[] => {
  // 当库存明细未加载或为空：回退到全量仓库，避免渲染阶段丢失已选值
  if (!row?.availableStocks || row.availableStocks.length === 0) {
    // 确保当前选中仓库在选项中（若不在列表中则追加一个只读占位项）
    const base: any[] = (warehouseList.value.slice() as any[])
    if (row.warehouseId && !base.some(w => w.id === row.warehouseId)) {
      base.push({ id: row.warehouseId, name: String(row.warehouseName || row.warehouseId) })
    }
    return base
  }

  // 已加载库存：根据是否选择批次决定启用状态与展示库存
  const stockByWarehouse = new Map()
  const stockByWarehouseAndBatch = new Map()
  row.availableStocks.forEach((s) => {
    const totalKey = `${s.warehouseId}`
    stockByWarehouse.set(totalKey, (Number(stockByWarehouse.get(totalKey)) || 0) + (Number(s.stockCount) || 0))
    const batchKey = `${s.warehouseId}-${s.purchaseInItemId || 0}`
    stockByWarehouseAndBatch.set(batchKey, (Number(stockByWarehouseAndBatch.get(batchKey)) || 0) + (Number(s.stockCount) || 0))
  })

  // 以全量仓库为基准，标记可用性，避免 UI 抹掉当前值
  const baseList: any[] = (warehouseList.value.slice() as any[])
  if (row.warehouseId && !baseList.some(w => w.id === row.warehouseId)) {
    baseList.push({ id: row.warehouseId, name: String(row.warehouseName || row.warehouseId) })
  }

  return baseList.map((w) => {
    let stockCount
    let disabled = false
    if (row.purchaseInItemId) {
      stockCount = Number(stockByWarehouseAndBatch.get(`${w.id}-${row.purchaseInItemId}`)) || 0
      disabled = stockCount <= 0
    } else {
      // 未选批次：按产品在该单位的总可用库存提示，可根据业务需要决定是否禁用无库存仓
      stockCount = Number(stockByWarehouse.get(`${w.id}`)) || 0
      disabled = (row.manageType === 20 || row.manageType === 30) ? stockCount <= 0 : false
    }
    // 当前选中的仓库始终可见；若不可用则仅禁用，不移除
    return { ...w, stockCount, disabled }
  })
}

/** 仓库下拉 placeholder 与 label */
const getWarehousePlaceholder = (row) => {
  const list = getAvailableWarehouses(row)
  return list.length === 0 ? '暂无可用仓库' : '请选择仓库'
}
const getWarehouseOptionLabel = (warehouse: any) => {
  const count = warehouse && warehouse.stockCount != null ? warehouse.stockCount : undefined
  return warehouse.name + (count != null ? ` (库存:${count})` : '')
}

const buildRowKey = (row: any) => {
  const manageType = Number(row?.manageType) || 0
  const productId = row?.productId ?? 'null'
  const batchId = row?.purchaseInItemId ?? 'null'
  const warehouseId = row?.warehouseId ?? 'null'
  return `${manageType}__${productId}__${batchId}__${warehouseId}`
}

// 基于行的仓库校验规则：库存已加载后校验仓库与产品/批次匹配性
const getWarehouseRules = (row) => {
  const base = formRules.warehouseId
  return [
    ...base,
    {
      validator: (_rule, value, callback) => {
        // 无值：交由必填规则处理
        if (!value) return callback()
        // 未加载库存：跳过，加载完成后由禁用与变更流程保障
        if (!row?.availableStocks || row.availableStocks.length === 0) return callback()
        // 普通管理：不强制校验库存匹配性（由数量/后端兜底）
        if (row.manageType === 10) return callback()
        // 批次/一码管理：若有批次，需匹配到该批次在该仓有库存；未选批次则需产品在该仓有库存
        if (row.purchaseInItemId) {
          const match = (row.availableStocks || []).find(
            (s) => s.warehouseId === value && s.purchaseInItemId === row.purchaseInItemId && (Number(s.stockCount) || 0) > 0
          )
          return match ? callback() : callback(new Error('所选仓库与批次不匹配或无库存'))
        } else {
          const total = (row.availableStocks || []).filter(s => s.warehouseId === value)
            .reduce((acc, s) => acc + (Number(s.stockCount) || 0), 0)
          return total > 0 ? callback() : callback(new Error('该产品在所选仓库无可用库存'))
        }
      },
      trigger: 'change'
    }
  ]
}

/** 获取一物一码校验规则 */
const getUniqueCodeRules = (row) => {
  if (row.manageType !== 30) return []
  return [
    {
      required: true,
      validator: (_rule, value, callback) => {
        const expectedCount = Math.floor(row.count || 0)
        if (!value || value.length === 0) {
          callback(new Error('请选择一物一码'))
        } else if (value.length !== expectedCount) {
          callback(new Error(`需要选择${expectedCount}个一物一码，当前已选择${value.length}个`))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

/** 获取状态文本 */
const getStatusText = (status: number) => {
  const statusMap = {
    1: '在库',
    2: '已出库',
    3: '已销售',
    7: '已作废',
    8: '上车',
    9: '送修'
  }
  return statusMap[status] || '未知'
}

// 新增：重置仓库列表的方法
const resetWarehouseList = async (isReset: boolean ,newDeptId: number) => {
  warehouseList.value = await WarehouseApi.getWarehouseSimpleListByDeptId(newDeptId)
  defaultWarehouse.value = warehouseList.value.find((item) => item.defaultStatus)
  // 新增：清空所有行仓库的选中
  if (isReset) {
    formData.value.forEach(row => {
      row.warehouseId = undefined
      row.purchaseInItemId = undefined
      row.batchName = undefined
      row.uniqueCodes = []
      row.stockCount = 0
      row.availableStocks = undefined
      row.batchWarehouses = undefined
    })
  }
}

/** 初始化设置出库项（编辑首屏预加载批次与库存） */
watch(
  () => props.items,
  async (val) => {
    if (!val || val.length === 0) {
      formData.value = []
      return
    }

    for (const row of val) {
      try {
        // 仅当有单位与产品时才可预加载
        if (props.deptId && row.productId) {
          if (row.manageType === 20 || row.manageType === 30) {
            // 预加载产品+单位的库存/批次明细
            if (!row.availableStocks || row.availableStocks === undefined) {
              await loadProductStock(row)
            } else if (Array.isArray(row.availableStocks) && row.availableStocks.length === 0) {
              // 空缓存时强制刷新一次
              await loadProductStock(row)
            }

            // 若已有批次，构建批次仓库列表与批次名
            if (row.purchaseInItemId && Array.isArray(row.availableStocks) && row.availableStocks.length > 0) {
              const batchStocks = row.availableStocks.filter((s) => s.purchaseInItemId === row.purchaseInItemId)
              row.batchWarehouses = batchStocks
              const first = batchStocks[0]
              if (first && first.batchName) {
                row.batchName = first.batchName
              }
            }

            // 若已有仓库，回填库存数量
            if (row.warehouseId) {
              await setStockCount(row)
            }
          } else if (row.manageType === 10) {
            // 普通管理：若已有仓库，则同步库存
            if (row.warehouseId) {
              await setStockCount(row)
            }
          }
        }
      } catch (e) {
        console.warn('预加载批次/库存失败:', e)
      }
    }

    formData.value = [...val]
  },
  { immediate: true }
)

/** 监听合同产品变化，计算合同产品总价 */
watch(
  () => formData.value,
  (val) => {
    if (!val || val.length === 0) {
      return
    }
    // 循环处理
    val.forEach((item) => {
      item.totalPrice = erpPriceMultiply(item.productPrice, item.count)
    })
  },
  { deep: true }
)

/** 合计 */
type SummaryMethodProps = { columns: Array<{ property: string }>; data: any[] }
const getSummaries = (param: SummaryMethodProps) => {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (['count', 'totalPrice'].includes(column.property)) {
      const sum = getSumValue(data.map((item) => Number(item[column.property])))
      sums[index] =
        column.property === 'count' ? erpCountInputFormatter(sum) : erpPriceInputFormatter(sum)
    } else {
      sums[index] = ''
    }
  })

  return sums
}

/** 新增按钮操作 */
const handleAdd = () => {
  const row = {
    id: undefined,
    warehouseId: defaultWarehouse.value?.id,
    productId: undefined,
    productName: undefined, // 产品名称
    productUnitName: undefined, // 产品单位
    productBarCode: undefined, // 产品条码
    productPrice: undefined,
    stockCount: undefined,
    count: 1,
    totalPrice: undefined,
    remark: undefined,
    manageType: 10, // 管理类型：10-不管理, 20-批次管理, 30-一物一码管理
    purchaseInItemId: undefined, // 批次ID
    batchName: undefined, // 批次名称
    uniqueCodes: [] // 一物一码列表
  }
  formData.value.push(row)
}

/** 删除按钮操作 */
const handleDelete = (index) => {
  formData.value.splice(index, 1)
}

/** 处理仓库变更（保留兼容的批次） */
const onChangeWarehouse = async (warehouseId, row) => {
  const oldBatchId = row.purchaseInItemId
  row.stockCount = 0

  if (!warehouseId) {
    // 未选择仓库：仅清空仓库相关的库存显示，批次保持不变，由后续选择决定
    return
  }

  // 如果未选产品无需处理
  if (!row.productId) {
    return
  }

  if (row.manageType === 20 || row.manageType === 30) {
    // 批次/一码管理：按产品+单位加载明细后判断旧批次是否存在于新仓
    await loadProductStock(row)

    if (oldBatchId) {
      const match = (row.availableStocks || []).find(
        (s) => s.warehouseId === warehouseId && s.purchaseInItemId === oldBatchId
      )
      if (match) {
        // 旧批次在新仓仍有库存：保留批次，仅刷新库存与批次仓库列表
        row.purchaseInItemId = oldBatchId
        row.batchName = match.batchName
        row.batchWarehouses = (row.availableStocks || []).filter(
          (s) => s.purchaseInItemId === oldBatchId
        )
        row.stockCount = match.stockCount || 0
        // 一物一码需重选（仓库变化可能影响码的可用性）
        row.uniqueCodes = []
        return
      }
    }
    // 旧批次在新仓无库存：清空批次与一码
    row.purchaseInItemId = undefined
    row.batchName = undefined
    row.batchWarehouses = undefined
    row.uniqueCodes = []
    row.stockCount = 0
  } else if (row.manageType === 10) {
    // 普通管理：直接加载库存
    await setStockCount(row)
  }
}

/** 处理产品变更 */
const onChangeProduct = async (productId, row) => {
  const product = productList.value.find((item) => item.id === productId)
  if (!product) {
    return
  }

  // 设置产品基本信息
  row.productName = product.name
  row.productUnitName = product.unitName
  row.productBarCode = product.barCode
  row.productPrice = product.minPrice
  row.manageType = product.batchManage // 初始管理类型；最终以库存接口返回为准

  // 清空批次、一物一码和库存相关数据（避免数据不一致）
  row.purchaseInItemId = undefined
  row.batchName = undefined
  row.uniqueCodes = []
  row.stockCount = 0
  row.availableStocks = undefined
  row.batchWarehouses = undefined

  // 无论管理类型，均预加载“产品+单位”的库存明细，用于后续仓库/批次联动
  await loadProductStock(row)

  // 普通管理下，若已选仓库则同步刷新库存显示
  if (row.manageType === 10 && row.warehouseId) {
    await setStockCount(row)
  }
}

/** 加载库存 */
const setStockCount = async (row) => {
  if (!row.productId || !row.warehouseId) {
    return
  }
  // 批次管理/一物一码管理：需要传批次ID
  const stock = await StockApi.getStock2(row.productId, row.warehouseId, row.purchaseInItemId)
  row.stockCount = stock ? stock.count : 0
}

/** 兼容旧事件：聚合为按产品+单位加载库存明细 */
const loadBatchList = async (row) => {
  if (!props.deptId || !row.productId) {
    message.warning('请先选择单位和产品')
    return
  }
  await loadProductStock(row)
}

/** 处理批次变更（保留兼容的仓库） */
const onChangeBatch = async (purchaseInItemId, row) => {
  if (!purchaseInItemId) {
    // 清空批次时，重置相关字段
    row.batchName = undefined
    row.stockCount = 0
    row.uniqueCodes = []
    return
  }
  // 从 availableStocks 中提取该批次的所有仓库库存
  if (!row.availableStocks || row.availableStocks.length === 0) {
    await loadProductStock(row)
  }
  const batchStocks = (row.availableStocks || []).filter(s => s.purchaseInItemId === purchaseInItemId)
  row.batchWarehouses = batchStocks
  // 批次名称
  const first = batchStocks[0]
  row.batchName = first?.batchName
  // 若已选仓库且属于该批次，则保留并回填库存；否则按规则设置
  if (row.warehouseId) {
    const inBatch = batchStocks.find((s) => s.warehouseId === row.warehouseId)
    if (inBatch) {
      row.stockCount = inBatch.stockCount || 0
    } else if (batchStocks.length === 1) {
      // 已选仓库不兼容且仅一个仓可选：自动切换
      row.warehouseId = batchStocks[0].warehouseId
      row.stockCount = batchStocks[0].stockCount || 0
    } else {
      // 多仓：当前仓不兼容，置空等待用户选择
      row.warehouseId = undefined
      row.stockCount = 0
    }
  } else if (batchStocks.length === 1) {
    // 未选仓且仅一个仓可选：自动选择
    row.warehouseId = batchStocks[0].warehouseId
    row.stockCount = batchStocks[0].stockCount || 0
  } else {
    // 未选仓且多仓可选：等待用户选择
    row.stockCount = 0
  }
  // 数量不超过库存
  if (row.stockCount && row.count > row.stockCount) {
    row.count = row.stockCount
  }
  // 批次变更需要重新选择一物一码
  row.uniqueCodes = []
}

/** 同步对话框中一物一码的勾选状态 */
const syncUniqueCodeSelection = async (row: any) => {
  if (!row) {
    selectedUniqueCodes.value = []
    return
  }

  await nextTick()

  const table = uniqueCodeTableRef.value
  if (!table) {
    return
  }

  table.clearSelection?.()

  const codes = Array.isArray(row.uniqueCodes) ? row.uniqueCodes : []
  if (codes.length === 0) {
    selectedUniqueCodes.value = []
    return
  }

  const matched: any[] = []
  availableUniqueCodes.value.forEach((item) => {
    if (item && codes.includes(item.code)) {
      table.toggleRowSelection?.(item, true)
      matched.push(item)
    }
  })

  selectedUniqueCodes.value = matched
}

/** 打开一物一码选择对话框 */
const openUniqueCodeSelectionDialog = async (row) => {
  // 详情模式：只查看
  if (props.disabled) {
    if (!row.uniqueCodes || row.uniqueCodes.length === 0) {
      message.warning('该行没有一物一码')
      return
    }
    currentEditRow.value = row
    uniqueCodeLoading.value = true
    uniqueCodeSelectionDialogVisible.value = true

    try {
      // 查询这些一物一码的详细信息
      const codes = await ErpUniqueCodeApi.getUniqueCodeListByCodes(row.uniqueCodes)
      availableUniqueCodes.value = codes || []
      await syncUniqueCodeSelection(row)
    } catch (e) {
      console.error('加载一物一码详情失败', e)
      message.error('加载一物一码详情失败')
    } finally {
      uniqueCodeLoading.value = false
    }
    return
  }

  // 编辑模式：选择一物一码
  if (!row.productId) {
    message.warning('请先选择产品')
    return
  }

  if (row.manageType === 30 && !row.purchaseInItemId) {
    message.warning('请先选择批次')
    return
  }

  if (!props.deptId) {
    message.warning('请先选择部门')
    return
  }

  currentEditRow.value = row
  uniqueCodeLoading.value = true
  uniqueCodeSelectionDialogVisible.value = true

  try {
    // 使用 getInStockUniqueCodeList 查询在库的一物一码列表
    // 支持未选择仓库时跨仓加载
    const codes = await ErpUniqueCodeApi.getInStockUniqueCodeList({
      productId: row.productId,
      warehouseId: row.warehouseId || undefined,
      purchaseInItemId: row.purchaseInItemId,
      deptId: props.deptId
    })
    availableUniqueCodes.value = codes || []
    await syncUniqueCodeSelection(row)
  } catch (e) {
    console.error('加载一物一码列表失败', e)
    message.error('加载一物一码列表失败')
  } finally {
    uniqueCodeLoading.value = false
  }
}

/** 处理一物一码选择变更 */
const handleSelectionChange = (selection) => {
  selectedUniqueCodes.value = selection
}

/** 确认一物一码选择 */
const confirmUniqueCodeSelection = () => {
  if (!currentEditRow.value) return

  const expectedCount = Math.floor(currentEditRow.value.count || 0)
  if (selectedUniqueCodes.value.length !== expectedCount) {
    message.error(`需要选择${expectedCount}个一物一码，当前已选择${selectedUniqueCodes.value.length}个`)
    return
  }

  // 判断是否跨仓
  const warehouseIds = [...new Set(selectedUniqueCodes.value.map((uc) => uc.currentWarehouseId))]
  if (warehouseIds.length > 1) {
    // 跨仓选择：按仓库拆分为多行
    handleCrossWarehouseSelection()
    message.success(`已选择${selectedUniqueCodes.value.length}个一物一码，自动拆分为${warehouseIds.length}行`)
  } else {
    // 单仓：直接回填，并在未选仓时自动设置为该仓
    currentEditRow.value.uniqueCodes = selectedUniqueCodes.value.map((item) => item.code)
    if (!currentEditRow.value.warehouseId && warehouseIds.length === 1) {
      currentEditRow.value.warehouseId = warehouseIds[0]
      // 若已构建批次仓库列表，回填库存
      const selectedStock = currentEditRow.value.batchWarehouses?.find((s) => s.warehouseId === warehouseIds[0])
      if (selectedStock) {
        currentEditRow.value.stockCount = selectedStock.stockCount || 0
      }
    }
    message.success('一物一码选择成功')
  }

  // 关闭弹窗
  uniqueCodeSelectionDialogVisible.value = false
}

/** 跨仓选择后，按仓库拆分为多行 */
const handleCrossWarehouseSelection = () => {
  if (!currentEditRow.value) return
  const currentIndex = formData.value.findIndex((item) => item === currentEditRow.value)
  if (currentIndex === -1) return

  // 按仓库分组一物一码
  const groups = new Map()
  selectedUniqueCodes.value.forEach((uc) => {
    const wid = uc.currentWarehouseId
    if (!groups.has(wid)) groups.set(wid, [])
    groups.get(wid).push(uc)
  })

  const original = { ...currentEditRow.value }
  // 删除原行
  formData.value.splice(currentIndex, 1)

  const newRows: any[] = []
  groups.forEach((list, wid) => {
    const stock = (original.batchWarehouses || []).find((s) => s.warehouseId === wid)
    const count = list.length
    const newRow = {
      ...original,
      id: undefined,
      warehouseId: wid,
      count,
      uniqueCodes: list.map((u) => u.code),
      stockCount: stock?.stockCount || 0,
      totalPrice: erpPriceMultiply(original.productPrice, count)
    }
    newRows.push(newRow)
  })

  // 插入新行
  formData.value.splice(currentIndex, 0, ...newRows)
}

/** 显示批量输入对话框 */
const showBatchInputDialog = () => {
  if (!props.deptId) {
    message.warning('请先选择单位')
    return
  }
  if (!props.bizType) {
    message.warning('业务类型未设置')
    return
  }
  batchInputText.value = ''
  batchInputDialogVisible.value = true
}

/** 处理批量输入回车（扫码枪自动换行） */
const handleBatchInputEnter = (_event: KeyboardEvent) => {
  // 允许自然换行，不做特殊处理
}

/** 确认批量输入并解析 */
const handleBatchInputConfirm = async () => {
  const text = batchInputText.value.trim()
  if (!text) {
    message.warning('请输入一物一码')
    return
  }

  // 解析一物一码列表
  const codes = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)

  if (codes.length === 0) {
    message.warning('请输入有效的一物一码')
    return
  }

  batchInputLoading.value = true
  try {
    // 调用后端接口解析并拆分
    const items = await StockOutApi.parseUniqueCodesForStockOut({
      codes,
      deptId: props.deptId!,
      bizType: props.bizType!
    })

    if (!items || items.length === 0) {
      message.warning('未解析到有效的出库项')
      return
    }

    const existingCodeSet = new Set<string>()
    const existingRowMap = new Map<string, any>()
    formData.value.forEach((row) => {
      if (Array.isArray(row.uniqueCodes)) {
        row.uniqueCodes.forEach((code: string) => {
          if (code) existingCodeSet.add(code)
        })
      }
      existingRowMap.set(buildRowKey(row), row)
    })

    const newRows: any[] = []
    const reusedCodes: string[] = []
    const inputDuplicateCodes: string[] = []
    const skippedGroups: string[] = []

    for (const item of items) {
      const row: any = {
        id: undefined,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouseName,
        productId: item.productId,
        productName: item.productName,
        productUnitName: item.productUnitName,
        productBarCode: item.productBarCode,
        productPrice: item.productPrice ?? undefined,
        originPurchasePrice: item.originPurchasePrice,
        stockCount: 0,
        count: Number(item.count) || 0,
        totalPrice: erpPriceMultiply(item.productPrice ?? 0, Number(item.count) || 0),
        remark: undefined,
        manageType: item.manageType,
        purchaseInItemId: item.purchaseInItemId,
        batchName: item.batchName,
        uniqueCodes: Array.isArray(item.uniqueCodes) ? item.uniqueCodes.filter(code => !!code) : [],
        availableStocks: undefined,
        batchWarehouses: undefined
      }

      if (item.productUnitId !== undefined) {
        row.productUnitId = item.productUnitId
      }

      if (Array.isArray(row.uniqueCodes) && row.uniqueCodes.length > 0) {
        const withinRowSet = new Set<string>()
        const uniqueWithinRow: string[] = []
        row.uniqueCodes.forEach((code: string) => {
          if (!code) return
          if (withinRowSet.has(code)) {
            inputDuplicateCodes.push(code)
          } else {
            withinRowSet.add(code)
            uniqueWithinRow.push(code)
          }
        })

        const filteredCodes: string[] = []
        uniqueWithinRow.forEach((code) => {
          if (existingCodeSet.has(code)) {
            reusedCodes.push(code)
          } else {
            filteredCodes.push(code)
          }
        })

        if (filteredCodes.length === 0 && uniqueWithinRow.length > 0) {
          skippedGroups.push(
            `${row.productName || '未知产品'}${row.batchName ? `/${row.batchName}` : ''}${row.warehouseName ? `/${row.warehouseName}` : ''}`
          )
          continue
        }

        if (row.manageType === 30) {
          if (filteredCodes.length === 0) {
            continue
          }
          row.uniqueCodes = filteredCodes
          row.count = filteredCodes.length
          row.totalPrice = erpPriceMultiply(row.productPrice ?? 0, filteredCodes.length)
          filteredCodes.forEach((code) => existingCodeSet.add(code))
        } else {
          row.uniqueCodes = filteredCodes
          filteredCodes.forEach((code) => existingCodeSet.add(code))
        }
      }

      newRows.push(row)
    }

    // 预加载库存明细并补齐库存/批次/仓库信息
    for (const row of newRows) {
      try {
        if (props.deptId && row.productId) {
          if (row.manageType === 20 || row.manageType === 30) {
            await loadProductStock(row)

            if (Array.isArray(row.availableStocks) && row.availableStocks.length > 0) {
              const batchStocks = row.availableStocks.filter(
                (s) => s.purchaseInItemId === row.purchaseInItemId
              )
              if (batchStocks.length > 0) {
                row.batchWarehouses = batchStocks

                // 批次名称兜底
                if (!row.batchName && batchStocks[0]?.batchName) {
                  row.batchName = batchStocks[0].batchName
                }

                const matchedWarehouse = batchStocks.find(
                  (s) => s.warehouseId === row.warehouseId
                )

                if (matchedWarehouse) {
                  row.stockCount = Number(matchedWarehouse.stockCount) || 0
                  if (!row.warehouseName && matchedWarehouse.warehouseName) {
                    row.warehouseName = matchedWarehouse.warehouseName
                  }
                } else if (batchStocks.length === 1) {
                  row.warehouseId = batchStocks[0].warehouseId
                  row.stockCount = Number(batchStocks[0].stockCount) || 0
                  if (!row.warehouseName && batchStocks[0].warehouseName) {
                    row.warehouseName = batchStocks[0].warehouseName
                  }
                } else {
                  row.stockCount = 0
                }
              }
            }
          } else if (row.warehouseId) {
            await setStockCount(row)
          }
        }

        if (!row.warehouseName && row.warehouseId) {
          const found = warehouseList.value.find((w) => w.id === row.warehouseId)
          if (found) {
            row.warehouseName = found.name
          }
        }
      } catch (err) {
        console.warn('预加载库存数据失败', err)
      }
    }

    let addedRowCount = 0
    let mergedRowCount = 0

    for (const row of newRows) {
      const key = buildRowKey(row)
      const target = existingRowMap.get(key)
      if (target) {
        let changed = false

        if (row.manageType === 30) {
          const existingCodes = Array.isArray(target.uniqueCodes) ? new Set<string>(target.uniqueCodes) : new Set<string>()
          let appended = 0
          row.uniqueCodes?.forEach((code: string) => {
            if (!existingCodes.has(code)) {
              existingCodes.add(code)
              appended++
            }
          })
          if (appended > 0) {
            target.uniqueCodes = Array.from(existingCodes)
            target.count = target.uniqueCodes.length
            changed = true
          }
        } else {
          const beforeCount = Number(target.count || 0)
          const addedCount = Number(row.count || 0)
          if (addedCount > 0) {
            target.count = beforeCount + addedCount
            if (target.count !== beforeCount) {
              changed = true
            }
          }
        }

        if (changed) {
          const priceBase = target.productPrice ?? row.productPrice ?? 0
          target.totalPrice = erpPriceMultiply(priceBase, target.count || 0)
          if (!target.warehouseName && row.warehouseName) target.warehouseName = row.warehouseName
          if (!target.batchName && row.batchName) target.batchName = row.batchName
          if (!target.availableStocks && row.availableStocks) target.availableStocks = row.availableStocks
          if (!target.batchWarehouses && row.batchWarehouses) target.batchWarehouses = row.batchWarehouses
          if (!target.stockCount && row.stockCount) target.stockCount = row.stockCount
          mergedRowCount += 1
        }
      } else {
        formData.value.push(row)
        existingRowMap.set(key, row)
        addedRowCount += 1
      }
    }

    if (addedRowCount === 0 && mergedRowCount === 0) {
      message.warning('未添加新的出库项，请检查输入是否重复或无效')
      return
    }

    message.success(`成功解析 ${codes.length} 个一物一码，新增 ${addedRowCount} 行，合并 ${mergedRowCount} 行`)

    const infoMessages: string[] = []
    if (reusedCodes.length > 0) {
      const list = Array.from(new Set(reusedCodes))
      infoMessages.push(`以下一物一码在当前单据中已存在，已忽略：${list.join('、')}`)
    }
    if (inputDuplicateCodes.length > 0) {
      const list = Array.from(new Set(inputDuplicateCodes))
      infoMessages.push(`输入中存在重复一物一码，已自动去重：${list.join('、')}`)
    }
    if (skippedGroups.length > 0) {
      const list = Array.from(new Set(skippedGroups))
      infoMessages.push(`部分产品因全部一物一码重复未添加：${list.join('；')}`)
    }
    infoMessages.forEach((msgText) => message.info(msgText))

    batchInputDialogVisible.value = false
  } catch (e: any) {
    console.error('解析一物一码失败', e)
    message.error(e.message || '解析一物一码失败，请检查输入')
  } finally {
    batchInputLoading.value = false
  }
}

/** 表单校验 */
const validate = () => {
  return formRef.value.validate()
}

/** 获取当前表格数据 */
const getTableData = () => formData.value

defineExpose({ validate, resetWarehouseList, getTableData })

/** 初始化 */
onMounted(async () => {
  productList.value = await ProductApi.getProductSimpleList()
  //warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
  //defaultWarehouse.value = warehouseList.value.find((item) => item.defaultStatus)
  // 默认添加一个
  if (formData.value.length === 0) {
    handleAdd()
  }
})
</script>
