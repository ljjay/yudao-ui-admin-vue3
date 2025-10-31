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
          <el-form-item
            :prop="`${$index}.warehouseId`"
            :rules="formRules.warehouseId"
            class="mb-0px!"
          >
            <el-select
              v-model="row.warehouseId"
              clearable
              filterable
              placeholder="请选择仓库"
              @change="onChangeWarehouse($event, row)"
            >
              <el-option
                v-for="item in warehouseList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
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
              @change="onChangeProduct($event, row)"
              placeholder="请选择产品"
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
            v-else-if="row.manageType === 20 || row.manageType === 30"
            :prop="`${$index}.purchaseInItemId`"
            :rules="formRules.purchaseInItemId"
            class="mb-0px!"
          >
            <el-select
              v-model="row.purchaseInItemId"
              clearable
              filterable
              placeholder="请先选择产品和单位"
              @change="onChangeBatch($event, row)"
              @focus="loadBatchList(row)"
            >
              <el-option
                v-for="item in getAvailableBatches(row)"
                :key="item.purchaseInItemId"
                :label="`${item.batchName || '批次' + item.purchaseInItemId} (库存:${item.stockCount || 0})`"
                :value="item.purchaseInItemId"
              />
            </el-select>
          </el-form-item>
          <div v-else class="text-gray-400 text-center">—</div>
        </template>
      </el-table-column>
      <el-table-column label="一物一码输入" min-width="150" v-if="showUniqueCodeInput">
        <template #default="{ row, $index }">
          <!-- 编辑模式 -->
          <el-form-item
            v-if="!disabled && row.manageType === 30"
            :prop="`${$index}.uniqueCodes`"
            :rules="getUniqueCodeRules(row)"
            class="mb-0px!"
          >
            <el-button @click="openUniqueCodeInputDialog(row)" type="primary" link>
              输入一物一码
            </el-button>
          </el-form-item>
          <!-- 详情模式 -->
          <div v-else-if="disabled && row.manageType === 30" class="mb-0px">
            <a
              href="javascript:void(0)"
              @click.prevent="openUniqueCodeInputDialog(row)"
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
          <el-form-item :prop="`${$index}.count`" :rules="formRules.count" class="mb-0px!">
            <el-input-number
              v-model="row.count"
              controls-position="right"
              :min="0.001"
              :precision="3"
              class="!w-100%"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="产品单价" fixed="right" min-width="150">
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
    <el-button @click="handleAdd" round>+ 添加入库产品</el-button>
    <el-button @click="openBatchUniqueCodeDialog" round type="primary">批量输入一物一码</el-button>
  </el-row>

  <!-- 一物一码输入对话框 -->
  <el-dialog
    v-model="uniqueCodeDialogVisible"
    title="输入一物一码"
    width="600px"
    :close-on-click-modal="false"
  >
    <div>
      <p class="mb-2">
        产品：<strong>{{ currentEditRow?.productName }}</strong>
        | 需要输入：<strong>{{ Math.floor(currentEditRow?.count || 0) }}</strong> 个
      </p>
      <p class="text-gray-500 text-sm mb-2">
        提示：每行一个一物一码，或使用逗号、空格分隔
      </p>
      <el-input
        v-model="uniqueCodeInput"
        type="textarea"
        :rows="10"
        placeholder="请输入一物一码，每行一个或用逗号分隔"
      />
    </div>
    <template #footer>
      <el-button @click="uniqueCodeDialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="confirmUniqueCodeInput">确 定</el-button>
    </template>
  </el-dialog>

  <!-- 批量输入一物一码对话框 -->
  <el-dialog
    v-model="batchUniqueCodeDialogVisible"
    title="批量输入一物一码（自动拆分）"
    width="700px"
    :close-on-click-modal="false"
  >
    <div>
      <p class="text-gray-500 text-sm mb-2">
        提示：系统将自动根据一物一码查询产品和批次信息，并按产品+批次自动拆分入库项
      </p>
      <el-input
        v-model="batchUniqueCodeInput"
        type="textarea"
        :rows="12"
        placeholder="请输入一物一码，每行一个或用逗号、空格分隔（支持扫码枪）"
      />
    </div>
    <template #footer>
      <el-button @click="batchUniqueCodeDialogVisible = false">取 消</el-button>
      <el-button type="primary" @click="confirmBatchUniqueCodeInput" :loading="batchParseLoading">
        解析并添加
      </el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { ProductApi, ProductVO } from '@/api/erp/product/product'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'
