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
      <el-table-column label="批次选择" min-width="200" v-if="showBatchSelection">
        <template #default="{ row, $index }">
          <!-- 详情模式：显示批次名称（历史数据，不判断当前有效性） -->
          <div v-if="disabled && (row.manageType === 20 || row.manageType === 30)">
            <span v-if="row.batchName">
              {{ row.batchName }}
            </span>
            <el-tag v-else-if="row.purchaseInItemId" type="warning" size="small">
              批次ID: {{ row.purchaseInItemId }}
            </el-tag>
            <span v-else class="text-gray-400">—</span>
          </div>
          <!-- 编辑模式：显示批次选择框 -->
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
              :placeholder="getBatchPlaceholder(row)"
              :class="{ 'batch-warning': getUniqueBatches(row).length === 0 }"
              @change="onChangeBatch($event, row)"
              @focus="loadProductStock(row)"
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
      <el-table-column label="批次操作" width="80" align="center" v-if="showBatchSelection">
        <template #default="{ row, $index }">
          <el-button 
            v-if="!disabled && (row.manageType === 20 || row.manageType === 30)"
            @click="handleCopyBatchRow(row, $index)" 
            :icon="Plus"
            circle
            size="small"
            :disabled="!canCopyRow(row)"
            title="复制行（添加该产品的其他批次）"
          />
          <span v-else class="text-gray-400 text-center">—</span>
        </template>
      </el-table-column>
      <el-table-column label="一物一码选择" min-width="150" v-if="showUniqueCodeSelection">
        <template #default="{ row, $index }">
          <!-- 编辑模式：使用 el-form-item 进行校验 -->
          <el-form-item
            v-if="!disabled && row.manageType === 30"
            :prop="`${$index}.uniqueCodes`"
            :rules="[{
              validator: (rule, value, callback) => {
                if (!value || value.length === 0) {
                  callback(new Error('请选择一物一码'))
                } else if (value.length !== Math.floor(row.count)) {
                  callback(new Error(`需要选择${Math.floor(row.count)}个一物一码`))
                } else {
                  callback()
                }
              },
              trigger: 'change'
            }]"
            class="mb-0px!"
          >
            <el-button @click="openUniqueCodeSelectionDialog(row)" type="primary" link>
              选择一物一码
            </el-button>
          </el-form-item>
          
          <!-- 详情模式：使用原生 a 标签，不受表单 disabled 影响 -->
          <div v-else-if="disabled && row.manageType === 30" class="mb-0px">
            <a 
              href="javascript:void(0)" 
              @click.prevent="openUniqueCodeSelectionDialog(row)" 
              class="el-button el-button--info el-button--small is-link"
            >
              {{ row.uniqueCodes && row.uniqueCodes.length > 0 ? `查看${row.uniqueCodes.length}个` : '无一物一码' }}
            </a>
          </div>
          
          <!-- 其他管理类型：显示占位符 -->
          <div v-else class="text-gray-400 text-center">—</div>
        </template>
      </el-table-column>
      <el-table-column label="仓库名称" min-width="125">
        <template #default="{ row, $index }">
          <!-- 详情模式：显示仓库名称 -->
          <div v-if="disabled">
            <span v-if="row.warehouseName">
              {{ row.warehouseName }}
            </span>
            <el-tag v-else-if="row.warehouseId" type="warning" size="small">
              仓库信息缺失（ID: {{ row.warehouseId }}）
            </el-tag>
            <span v-else class="text-gray-400">—</span>
          </div>
          <!-- 编辑模式：显示仓库选择框 -->
          <el-form-item
            v-else
            :prop="`${$index}.warehouseId`"
            :rules="formRules.warehouseId"
            class="mb-0px!"
          >
            <el-select
              v-model="row.warehouseId"
              clearable
              filterable
              :placeholder="getWarehousePlaceholder(row)"
              :class="{ 'warehouse-warning': getAvailableWarehouses(row).length === 0 }"
              @change="onChangeWarehouse($event, row)"
            >
              <el-option
                v-for="item in getAvailableWarehouses(row)"
                :key="item.id"
                :label="getWarehouseOptionLabel(item)"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="产品名称" min-width="180">
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.productName" />
          </el-form-item>
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
      <el-table-column
        label="原数量"
        fixed="right"
        min-width="80"
        v-if="formData[0]?.totalCount != null"
      >
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <el-input disabled v-model="row.totalCount" :formatter="erpCountInputFormatter" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column
        label="已出库（净）"
        fixed="right"
        min-width="100"
        v-if="formData[0]?.outCount != null"
      >
        <template #default="{ row }">
          <el-form-item class="mb-0px!">
            <!-- 显示净出库数量 = 已出库 - 已退货 -->
            <el-input disabled :model-value="((row.outCount || 0) - (row.returnCount || 0))" :formatter="erpCountInputFormatter" />
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
              :max="row.maxOutCount || undefined"
              :precision="3"
              class="!w-100%"
              :placeholder="row.maxOutCount ? `最多可出${row.maxOutCount}` : ''"
              @update:model-value="markInternalOperation"
            />
          </el-form-item>
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
              @update:model-value="markInternalOperation"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="金额" prop="totalProductPrice" fixed="right" min-width="100">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.totalProductPrice`" class="mb-0px!">
            <el-input
              disabled
              v-model="row.totalProductPrice"
              :formatter="erpPriceInputFormatter"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="税率（%）" fixed="right" min-width="115">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.taxPercent`" class="mb-0px!">
            <el-input-number
              v-model="row.taxPercent"
              controls-position="right"
              :min="0"
              :precision="2"
              class="!w-100%"
              @update:model-value="markInternalOperation"
            />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="税额" prop="taxPrice" fixed="right" min-width="120">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.taxPrice`" class="mb-0px!">
            <el-form-item :prop="`${$index}.taxPrice`" class="mb-0px!">
              <el-input disabled v-model="row.taxPrice" :formatter="erpPriceInputFormatter" />
            </el-form-item>
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="税额合计" prop="totalPrice" fixed="right" min-width="100">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.totalPrice`" class="mb-0px!">
            <el-input disabled v-model="row.totalPrice" :formatter="erpPriceInputFormatter" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="150">
        <template #default="{ row, $index }">
          <el-form-item :prop="`${$index}.remark`" class="mb-0px!">
            <el-input v-model="row.remark" placeholder="请输入备注" @input="markInternalOperation" />
          </el-form-item>
        </template>
      </el-table-column>
      <el-table-column align="center" fixed="right" label="操作" width="60">
        <template #default="{ $index }">
          <el-button :disabled="formData.length === 1" @click="handleDelete($index)" link>
            —
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-form>

  <!-- 一物一码选择对话框 -->
  <el-dialog
    v-model="uniqueCodeDialogVisible"
    :title="disabled ? '查看一物一码' : '选择一物一码'"
    width="800px"
    :close-on-click-modal="false"
  >
    <div v-loading="uniqueCodeLoading">
      <el-form label-width="120px">
        <el-form-item label="产品名称">
          <el-input :value="currentRow?.productName" disabled />
        </el-form-item>
        <el-form-item label="需要数量">
          <el-input :value="currentRow ? Math.floor(currentRow.count) : 0" disabled />
        </el-form-item>
        <el-form-item label="批次">
          <el-input :value="getCurrentBatchName()" disabled />
        </el-form-item>
        <el-form-item label="选择模式">
          <el-tag v-if="currentRow?.warehouseId" type="success">
            按仓库筛选（只显示选中仓库的一物一码）
          </el-tag>
          <el-tag v-else type="info">
            跨仓库选择（显示该批次所有仓库的一物一码）
          </el-tag>
        </el-form-item>
      </el-form>

      <el-table
        ref="uniqueCodeTableRef"
        :data="availableUniqueCodes"
        @selection-change="handleUniqueCodeSelectionChange"
        max-height="400"
      >
        <el-table-column type="selection" width="55" :selectable="() => !disabled" />
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="唯一码" prop="code" min-width="180" />
        <el-table-column label="仓库" prop="warehouseName" width="120" />
        <el-table-column label="入库日期" prop="purchaseInDate" width="120" />
        <el-table-column label="保修天数" prop="warrantyPeriodDays" width="100" />
      </el-table>
    </div>
    <template #footer>
      <div class="text-left mb-2" v-if="!disabled">
        已选择：{{ selectedUniqueCodes.length }} / {{ currentRow ? Math.floor(currentRow.count) : 0 }}
      </div>
      <div class="text-left mb-2" v-else>
        已选择：{{ currentRow?.uniqueCodes?.length || 0 }} 个一物一码
      </div>
      <!-- 详情模式：使用原生 a 标签，避免被 el-form 的 disabled 影响 -->
      <a 
        v-if="disabled"
        href="javascript:void(0)" 
        @click.prevent="uniqueCodeDialogVisible = false" 
        class="el-button el-button--default"
      >
        关闭
      </a>
      <!-- 编辑模式：使用 el-button -->
      <el-button v-else @click="uniqueCodeDialogVisible = false">取消</el-button>
      <el-button v-if="!disabled" type="primary" @click="confirmUniqueCodeSelection">确定</el-button>
    </template>
  </el-dialog>