import { StockApi } from '@/api/erp/stock/stock'
import { StockInApi } from '@/api/erp/stock/in'
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
const message = useMessage() // 消息弹窗
const formLoading = ref(false) // 表单的加载中
const formData = ref<any[]>([])
const formRules = reactive({
  inId: [{ required: true, message: '入库编号不能为空', trigger: 'blur' }],
  warehouseId: [{ required: true, message: '仓库不能为空', trigger: 'blur' }],
  productId: [{ required: true, message: '产品不能为空', trigger: 'blur' }],
  count: [{ required: true, message: '产品数量不能为空', trigger: 'blur' }],
  purchaseInItemId: [{ required: true, message: '批次不能为空', trigger: 'blur' }]
})
const formRef = ref<any>() // 表单 Ref
const productList = ref<ProductVO[]>([]) // 产品列表
const warehouseList = ref<WarehouseVO[]>([]) // 仓库列表
const defaultWarehouse = ref<WarehouseVO | undefined>(undefined) // 默认仓库

// 批次管理相关
const batchStockMap = ref<Map<string, any[]>>(new Map()) // 存储每个产品的可用批次

// 一物一码对话框相关
const uniqueCodeDialogVisible = ref(false)
const currentEditRow = ref<{ productName?: string; count?: number; uniqueCodes?: string[] } | null>(null)
const uniqueCodeInput = ref('')

// 批量输入一物一码对话框相关
const batchUniqueCodeDialogVisible = ref(false)
const batchUniqueCodeInput = ref('')
const batchParseLoading = ref(false)

// 动态显示列
// 注意：其他入库/出库是由用户手动选择产品后才有manageType，
// 所以这里始终显示列，在列内部根据每行的manageType判断是否显示具体控件
const showBatchSelection = computed(() => {
  return true // 始终显示批次列
})

const showUniqueCodeInput = computed(() => {
  return true // 始终显示一物一码列
})

// 新增：重置仓库列表的方法
const resetWarehouseList = async (isReset: boolean ,newDeptId: number) => {
  warehouseList.value = await WarehouseApi.getWarehouseSimpleListByDeptId(newDeptId)
  defaultWarehouse.value = warehouseList.value.find((item) => item.defaultStatus)
  // 新增：清空所有行仓库的选中
  if (isReset) {
    formData.value.forEach(row => {
      row.warehouseId = undefined
    })
  }
}