</template>
<script setup lang="ts">
import { StockApi } from '@/api/erp/stock/stock'
import { UniqueCodeApi, UniqueCodeVO } from '@/api/erp/uniquecode'
import {
  erpCountInputFormatter,
  erpPriceInputFormatter,
  erpPriceMultiply,
  getSumValue
} from '@/utils'
import { WarehouseApi, WarehouseVO } from '@/api/erp/stock/warehouse'
import { computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'

const props = defineProps<{
  items: any[]
  disabled: boolean
  deptId?: number  // 添加部门ID，用于查询一物一码
}>()
const message = useMessage() // 消息弹窗
const formLoading = ref(false) // 表单的加载中
const isInternalOperation = ref(false) // 标记是否正在进行内部操作（删除、批次选择等），避免触发watch重新赋值
const isHydrating = ref(false) // 表单初始化水合态，避免初始化期间误清理历史数据
const formData = ref<any[]>([])
const formRules = reactive({
  warehouseId: [{
    validator: (rule: any, value: any, callback: any) => {
      // ✅ 步骤1：验证rule.fullField有效性
      if (!rule.fullField || typeof rule.fullField !== 'string') {
        // 降级处理：直接校验value
        if (!value) {
          callback(new Error('仓库不能为空'))
        } else {
          callback()
        }
        return
      }
      
      // ✅ 步骤2：安全解析字段路径
      const parts = rule.fullField.split('.')
      if (parts.length < 2) {
        // 格式异常（期望格式：0.warehouseId）
        if (!value) {
          callback(new Error('仓库不能为空'))
        } else {
          callback()
        }
        return
      }
      
      // ✅ 步骤3：安全解析索引
      const rowIndex = parseInt(parts[0])
      if (isNaN(rowIndex) || rowIndex < 0 || rowIndex >= formData.value.length) {
        // 索引异常：直接通过校验（避免阻塞保存）
        // 这种情况通常是表单数据同步问题，不应该阻止用户保存
        console.warn('warehouseId校验索引异常:', { 
          fullField: rule.fullField, 
          rowIndex, 
          formDataLength: formData.value.length 
        })
        callback()  // ✅ 通过校验，让其他必填项校验生效
        return
      }
      
      // ✅ 步骤4：获取当前行数据
      const currentRow = formData.value[rowIndex]
      
      // ✅ 步骤5：业务逻辑校验（保持不变）
      // 一物一码管理（manageType=30）且已选择一物一码，则仓库可选
      if (currentRow?.manageType === 30 && currentRow?.uniqueCodes && currentRow.uniqueCodes.length > 0) {
        callback()  // 有一物一码就不需要仓库必填
      } else if (!value) {
        callback(new Error('仓库不能为空'))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }],
  productId: [{ required: true, message: '产品不能为空', trigger: 'blur' }],
  count: [
    { required: true, message: '产品数量不能为空', trigger: 'blur' },
    {
      validator: (rule: any, value: any, callback: any) => {
        if (value && value <= 0) {
          callback(new Error('出库数量必须大于0'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  purchaseInItemId: [{
    validator: (rule: any, value: any, callback: any) => {
      // 只有批次管理和一物一码管理才需要验证批次选择
      const row = rule.fullField.split('.')[0]
      const rowIndex = parseInt(row)
      const currentRow = formData.value[rowIndex]
      if (currentRow && (currentRow.manageType === 20 || currentRow.manageType === 30)) {
        if (!value) {
          callback(new Error('请选择批次'))
        } else {
          callback()
        }
      } else {
        callback()
      }
    },
    trigger: 'change'
  }]
})
const formRef = ref<any>() // 表单 Ref
const warehouseList = ref<WarehouseVO[]>([]) // 仓库列表
const defaultWarehouse = ref<WarehouseVO | undefined>(undefined) // 默认仓库

// 计算属性：是否显示批次选择列
const showBatchSelection = computed(() => {
  // 检查是否有任何产品需要批次管理
  if (formData.value.length === 0) return false

  return formData.value.some(row => row.manageType === 20 || row.manageType === 30)
})

// 计算属性：是否显示一物一码选择列
const showUniqueCodeSelection = computed(() => {
  // 检查是否有任何产品需要一物一码管理
  if (formData.value.length === 0) return false

  return formData.value.some(row => row.manageType === 30)
})

// 一物一码选择对话框相关
const uniqueCodeDialogVisible = ref(false) // 对话框是否显示
const uniqueCodeLoading = ref(false) // 加载中
const currentRow = ref<any>(null) // 当前操作的行
const availableUniqueCodes = ref<UniqueCodeVO[]>([]) // 可选的一物一码列表
const selectedUniqueCodes = ref<UniqueCodeVO[]>([]) // 已选择的一物一码列表
const uniqueCodeTableRef = ref<any>(null) // 一物一码表格ref

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

// 通用：标记内部操作，避免触发 props.items 深度监听导致行数被还原
const markInternalOperation = () => {
  isInternalOperation.value = true
  nextTick(() => {
    isInternalOperation.value = false
  })
}

/** 初始化设置出库项 */
watch(
  () => props.items,
  async (val) => {
    // 初始化进入水合态，避免在初始化期间触发的校验清理掉历史数据
    isHydrating.value = true
    // 如果是内部操作触发的watch，跳过重新赋值
    if (isInternalOperation.value) {
      isHydrating.value = false
      return
    }
    
    if (!val || val.length === 0) {
      formData.value = []
      return
    }

    // 设置默认仓库（仅普通管理模式需要，批次管理由批次决定仓库）
    for (const item of val) {
      // 确保每个 item 都有 deptId（编辑时需要）
      if (!item.deptId && props.deptId) {
        item.deptId = props.deptId
      }
      
      if (item.warehouseId == null && item.manageType !== 20 && item.manageType !== 30) {
        item.warehouseId = defaultWarehouse.value?.id
      }
      
      // 初始化一物一码字段
      if (item.uniqueCodes === undefined) {
        item.uniqueCodes = []
      }
      
      // 编辑/详情时：如果是批次管理/一物一码管理，且已有批次ID，主动加载批次数据
      if ((item.manageType === 20 || item.manageType === 30) && 
          item.purchaseInItemId && 
          (!item.availableStocks || item.availableStocks.length === 0)) {
        await loadProductStock(item)
        
        // 加载完批次数据后，重新构建批次仓库列表（用于仓库下拉选择）
        if (item.availableStocks && item.availableStocks.length > 0) {
          item.batchWarehouses = item.availableStocks.filter(
            stock => stock.purchaseInItemId === item.purchaseInItemId
          )
        }
      }
      
      // 普通管理：加载库存信息
      if (item.manageType !== 20 && item.manageType !== 30 && item.stockCount === null && item.warehouseId != null) {
        await loadProductStock(item)
      }
    }
    
    formData.value = [...val] // 使用展开运算符确保响应式更新
    // 等待DOM与数据同步后退出水合态
    await nextTick()
    isHydrating.value = false
  },
  { immediate: true, deep: true }
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
      item.totalProductPrice = erpPriceMultiply(item.productPrice, item.count)
      item.taxPrice = erpPriceMultiply(item.totalProductPrice, item.taxPercent / 100.0)
      if (item.totalProductPrice != null) {
        item.totalPrice = item.totalProductPrice + (item.taxPrice || 0)
      } else {
        item.totalPrice = undefined
      }
    })
  },
  { deep: true }
)

/** 加载产品库存信息 */
const loadProductStock = async (row: any) => {
  if (!row.productId || !row.deptId) {
    return
  }

  //  如果已经加载过库存数据，直接返回（避免重复请求）
  // 使用 !== undefined 而不是检查长度，因为空数组也是有效的加载结果
  if (row.availableStocks !== undefined) {
    return
  }

  // 标记为内部操作，避免触发watch
  isInternalOperation.value = true

  try {
    // 调用统一的库存服务接口
    const stockList = await StockApi.getProductStockForOperation(row.productId, row.deptId)

    // 根据管理类型处理库存数据
    if (row.manageType === 20 || row.manageType === 30) {
      // 批次管理或一物一码管理：保存批次列表供下拉选择
      row.availableStocks = stockList
    } else {
      // 普通管理：直接更新库存数量（如果已选择仓库）
      if (row.warehouseId) {
        const warehouseStock = stockList.find(item => item.warehouseId === row.warehouseId)
        row.stockCount = warehouseStock?.stockCount || 0
        row.maxOutCount = row.stockCount
      }
    }
  } catch (error) {
    console.error('获取库存信息失败:', error)
    row.availableStocks = []
    row.stockCount = 0
    row.maxOutCount = null
  } finally {
    // 重置标志
    nextTick(() => {
      isInternalOperation.value = false
    })
  }
}

/** 批次选择变化处理 */
const onChangeBatch = (batchId: number, row: any) => {
  isInternalOperation.value = true
  
  if (!batchId) {
    // 清空批次选择时，重置相关字段
    row.warehouseId = undefined
    row.stockCount = 0
    row.maxOutCount = null
    // 初始化或详情阶段不清空历史一物一码，避免回显丢失
    if (!props.disabled && !isHydrating.value) {
      row.uniqueCodes = []  // 清空一物一码选择
    }
    row.batchWarehouses = []  // 清空批次仓库列表
    nextTick(() => {
      isInternalOperation.value = false
    })
    return
  }

  // 批次选择后，保存该批次的仓库库存列表（用于仓库下拉选择）
  // 过滤出选中批次的所有仓库库存
  row.batchWarehouses = (row.availableStocks || []).filter(
    stock => stock.purchaseInItemId === batchId
  )

  // 如果该批次只在一个仓库有库存，自动选择该仓库
  if (row.batchWarehouses.length === 1) {
    row.warehouseId = row.batchWarehouses[0].warehouseId
    row.stockCount = row.batchWarehouses[0].stockCount
    row.maxOutCount = row.batchWarehouses[0].stockCount
    
    // 如果当前出库数量超过库存，自动调整为库存数量
    if (row.count > row.batchWarehouses[0].stockCount) {
      row.count = row.batchWarehouses[0].stockCount
    }
  } else {
    // 多个仓库，需要用户选择
    row.warehouseId = undefined
    row.stockCount = 0
    row.maxOutCount = null
  }
  
  // 清空之前选择的一物一码（因为批次变了）
  if (!props.disabled && !isHydrating.value) {
    row.uniqueCodes = []
  }
  
  nextTick(() => {
    isInternalOperation.value = false
  })
}

/** 合计 */
const getSummaries = (param: any) => {
  const { columns, data } = param
  const sums: string[] = []
  columns.forEach((column, index: number) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    if (['count', 'totalProductPrice', 'taxPrice', 'totalPrice'].includes(column.property)) {
      const sum = getSumValue(data.map((item) => Number(item[column.property])))
      sums[index] =
        column.property === 'count' ? erpCountInputFormatter(sum) : erpPriceInputFormatter(sum)
    } else {
      sums[index] = ''
    }
  })

  return sums
}

/** 检查是否可以复制行（该产品行数是否已达到批次总数） */
const canCopyRow = (row: any) => {
  // 必须有产品ID和批次库存数据
  if (!row.productId || !row.availableStocks || row.availableStocks.length === 0) {
    return false
  }
  
  // 获取该产品当前有多少行
  const sameProductRows = formData.value.filter(r => r.productId === row.productId)
  const currentRowCount = sameProductRows.length
  
  // 获取该产品所有不重复的批次数量
  const allBatchIds = new Set(
    row.availableStocks.map(stock => stock.purchaseInItemId)
  )
  const totalBatchCount = allBatchIds.size
  
  // 如果当前行数小于批次总数，则可以复制
  return currentRowCount < totalBatchCount
}

/** 复制行（用于添加同一产品的不同批次） */
const handleCopyBatchRow = (row: any, index: number) => {
  // 二次验证是否可以复制
  if (!canCopyRow(row)) {
    message.warning('该产品已达到批次数量上限，无法继续添加')
    return
  }
  
  // 标记为内部操作
  isInternalOperation.value = true
  
  // 创建新行：复制产品基本信息，清空批次相关数据
  const newRow = {
    ...row,
    id: undefined,                    // 清空ID，作为新增项
    purchaseInItemId: undefined,      // 清空批次ID
    warehouseId: undefined,           // 清空仓库
    count: 0,                         // 数量设为0
    uniqueCodes: [],                  // 清空一物一码
    stockCount: 0,                    // 清空库存显示
    maxOutCount: null,                // 清空最大出库数
    batchWarehouses: [],              // 清空批次仓库列表
    totalProductPrice: 0,             // 清空总价
    taxPrice: 0,                      // 清空税额
    totalPrice: 0,                    // 清空含税总价
    availableStocks: row.availableStocks  // 共享批次库存数据
  }
  
  // 在当前行后插入新行
  formData.value.splice(index + 1, 0, newRow)
  
  // 提示用户
  message.success('已添加新行，请选择其他批次')
  
  // 重置内部操作标志
  nextTick(() => {
    isInternalOperation.value = false
  })
}

/** 新增按钮操作 */
const handleAdd = () => {
  const row = {
    id: undefined,
    productId: undefined,
    productUnitName: undefined, // 产品单位
    productBarCode: undefined, // 产品条码
    productPrice: undefined,
    stockCount: undefined,
    count: 1,
    totalProductPrice: undefined,
    taxPercent: undefined,
    taxPrice: undefined,
    totalPrice: undefined,
    remark: undefined
  }
  formData.value.push(row)
}

/** 删除按钮操作 */
const handleDelete = (index: number) => {
  isInternalOperation.value = true
  formData.value.splice(index, 1)
  // 使用nextTick确保DOM更新后再重置标志
  nextTick(() => {
    isInternalOperation.value = false
  })
}

/** 处理仓库变更 */
const onChangeWarehouse = async (warehouseId: number, row: any) => {
  isInternalOperation.value = true
  
  // 清空一物一码选择（仓库变了）
  if (!props.disabled && !isHydrating.value) {
    row.uniqueCodes = []
  }
  
  if (!warehouseId) {
    row.stockCount = 0
    row.maxOutCount = null
    nextTick(() => {
      isInternalOperation.value = false
    })
    return
  }

  // 批次管理和一物一码管理：从批次仓库列表中获取库存
  if (row.manageType === 20 || row.manageType === 30) {
    if (row.batchWarehouses && row.batchWarehouses.length > 0) {
      const selectedStock = row.batchWarehouses.find(stock => stock.warehouseId === warehouseId)
      if (selectedStock) {
        row.stockCount = selectedStock.stockCount
        row.maxOutCount = selectedStock.stockCount
        
        // 如果当前出库数量超过库存，自动调整
        if (row.count > selectedStock.stockCount) {
          row.count = selectedStock.stockCount
        }
      }
    }
    nextTick(() => {
      isInternalOperation.value = false
    })
    return
  }

  // 普通管理：直接加载该仓库的库存数量
  await loadProductStock(row)
  
  nextTick(() => {
    isInternalOperation.value = false
  })
}

/** 获取可用的仓库列表（根据批次过滤） */
const getAvailableWarehouses = (row: any) => {
  // 普通管理：显示所有仓库
  if (row.manageType !== 20 && row.manageType !== 30) {
    return warehouseList.value
  }

  // 批次管理/一物一码管理：只显示该批次有库存的仓库
  if (!row.purchaseInItemId || !row.batchWarehouses || row.batchWarehouses.length === 0) {
    // 无可用仓库时，清空已选仓库
    if (row.warehouseId != null) {
      row.warehouseId = undefined
    }
    return []
  }
  
  // 从批次库存列表中提取仓库信息
  const batchWarehouseIds = row.batchWarehouses.map(stock => stock.warehouseId)
  const batchWarehouseMap = new Map(
    row.batchWarehouses.map(stock => [stock.warehouseId, stock.stockCount])
  )
  
  // 返回该批次有库存的仓库（含库存数量）
  const availableWarehouses = warehouseList.value
    .filter(warehouse => batchWarehouseIds.includes(warehouse.id))
    .map(warehouse => ({
      ...warehouse,
      stockCount: batchWarehouseMap.get(warehouse.id)
    }))

  // 当前选中仓库不在可用列表中，清空之
  if (row.warehouseId != null && !availableWarehouses.some(w => w.id === row.warehouseId)) {
    row.warehouseId = undefined
  }

  return availableWarehouses
}

/** 获取去重后的批次列表（一个批次可能存在于多个仓库） */
const getUniqueBatches = (row: any) => {
  if (!row.availableStocks || row.availableStocks.length === 0) {
    return []
  }

  // 汇总同一产品其他行已占用的批次 + 仓库组合
  const occupiedByBatch = new Map<number, Set<number | null>>()
  formData.value
    .filter(r => r.productId === row.productId && r !== row)
    .forEach(r => {
      if (!r.purchaseInItemId) {
        return
      }
      const set = occupiedByBatch.get(r.purchaseInItemId) ?? new Set<number | null>()
      set.add(r.warehouseId ?? null)
      occupiedByBatch.set(r.purchaseInItemId, set)
    })

  const batchMap = new Map<number, any>()
  row.availableStocks.forEach((stock: any) => {
    const batchId = stock.purchaseInItemId
    if (!batchId) {
      return
    }

    const occupiedWarehouses = occupiedByBatch.get(batchId)
    const isCurrentSelection =
      row.purchaseInItemId === batchId &&
      ((row.warehouseId ?? null) === (stock.warehouseId ?? null))

    if (occupiedWarehouses && !isCurrentSelection) {
      // 其他行已占用同批次且同仓库（或尚未指定仓库）时跳过
      if (occupiedWarehouses.has(null) || occupiedWarehouses.has(stock.warehouseId ?? null)) {
        return
      }
    }

    if (!batchMap.has(batchId)) {
      batchMap.set(batchId, {
        ...stock,
        stockCount: stock.stockCount || 0
      })
    } else {
      const existing = batchMap.get(batchId)
      existing.stockCount = (existing.stockCount || 0) + (stock.stockCount || 0)
    }
  })

  // 确保当前选中的批次始终可见
  if (row.purchaseInItemId && !batchMap.has(row.purchaseInItemId)) {
    const fallbackStock = (row.availableStocks || []).find((stock: any) => {
      if (stock.purchaseInItemId !== row.purchaseInItemId) {
        return false
      }
      if (row.warehouseId == null) {
        return true
      }
      return stock.warehouseId === row.warehouseId
    })

    const fallbackPayload = fallbackStock ? { ...fallbackStock } : {}

    batchMap.set(row.purchaseInItemId, {
      ...fallbackPayload,
      purchaseInItemId: row.purchaseInItemId,
      batchName: fallbackStock?.batchName ?? row.batchName,
      stockCount: fallbackStock?.stockCount ?? row.stockCount ?? 0
    })
  }

  return Array.from(batchMap.values())
}


/** 获取批次选择的 placeholder */
const getBatchPlaceholder = (row: any) => {
  const batches = getUniqueBatches(row)
  if (batches.length === 0) {
    return '暂无可用批次'
  }
  return '请选择批次'
}

/** 获取仓库选择的 placeholder */
const getWarehousePlaceholder = (row: any) => {
  const warehouses = getAvailableWarehouses(row)
  if (warehouses.length === 0) {
    return '暂无可用仓库'
  }
  return '请选择仓库'
}

/** 获取仓库下拉显示文案，兼容附加的 stockCount 字段 */
const getWarehouseOptionLabel = (warehouse: any) => {
  const count = warehouse && warehouse.stockCount != null ? warehouse.stockCount : undefined
  return warehouse.name + (count != null ? ` (库存:${count})` : '')
}

/** 获取当前批次名称 */
const getCurrentBatchName = () => {
  if (!currentRow.value || !currentRow.value.purchaseInItemId) {
    return '未选择'
  }
  
  // 从 availableStocks 中查找对应的批次名称
  if (currentRow.value.availableStocks && currentRow.value.availableStocks.length > 0) {
    const stock = currentRow.value.availableStocks.find(
      item => item.purchaseInItemId === currentRow.value.purchaseInItemId
    )
    if (stock && stock.batchName) {
      return stock.batchName
    }
  }
  
  // 如果找不到批次名称，返回ID
  return '批次' + currentRow.value.purchaseInItemId
}

/** 打开一物一码选择对话框 */
const openUniqueCodeSelectionDialog = async (row: any) => {
  // 检查是否已选择批次
  if (!row.purchaseInItemId) {
    message.warning('请先选择批次')
    return
  }

  // 检查部门ID是否存在
  if (!props.deptId) {
    message.error('缺少部门信息，请刷新页面重试')
    return
  }

  currentRow.value = row
  uniqueCodeDialogVisible.value = true
  uniqueCodeLoading.value = true

  try {
    // 如果 availableStocks 为空，主动加载一次库存数据（编辑/详情时需要）
    if (!row.availableStocks || row.availableStocks.length === 0) {
      // 确保 row 中有 deptId（编辑时 row 中可能没有 deptId）
      if (!row.deptId && props.deptId) {
        row.deptId = props.deptId
      }
      await loadProductStock(row)
    }
    
    let result
    // 详情模式：根据已选择的uniqueCodes查询详细信息（不限制状态）
    if (props.disabled && row.uniqueCodes && row.uniqueCodes.length > 0) {
      result = await UniqueCodeApi.getUniqueCodeListByCodes(row.uniqueCodes)
    } else {
      // 编辑模式：调用API查询在库的一物一码列表
      // 支持两种模式：
      // 模式A：warehouseId为null，查询该批次所有仓库的一物一码
      // 模式B：warehouseId有值，只查询该仓库的一物一码
      result = await UniqueCodeApi.getInStockUniqueCodeList({
        productId: row.productId,
        warehouseId: row.warehouseId || null,  // 如果未选仓库，传null
        purchaseInItemId: row.purchaseInItemId,
        deptId: props.deptId
      })
    }

    // 处理不同的返回格式
    let dataList: UniqueCodeVO[] = []
    if (Array.isArray(result)) {
      // 直接返回数组
      dataList = result
    } else if (result.data && Array.isArray(result.data)) {
      // 标准格式 {code: 0, data: [...]}
      dataList = result.data
    } else if (result.data && Array.isArray(result.data.list)) {
      // 分页格式 {code: 0, data: {list: [...], total: ...}}
      dataList = result.data.list
    }
    
    availableUniqueCodes.value = dataList

    // 如果之前已经选择过，恢复选择状态
    if (row.uniqueCodes && row.uniqueCodes.length > 0) {
      // 等待表格渲染完成后设置勾选状态
      await nextTick()
      
      // 清空之前的选择
      uniqueCodeTableRef.value?.clearSelection()
      
      // 遍历可选的一物一码，勾选已选择的
      availableUniqueCodes.value.forEach(item => {
        if (row.uniqueCodes.includes(item.code)) {
          // 设置表格勾选状态
          uniqueCodeTableRef.value?.toggleRowSelection(item, true)
        }
      })
    } else {
      selectedUniqueCodes.value = []
      // 清空表格选择
      await nextTick()
      uniqueCodeTableRef.value?.clearSelection()
    }
  } catch (error) {
    console.error('加载一物一码失败:', error)
    availableUniqueCodes.value = []
    selectedUniqueCodes.value = []
  } finally {
    uniqueCodeLoading.value = false
  }
}

/** 处理一物一码选择变化 */
const handleUniqueCodeSelectionChange = (selection: UniqueCodeVO[]) => {
  selectedUniqueCodes.value = selection
}

/** 处理跨仓库选择 - 自动拆分为多个出库项 */
const handleCrossWarehouseSelection = (warehouseIds: number[]) => {
  if (!currentRow.value) {
    return
  }

  // 找到当前行在formData中的索引
  const currentIndex = formData.value.findIndex(item => item === currentRow.value)
  if (currentIndex === -1) {
    return
  }

  // 按仓库分组一物一码
  const warehouseGroups = new Map<number, UniqueCodeVO[]>()
  selectedUniqueCodes.value.forEach(uniqueCode => {
    const warehouseId = uniqueCode.currentWarehouseId
    if (!warehouseGroups.has(warehouseId)) {
      warehouseGroups.set(warehouseId, [])
    }
    warehouseGroups.get(warehouseId)!.push(uniqueCode)
  })

  // 获取原始行数据
  const originalRow = { ...currentRow.value }
  
  // 删除原始行
  formData.value.splice(currentIndex, 1)
  
  // 为每个仓库创建一个新的出库项
  const newRows: any[] = []
  
  warehouseGroups.forEach((uniqueCodes, warehouseId) => {
    // 查找仓库库存信息
    const warehouseStock = originalRow.batchWarehouses?.find(
      (stock: any) => stock.warehouseId === warehouseId
    )
    
    // 创建新行
    const newRow = {
      ...originalRow,
      id: undefined,  // 清空ID，作为新增项
      warehouseId: warehouseId,
      count: uniqueCodes.length,
      uniqueCodes: uniqueCodes.map(uc => uc.code),
      stockCount: warehouseStock?.stockCount || 0,
      maxOutCount: warehouseStock?.stockCount || 0,
      // 重新计算价格
      totalProductPrice: erpPriceMultiply(originalRow.productPrice, uniqueCodes.length),
    }
    
    // 深拷贝库存信息，确保各行独立维护批次/仓库映射
    const clonedAvailableStocks = (originalRow.availableStocks || []).map((stock: any) => ({ ...stock }))
    const batchWarehouses = clonedAvailableStocks.filter(
      (stock: any) =>
        stock.purchaseInItemId === originalRow.purchaseInItemId &&
        stock.warehouseId === warehouseId
    )

    newRow.availableStocks = clonedAvailableStocks
    newRow.batchWarehouses = batchWarehouses

    // 计算税额
    if (newRow.taxPercent) {
      newRow.taxPrice = erpPriceMultiply(newRow.totalProductPrice, newRow.taxPercent / 100.0)
      newRow.totalPrice = newRow.totalProductPrice + (newRow.taxPrice || 0)
    }
    
    newRows.push(newRow)
  })
  
  // 插入新行
  formData.value.splice(currentIndex, 0, ...newRows)
}

/** 确认一物一码选择 */
const confirmUniqueCodeSelection = () => {
  if (!currentRow.value) {
    return
  }

  // 校验选择数量
  const requiredCount = Math.floor(currentRow.value.count)
  if (selectedUniqueCodes.value.length === 0) {
    message.warning('请至少选择一个一物一码')
    return
  }
  if (selectedUniqueCodes.value.length !== requiredCount) {
    message.warning(`需要选择${requiredCount}个一物一码，当前选择了${selectedUniqueCodes.value.length}个`)
    return
  }

  //  设置内部操作标志，防止触发props watch导致删除的行恢复
  isInternalOperation.value = true

  // 检查是否跨仓库选择
  const warehouseIds = [...new Set(selectedUniqueCodes.value.map(item => item.currentWarehouseId))]
  
  if (warehouseIds.length > 1) {
    // 跨仓库选择：按仓库自动拆分为多个出库项
    handleCrossWarehouseSelection(warehouseIds)
    message.success(`已选择${selectedUniqueCodes.value.length}个一物一码，自动拆分为${warehouseIds.length}个出库项`)
  } else {
    // 单仓库选择：直接保存
    currentRow.value.uniqueCodes = selectedUniqueCodes.value.map(item => item.code)
    // 如果用户未选仓库，自动设置为一物一码所在的仓库
    if (!currentRow.value.warehouseId && warehouseIds.length === 1) {
      currentRow.value.warehouseId = warehouseIds[0]
      // 更新库存信息
      const selectedStock = currentRow.value.batchWarehouses?.find(
        (stock: any) => stock.warehouseId === warehouseIds[0]
      )
      if (selectedStock) {
        currentRow.value.stockCount = selectedStock.stockCount
        currentRow.value.maxOutCount = selectedStock.stockCount
      }
    }
    message.success('一物一码选择成功')
  }

  // 关闭对话框
  uniqueCodeDialogVisible.value = false
  currentRow.value = null
  availableUniqueCodes.value = []
  selectedUniqueCodes.value = []
  
  //  在nextTick中重置标志，确保响应式更新完成
  nextTick(() => {
    isInternalOperation.value = false
  })
}

/** 表单校验 */
const validate = () => {
  return formRef.value.validate()
}

/** 获取表格数据 */
const getTableData = () => {
  return formData.value
}

defineExpose({ validate, resetWarehouseList, getTableData })

/** 初始化 */
onMounted(async () => {
  //warehouseList.value = await WarehouseApi.getWarehouseSimpleList()
  //defaultWarehouse.value = warehouseList.value.find((item) => item.defaultStatus)
})
</script>

<style scoped>
/* 批次选择警告样式 */
:deep(.batch-warning .el-input__inner::placeholder) {
  color: #f56c6c !important;
}

/* 仓库选择警告样式 */
:deep(.warehouse-warning .el-input__inner::placeholder) {
  color: #f56c6c !important;
}
</style>