/** 初始化设置入库项（编辑首屏预加载批次与库存） */
watch(
  () => props.items,
  async (val) => {
    if (!val || val.length === 0) {
      formData.value = []
      return
    }

    // 预加载：批次管理/一物一码管理 在进入编辑时直接加载可用批次；若已选批次且已选仓库，同步库存
    for (const row of val) {
      try {
        if ((row.manageType === 20 || row.manageType === 30) && props.deptId && row.productId) {
          const key = `${props.deptId}-${row.productId}`
          if (!batchStockMap.value.has(key)) {
            await loadBatchList(row)
          }
          if (row.purchaseInItemId && row.warehouseId) {
            await setStockCount(row)
          }
        }
      } catch (e) {
        console.warn('预加载批次/库存失败:', e)
      }
    }

    // 赋值到表格
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

const buildRowKey = (row: any) => {
  const manageType = Number(row?.manageType) || 0
  const productId = row?.productId ?? 'null'
  const batchId = row?.purchaseInItemId ?? 'null'
  return `${manageType}__${productId}__${batchId}`
}

/** 删除按钮操作 */
const handleDelete = (index) => {
  formData.value.splice(index, 1)
}

/** 处理仓库变更 */
const onChangeWarehouse = async (warehouseId, row) => {
  // 仓库变更：
  // - 普通管理：保持清空后重新按仓查询库存
  // - 批次/一物一码管理：保留已选批次，仅清空一物一码，并刷新该仓下该批次的库存
  if (row.manageType === 10) {
    row.purchaseInItemId = undefined
    row.batchName = undefined
    row.stockCount = 0
  }

  // 一物一码：保持已录入的码，避免切换仓库时被清空
  // 若后续操作（如批次变更）需要重置，会在对应逻辑中处理

  if (!warehouseId) {
    return
  }

  // 如果已选择产品，需要刷新库存
  if (row.productId) {
    if (row.manageType === 20 || row.manageType === 30) {
      // 若已选批次，切换仓库后按新仓刷新该批次库存
      if (row.purchaseInItemId) {
        await setStockCount(row)
      } else {
        row.stockCount = 0
      }
    } else if (row.manageType === 10) {
      // 普通管理：直接加载库存
      await setStockCount(row)
    }
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
  row.manageType = product.batchManage // 直接使用产品的 batchManage 字段

  // 清空批次、一物一码和库存相关数据（避免数据不一致）
  row.purchaseInItemId = undefined
  row.batchName = undefined
  row.uniqueCodes = []
  row.stockCount = 0

  // 如果是批次管理或一物一码管理：按产品+单位加载批次
  if (row.manageType === 20 || row.manageType === 30) {
    if (props.deptId) {
      await loadBatchList(row)
    }
  } else {
    // 普通管理：如果已选择仓库，加载库存
    if (row.warehouseId) {
      await setStockCount(row)
    }
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

/** 加载产品的批次列表（按产品+单位，不依赖仓库） */
const loadBatchList = async (row) => {
  if (!row.productId || !props.deptId) {
    message.warning('请先选择单位和产品')
    return
  }

  const key = `${props.deptId}-${row.productId}`
  if (batchStockMap.value.has(key)) {
    return // 已加载过
  }

  try {
    // 获取指定产品在当前单位下的所有批次（跨仓返回明细，前端聚合）
    const data = await StockApi.getProductStockForOperation(row.productId, props.deptId)
    // 按批次ID聚合库存并保留批次名称
    const grouped = new Map()
    ;(data || []).forEach((item) => {
      const batchId = item.purchaseInItemId
      if (!batchId) return
      const existed = grouped.get(batchId) || { purchaseInItemId: batchId, batchName: item.batchName, stockCount: 0 }
      const inc = Number(item.stockCount) || 0
      existed.stockCount = (Number(existed.stockCount) || 0) + inc
      if (!existed.batchName && item.batchName) existed.batchName = item.batchName
      grouped.set(batchId, existed)
    })
    const result = Array.from(grouped.values())
    batchStockMap.value.set(key, result)
  } catch (e) {
    console.error('加载批次失败', e)
  }
}

/** 获取可用批次列表 */
const getAvailableBatches = (row) => {
  if (!props.deptId || !row.productId) {
    return []
  }
  const key = `${props.deptId}-${row.productId}`
  return batchStockMap.value.get(key) || []
}

/** 批次变更事件 */
const onChangeBatch = async (batchId, row) => {
  if (!batchId) {
    // 清空批次时，重置相关字段
    row.batchName = undefined
    row.stockCount = 0
    row.uniqueCodes = []
    return
  }

  const batches = getAvailableBatches(row)
  const batch = batches.find(b => b.purchaseInItemId === batchId)

  if (batch) {
    row.batchName = batch.batchName
    // 使用 setStockCount 方法查询最新库存（而不是使用缓存的 stockCount）
    await setStockCount(row)
  } else {
    row.batchName = undefined
    row.stockCount = 0
  }

  // 清空一物一码选择（批次变了，一物一码也要重新输入）
  row.uniqueCodes = []
}

/** 打开一物一码输入对话框 */
const openUniqueCodeInputDialog = (row) => {
  currentEditRow.value = row
  uniqueCodeInput.value = (row.uniqueCodes || []).join('\n')
  uniqueCodeDialogVisible.value = true
}

/** 确认输入一物一码 */
const confirmUniqueCodeInput = () => {
  if (!currentEditRow.value) return

  const codes = uniqueCodeInput.value
    .split(/[\n,，\s]+/)
    .map(c => c.trim())
    .filter(c => c.length > 0)

  // 去重
  const uniqueCodes = [...new Set(codes)]

  // 校验数量
  const expectedCount = Math.floor((currentEditRow.value?.count) || 0)
  if (uniqueCodes.length !== expectedCount) {
    message.error(`需要输入${expectedCount}个一物一码，当前输入${uniqueCodes.length}个`)
    return
  }

  currentEditRow.value.uniqueCodes = uniqueCodes
  uniqueCodeDialogVisible.value = false
  message.success('一物一码输入成功')
}

/** 一物一码校验规则 */
const getUniqueCodeRules = (row) => {
  return [{
    validator: (_rule, value, callback) => {
      if (!value || value.length === 0) {
        callback(new Error('请输入一物一码'))
      } else if (value.length !== Math.floor(row.count)) {
        callback(new Error(`需要输入${Math.floor(row.count)}个一物一码`))
      } else {
        callback()
      }
    },
    trigger: 'change'
  }]
}

/** 打开批量输入一物一码对话框 */
const openBatchUniqueCodeDialog = () => {
  if (!props.deptId) {
    message.error('请先选择部门')
    return
  }
  if (!props.bizType) {
    message.error('业务类型未设置')
    return
  }
  batchUniqueCodeInput.value = ''
  batchUniqueCodeDialogVisible.value = true
}

/** 确认批量输入一物一码 */
const confirmBatchUniqueCodeInput = async () => {
  if (!batchUniqueCodeInput.value.trim()) {
    message.error('请输入一物一码')
    return
  }

  // 解析输入的一物一码
  const codes = batchUniqueCodeInput.value
    .split(/[\n,，\s]+/)
    .map(c => c.trim())
    .filter(c => c.length > 0)

  if (codes.length === 0) {
    message.error('请输入有效的一物一码')
    return
  }

  // 去重
  const uniqueCodes = [...new Set(codes)]
  if (uniqueCodes.length !== codes.length) {
    message.warning(`检测到重复的一物一码，已自动去重。原始${codes.length}个，去重后${uniqueCodes.length}个`)
  }

  try {
    batchParseLoading.value = true
    // 调用后端接口解析一物一码
    const result = await StockInApi.parseUniqueCodesForStockIn({
      codes: uniqueCodes,
      deptId: props.deptId!,
      bizType: props.bizType!
    })

    if (!result || result.length === 0) {
      message.error('未能解析出有效的入库项')
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

    result.forEach((item: any) => {
      const row: any = {
        
        id: undefined,
        warehouseId: defaultWarehouse.value?.id,
        productId: item.productId,
        productName: item.productName,
        productUnitName: item.productUnitName,
        productBarCode: item.productBarCode,
        productPrice: item.productPrice ?? undefined,
        originPurchasePrice: item.originPurchasePrice,
        stockCount: undefined,
        count: Number(item.count) || 0,
        totalPrice: erpPriceMultiply(item.productPrice ?? 0, Number(item.count) || 0),
        remark: undefined,
        manageType: item.manageType,
        purchaseInItemId: item.purchaseInItemId,
        batchName: item.batchName,
        uniqueCodes: Array.isArray(item.uniqueCodes) ? item.uniqueCodes.filter(code => !!code) : []
      }

      if (row.manageType === 30 && Array.isArray(row.uniqueCodes) && row.uniqueCodes.length > 0) {
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
          skippedGroups.push(`${row.productName || '未知产品'}${row.batchName ? `/${row.batchName}` : ''}`)
          return
        }

        if (filteredCodes.length === 0) {
          return
        }

        row.uniqueCodes = filteredCodes
        row.count = filteredCodes.length
        row.totalPrice = erpPriceMultiply(row.productPrice || 0, filteredCodes.length)
        filteredCodes.forEach((code) => existingCodeSet.add(code))
      } else if (Array.isArray(row.uniqueCodes) && row.uniqueCodes.length > 0) {
        const filteredCodes: string[] = []
        row.uniqueCodes.forEach((code: string) => {
          if (!code) return
          if (existingCodeSet.has(code)) {
            reusedCodes.push(code)
          } else {
            filteredCodes.push(code)
            existingCodeSet.add(code)
          }
        })
        row.uniqueCodes = filteredCodes
      }

      newRows.push(row)
    })

    let addedRowCount = 0
    let mergedRowCount = 0

    for (const row of newRows) {
      if ((row.manageType === 20 || row.manageType === 30) && props.deptId && row.productId) {
        const cacheKey = `${props.deptId}-${row.productId}`
        if (!batchStockMap.value.has(cacheKey)) {
          await loadBatchList(row)
        }
        const batches = getAvailableBatches(row)
        if (Array.isArray(batches) && batches.length > 0) {
          const matchedBatch = batches.find((item) => item.purchaseInItemId === row.purchaseInItemId)
          if (matchedBatch) {
            if (!row.batchName && matchedBatch.batchName) {
              row.batchName = matchedBatch.batchName
            }
          }
        }
      }

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
          if (!target.batchName && row.batchName) target.batchName = row.batchName
          if (!target.productUnitName && row.productUnitName) target.productUnitName = row.productUnitName
          mergedRowCount += 1
        }
      } else {
        formData.value.push(row)
        existingRowMap.set(key, row)
        addedRowCount += 1
      }
    }

    if (addedRowCount === 0 && mergedRowCount === 0) {
      message.warning('未添加新的入库项，请检查输入是否重复或无效')
      return
    }

    message.success(`成功解析 ${uniqueCodes.length} 个一物一码，新增 ${addedRowCount} 行，合并 ${mergedRowCount} 行`)

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
      infoMessages.push(`部分产品因一物一码全部重复未添加：${list.join('；')}`)
    }
    infoMessages.forEach((msgText) => message.info(msgText))

    batchUniqueCodeDialogVisible.value = false
    batchUniqueCodeInput.value = ''
  } catch (error: any) {
    console.error('解析一物一码失败:', error)
    message.error(error.message || '解析一物一码失败')
  } finally {
    batchParseLoading.value = false
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
